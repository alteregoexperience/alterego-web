-- ALTER EGO - Reparacion puntual auditada el 2026-09-24
--
-- Alcance: 38 orders pagadas del evento HALLOWEEN que tienen cero tickets.
-- Evidencia: cada Checkout Session esta pagada y coincide en evento,
-- comprador, importe, metadata.items y cantidad de line items de Stripe.
-- Resultado esperado: 92 tickets del tipo historico Entrada Preventa (13 EUR).
--
-- Este archivo NO se ejecuta desde la aplicacion. Revisar y ejecutar
-- manualmente en Supabase. Toda discrepancia hace rollback de la transaccion.

BEGIN;

CREATE TEMP TABLE historical_ticket_repair_plan (
  order_id uuid NOT NULL,
  event_id uuid NOT NULL,
  stripe_checkout_session_id text NOT NULL,
  ticket_type_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, ticket_type_id)
) ON COMMIT DROP;

INSERT INTO historical_ticket_repair_plan (
  order_id,
  event_id,
  stripe_checkout_session_id,
  ticket_type_id,
  quantity
) VALUES
  ('046a2d7c-0cc5-4930-81b0-5d5faa0bb364', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1OdxSWL4lK4grBSzuPnaxanZoTNwGPXKiW8t19oiHvobZ2jBfofwA8tkI', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('10a6fdaf-3273-4931-800b-d23ad120392e', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1PXNH3Z0CrDK7ASeCbkpgTH3IW3KFsyCowrUc9qemzBn8XEfW4eZ5deN5', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('10e91760-d6a9-44ad-8a71-e10387adebff', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1AoFf9XrH3NyaRGZgZdTuf2iXaELPlXqdV2UUrGbFXBcKwgVwht4JL0TQ', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 5),
  ('1b6b7ee2-cc39-49ef-a29d-52c3407cc8af', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1eS7IZjqCyu7SPmEZnq4jMp6rLQgx9hn1SMfxN0TX5u69YsGNmsbhv6j3', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 3),
  ('2e1003bf-59e2-4af3-a699-f3b09e059846', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1QsFILSe5dnhbZc8ll1DavMcDqfdAYfqt9ZtZXx6TUqiQTHi4nUY0EsK8', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('30c0eb1d-8d67-405d-b646-afa12c8b2048', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1eZPLiMGKi9UaiXJ2zuEgWM5oJLMTldk96BexNuejMUZtjm5uTwLdvFOZ', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('38bcae9c-f7b8-42b4-8bca-b2cc09775b56', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1odCq1ndpDin2WdjQxGbsUI30oqDb3xFXqKH8EQ4YT1AuObNd2b7g9I6Q', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('39823bef-f7d8-4d39-8b57-3d6b728d20c4', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a156RhuHFojtlkj7IQ3h7B0r3eFm42FIgJXSNnLpM2C4Rq6E5PuIPIFTp4', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('3adc2953-849d-4f8f-a4ec-a4543c396360', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a17nPXVCL7DIXjTg0iiQy5cJmUr02ZAkd2YbsK6VZVyIhHVTinAaKlgB8z', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 4),
  ('3f3d4c0e-64e6-4fb3-9efe-7df0664cb2ce', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1BahZzv4oGdktEm2uRx0BQz5FZwtWGe4pD6nud1dZiOhE22lCXQhsRsrE', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 3),
  ('43555e84-ba3d-4d97-874c-97e28b091d9e', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1x6k9zYASQJ6KiuwFyTTrjF2OzUBXKwSNCwief3W2e0Vmyph9hNLi8IJb', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('4b15fe14-5014-4f3a-8b4b-86aa885ced20', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a11TFeKjN7XXRf0PwFh3fpCdBhw1yedAzTqqTSW78Xeq4KhfMpH7y5xdVy', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 5),
  ('4fcf9b92-73b0-40eb-94c6-d1c8836b5fc9', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1j8HTIFbHaAPaNlGPTxHYcbFOWMwrYaMcokFFMgkWXaHQkSXFYH1voYyB', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 8),
  ('52485bdd-6e01-437a-9e49-59ac79677df1', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1MZz67qMeff3dTAUKbdqkOIF1AnIkPnkfgG55CC6tiWD20bdkq5Xfo74A', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('52fdad44-8d5f-4144-b046-024f086694cf', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1uIuehDO4W6vdL8SlzKFxOssgC55EvVo01fW4VhIJ6ktcUka745I8reaE', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('5ae5afe8-2c64-4b53-8f3f-0bf7ad802125', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a19VZMWUvZf36wQaJ0jJz4EmhdQKxddlbBu6jhZrMYb1UNMQUF9nizBR7W', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('6ae92e43-838f-4235-856b-361a0aaf42c6', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1cv1OFzHuP0hujIOp2LsGMqfYz9U2OcBApF7KZOdA4GiE9zpYCaeny76y', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 3),
  ('6f1fc455-f204-4ab6-b3b8-7edf7de995bc', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1Pefq6U8D4cQ34vJY2bg8HgYOKxY7RwyZEt1vWck1DDFJvQ02XtwLK1F8', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('6fc74657-ae40-4959-8089-820a420bfdd4', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a13lIFyCFmQ04sg0x6e68JH6YJY0fMyQCWJJ02n9fRdWgXEUhDLzg1zHtv', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 4),
  ('70548967-c8b6-4393-b251-287761ba3c4d', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1MlaYJOy43lAZPVCs0KXy0NmjttBTekwd7Guf5V6PfHNvdzGwRXAK6oTl', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('7c09b287-390d-4bbb-aee4-927e977501fe', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1cSVC0MRd8217L5g2JH6CvmTd4KRPK1UKRfPRXMMVLKSt1dohKiuwoGyD', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('8000720f-8646-42cd-b6a7-4257ce2ab75c', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a17sL34otkbmrqWzRNnZ1jBOirZUjOeECY26as0Zm3BnL8tWN3pOCCq8UA', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 4),
  ('806b0c6b-d906-4618-9e7a-06a6d61dbfea', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1ElRbPmkNhVxvgZRe31X78N3qrKktnaIxhpEGshhDdQW2FPv4RAc1fcBI', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('8c1cf211-2cc0-4d3f-9e33-c16e54b11dfd', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1PbvtMEEQSfUGsVhYyuDtF0mHPiNpxo4WIv3WQS4RZFBq2RIkZxEsgFU1', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 3),
  ('90a3ee78-1229-42b1-9e34-6d0c4d4107d0', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1c3da0DnjEoImY7HPSwPqASiz1MXtlkVTlE1Q43R0r3Pts3UrO4L3ACOf', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('9d0b5450-1a42-4825-a0a7-cd92dfa40c9d', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1QyOGEZ830inKCNy5gsRuIs1yBRmvGiGrgFbog6MBKxGVjSKoAwRJ8kQH', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('ab629845-0bc5-4785-b57e-efb3bec638f6', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1ttSzfPS0hmDZIfBpmTob2pxrJmWcmcDWqStqqAV7uXLYTZgTxm5dd3Pa', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('ac951a30-fafc-4130-98ed-25feec86ae9b', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1Zt6nu9b8cuK6V9p5CSaL1T0Akn8KpBmPVgikNNrtJxJeb8xzV2rieTKZ', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 4),
  ('b2b10598-0b96-4930-b2f2-6ed5cb6ed367', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1VdH08K01cLOOByin6VkBIL6oQ8V3jDq6mEO4VjnatbsFGTDeHZFvohMf', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('b84e4c9a-5b3b-4201-b529-aa87eff1f14b', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1FDkuPoBhpLpp60rXGoHfZHVu3xttQpGKn9ykmYDnVQX5SlEgtB747bwT', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('cab65817-eebb-48a7-9c11-b59c6f2bb102', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1YZ1Mv1P26KBCjcFWAeRMwJL4YiXGFpSm8ult0Ae04dBU9OxkZPu7bN1N', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('ce18cda4-f70c-4caf-993a-706fc5af51be', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a142wnL7jyfGIkMO2bwMOc2UQDSdtmsuENa8EmZuRXgcQ1mrikcgdDJolK', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('d458ec8f-4ee6-43d8-befc-97c16d6d8e04', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1Auw2YevM0pm73nwKfvG9K77JXqXmq70XFgvPTpk3Ydqfzs1CYXbcFdAb', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 10),
  ('e18c24f1-b971-4215-9918-8edda40c284c', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1dNw4ZHwUkl5bYBqEb63cxL9SAd7yenkxRbpkSPis5unyZQmhLi528fee', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('e7eee482-92f8-4d3b-9d3a-61ff24288d34', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1A3iecp4qg7sFpKiqX7Orob2ztgFq0RiVDsVQ17NYvgb9yVHL1nQzQZeT', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('ea62b623-db15-4a31-b5de-106dfbd55ddc', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1KWFb92O6YD2kxYTBEwZaKXm6DmXqC9ZLyINeiQUBwddHFgveVUXOm9Vm', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 2),
  ('fd774708-e8f3-4b80-9a71-44b8626d657a', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1CvJwipmFnA23uCGyaZd7Z6JQwn7htnF2Lga6OHyjd7yshTxVmZ6TSJi5', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 1),
  ('fe7a550c-30ff-40f2-9e70-636ffd866996', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'cs_live_a1ssX33py74OwWNUQ9mN31Y5U23bIqvYdDM73iFLTLnBpwc5DAFUMgNPpQ', 'b695a3f8-8792-4803-a817-b6ca3e643ceb', 4);

-- Usa el mismo candado que fulfill_stripe_purchase para no competir con un
-- reintento simultaneo del webhook de la misma Checkout Session.
SELECT pg_advisory_xact_lock(
  hashtextextended(stripe_checkout_session_id, 0)
)
FROM (
  SELECT DISTINCT stripe_checkout_session_id
  FROM historical_ticket_repair_plan
  ORDER BY stripe_checkout_session_id
) AS sessions;

-- Stripe conserva el UUID, nombre y precio originales. Se restaura el tipo
-- solo como referencia historica e inactivo para que no vuelva a venderse.
CREATE TEMP TABLE historical_ticket_type_restore_plan (
  ticket_type_id uuid PRIMARY KEY,
  event_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL
) ON COMMIT DROP;

INSERT INTO historical_ticket_type_restore_plan (
  ticket_type_id,
  event_id,
  name,
  price
) VALUES
  ('b695a3f8-8792-4803-a817-b6ca3e643ceb', 'cf47442c-afe0-46ee-acdc-374cc7b9ba82', 'Entrada Preventa', 13.00);

INSERT INTO public.event_ticket_types (
  id,
  event_id,
  name,
  description,
  price,
  stock,
  sold,
  status,
  order_index
)
SELECT
  restore.ticket_type_id,
  restore.event_id,
  restore.name,
  NULL,
  restore.price,
  NULL,
  0,
  'inactive',
  0
FROM historical_ticket_type_restore_plan AS restore
ON CONFLICT (id) DO NOTHING;

SELECT orders.id
FROM public.orders AS orders
JOIN (
  SELECT DISTINCT order_id
  FROM historical_ticket_repair_plan
) AS planned ON planned.order_id = orders.id
ORDER BY orders.id
FOR UPDATE OF orders;

SELECT ticket_types.id
FROM public.event_ticket_types AS ticket_types
JOIN (
  SELECT DISTINCT ticket_type_id
  FROM historical_ticket_repair_plan
) AS planned ON planned.ticket_type_id = ticket_types.id
ORDER BY ticket_types.id
FOR UPDATE OF ticket_types;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT DISTINCT order_id, event_id, stripe_checkout_session_id
      FROM historical_ticket_repair_plan
    ) AS planned
    LEFT JOIN public.orders AS orders ON orders.id = planned.order_id
    WHERE orders.id IS NULL
      OR orders.status IS DISTINCT FROM 'paid'
      OR orders.event_id IS DISTINCT FROM planned.event_id
      OR (
        orders.stripe_checkout_session_id IS DISTINCT FROM
          planned.stripe_checkout_session_id
        AND orders.stripe_session_id IS DISTINCT FROM
          planned.stripe_checkout_session_id
      )
  ) THEN
    RAISE EXCEPTION
      'La order, estado, evento o Checkout Session ya no coincide con la auditoria';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM historical_ticket_type_restore_plan AS restore
    LEFT JOIN public.event_ticket_types AS ticket_types
      ON ticket_types.id = restore.ticket_type_id
    WHERE ticket_types.id IS NULL
      OR ticket_types.event_id IS DISTINCT FROM restore.event_id
      OR ticket_types.name IS DISTINCT FROM restore.name
      OR ticket_types.price IS DISTINCT FROM restore.price
      OR ticket_types.status IS DISTINCT FROM 'inactive'
  ) THEN
    RAISE EXCEPTION
      'El tipo historico restaurado no coincide con la evidencia de Stripe';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM historical_ticket_repair_plan AS planned
    LEFT JOIN public.event_ticket_types AS ticket_types
      ON ticket_types.id = planned.ticket_type_id
    WHERE ticket_types.id IS NULL
      OR ticket_types.event_id IS DISTINCT FROM planned.event_id
  ) THEN
    RAISE EXCEPTION
      'Un tipo de entrada ya no existe o no pertenece al evento auditado';
  END IF;

  -- Cero tickets se repara. Una composicion ya identica se considera un
  -- reintento inocuo. Cualquier estado parcial o diferente aborta todo.
  IF EXISTS (
    WITH expected AS (
      SELECT order_id, ticket_type_id, quantity
      FROM historical_ticket_repair_plan
    ),
    actual AS (
      SELECT tickets.order_id, tickets.ticket_type_id, count(*)::integer AS quantity
      FROM public.tickets AS tickets
      WHERE tickets.order_id IN (
        SELECT DISTINCT order_id FROM historical_ticket_repair_plan
      )
      GROUP BY tickets.order_id, tickets.ticket_type_id
    ),
    orders_with_tickets AS (
      SELECT DISTINCT order_id FROM actual
    )
    SELECT 1
    FROM expected
    FULL JOIN actual USING (order_id, ticket_type_id)
    JOIN orders_with_tickets
      ON orders_with_tickets.order_id = COALESCE(expected.order_id, actual.order_id)
    WHERE expected.quantity IS DISTINCT FROM actual.quantity
  ) THEN
    RAISE EXCEPTION
      'Una order tiene tickets parciales o distintos de la composicion auditada';
  END IF;

  IF EXISTS (
    WITH empty_orders AS (
      SELECT DISTINCT planned.order_id
      FROM historical_ticket_repair_plan AS planned
      WHERE NOT EXISTS (
        SELECT 1 FROM public.tickets WHERE tickets.order_id = planned.order_id
      )
    ),
    additions AS (
      SELECT planned.ticket_type_id, sum(planned.quantity)::integer AS quantity
      FROM historical_ticket_repair_plan AS planned
      JOIN empty_orders USING (order_id)
      GROUP BY planned.ticket_type_id
    )
    SELECT 1
    FROM additions
    JOIN public.event_ticket_types AS ticket_types
      ON ticket_types.id = additions.ticket_type_id
    WHERE ticket_types.stock IS NOT NULL
      AND (
        SELECT count(*) FROM public.tickets
        WHERE tickets.ticket_type_id = additions.ticket_type_id
      ) + additions.quantity > ticket_types.stock
  ) THEN
    RAISE EXCEPTION 'La reparacion superaria el stock del tipo de entrada';
  END IF;
END;
$$;

WITH empty_orders AS (
  SELECT DISTINCT planned.order_id
  FROM historical_ticket_repair_plan AS planned
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tickets WHERE tickets.order_id = planned.order_id
  )
),
expanded AS (
  SELECT
    planned.order_id,
    planned.event_id,
    planned.ticket_type_id,
    row_number() OVER (
      PARTITION BY planned.order_id
      ORDER BY planned.ticket_type_id, generated.ticket_number
    ) AS ticket_number
  FROM historical_ticket_repair_plan AS planned
  JOIN empty_orders USING (order_id)
  CROSS JOIN LATERAL generate_series(1, planned.quantity)
    AS generated(ticket_number)
)
INSERT INTO public.tickets (
  order_id,
  event_id,
  ticket_type_id,
  qr_code,
  created_at
)
SELECT
  expanded.order_id,
  expanded.event_id,
  expanded.ticket_type_id,
  gen_random_uuid()::text,
  statement_timestamp() + ((expanded.ticket_number - 1) * interval '1 microsecond')
FROM expanded;

-- tickets es la fuente de verdad: no se incrementa sold a ciegas.
UPDATE public.event_ticket_types AS ticket_types
SET sold = (
  SELECT count(*)::integer
  FROM public.tickets
  WHERE tickets.ticket_type_id = ticket_types.id
)
WHERE ticket_types.id IN (
  SELECT DISTINCT ticket_type_id FROM historical_ticket_repair_plan
)
AND ticket_types.sold IS DISTINCT FROM (
  SELECT count(*)::integer
  FROM public.tickets
  WHERE tickets.ticket_type_id = ticket_types.id
);

SELECT
  planned.order_id,
  count(tickets.id)::integer AS resulting_ticket_count
FROM (
  SELECT DISTINCT order_id FROM historical_ticket_repair_plan
) AS planned
LEFT JOIN public.tickets AS tickets ON tickets.order_id = planned.order_id
GROUP BY planned.order_id
ORDER BY planned.order_id;

COMMIT;
