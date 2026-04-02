-- =========================================
-- ALTER EGO - MIGRACIÓN FINAL MULTI EVENTO
-- Ejecutar SOLO cuando producción ya use
-- event_participants en toda la app
-- =========================================

-- 1. ELIMINAR COLUMN POINTS GLOBAL (YA NO SE USA)
ALTER TABLE public.participants
DROP COLUMN IF EXISTS points;


-- 2. ASEGURAR CLAVE PRIMARIA EN event_participants
-- (evita duplicados mismo participante en mismo evento)
ALTER TABLE public.event_participants
ADD CONSTRAINT event_participants_pk
PRIMARY KEY (event_id, participant_id);


-- 3. ASEGURAR FOREIGN KEYS (por seguridad)
ALTER TABLE public.event_participants
ADD CONSTRAINT event_participants_event_fk
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

ALTER TABLE public.event_participants
ADD CONSTRAINT event_participants_participant_fk
FOREIGN KEY (participant_id)
REFERENCES public.participants(id)
ON DELETE CASCADE;


-- 4. ÍNDICE PARA RANKING RÁPIDO
CREATE INDEX IF NOT EXISTS idx_event_participants_ranking
ON public.event_participants (event_id, points DESC);


-- 5. ÍNDICE PARA BÚSQUEDA POR PARTICIPANTE
CREATE INDEX IF NOT EXISTS idx_event_participants_participant
ON public.event_participants (participant_id);


-- 6. ACTIVAR REPLICA IDENTITY FULL PARA REALTIME
ALTER TABLE public.event_participants
REPLICA IDENTITY FULL;


-- 7. (OPCIONAL) ELIMINAR FUNCIÓN ANTIGUA GLOBAL
-- Solo si ya no se usa en ningún sitio
DROP FUNCTION IF EXISTS public.increment_points;


-- 8. (OPCIONAL) LIMPIAR FUNCIÓN DE IMPORT ANTIGUA
DROP FUNCTION IF EXISTS public.replace_participants;
