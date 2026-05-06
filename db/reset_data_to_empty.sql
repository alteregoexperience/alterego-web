-- =========================================
-- ALTER EGO - RESET DE DATOS
-- =========================================
-- Borra los registros de negocio y deja la base limpia para empezar.
-- NO elimina tablas, funciones, indices, policies RLS ni estructura.
--
-- Ejecutar manualmente en Supabase SQL Editor solo si quieres borrar
-- eventos, entradas, pedidos, tickets, participantes y recordatorios.
--
-- Recomendado antes:
-- 1. Hacer backup/export de Supabase.
-- 2. Confirmar que estas en el proyecto correcto.
-- 3. Confirmar que no hay compras reales que conservar.

BEGIN;

TRUNCATE TABLE
  public.tickets,
  public.orders,
  public.ticket_sale_reminders,
  public.event_ticket_types,
  public.event_participants,
  public.participants,
  public.events
RESTART IDENTITY CASCADE;

COMMIT;

-- Opcional: borrar imagenes subidas de portadas de eventos en Supabase Storage.
-- Descomenta solo si tambien quieres vaciar el bucket de portadas.
--
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'event-covers';
