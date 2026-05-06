import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/Event";

export async function getUpcomingEvents(): Promise<Event[]> {
  return getPublicEvents(6);
}

export async function getPublicEvents(limit?: number): Promise<Event[]> {
  noStore();

  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("*")
    .eq("is_visible", true)
    .gte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("starts_at", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching public events", error);
    return [];
  }

  return data ?? [];
}
