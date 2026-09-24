import { NextResponse } from "next/server";

import { resendOrderTickets } from "@/lib/adminOrderTickets";
import { checkAuth } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { orderId } = await params;

  try {
    const result = await resendOrderTickets(orderId);

    return NextResponse.json({
      success: true,
      recipient: result.recipient,
      ticketCount: result.ticketCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron reenviar las entradas",
      },
      { status: 500 },
    );
  }
}
