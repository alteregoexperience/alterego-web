import { NextResponse } from "next/server";

import { changeTicketHolder } from "@/lib/adminOrderTickets";
import { checkAuth } from "@/lib/auth";

type ChangeHolderPayload = {
  eventSlug?: string;
  currentName?: string;
  newName?: string;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { ticketId } = await params;
    const body = (await req.json()) as ChangeHolderPayload;
    const eventSlug = body.eventSlug?.trim() ?? "";
    const currentName = body.currentName?.trim() ?? "";
    const newName = body.newName?.trim() ?? "";

    if (!ticketId || !eventSlug || !currentName || !newName) {
      return NextResponse.json(
        { error: "Completa el nombre actual y el nombre nuevo" },
        { status: 400 },
      );
    }

    const result = await changeTicketHolder({
      ticketId,
      eventSlug,
      currentName,
      newName,
    });

    return new NextResponse(Buffer.from(result.pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar el titular",
      },
      { status: 400 },
    );
  }
}
