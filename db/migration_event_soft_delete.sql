-- Papelera temporal de eventos.
-- Los datos relacionados se conservan mientras deleted_at tenga valor y
-- se eliminan definitivamente, mediante el cron diario, tras 30 dias.

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_events_deleted_at
ON public.events (deleted_at)
WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.events.deleted_at IS
'Fecha de borrado logico. Los eventos se purgan definitivamente tras 30 dias.';
