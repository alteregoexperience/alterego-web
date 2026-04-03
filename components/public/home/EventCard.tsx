"use client";

import { Event } from "@/types/Event";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

export default function EventCard({
  event,
  onClick,
}: {
  event: Event;
  onClick: (event: Event) => void;
}) {
  const formattedDate = format(new Date(event.starts_at), "d MMMM · HH:mm", {
    locale: es,
  });

  const isTicketingOpen =
    event.ticket_sales_start_at &&
    new Date(event.ticket_sales_start_at) <= new Date();

  return (
    <motion.div
      onClick={() => onClick(event)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur hover:border-purple-400 transition cursor-pointer"
    >
      {event.cover_image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          {isTicketingOpen && (
            <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-purple-600/90 backdrop-blur">
              Ticketing abierto
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <h3 className="text-lg font-semibold">{event.title}</h3>

        <p className="text-gray-400 text-sm mt-2">
          {formattedDate}
          {event.location && ` · ${event.location}`}
        </p>

        <span className="inline-block mt-4 text-sm text-purple-400 group-hover:text-purple-300 transition">
          Ver evento →
        </span>
      </div>
    </motion.div>
  );
}
