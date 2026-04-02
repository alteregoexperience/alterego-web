export type Event = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  cover_image_url: string | null;
  is_ticketing_enabled: boolean | null;
  created_at: string | null;
};
