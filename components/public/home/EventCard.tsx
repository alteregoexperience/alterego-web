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
  const now = new Date();

  const formattedDate = format(new Date(event.starts_at), "d MMMM · HH:mm", {
    locale: es,
  });

  const salesStart = event.ticket_sales_start_at
    ? new Date(event.ticket_sales_start_at)
    : null;

  const isSaleUpcoming = salesStart && salesStart > now;
  const isSaleOpen = !salesStart || salesStart <= now;

  return (
    <motion.div
      onClick={() => onClick(event)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur hover:border-purple-500/60 transition cursor-pointer"
    >
      {/* 🖼️ IMAGE */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={
            event.cover_image_url && event.cover_image_url.trim() !== ""
              ? event.cover_image_url
              : "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop"
          }
          alt={event.title}
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop";
          }}
          className="w-full h-full object-cover"
        />

        {/* overlay elegante */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* 🔥 BADGE */}
        <div className="absolute top-3 left-3">
          {isSaleUpcoming ? (
            <div className="text-[11px] px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur">
              Venta desde {format(salesStart!, "d MMM · HH:mm", { locale: es })}
            </div>
          ) : isSaleOpen ? (
            <div className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur">
              Tickets disponibles
            </div>
          ) : (
            <div className="text-[11px] px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur">
              Venta cerrada
            </div>
          )}
        </div>

        {/* 🧠 INFO SOBRE IMAGEN */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-white text-lg font-semibold leading-tight">
            {event.title}
          </h3>

          <p className="text-sm text-gray-300 mt-1">
            {formattedDate}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
      </div>

      {/* 📄 FOOTER */}
      <div className="px-5 py-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {isSaleUpcoming
            ? "Próximamente"
            : isSaleOpen
              ? "Disponible"
              : "Finalizado"}
        </span>

        <span className="text-sm text-purple-400 group-hover:text-purple-300 transition">
          Ver evento →
        </span>
      </div>
    </motion.div>
  );
}
