-- ALTER EGO - Recordatorios de apertura de venta

BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.ticket_sale_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email text NOT NULL,
  sent_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ticket_sale_reminders_email_check CHECK (position('@' in email) > 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS ticket_sale_reminders_event_email_idx
ON public.ticket_sale_reminders (event_id, email);

CREATE INDEX IF NOT EXISTS ticket_sale_reminders_pending_idx
ON public.ticket_sale_reminders (sent_at, event_id);

ALTER TABLE public.ticket_sale_reminders ENABLE ROW LEVEL SECURITY;

-- Acceso exclusivo desde las APIs del servidor; no depende de los grants
-- automaticos de Supabase y no expone emails al navegador.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ticket_sale_reminders
TO service_role;

COMMIT;
