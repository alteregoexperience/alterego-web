import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.eventId !== "string" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.eventId) ||
    typeof body.importId !== "string" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.importId) ||
    !Array.isArray(body.names) ||
    !body.names.length ||
    body.names.length > 5000 ||
    body.names.some((name: unknown) =>
      typeof name !== "string" || !name.trim() || name.length > 200,
    ) ||
    (body.includeDuplicates !== undefined && typeof body.includeDuplicates !== "boolean")
  ) {
    return NextResponse.json({ error: "Los nombres o el evento no son válidos" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("add_participants_to_event", {
    p_event_id: body.eventId,
    p_names: body.names,
    p_include_duplicates: body.includeDuplicates === true,
    p_import_id: body.importId,
  });
  if (error) {
    console.error("Error importando participantes:", error.code);
    return NextResponse.json({ error: "No se han podido importar los participantes. Inténtalo de nuevo." }, { status: 500 });
  }
  return NextResponse.json(data);
}
