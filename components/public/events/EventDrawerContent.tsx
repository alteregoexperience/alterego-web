"use client";

import { X } from "lucide-react";
import { Event } from "@/types/Event";
import TicketsSection from "./tickets/TicketsSection";

export default function EventDrawerContent({
  event,
  onClose,
}: {
  event: Event;
  onClose: () => void;
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="relative h-full overflow-y-auto px-6 md:px-10 py-6 box-border">
        {/* ❌ CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 🎯 MAIN GRID */}
        <div className="grid md:grid-cols-[320px_1fr] gap-10 max-w-5xl mx-auto">
          {/* 🖼️ CARTEL */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                src={
                  event.cover_image_url && event.cover_image_url.trim() !== ""
                    ? event.cover_image_url
                    : "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800&auto=format&fit=crop"
                }
                alt={event.title}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            {/* 📍 LOCATION */}
            {event.location && (
              <div className="text-sm text-gray-400">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Ubicación
                </p>
                <p>{event.location}</p>
              </div>
            )}
          </div>

          {/* 📄 INFO + TICKETS */}
          <div className="flex flex-col gap-6">
            {/* HEADER */}
            <div>
              <p className="text-xs text-gray-500 mb-2">
                {new Date(event.starts_at).toLocaleDateString()} ·{" "}
                {new Date(event.starts_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                {event.title}
              </h1>

              {event.description && (
                <p className="text-gray-400 mt-3 max-w-xl">
                  {event.description}
                </p>
              )}
            </div>

            {/* DIVIDER */}
            <div className="h-px bg-white/10" />

            {/* 🎟️ TICKETS */}
            <div>
              <TicketsSection event={event} />
            </div>
          </div>
        </div>
      </div>
      {/* 🎨 BACKGROUND DINÁMICO */}
      <div className="absolute inset-0 -z-10">
        {/* imagen base */}
        <img
          src={
            event.cover_image_url && event.cover_image_url.trim() !== ""
              ? event.cover_image_url
              : "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop"
          }
          className="
      w-full h-full object-cover
      scale-110
      blur-2xl
      brightness-75
      saturate-150
    "
        />

        {/* degradado oscuro suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

        {/* glow dinámico lateral */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 mix-blend-overlay" />

        {/* radial center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_60%)]" />
      </div>
    </div>
  );
}
