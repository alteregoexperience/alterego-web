export type EventTicketType = {
  id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  sold: number | null;
  status: string | null;
  order_index: number | null;
  created_at: string | null;
};

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type Order = {
  id: string;
  event_id: string;

  buyer_name: string;
  buyer_birthdate: string;
  buyer_email: string;
  buyer_phone: string;

  total_amount: number;
  status: OrderStatus;

  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  fulfilled_at: string | null;

  created_at: string;
};

export type Ticket = {
  id: string;
  order_id: string;
  event_id: string;
  ticket_type_id: string;

  qr_code: string;

  used: boolean;
  used_at: string | null;

  created_at: string;
};

export type PurchaseItem = {
  ticketTypeId: string;
  quantity: number;
};

export type PurchaseBuyer = {
  name: string;
  birthdate: string;
  email: string;
  phone: string;
};

export type PurchasePayload = {
  eventId: string;
  buyer: PurchaseBuyer;
  items: PurchaseItem[];
};
