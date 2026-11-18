-- Aplicar antes de desplegar el botón de importación y el alta de compradores.
-- Solo añade funciones. No reemplaza listas ni modifica compras históricas.
BEGIN;

CREATE OR REPLACE FUNCTION public.add_participants_to_event(
  p_event_id uuid,
  p_names jsonb,
  p_include_duplicates boolean DEFAULT false,
  p_import_id uuid DEFAULT gen_random_uuid()
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_input jsonb;
  v_name text;
  v_key text;
  v_participant_id uuid;
  v_inserted integer := 0;
  v_duplicates jsonb := '[]'::jsonb;
  v_row integer := 0;
  v_relation_id uuid;
BEGIN
  IF jsonb_typeof(p_names) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'La lista de nombres no es válida';
  END IF;
  IF jsonb_array_length(p_names) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'La lista debe tener entre 1 y 5000 nombres';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Evento no encontrado';
  END IF;

  -- Importaciones y compras del mismo evento comparten el candado.
  PERFORM pg_advisory_xact_lock(hashtextextended('event-participants:' || p_event_id::text, 0));

  FOR v_input IN SELECT value FROM jsonb_array_elements(p_names) LOOP
    v_row := v_row + 1;
    -- Permite reintentar la misma confirmación tras perder la respuesta HTTP.
    v_relation_id := md5(p_event_id::text || ':' || p_import_id::text || ':' || v_row::text)::uuid;
    IF EXISTS (SELECT 1 FROM public.event_participants WHERE id = v_relation_id) THEN
      v_inserted := v_inserted + 1;
      CONTINUE;
    END IF;
    IF jsonb_typeof(v_input) IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Cada participante debe tener un nombre en texto';
    END IF;
    v_name := btrim(regexp_replace(v_input #>> '{}', '\s+', ' ', 'g'));
    IF length(v_name) NOT BETWEEN 1 AND 200 THEN
      RAISE EXCEPTION 'Nombre no válido';
    END IF;
    v_key := lower(v_name);

    IF EXISTS (
      SELECT 1
      FROM public.event_participants ep
      JOIN public.participants p ON p.id = ep.participant_id
      WHERE ep.event_id = p_event_id
        AND lower(btrim(regexp_replace(p.name, '\s+', ' ', 'g'))) = v_key
    ) THEN
      IF NOT COALESCE(p_include_duplicates, false) THEN
        v_duplicates := v_duplicates || jsonb_build_array(v_name);
        CONTINUE;
      END IF;
      -- Un homónimo confirmado necesita su propio id para poder participar.
      v_participant_id := NULL;
    ELSE
      -- Reutilizar el catálogo global sin modificar otras fiestas ni sus puntos.
      SELECT p.id INTO v_participant_id
      FROM public.participants p
      WHERE lower(btrim(regexp_replace(p.name, '\s+', ' ', 'g'))) = v_key
      ORDER BY p.created_at, p.id
      LIMIT 1;
    END IF;

    IF v_participant_id IS NULL THEN
      INSERT INTO public.participants (name, instagram)
      VALUES (v_name, NULL) RETURNING id INTO v_participant_id;
    END IF;
    INSERT INTO public.event_participants (id, event_id, participant_id, points)
    VALUES (v_relation_id, p_event_id, v_participant_id, 0);
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object('insertedCount', v_inserted, 'duplicates', v_duplicates);
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_order_buyer_participant(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION 'El pedido no está pagado';
  END IF;
  PERFORM public.add_participants_to_event(
    v_order.event_id, jsonb_build_array(v_order.buyer_name), false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.add_participants_to_event(uuid, jsonb, boolean, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_order_buyer_participant(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_participants_to_event(uuid, jsonb, boolean, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_order_buyer_participant(uuid)
  TO service_role;

COMMIT;
