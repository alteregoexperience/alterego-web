-- Solo lectura. Ejecutar como postgres en el SQL Editor de Supabase.
-- Cada fila debe tener status = OK. No comprueba la visibilidad de las filas
-- que deciden las policies RLS ni la publicacion de Realtime.

WITH required_tables(table_name, public_read) AS (
  VALUES
    ('events', true),
    ('event_ticket_types', true),
    ('participants', false),
    ('event_participants', true),
    ('orders', false),
    ('tickets', false),
    ('ticket_sale_reminders', false)
), required_grants AS (
  SELECT table_name, 'anon'::text AS role_name, 'SELECT'::text AS privilege
  FROM required_tables
  WHERE public_read
  UNION ALL
  SELECT table_name, 'service_role', privilege
  FROM required_tables
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(privilege)
), checks AS (
  SELECT
    required_grants.*,
    tables.oid IS NOT NULL AS table_exists,
    COALESCE(tables.relrowsecurity, false) AS rls_enabled,
    has_schema_privilege(role_name, 'public', 'USAGE') AS schema_usage,
    COALESCE(has_table_privilege(role_name, tables.oid, privilege), false)
      AS privilege_granted
  FROM required_grants
  LEFT JOIN pg_class AS tables
    ON tables.oid = to_regclass(format('public.%I', table_name))
)
SELECT *,
  CASE
    WHEN NOT table_exists THEN 'MISSING_TABLE'
    WHEN NOT schema_usage THEN 'MISSING_SCHEMA_USAGE'
    WHEN NOT privilege_granted THEN 'MISSING_GRANT'
    WHEN NOT rls_enabled THEN 'RLS_DISABLED'
    ELSE 'OK'
  END AS status
FROM checks
ORDER BY table_name, role_name, privilege;

-- Se resuelven las firmas de las RPC definidas fuera del repositorio sin
-- asumir el orden de sus argumentos. Las otras dos firmas son conocidas.
WITH required_functions(function_name, signature) AS (
  VALUES
    ('increment_event_points', NULL::text),
    ('replace_participants_for_event', NULL::text),
    ('increment_ticket_sold', 'public.increment_ticket_sold(uuid,integer)'),
    ('fulfill_stripe_purchase',
      'public.fulfill_stripe_purchase(uuid,text,date,text,text,text,jsonb)')
), checks AS (
  SELECT
    required_functions.function_name,
    functions.oid::regprocedure::text AS signature,
    functions.oid IS NOT NULL AS function_exists,
    has_schema_privilege('service_role', 'public', 'USAGE') AS schema_usage,
    COALESCE(has_function_privilege('service_role', functions.oid, 'EXECUTE'), false)
      AS execute_granted,
    count(functions.oid) OVER (PARTITION BY required_functions.function_name)
      AS signature_count
  FROM required_functions
  LEFT JOIN pg_proc AS functions
    ON functions.pronamespace = 'public'::regnamespace
    AND functions.proname = required_functions.function_name
    AND functions.prokind = 'f'
    AND (required_functions.signature IS NULL
      OR functions.oid = to_regprocedure(required_functions.signature))
)
SELECT *,
  CASE
    WHEN NOT function_exists THEN 'MISSING_FUNCTION'
    WHEN NOT schema_usage THEN 'MISSING_SCHEMA_USAGE'
    WHEN signature_count > 1 THEN 'AMBIGUOUS_FUNCTION'
    WHEN NOT execute_granted THEN 'MISSING_GRANT'
    ELSE 'OK'
  END AS status
FROM checks
ORDER BY function_name, signature;
