"use client";

import { useEffect, useState } from "react";
import { Event } from "@/types/Event";
import { supabase } from "@/lib/supabase";
import { ChevronRight } from "lucide-react";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  sold: number | null;
  order_index: number | null;
};

export default function TicketsSection({ event }: { event: Event }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);

  useEffect(() => {
    const loadTickets = async () => {
      const { data } = await supabase
        .from("event_ticket_types")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });

      setTickets(data || []);
    };

    loadTickets();
  }, [event.id]);

  if (tickets.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-sm tracking-[0.2em] text-gray-400 mb-6">ENTRADAS</h3>

      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
        {tickets.map((ticket) => {
          const available =
            ticket.stock === null
              ? null
              : (ticket.stock || 0) - (ticket.sold || 0);

          const soldOut = available !== null && available <= 0;

          return (
            <div
              key={ticket.id}
              className={`p-5 flex items-center justify-between ${
                soldOut ? "opacity-40" : ""
              }`}
            >
              <div>
                <p className="font-medium">{ticket.name}</p>

                {ticket.description && (
                  <p className="text-sm text-gray-400">{ticket.description}</p>
                )}

                {ticket.stock !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {available} disponibles
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold">{ticket.price}€</span>

                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    soldOut ? "bg-white/10" : "bg-purple-600"
                  }`}
                >
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
