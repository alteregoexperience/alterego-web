/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, mocks) {
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const loadedModule = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
    filename: file,
  })(
    (name) => (name in mocks ? mocks[name] : require(name)),
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}

const purchase = {
  eventId: "11111111-1111-4111-8111-111111111111",
  sessionId: "cs_test_purchase",
  paymentIntentId: "pi_test_purchase",
  buyer: {
    name: "Compradora",
    birthdate: "2000-01-01",
    email: "test@example.invalid",
    phone: "600000000",
  },
  items: [
    { ticketTypeId: "22222222-2222-4222-8222-222222222222", quantity: 4 },
  ],
  attendeeNames: [
    "Compradora",
    "Segunda persona",
    "Tercera persona",
    "Cuarta persona",
  ],
  totalAmount: 68,
  unitPrices: [17],
};

function fixture({
  rpcFailures = 0,
  emailFailures = 0,
  pauseEmail = null,
} = {}) {
  const state = {
    order: null,
    tickets: [],
    sold: 0,
    sends: [],
    pdfs: [],
    rpcCalls: 0,
  };
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.operation = "select";
    }
    select() {
      return this;
    }
    insert(value) {
      this.operation = "insert";
      this.value = value;
      return this;
    }
    update(value) {
      this.operation = "update";
      this.value = value;
      return this;
    }
    eq(key, value) {
      this.filters.push((row) => row[key] === value);
      return this;
    }
    is(key, value) {
      this.filters.push((row) => row[key] == value);
      return this;
    }
    in() {
      return this;
    }
    or(value) {
      if (value.startsWith("fulfillment_locked_until"))
        this.filters.push(
          (row) =>
            !row.fulfillment_locked_until ||
            new Date(row.fulfillment_locked_until) < new Date(),
        );
      return this;
    }
    maybeSingle() {
      this.singleResult = true;
      return this;
    }
    single() {
      this.singleResult = true;
      return this;
    }
    then(resolve, reject) {
      return Promise.resolve()
        .then(() => this.run())
        .then(resolve, reject);
    }
    run() {
      if (this.table === "events")
        return {
          data: {
            title: "Evento",
            location: "Sala",
            starts_at: "2026-10-31T22:00:00Z",
            ends_at: null,
          },
          error: null,
        };
      if (this.table === "event_ticket_types")
        return {
          data: [
            {
              id: purchase.items[0].ticketTypeId,
              name: "Last Call",
              price: 99,
            },
          ],
          error: null,
        };
      if (this.table === "tickets") {
        for (const ticket of state.tickets.filter((row) =>
          this.filters.every((filter) => filter(row)),
        ))
          Object.assign(ticket, this.value);
        return { data: null, error: null };
      }
      if (this.operation === "insert") {
        if (state.order) return { data: null, error: { code: "23505" } };
        state.order = {
          ...this.value,
          id: "order-1",
          created_at: "2026-10-26T20:00:00Z",
          fulfilled_at: null,
          ticket_email_sent_at: null,
          fulfillment_locked_until: null,
        };
        return { data: null, error: null };
      }
      const row = state.order;
      if (!row || !this.filters.every((filter) => filter(row)))
        return { data: this.singleResult ? null : [], error: null };
      if (this.operation === "update") Object.assign(row, this.value);
      return {
        data: this.singleResult
          ? { ...row, tickets: [{ count: state.tickets.length }] }
          : null,
        error: null,
      };
    }
  }
  const db = {
    from: (table) => new Query(table),
    rpc: async () => {
      state.rpcCalls++;
      if (rpcFailures-- > 0)
        return {
          data: null,
          error: { message: "Caida temporal de base de datos" },
        };
      if (!state.tickets.length) {
        state.tickets = Array.from({ length: 4 }, (_, i) => ({
          id: `ticket-${i}`,
          ticket_type_id: purchase.items[0].ticketTypeId,
          qr_code: `qr-${i}`,
          holder_name: null,
        }));
        state.sold += 4;
        state.order.fulfilled_at = "2026-10-26T20:01:00Z";
      }
      return {
        data: {
          order: { ...state.order },
          tickets: state.tickets.map((row) => ({ ...row })),
        },
        error: null,
      };
    },
  };
  const api = load("lib/handleSuccessfulPurchase.ts", {
    "@/lib/supabaseAdmin": { supabaseAdmin: db },
    "@/lib/stripePurchase": { getPaidStripePurchase: async () => purchase },
    "@/lib/emailPurchaseTemplate": { renderPurchaseEmail: () => "email" },
    "@/lib/formatTicketEventDateTime": {
      formatTicketEventDateTime: () => ({
        eventDate: "31/10/2026",
        eventTime: "23:00",
      }),
    },
    "@/lib/generateTicketPdf": {
      generateTicketPdf: async (value) => {
        state.pdfs.push(value);
        return Buffer.from(value.ticketId + value.buyerName);
      },
    },
    "@/lib/resend": {
      resend: {
        emails: {
          send: async (body, options) => {
            state.sends.push({ body, options });
            if (pauseEmail) await pauseEmail;
            if (emailFailures-- > 0)
              return {
                data: null,
                error: { message: "Proveedor temporalmente indisponible" },
              };
            return { data: { id: "email-1" }, error: null };
          },
        },
      },
    },
  });
  return { state, api };
}

test("el pago queda pendiente si falla la emision y se recupera sin duplicados", async () => {
  const { state, api } = fixture({ rpcFailures: 1 });
  await assert.rejects(
    api.handleSuccessfulPurchase(purchase.sessionId),
    /Caida temporal/,
  );
  assert.equal(state.order.status, "paid");
  assert.equal(state.order.total_amount, 68);
  assert.equal(state.order.ticket_email_pending, true);
  assert.match(state.order.fulfillment_error, /Caida temporal/);
  assert.equal(state.sends.length, 0);
  assert.equal(
    (await api.handleSuccessfulPurchase(purchase.sessionId)).status,
    "sent",
  );
  assert.equal(state.tickets.length, 4);
  assert.equal(state.sold, 4);
  await api.handleSuccessfulPurchase(purchase.sessionId);
  assert.equal(state.sends.length, 1);
  assert.equal(state.sold, 4);
});

test("un fallo de correo conserva los QR y el reintento envia los cuatro PDF al comprador original", async () => {
  const { state, api } = fixture({ emailFailures: 1 });
  await assert.rejects(
    api.handleSuccessfulPurchase(purchase.sessionId),
    /Proveedor temporalmente/,
  );
  const ids = state.tickets.map((ticket) => ticket.id);
  assert.equal(state.order.ticket_email_pending, true);
  await api.handleSuccessfulPurchase(purchase.sessionId);
  assert.deepEqual(
    state.tickets.map((ticket) => ticket.id),
    ids,
  );
  assert.equal(state.sold, 4);
  assert.equal(state.sends[1].body.to, purchase.buyer.email);
  assert.equal(state.sends[1].body.attachments.length, 4);
  assert.deepEqual(state.sends[0].options, state.sends[1].options);
  assert.equal(state.order.ticket_email_pending, false);
  assert.equal(state.order.ticket_email_id, "email-1");
  assert.ok(state.order.ticket_email_sent_at);
  assert.equal(state.order.fulfillment_error, null);
  assert.ok(state.pdfs.every((pdf) => pdf.price === 17));
  assert.deepEqual(
    state.pdfs.slice(0, 4).map((pdf) => pdf.buyerName),
    purchase.attendeeNames,
  );
});

test("dos notificaciones concurrentes solo generan un envio", async () => {
  let release;
  const pauseEmail = new Promise((resolve) => {
    release = resolve;
  });
  const { state, api } = fixture({ pauseEmail });
  const first = api.handleSuccessfulPurchase(purchase.sessionId);
  while (!state.sends.length)
    await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    (await api.handleSuccessfulPurchase(purchase.sessionId)).status,
    "pending",
  );
  release();
  await first;
  assert.equal(state.sends.length, 1);
  assert.equal(state.tickets.length, 4);
});

test("las compras historicas completas no se reenvian en masa", async () => {
  const { state, api } = fixture();
  await api.handleSuccessfulPurchase(purchase.sessionId);
  state.order.ticket_email_sent_at = null;
  assert.equal(
    (await api.handleSuccessfulPurchase(purchase.sessionId)).status,
    "issued",
  );
  assert.equal(state.sends.length, 1);
});

test("el precio del PDF viene de Stripe y nombres auxiliares corruptos no bloquean el pago", async () => {
  const session = {
    id: purchase.sessionId,
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    currency: "eur",
    amount_total: 6800,
    payment_intent: "pi_test",
    metadata: {
      eventId: purchase.eventId,
      items: JSON.stringify(purchase.items),
      buyerName: "Compradora",
      buyerBirthdate: "2000-01-01",
      buyerEmail: "test@example.invalid",
      buyerPhone: "600000000",
      attendeeNamesChunks: "1",
      attendeeNames_0: "invalido",
    },
  };
  const api = load("lib/stripePurchase.ts", {
    "@/lib/stripe": {
      stripe: {
        checkout: {
          sessions: {
            retrieve: async () => session,
            listLineItems: async function* () {
              yield { quantity: 4, amount_total: 6800 };
            },
          },
        },
      },
    },
  });
  const result = await api.getPaidStripePurchase(purchase.sessionId);
  assert.deepEqual(result.unitPrices, [17]);
  assert.deepEqual(result.attendeeNames, []);
  session.payment_status = "unpaid";
  assert.equal(await api.getPaidStripePurchase(purchase.sessionId), null);
});

test("el webhook rechaza firmas invalidas y procesa pagos diferidos", async () => {
  let valid = false;
  const calls = [];
  const api = load("app/api/stripe/webhook/route.ts", {
    stripe: {},
    "@/lib/stripe": {
      stripe: {
        webhooks: {
          constructEvent: () => {
            if (!valid) throw new Error("Invalid signature");
            return {
              type: "checkout.session.async_payment_succeeded",
              data: { object: { id: purchase.sessionId } },
            };
          },
        },
      },
    },
    "@/lib/handleSuccessfulPurchase": {
      handleSuccessfulPurchase: async (id) => calls.push(id),
    },
  });
  const request = () =>
    new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "test" },
    });
  assert.equal((await api.POST(request())).status, 400);
  assert.equal(calls.length, 0);
  valid = true;
  assert.equal((await api.POST(request())).status, 200);
  assert.deepEqual(calls, [purchase.sessionId]);
});

test("la conciliacion encuentra pagos sin pedido y reintenta pendientes antiguos sin reenviar los completos", async () => {
  const calls = [];
  const session = (id) => ({
    id,
    payment_status: "paid",
    metadata: {
      eventId: purchase.eventId,
      items: JSON.stringify(purchase.items),
    },
  });
  let pages = 0;
  const api = load("lib/reconcileStripePurchases.ts", {
    "@/lib/handleSuccessfulPurchase": {
      handleSuccessfulPurchase: async (id) => {
        calls.push(id);
        return { status: "sent" };
      },
    },
    "@/lib/stripe": {
      stripe: {
        checkout: {
          sessions: {
            list: async () =>
              ++pages === 1
                ? {
                    data: [
                      session("cs_test_missing"),
                      session("cs_test_existing"),
                    ],
                    has_more: true,
                  }
                : { data: [session("cs_test_missing2")], has_more: false },
          },
        },
      },
    },
    "@/lib/supabaseAdmin": {
      supabaseAdmin: {
        from: () => {
          const query = {
            select() {
              return query;
            },
            eq() {
              return query;
            },
            not() {
              return query;
            },
            order() {
              return query;
            },
            limit: async () => ({
              data: [{ stripe_checkout_session_id: "cs_test_old_pending" }],
              error: null,
            }),
            in: async () => ({
              data: [
                {
                  stripe_checkout_session_id: "cs_test_existing",
                  fulfilled_at: "2026-01-01",
                  ticket_email_pending: false,
                  tickets: [{ count: 4 }],
                },
              ],
              error: null,
            }),
          };
          return query;
        },
      },
    },
  });
  const result = await api.reconcileStripePurchases();
  assert.deepEqual(calls, [
    "cs_test_old_pending",
    "cs_test_missing",
    "cs_test_missing2",
  ]);
  assert.equal(result.sent, 3);
  assert.equal(result.scanComplete, true);
});

test("la confirmacion publica no anuncia un correo enviado mientras sigue pendiente", async () => {
  const order = {
    status: "paid",
    fulfilled_at: "2026-10-26",
    ticket_email_pending: true,
    ticket_email_sent_at: null,
  };
  let reads = 0;
  const api = load("app/api/checkout/status/route.ts", {
    "@/lib/stripe": {
      stripe: {
        checkout: {
          sessions: {
            retrieve: async () => {
              throw new Error(
                "No debe consultar Stripe si ya existe el pedido",
              );
            },
          },
        },
      },
    },
    "@/lib/supabaseAdmin": {
      supabaseAdmin: {
        from: () => {
          reads++;
          const query = {
            select() {
              return query;
            },
            eq() {
              return query;
            },
            maybeSingle: async () => ({ data: order, error: null }),
          };
          return query;
        },
      },
    },
  });
  const request = () =>
    new Request(
      "http://localhost/api/checkout/status?session_id=cs_test_valid",
    );
  assert.equal((await (await api.GET(request())).json()).status, "processing");
  order.ticket_email_pending = false;
  order.ticket_email_sent_at = "2026-10-26T21:00:00Z";
  assert.equal((await (await api.GET(request())).json()).status, "sent");
  const invalid = await api.GET(
    new Request("http://localhost/api/checkout/status?session_id=invalid"),
  );
  assert.equal(invalid.status, 400);
  assert.equal(reads, 2);
});

test("la recuperacion automatica exige el secreto del cron", async () => {
  let calls = 0;
  const api = load("app/api/stripe/reconcile/route.ts", {
    "@/lib/reconcileStripePurchases": {
      reconcileStripePurchases: async () => {
        calls++;
        return { scanComplete: true };
      },
    },
  });
  assert.equal(
    (await api.GET(new Request("http://localhost/api/stripe/reconcile")))
      .status,
    401,
  );
  assert.equal(calls, 0);
});
