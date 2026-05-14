import { NextResponse } from "next/server";

import { generateExistingTicketPdf } from "@/lib/adminOrderTickets";
import { checkAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { ticketId } = await params;

  try {
    const { fileName, pdfBytes } = await generateExistingTicketPdf(ticketId);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar la entrada",
      },
      { status: 500 },
    );
  }
}
