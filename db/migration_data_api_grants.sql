-- ALTER EGO - Permisos explicitos para la Data API de Supabase.
-- Aplicar una vez sobre el esquema actual y despues de restaurarlo/recrearlo.
-- Requiere las siete tablas y las cuatro RPC que utiliza la app (ver README).
-- Es idempotente: solo anade permisos, sin modificar datos, RLS ni policies.
-- No restaura los permisos automaticos para futuras tablas.

BEGIN;
SET LOCAL lock_timeout = '5s';

-- El navegador usa anon incluso en gestion: la autenticacion es por cookie
-- propia, no Supabase Auth. Las escrituras pasan por APIs con service_role.
GRANT USAGE ON SCHEMA public TO anon, service_role;

GRANT SELECT ON TABLE
  public.events,
  public.event_ticket_types,
  public.event_participants
TO anon;

-- BYPASSRLS no sustituye los permisos de tabla del rol de servidor.
-- No se conceden permisos publicos sobre compradores, QR ni recordatorios.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.events,
  public.event_ticket_types,
  public.participants,
  public.event_participants,
  public.orders,
  public.tickets,
  public.ticket_sale_reminders
TO service_role;

-- Las RPC de participantes se definen fuera de este repositorio. Como en
-- migration_function_security_advisor.sql, se requiere una firma por nombre.
GRANT EXECUTE ON FUNCTION public.increment_event_points TO service_role;
GRANT EXECUTE ON FUNCTION public.replace_participants_for_event TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_ticket_sold(uuid, integer)
TO service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_purchase(
  uuid, text, date, text, text, text, jsonb
) TO service_role;

-- Los identificadores actuales usan UUID: no hay secuencias que conceder.
NOTIFY pgrst, 'reload schema';
COMMIT;
