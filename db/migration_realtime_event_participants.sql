-- ALTER EGO - Realtime para rankings y panel de participantes

ALTER TABLE public.event_participants
REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.event_participants;
  END IF;
END $$;
