-- Corrige exclusivamente los avisos del Security Advisor para estas RPC.
-- No cambia sus cuerpos, SECURITY INVOKER/DEFINER ni ninguna policy RLS.

BEGIN;

-- Evita que la resolucion de objetos dependa del search_path de la sesion.
-- Se omite la firma porque cada nombre identifica una unica funcion.
ALTER FUNCTION public.increment_event_points
SET search_path = pg_catalog, public, pg_temp;

ALTER FUNCTION public.replace_participants_for_event
SET search_path = pg_catalog, public, pg_temp;

-- Esta SECURITY DEFINER solo se invoca desde rutas server-side con service_role.
REVOKE EXECUTE ON FUNCTION public.increment_ticket_sold(uuid, integer)
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.increment_ticket_sold(uuid, integer)
FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_ticket_sold(uuid, integer)
TO service_role;

COMMIT;
