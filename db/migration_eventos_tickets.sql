-- =========================================
-- ALTER EGO - MIGRACION FINAL MULTI EVENTO
-- Ejecutar cuando la app ya use event_participants
-- para participantes y rankings por evento.
-- =========================================

-- Esta version es idempotente y compatible con el modelo actual:
-- event_participants mantiene su id uuid primary key y se asegura
-- unique(event_id, participant_id), no una segunda primary key.

-- 1. ELIMINAR COLUMN POINTS GLOBAL EN participants
-- La puntuacion por evento vive en event_participants.points.
ALTER TABLE public.participants
DROP COLUMN IF EXISTS points;


-- 2. ASEGURAR UNIQUE(event_id, participant_id)
-- Evita duplicar el mismo participante dentro del mismo evento.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_participants_event_id_participant_id_key'
      AND conrelid = 'public.event_participants'::regclass
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_participants_unique_event_participant'
      AND conrelid = 'public.event_participants'::regclass
  ) THEN
    ALTER TABLE public.event_participants
    ADD CONSTRAINT event_participants_unique_event_participant
    UNIQUE (event_id, participant_id);
  END IF;
END $$;


-- 3. ASEGURAR FOREIGN KEYS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_participants_event_fk'
      AND conrelid = 'public.event_participants'::regclass
  ) THEN
    ALTER TABLE public.event_participants
    ADD CONSTRAINT event_participants_event_fk
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_participants_participant_fk'
      AND conrelid = 'public.event_participants'::regclass
  ) THEN
    ALTER TABLE public.event_participants
    ADD CONSTRAINT event_participants_participant_fk
    FOREIGN KEY (participant_id)
    REFERENCES public.participants(id)
    ON DELETE CASCADE;
  END IF;
END $$;


-- 4. INDICE PARA RANKING RAPIDO
CREATE INDEX IF NOT EXISTS idx_event_participants_ranking
ON public.event_participants (event_id, points DESC);


-- 5. INDICE PARA BUSQUEDA POR PARTICIPANTE
CREATE INDEX IF NOT EXISTS idx_event_participants_participant
ON public.event_participants (participant_id);


-- 6. ACTIVAR REPLICA IDENTITY FULL PARA REALTIME
ALTER TABLE public.event_participants
REPLICA IDENTITY FULL;


-- 7. ELIMINAR FUNCIONES ANTIGUAS GLOBALES
-- La app actual usa increment_event_points y replace_participants_for_event.
DROP FUNCTION IF EXISTS public.increment_points;
DROP FUNCTION IF EXISTS public.replace_participants;
