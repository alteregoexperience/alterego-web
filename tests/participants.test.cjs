/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const XLSX = require("xlsx");

function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(
    (name) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports,
  );
  return loaded.exports;
}

const { parseParticipantNamesExcel } = load("lib/parseParticipantNamesExcel.ts");
function excel(rows, bookType = "xlsx") {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Participantes");
  return XLSX.write(book, { type: "array", bookType });
}

test("Excel sin cabecera incluye A1, omite vacíos y conserva coincidencias", () => {
  assert.deepEqual(parseParticipantNamesExcel(excel([
    ["Nombre Apellido"], [], ["  Ana   García  "], ["Ana García"], ["Óscar López"],
  ])), ["Nombre Apellido", "Ana García", "Ana García", "Óscar López"]);
  assert.deepEqual(parseParticipantNamesExcel(excel([["Ana García"]], "xls")), ["Ana García"]);
});

test("lee la columna A aunque el rango comience en una fila vacía", () => {
  assert.deepEqual(parseParticipantNamesExcel(excel([[], [], ["Ana García", "ignorado"]])), ["Ana García"]);
  assert.throws(() => parseParticipantNamesExcel(excel([[undefined, "Otra columna"]])), /primera columna/);
});

test("rechaza Excel vacío, valores que no son nombres y archivos demasiado largos", () => {
  assert.throws(() => parseParticipantNamesExcel(excel([])), /vacío/);
  assert.throws(() => parseParticipantNamesExcel(excel([[123]])), /A1/);
  assert.throws(() => parseParticipantNamesExcel(excel([["a".repeat(201)]])), /demasiado largo/);
  assert.throws(() => parseParticipantNamesExcel(excel(Array.from({ length: 5001 }, () => ["Ana"]))), /5000/);
});

test("la API protege la importación, valida datos y conserva el identificador de reintento", async () => {
  let authorized = false;
  const calls = [];
  const api = load("app/api/participants/import/route.ts", {
    "@/lib/auth": { checkAuth: async () => authorized },
    "@/lib/supabaseAdmin": { supabaseAdmin: { rpc: async (...args) => {
      calls.push(args);
      return { data: { insertedCount: 1, duplicates: ["Ana García"] }, error: null };
    } } },
  });
  const payload = {
    eventId: "11111111-1111-4111-8111-111111111111",
    importId: "22222222-2222-4222-8222-222222222222",
    names: ["Ana García"],
  };
  const request = (body) => new Request("http://localhost/api/participants/import", {
    method: "POST", body: JSON.stringify(body),
  });
  assert.equal((await api.POST(request(payload))).status, 401);
  authorized = true;
  for (const body of [null, {}, { ...payload, names: [123] }, { ...payload, names: [] }, { ...payload, eventId: "otro" }, { ...payload, includeDuplicates: "true" }]) {
    assert.equal((await api.POST(request(body))).status, 400);
  }
  assert.equal(calls.length, 0);
  const response = await api.POST(request({ ...payload, includeDuplicates: true }));
  assert.deepEqual(await response.json(), { insertedCount: 1, duplicates: ["Ana García"] });
  assert.deepEqual(calls, [["add_participants_to_event", {
    p_event_id: payload.eventId, p_names: payload.names, p_import_id: payload.importId, p_include_duplicates: true,
  }]]);
});

test("la lista de gestión carga todas las páginas y filtra por el evento", async () => {
  const ranges = [];
  const eventId = "11111111-1111-4111-8111-111111111111";
  const rows = Array.from({ length: 1002 }, (_, index) => ({
    points: index, participant: { id: `p-${index}`, name: `Persona ${index}`, instagram: null },
  }));
  const api = load("app/api/events/[slug]/participants/route.ts", {
    "@/lib/supabaseAdmin": { supabaseAdmin: { from: (table) => {
      const query = {
        select: () => query, is: () => query, order: () => query,
        eq: (key, value) => {
          if (table === "event_participants") {
            assert.equal(key, "event_id");
            assert.equal(value, eventId);
          }
          return query;
        },
        single: async () => ({ data: { id: eventId }, error: null }),
        range: async (start, end) => {
          ranges.push([start, end]);
          return { data: rows.slice(start, end + 1), error: null };
        },
      };
      return query;
    } } },
  });
  const response = await api.GET(new Request("http://localhost/api/events/prueba/participants?order=name"), {
    params: Promise.resolve({ slug: "prueba" }),
  });
  const data = await response.json();
  assert.equal(data.participants.length, 1002);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
});

// Ejecutar con PGLITE_TEST_MODULE apuntando a una instalación temporal de
// @electric-sql/pglite. Nunca conecta con Supabase ni utiliza datos reales.
test("SQL: importación atómica por evento, homónimos, reintentos y compradores", {
  skip: !process.env.PGLITE_TEST_MODULE,
}, async () => {
  const { PGlite } = require(process.env.PGLITE_TEST_MODULE);
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE events (id uuid PRIMARY KEY, deleted_at timestamptz);
      CREATE TABLE participants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, instagram text, created_at timestamptz DEFAULT now());
      CREATE TABLE event_participants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid REFERENCES events(id), participant_id uuid REFERENCES participants(id), points integer DEFAULT 0, UNIQUE(event_id, participant_id));
      CREATE TABLE orders (id uuid PRIMARY KEY, event_id uuid REFERENCES events(id), buyer_name text, status text);
      INSERT INTO events(id) VALUES ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, "..", "db/migration_participant_import_and_buyers.sql"), "utf8"));
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    const add = async (event, names, include = false, id = crypto.randomUUID()) => {
      const result = await db.query("SELECT public.add_participants_to_event($1, $2, $3, $4) AS result", [event, JSON.stringify(names), include, id]);
      return result.rows[0].result;
    };
    const list = async (event) => (await db.query("SELECT p.name, ep.points, p.id FROM event_participants ep JOIN participants p ON p.id = ep.participant_id WHERE event_id = $1 ORDER BY name", [event])).rows;
    assert.deepEqual(await add(a, ["Ana García", "Luis Pérez"]), { insertedCount: 2, duplicates: [] });
    await db.exec("UPDATE event_participants SET points = 100");
    await add(b, ["Ana García", "Berta López"]);
    const beforeB = await list(b);
    assert.equal((await list(a))[0].id, beforeB[0].id); // Catálogo compartido.
    assert.deepEqual(await add(a, ["  ANA   GARCÍA ", "Marta Sánchez", "Marta Sánchez"]), {
      insertedCount: 1, duplicates: ["ANA GARCÍA", "Marta Sánchez"],
    });
    assert.deepEqual(await list(b), beforeB);
    assert.equal((await list(a))[0].points, 100);
    const importId = crypto.randomUUID();
    await add(a, ["Ana García"], true, importId);
    await add(a, ["Ana García"], true, importId);
    assert.equal((await list(a)).filter((row) => row.name === "Ana García").length, 2);
    const beforeInvalid = await list(a);
    await assert.rejects(add(a, ["No debe guardarse", ""]));
    assert.deepEqual(await list(a), beforeInvalid); // Reversión completa.
    await db.query("INSERT INTO orders VALUES ($1, $2, 'Compradora Apellido', 'pending')", ["33333333-3333-4333-8333-333333333333", a]);
    const buyer = () => db.query("SELECT public.ensure_order_buyer_participant('33333333-3333-4333-8333-333333333333')");
    await assert.rejects(buyer(), /no está pagado/);
    await db.exec("UPDATE orders SET status = 'paid'");
    await Promise.all([buyer(), buyer()]);
    await buyer();
    assert.equal((await list(a)).filter((row) => row.name === "Compradora Apellido").length, 1);
    await db.exec("UPDATE orders SET buyer_name = '  ANA  GARCÍA '");
    await buyer();
    assert.equal((await list(a)).filter((row) => row.name === "Ana García").length, 2);
    assert.deepEqual(await list(b), beforeB);
    const permissions = await db.query("SELECT has_function_privilege('anon', 'public.add_participants_to_event(uuid,jsonb,boolean,uuid)', 'EXECUTE') AS anon, has_function_privilege('service_role', 'public.add_participants_to_event(uuid,jsonb,boolean,uuid)', 'EXECUTE') AS service");
    assert.deepEqual(permissions.rows[0], { anon: false, service: true });
  } finally {
    await db.close();
  }
});
