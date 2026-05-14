import { NextResponse } from "next/server";

import { getOrderTicketDetails } from "@/lib/adminOrderTickets";
import { checkAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { orderId } = await params;

  try {
    const details = await getOrderTicketDetails(orderId);

    return NextResponse.json({
      order: {
        id: details.order.id,
        buyerName: details.order.buyer_name,
        buyerEmail: details.order.buyer_email,
        buyerPhone: details.order.buyer_phone,
        totalAmount: details.order.total_amount,
        status: details.order.status,
        createdAt: details.order.created_at,
        fulfilledAt: details.order.fulfilled_at,
      },
      event: {
        id: details.event.id,
        title: details.event.title,
      },
      tickets: details.tickets.map((ticket) => ({
        ...ticket,
        downloadUrl: `/api/tickets/${ticket.id}/pdf`,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las entradas",
      },
      { status: 500 },
    );
  }
}
