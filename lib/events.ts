import { supabase } from "@/lib/supabase";

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }

  return data;
}

export function isTicketingOpen(event: {
  starts_at: string;
  ends_at?: string | null;
  ticket_sales_start_at?: string | null;
}) {
  const now = new Date();

  const start = new Date(event.starts_at);

  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 12 * 60 * 60 * 1000);

  const ticketStart = event.ticket_sales_start_at
    ? new Date(event.ticket_sales_start_at)
    : start;

  return now >= ticketStart && now <= end;
}
