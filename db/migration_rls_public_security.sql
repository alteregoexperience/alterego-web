-- ALTER EGO - RLS para tablas marcadas como UNRESTRICTED
-- Objetivo:
-- 1. Quitar el estado UNRESTRICTED de Supabase.
-- 2. Bloquear escrituras desde la anon key.
-- 3. Mantener funcionando la web publica y el panel de gestion actual.
--
-- Importante:
-- La app usa autenticacion propia por cookie, no Supabase Auth. Por eso RLS no
-- puede distinguir directamente "admin logueado" en consultas desde navegador.
-- Las operaciones sensibles deben hacerse desde APIs server-side con service role.

-- =========================
-- EVENT TICKET TYPES
-- =========================
ALTER TABLE public.event_ticket_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read ticket types" ON public.event_ticket_types;
CREATE POLICY "Anon can read ticket types"
ON public.event_ticket_types
FOR SELECT
TO anon
USING (true);

-- Sin policies de INSERT / UPDATE / DELETE:
-- la anon key no puede crear, modificar ni borrar tipos de entrada.

-- =========================
-- EVENT PARTICIPANTS
-- =========================
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read event participants" ON public.event_participants;
CREATE POLICY "Anon can read event participants"
ON public.event_participants
FOR SELECT
TO anon
USING (true);

-- Sin policies de INSERT / UPDATE / DELETE:
-- la anon key no puede alterar rankings ni asignaciones.

-- =========================
-- ORDERS
-- =========================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- No public policies. Orders son privados y solo deben usarse desde servidor
-- mediante SUPABASE_SERVICE_ROLE_KEY.

-- =========================
-- TICKETS
-- =========================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- No public policies. Los QR y su estado de uso son privados y solo deben
-- crearse/validarse desde servidor mediante SUPABASE_SERVICE_ROLE_KEY.
