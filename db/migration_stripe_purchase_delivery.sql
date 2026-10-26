-- Compras Stripe: seguimiento persistente de emision y envio de entradas.
-- No marca correos historicos como enviados ni modifica entradas manuales.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ticket_email_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS ticket_email_id text,
  ADD COLUMN IF NOT EXISTS fulfillment_error text,
  ADD COLUMN IF NOT EXISTS fulfillment_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfillment_locked_until timestamptz;

CREATE INDEX IF NOT EXISTS orders_pending_ticket_email_idx
ON public.orders (fulfillment_last_attempt_at NULLS FIRST)
WHERE ticket_email_pending = true;

CREATE OR REPLACE FUNCTION public.fulfill_stripe_purchase(p_event_id uuid, p_buyer_name text, p_buyer_birthdate date, p_buyer_email text, p_buyer_phone text, p_stripe_checkout_session_id text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_existing_ticket_count integer;
  v_item_count integer;
  v_recover_empty_order boolean := false;
  v_total numeric;
  v_result jsonb;
BEGIN
  IF p_stripe_checkout_session_id IS NULL
    OR btrim(p_stripe_checkout_session_id) = '' THEN
    RAISE EXCEPTION 'Stripe session id obligatorio';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Formato de entradas no valido';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La compra no contiene entradas';
  END IF;

  -- Serializa entregas concurrentes de una misma Checkout Session. Las
  -- colisiones del hash solo serializan sesiones distintas de forma inocua.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_stripe_checkout_session_id, 0)
  );

  SELECT orders.*
  INTO v_order
  FROM public.orders
  WHERE orders.stripe_checkout_session_id = p_stripe_checkout_session_id;

  IF FOUND THEN
    IF v_order.event_id <> p_event_id THEN
      RAISE EXCEPTION 'La sesion Stripe ya pertenece a otro evento';
    END IF;

    IF v_order.status IS DISTINCT FROM 'paid'
      OR v_order.buyer_name IS DISTINCT FROM p_buyer_name
      OR v_order.buyer_birthdate IS DISTINCT FROM p_buyer_birthdate
      OR v_order.buyer_email IS DISTINCT FROM p_buyer_email
      OR v_order.buyer_phone IS DISTINCT FROM p_buyer_phone THEN
      RAISE EXCEPTION
        'La order existente no coincide con los datos de la sesion Stripe';
    END IF;

    SELECT count(*)::integer
    INTO v_existing_ticket_count
    FROM public.tickets
    WHERE tickets.order_id = v_order.id;

    -- El flujo antiguo podia dejar la order creada antes de insertar ningun
    -- ticket. Como sold se reconcilia al aplicar esta migracion, ese estado
    -- vacio se puede completar de forma segura dentro de esta transaccion.
    IF v_existing_ticket_count = 0 THEN
      v_recover_empty_order := true;
    ELSE
      -- Una order creada por esta funcion siempre tiene todos sus tickets.
      -- Cualquier otra diferencia es ambigua y requiere revision manual.
      WITH requested AS (
        SELECT
          (item ->> 'ticketTypeId')::uuid AS ticket_type_id,
          sum((item ->> 'quantity')::integer)::integer AS quantity
        FROM jsonb_array_elements(p_items) AS input(item)
        GROUP BY (item ->> 'ticketTypeId')::uuid
      ),
      existing AS (
        SELECT tickets.ticket_type_id, count(*)::integer AS quantity
        FROM public.tickets
        WHERE tickets.order_id = v_order.id
        GROUP BY tickets.ticket_type_id
      )
      SELECT count(*)
      INTO v_item_count
      FROM (
        SELECT
          requested.ticket_type_id,
          requested.quantity AS requested_quantity,
          existing.quantity AS existing_quantity
        FROM requested
        FULL JOIN existing USING (ticket_type_id)
        WHERE requested.quantity IS DISTINCT FROM existing.quantity
      ) AS mismatches;

      IF v_item_count > 0 THEN
        RAISE EXCEPTION
          'La order existente para la sesion Stripe esta incompleta o no coincide con la compra';
      END IF;

      SELECT jsonb_build_object(
        'order', to_jsonb(v_order),
        'tickets', COALESCE(
          jsonb_agg(to_jsonb(tickets) ORDER BY tickets.created_at, tickets.id),
          '[]'::jsonb
        )
      )
      INTO v_result
      FROM public.tickets
      WHERE tickets.order_id = v_order.id;

      RETURN v_result;
    END IF;
  END IF;

  WITH requested AS (
    SELECT
      (item ->> 'ticketTypeId')::uuid AS ticket_type_id,
      (item ->> 'quantity')::integer AS quantity
    FROM jsonb_array_elements(p_items) AS input(item)
  )
  SELECT COALESCE(sum(requested.quantity), 0)::integer
  INTO v_item_count
  FROM requested;

  IF v_item_count <= 0 OR EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS input(item)
    WHERE (item ->> 'quantity')::integer <= 0
  ) THEN
    RAISE EXCEPTION 'Cantidad de entradas no valida';
  END IF;

  -- El orden estable de bloqueo evita deadlocks cuando dos compras incluyen
  -- varios tipos de entrada en orden diferente.
  PERFORM ticket_types.id
  FROM public.event_ticket_types AS ticket_types
  JOIN (
    SELECT DISTINCT (item ->> 'ticketTypeId')::uuid AS ticket_type_id
    FROM jsonb_array_elements(p_items) AS input(item)
  ) AS requested ON requested.ticket_type_id = ticket_types.id
  ORDER BY ticket_types.id
  FOR UPDATE OF ticket_types;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT DISTINCT (item ->> 'ticketTypeId')::uuid AS ticket_type_id
      FROM jsonb_array_elements(p_items) AS input(item)
    ) AS requested
    LEFT JOIN public.event_ticket_types AS ticket_types
      ON ticket_types.id = requested.ticket_type_id
    WHERE ticket_types.id IS NULL
      OR ticket_types.event_id IS DISTINCT FROM p_event_id
  ) THEN
    RAISE EXCEPTION 'Hay tipos de entrada inexistentes o de otro evento';
  END IF;

  -- El cobro ya esta confirmado: una venta simultanea no puede dejar al
  -- comprador sin entradas. El checkout sigue comprobando stock antes de pagar.

  WITH requested AS (
    SELECT
      (item ->> 'ticketTypeId')::uuid AS ticket_type_id,
      sum((item ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items) AS input(item)
    GROUP BY (item ->> 'ticketTypeId')::uuid
  )
  SELECT sum(ticket_types.price * requested.quantity)
  INTO v_total
  FROM requested
  JOIN public.event_ticket_types AS ticket_types
    ON ticket_types.id = requested.ticket_type_id;

  IF NOT v_recover_empty_order THEN
    INSERT INTO public.orders (
      event_id,
      buyer_name,
      buyer_birthdate,
      buyer_email,
      buyer_phone,
      total_amount,
      status,
      stripe_checkout_session_id,
      stripe_session_id,
      fulfilled_at
    ) VALUES (
      p_event_id,
      p_buyer_name,
      p_buyer_birthdate,
      p_buyer_email,
      p_buyer_phone,
      v_total,
      'paid',
      p_stripe_checkout_session_id,
      p_stripe_checkout_session_id,
      NULL
    )
    RETURNING public.orders.* INTO v_order;
  END IF;

  WITH requested AS (
    SELECT
      (item ->> 'ticketTypeId')::uuid AS ticket_type_id,
      (item ->> 'quantity')::integer AS quantity,
      item_order
    FROM jsonb_array_elements(p_items) WITH ORDINALITY
      AS input(item, item_order)
  ),
  expanded AS (
    SELECT
      requested.ticket_type_id,
      requested.item_order,
      ticket_number,
      row_number() OVER (
        ORDER BY requested.item_order, ticket_number
      ) AS purchase_order
    FROM requested
    CROSS JOIN LATERAL generate_series(1, requested.quantity)
      AS generated(ticket_number)
  )
  INSERT INTO public.tickets (
    order_id,
    event_id,
    ticket_type_id,
    qr_code,
    created_at
  )
  SELECT
    v_order.id,
    p_event_id,
    expanded.ticket_type_id,
    gen_random_uuid()::text,
    statement_timestamp()
      + ((expanded.purchase_order - 1) * interval '1 microsecond')
  FROM expanded
  ORDER BY expanded.purchase_order;

  WITH requested AS (
    SELECT
      (item ->> 'ticketTypeId')::uuid AS ticket_type_id,
      sum((item ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items) AS input(item)
    GROUP BY (item ->> 'ticketTypeId')::uuid
  )
  UPDATE public.event_ticket_types AS ticket_types
  SET sold = COALESCE(ticket_types.sold, 0) + requested.quantity
  FROM requested
  WHERE ticket_types.id = requested.ticket_type_id;

  UPDATE public.orders
  SET fulfilled_at = now()
  WHERE orders.id = v_order.id
  RETURNING public.orders.* INTO v_order;

  SELECT jsonb_build_object(
    'order', to_jsonb(v_order),
    'tickets', COALESCE(
      jsonb_agg(to_jsonb(tickets) ORDER BY tickets.created_at, tickets.id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM public.tickets
  WHERE tickets.order_id = v_order.id;

  RETURN v_result;
END;
$function$;


REVOKE ALL ON FUNCTION public.fulfill_stripe_purchase(uuid,text,date,text,text,text,jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_purchase(uuid,text,date,text,text,text,jsonb)
TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
