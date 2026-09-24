import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type OrderRow = {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_birthdate: string;
  buyer_email: string;
  buyer_phone: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  stripe_checkout_session_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type TicketRow = {
  order_id: string;
  ticket_type_id: string;
};

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  price: number | string;
  stock: number | null;
  status: string;
};

type EventRow = {
  id: string;
  title: string;
};

type PurchaseItem = {
  ticketTypeId: string;
  quantity: number;
};

type AuditedCase = {
  orderId: string;
  eventId: string;
  eventTitle: string;
  createdAt: string;
  stripeSessionId: string | null;
  totalAmount: number;
  classification: "automatic" | "manual";
  reasons: string[];
  items: Array<{
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    restoreMissingType: boolean;
    historicalUnitAmountCents: number | null;
  }>;
};

const PAGE_SIZE = 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

async function readAllRows<T>(
  readPage: (from: number, to: number) => Promise<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await readPage(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) return rows;
  }
}

function decimalToCents(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return null;

  const cents = Math.round(numericValue * 100);

  return Math.abs(numericValue * 100 - cents) < 0.001 ? cents : null;
}

function paymentIntentId(
  value: string | Stripe.PaymentIntent | null,
) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function parseItems(value: string | undefined): PurchaseItem[] | null {
  if (!value) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const quantities = new Map<string, number>();

  for (const item of parsed) {
    if (!item || typeof item !== "object") return null;

    const candidate = item as Partial<PurchaseItem>;

    if (
      typeof candidate.ticketTypeId !== "string" ||
      !UUID_PATTERN.test(candidate.ticketTypeId) ||
      !Number.isSafeInteger(candidate.quantity) ||
      Number(candidate.quantity) <= 0
    ) {
      return null;
    }

    quantities.set(
      candidate.ticketTypeId,
      (quantities.get(candidate.ticketTypeId) ?? 0) +
        Number(candidate.quantity),
    );
  }

  return [...quantities.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
}

async function findStripeSession(stripe: Stripe, order: OrderRow) {
  const sessionReferences = [
    order.stripe_checkout_session_id,
    order.stripe_session_id,
  ].filter((value): value is string => Boolean(value));
  const uniqueReferences = [...new Set(sessionReferences)];

  if (uniqueReferences.length > 1) {
    return {
      session: null,
      reason: "Los dos campos de Checkout Session contienen valores distintos",
    };
  }

  try {
    if (uniqueReferences.length === 1) {
      return {
        session: await stripe.checkout.sessions.retrieve(uniqueReferences[0]),
        reason: null,
      };
    }

    if (!order.stripe_payment_intent_id) {
      return {
        session: null,
        reason: "No hay Checkout Session ni Payment Intent para localizarla",
      };
    }

    const sessions = await stripe.checkout.sessions.list({
      payment_intent: order.stripe_payment_intent_id,
      limit: 10,
    });

    if (sessions.has_more || sessions.data.length !== 1) {
      return {
        session: null,
        reason:
          "El Payment Intent no identifica una unica Checkout Session",
      };
    }

    return { session: sessions.data[0], reason: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "error desconocido";

    return {
      session: null,
      reason: `Stripe no permite recuperar la Checkout Session: ${message}`,
    };
  }
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildSql(cases: AuditedCase[]) {
  const automaticCases = cases.filter(
    (candidate) => candidate.classification === "automatic",
  );

  if (automaticCases.length === 0) {
    return "-- No hay casos reparables automaticamente en esta auditoria.\n";
  }

  const rows = automaticCases.flatMap((candidate) =>
    candidate.items.map((item) =>
      [
        sqlLiteral(candidate.orderId),
        sqlLiteral(candidate.eventId),
        sqlLiteral(candidate.stripeSessionId!),
        sqlLiteral(item.ticketTypeId),
        item.quantity,
      ].join(", "),
    ),
  );
  const missingTypes = new Map<
    string,
    {
      eventId: string;
      name: string;
      unitAmountCents: number;
    }
  >();

  for (const candidate of automaticCases) {
    for (const item of candidate.items) {
      if (item.restoreMissingType && item.historicalUnitAmountCents !== null) {
        missingTypes.set(item.ticketTypeId, {
          eventId: candidate.eventId,
          name: item.ticketTypeName,
          unitAmountCents: item.historicalUnitAmountCents,
        });
      }
    }
  }
  const missingTypeRows = [...missingTypes.entries()].map(
    ([ticketTypeId, historical]) =>
      [
        sqlLiteral(ticketTypeId),
        sqlLiteral(historical.eventId),
        sqlLiteral(historical.name),
        (historical.unitAmountCents / 100).toFixed(2),
      ].join(", "),
  );
  const restoreMissingTypesSql =
    missingTypeRows.length === 0
      ? ""
      : `
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
  (${missingTypeRows.join("),\n  (")});

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
`;
  const restoreMissingTypesValidationSql =
    missingTypeRows.length === 0
      ? ""
      : `
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
`;

  return `-- Generado por scripts/audit-historical-ticket-gaps.ts
-- La ejecucion es deliberadamente manual. Revisar antes de aplicar.

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
  (${rows.join("),\n  (")});

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
${restoreMissingTypesSql}

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

${restoreMissingTypesValidationSql}

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
`;
}

async function main() {
  const supabase = createClient(
    requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const stripe = new Stripe(requireEnvironment("STRIPE_SECRET_KEY"));

  const [orders, tickets, ticketTypes, events] = await Promise.all([
    readAllRows<OrderRow>(async (from, to) => {
      const result = await supabase
        .from("orders")
        .select(
          "id,event_id,buyer_name,buyer_birthdate,buyer_email,buyer_phone,total_amount,status,created_at,stripe_checkout_session_id,stripe_session_id,stripe_payment_intent_id",
        )
        .eq("status", "paid")
        .order("id")
        .range(from, to);

      return result as unknown as {
        data: OrderRow[] | null;
        error: { message: string } | null;
      };
    }),
    readAllRows<TicketRow>(async (from, to) => {
      const result = await supabase
        .from("tickets")
        .select("order_id,ticket_type_id")
        .order("id")
        .range(from, to);

      return result as unknown as {
        data: TicketRow[] | null;
        error: { message: string } | null;
      };
    }),
    readAllRows<TicketTypeRow>(async (from, to) => {
      const result = await supabase
        .from("event_ticket_types")
        .select("id,event_id,name,price,stock,status")
        .order("id")
        .range(from, to);

      return result as unknown as {
        data: TicketTypeRow[] | null;
        error: { message: string } | null;
      };
    }),
    readAllRows<EventRow>(async (from, to) => {
      const result = await supabase
        .from("events")
        .select("id,title")
        .order("id")
        .range(from, to);

      return result as unknown as {
        data: EventRow[] | null;
        error: { message: string } | null;
      };
    }),
  ]);

  const ticketCountByOrder = new Map<string, number>();
  const ticketCountByType = new Map<string, number>();

  for (const ticket of tickets) {
    ticketCountByOrder.set(
      ticket.order_id,
      (ticketCountByOrder.get(ticket.order_id) ?? 0) + 1,
    );
    ticketCountByType.set(
      ticket.ticket_type_id,
      (ticketCountByType.get(ticket.ticket_type_id) ?? 0) + 1,
    );
  }

  const candidates = orders.filter(
    (order) => (ticketCountByOrder.get(order.id) ?? 0) === 0,
  );
  const ticketTypeById = new Map(ticketTypes.map((row) => [row.id, row]));
  const eventTitleById = new Map(events.map((row) => [row.id, row.title]));
  const auditedCases: AuditedCase[] = [];

  for (const order of candidates) {
    const reasons: string[] = [];
    const located = await findStripeSession(stripe, order);
    const session = located.session;
    let items: PurchaseItem[] = [];
    const historicalItemEvidence = new Map<
      string,
      { name: string; unitAmountCents: number }
    >();

    if (!session) {
      reasons.push(located.reason ?? "No se encontro la Checkout Session");
    } else {
      const metadata = session.metadata;
      const sessionPaymentIntentId = paymentIntentId(session.payment_intent);
      const orderCents = decimalToCents(order.total_amount);
      const metadataCents = decimalToCents(metadata?.totalAmount);

      if (session.mode !== "payment") reasons.push("La sesion no es de pago");
      if (session.status !== "complete") reasons.push("La sesion no esta completada");
      if (session.payment_status !== "paid") reasons.push("Stripe no marca el pago como pagado");
      if (session.currency !== "eur") reasons.push("La moneda de Stripe no es EUR");
      if (session.amount_total === null || orderCents !== session.amount_total) {
        reasons.push("El importe del pedido no coincide con Stripe");
      }
      if (metadataCents === null || metadataCents !== session.amount_total) {
        reasons.push("metadata.totalAmount no coincide con Stripe");
      }
      if (metadata?.eventId !== order.event_id) {
        reasons.push("metadata.eventId no coincide con la order");
      }
      if (metadata?.buyerName !== order.buyer_name) {
        reasons.push("metadata.buyerName no coincide con la order");
      }
      if (metadata?.buyerBirthdate !== order.buyer_birthdate) {
        reasons.push("metadata.buyerBirthdate no coincide con la order");
      }
      if (metadata?.buyerEmail !== order.buyer_email) {
        reasons.push("metadata.buyerEmail no coincide con la order");
      }
      if (metadata?.buyerPhone !== order.buyer_phone) {
        reasons.push("metadata.buyerPhone no coincide con la order");
      }
      if (
        order.stripe_payment_intent_id &&
        sessionPaymentIntentId !== order.stripe_payment_intent_id
      ) {
        reasons.push("El Payment Intent de Stripe no coincide con la order");
      }

      const parsedItems = parseItems(metadata?.items);

      if (!parsedItems) {
        reasons.push("metadata.items no contiene una composicion valida");
      } else {
        items = parsedItems;

        for (const item of items) {
          const ticketType = ticketTypeById.get(item.ticketTypeId);

          if (!ticketType) {
            reasons.push(`No existe el tipo de entrada ${item.ticketTypeId}`);
          } else if (ticketType.event_id !== order.event_id) {
            reasons.push(
              `El tipo de entrada ${item.ticketTypeId} pertenece a otro evento`,
            );
          }
        }

        try {
          const lineItems = await stripe.checkout.sessions.listLineItems(
            session.id,
            { limit: 100 },
          );
          const stripeQuantity = lineItems.data.reduce(
            (total, lineItem) => total + (lineItem.quantity ?? 0),
            0,
          );
          const metadataQuantity = items.reduce(
            (total, item) => total + item.quantity,
            0,
          );

          if (lineItems.has_more || stripeQuantity !== metadataQuantity) {
            reasons.push(
              "La cantidad de metadata.items no coincide con las line items de Stripe",
            );
          }

          if (
            !lineItems.has_more &&
            items.length === 1 &&
            lineItems.data.length === 1
          ) {
            const lineItem = lineItems.data[0];
            const eventTitle = eventTitleById.get(order.event_id);
            const expectedPrefix = eventTitle ? `${eventTitle} - ` : null;
            const historicalName =
              expectedPrefix && lineItem.description?.startsWith(expectedPrefix)
                ? lineItem.description.slice(expectedPrefix.length).trim()
                : "";
            const unitAmountCents = lineItem.price?.unit_amount ?? null;

            if (
              historicalName &&
              Number.isSafeInteger(unitAmountCents) &&
              Number(unitAmountCents) >= 0 &&
              lineItem.currency === "eur"
            ) {
              historicalItemEvidence.set(items[0].ticketTypeId, {
                name: historicalName,
                unitAmountCents: Number(unitAmountCents),
              });
            }
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "error desconocido";
          reasons.push(`No se pudieron contrastar las line items: ${message}`);
        }
      }
    }

    auditedCases.push({
      orderId: order.id,
      eventId: order.event_id,
      eventTitle: eventTitleById.get(order.event_id) ?? "Evento desconocido",
      createdAt: order.created_at,
      stripeSessionId: session?.id ?? null,
      totalAmount: Number(order.total_amount),
      classification: reasons.length === 0 ? "automatic" : "manual",
      reasons,
      items: items.map((item) => ({
        ticketTypeId: item.ticketTypeId,
        ticketTypeName:
          ticketTypeById.get(item.ticketTypeId)?.name ??
          historicalItemEvidence.get(item.ticketTypeId)?.name ??
          "Tipo desconocido",
        quantity: item.quantity,
        restoreMissingType: false,
        historicalUnitAmountCents:
          historicalItemEvidence.get(item.ticketTypeId)?.unitAmountCents ?? null,
      })),
    });
  }

  // Un UUID de tipo eliminado puede restaurarse sin mapearlo a un tipo actual
  // solo cuando todas sus sesiones aportan la misma evidencia historica:
  // evento, nombre y precio unitario exactos en Stripe.
  const missingTypeIds = new Set(
    auditedCases.flatMap((candidate) =>
      candidate.items
        .filter((item) => !ticketTypeById.has(item.ticketTypeId))
        .map((item) => item.ticketTypeId),
    ),
  );

  for (const missingTypeId of missingTypeIds) {
    const affectedCases = auditedCases.filter((candidate) =>
      candidate.items.some((item) => item.ticketTypeId === missingTypeId),
    );
    const evidenceKeys = new Set(
      affectedCases.map((candidate) => {
        const item = candidate.items.find(
          (candidateItem) => candidateItem.ticketTypeId === missingTypeId,
        );

        return item?.historicalUnitAmountCents === null || !item
          ? ""
          : `${candidate.eventId}\u0000${item.ticketTypeName}\u0000${item.historicalUnitAmountCents}`;
      }),
    );
    const missingReason = `No existe el tipo de entrada ${missingTypeId}`;
    const hasOnlyRestorableReasons = affectedCases.every(
      (candidate) =>
        candidate.reasons.length === 1 && candidate.reasons[0] === missingReason,
    );

    if (
      hasOnlyRestorableReasons &&
      evidenceKeys.size === 1 &&
      !evidenceKeys.has("")
    ) {
      for (const candidate of affectedCases) {
        candidate.reasons = candidate.reasons.filter(
          (reason) => reason !== missingReason,
        );
        candidate.classification = "automatic";

        const item = candidate.items.find(
          (candidateItem) => candidateItem.ticketTypeId === missingTypeId,
        );

        if (item) item.restoreMissingType = true;
      }
    }
  }

  // El stock se comprueba para el conjunto completo, no pedido a pedido. Si
  // varios historicos compiten por un stock insuficiente, ninguno se elige de
  // forma arbitraria: todos quedan para revision manual.
  const automaticCases = auditedCases.filter(
    (candidate) => candidate.classification === "automatic",
  );
  const plannedByType = new Map<string, number>();

  for (const candidate of automaticCases) {
    for (const item of candidate.items) {
      plannedByType.set(
        item.ticketTypeId,
        (plannedByType.get(item.ticketTypeId) ?? 0) + item.quantity,
      );
    }
  }

  for (const [ticketTypeId, plannedQuantity] of plannedByType) {
    const ticketType = ticketTypeById.get(ticketTypeId);
    const resultingCount =
      (ticketCountByType.get(ticketTypeId) ?? 0) + plannedQuantity;

    if (
      ticketType &&
      ticketType.stock !== null &&
      resultingCount > ticketType.stock
    ) {
      for (const candidate of automaticCases) {
        if (
          candidate.items.some((item) => item.ticketTypeId === ticketTypeId)
        ) {
          candidate.classification = "manual";
          candidate.reasons.push(
            `La reparacion conjunta superaria el stock de ${ticketType.name}`,
          );
        }
      }
    }
  }

  const summary = {
    auditedAt: new Date().toISOString(),
    paidOrders: orders.length,
    paidOrdersWithoutTickets: auditedCases.length,
    automaticallyRepairable: auditedCases.filter(
      (candidate) => candidate.classification === "automatic",
    ).length,
    automaticallyRepairableTickets: auditedCases
      .filter((candidate) => candidate.classification === "automatic")
      .flatMap((candidate) => candidate.items)
      .reduce((total, item) => total + item.quantity, 0),
    manualReview: auditedCases.filter(
      (candidate) => candidate.classification === "manual",
    ).length,
    manualReviewTickets: auditedCases
      .filter((candidate) => candidate.classification === "manual")
      .flatMap((candidate) => candidate.items)
      .reduce((total, item) => total + item.quantity, 0),
    cases: auditedCases,
  };
  const formatArgument = process.argv.find((argument) =>
    argument.startsWith("--format="),
  );
  const format = formatArgument?.split("=")[1] ?? "json";

  if (format === "sql") {
    process.stdout.write(buildSql(auditedCases));
  } else if (format === "json") {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    throw new Error("Formato no valido; usa --format=json o --format=sql");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
