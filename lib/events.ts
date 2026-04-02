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
