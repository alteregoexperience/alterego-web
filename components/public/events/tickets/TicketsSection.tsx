"use client";

import { useEffect, useState } from "react";
import { Event } from "@/types/Event";
import { supabase } from "@/lib/supabase";

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
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  const increase = (ticket: TicketType) => {
    setQuantities((prev) => {
      const current = prev[ticket.id] || 0;

      if (ticket.stock === null) {
        return { ...prev, [ticket.id]: current + 1 };
      }

      const available = (ticket.stock || 0) - (ticket.sold || 0);

      return {
        ...prev,
        [ticket.id]: Math.min(current + 1, available),
      };
    });
  };

  const decrease = (ticket: TicketType) => {
    setQuantities((prev) => {
      const current = prev[ticket.id] || 0;

      return {
        ...prev,
        [ticket.id]: Math.max(0, current - 1),
      };
    });
  };

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
          const lowStock =
            available !== null && available > 0 && available < 50;

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

                {lowStock && (
                  <p className="text-xs text-amber-400 mt-1">
                    Quedan pocas entradas
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold">{ticket.price}€</span>

                {!soldOut && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrease(ticket)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      -
                    </button>

                    <span className="w-6 text-center">
                      {quantities[ticket.id] || 0}
                    </span>

                    <button
                      onClick={() => increase(ticket)}
                      className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
