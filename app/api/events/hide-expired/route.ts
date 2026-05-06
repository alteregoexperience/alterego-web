import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderTicketSaleReminderEmail } from "@/lib/emailTicketSaleReminderTemplate";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { resend } from "@/lib/resend";

export const dynamic = "force-dynamic";

type ReminderRow = {
  id: string;
  email: string;
  events: {
    title: string;
    slug: string;
    location: string | null;
    starts_at: string;
    ticket_sales_start_at: string;
  };
};

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const forceReminders =
    process.env.NODE_ENV === "development" &&
    searchParams.get("forceReminders") === "true";

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("events")
    .update({ is_visible: false })
    .eq("is_visible", true)
    .lt("ends_at", now)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { sentCount, reminderError } = await sendPendingTicketReminders(
    now,
    forceReminders,
  );

  if (reminderError) {
    return NextResponse.json(
      {
        error: reminderError,
        hiddenCount: data?.length ?? 0,
        sentReminderCount: sentCount,
        forceReminderMode: forceReminders,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    hiddenCount: data?.length ?? 0,
    sentReminderCount: sentCount,
    forceReminderMode: forceReminders,
  });
}

async function sendPendingTicketReminders(now: string, forceReminders = false) {
  let query = supabaseAdmin
    .from("ticket_sale_reminders")
    .select(
      `
      id,
      email,
      events!inner (
        title,
        slug,
        location,
        starts_at,
        ticket_sales_start_at,
        is_visible
      )
    `,
    )
    .is("sent_at", null)
    .eq("events.is_visible", true)
    .limit(100);

  if (!forceReminders) {
    query = query.lte("events.ticket_sales_start_at", now);
  }

  const { data, error } = await query;

  if (error) {
    return { sentCount: 0, reminderError: error.message };
  }

  const reminders = (data ?? []) as ReminderRow[];
  let sentCount = 0;

  for (const reminder of reminders) {
    const event = reminder.events;
    const eventUrl = `${getBaseUrl()}/?event=${encodeURIComponent(event.slug)}`;
    const eventDate = new Date(event.starts_at).toLocaleDateString("es-ES");
    const eventTime = new Date(event.starts_at).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const { error: emailError } = await resend.emails.send({
      from: "ALTER EGO <tickets@alteregoexperience.org>",
      to: reminder.email,
      subject: `Entradas disponibles - ${event.title}`,
      html: renderTicketSaleReminderEmail({
        eventTitle: event.title,
        eventDate,
        eventTime,
        eventLocation: event.location ?? "",
        eventUrl,
      }),
    });

    if (emailError) {
      console.error("REMINDER EMAIL ERROR:", emailError);
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("ticket_sale_reminders")
      .update({ sent_at: now })
      .eq("id", reminder.id);

    if (updateError) {
      console.error("REMINDER UPDATE ERROR:", updateError);
      continue;
    }

    sentCount++;
  }

  return { sentCount, reminderError: null };
}
