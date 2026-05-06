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
  is_visible: boolean | null;
  created_at: string | null;
  ticket_sales_start_at: string | null;
};

export interface EventListItem {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  ends_at?: string | null;
  ticket_sales_start_at: string | null;
  event_participants: { count: number }[];
  sold_tickets?: number;
  is_visible: boolean | null;
}
