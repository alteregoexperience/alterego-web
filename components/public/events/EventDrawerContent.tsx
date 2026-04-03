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
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xs tracking-[0.3em] text-gray-500 font-medium">
          COMPRAR ENTRADAS
        </h2>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h1 className="text-3xl md:text-5xl font-semibold mb-4">{event.title}</h1>

      {event.location && <p className="text-gray-400 mb-8">{event.location}</p>}

      {event.description && (
        <p className="text-gray-300 leading-relaxed mb-10">
          {event.description}
        </p>
      )}

      <TicketsSection event={event} />
    </div>
  );
}
