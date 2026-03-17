import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAuth } from "@/lib/auth";

type ParticipantPayload = {
  name: string;
  instagram?: string;
};

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.participants)) {
      return NextResponse.json(
        { error: "El body debe incluir participants como array" },
        { status: 400 },
      );
    }

    const participants: ParticipantPayload[] = body.participants
      .map((participant: ParticipantPayload) => ({
        name: String(participant?.name ?? "")
          .trim()
          .replace(/\s+/g, " "),
        instagram: (() => {
          const ig = String(participant?.instagram ?? "")
            .trim()
            .replace(/^@+/, "");

          return ig ? `@${ig}` : "";
        })(),
      }))
      .filter((participant: ParticipantPayload) => participant.name.length > 0);

    if (!participants.length) {
      return NextResponse.json(
        { error: "No hay participantes válidos para importar" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin.rpc("replace_participants", {
      new_participants: participants,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      insertedCount: data?.inserted_count ?? participants.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al reemplazar participantes",
      },
      { status: 500 },
    );
  }
}
