import { supabase } from "@/lib/supabase";
import { Event } from "@/types/Event";

export async function getUpcomingEvents(): Promise<Event[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(6);

  if (error) {
    console.error("Error fetching upcoming events", error);
    return [];
  }

  return data ?? [];
}
