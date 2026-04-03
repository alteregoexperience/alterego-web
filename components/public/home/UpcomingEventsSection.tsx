"use client";

import { useState } from "react";
import SectionContainer from "./SectionContainer";
import EventCard from "./EventCard";
import EventDrawer from "../events/EventDrawer";
import EventDrawerContent from "../events/EventDrawerContent";
import { Event } from "@/types/Event";

export default function UpcomingEventsSection({ events }: { events: Event[] }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(() => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("event");

    if (!slug) return null;

    return events.find((e) => e.slug === slug) || null;
  });

  const openEvent = (event: Event) => {
    setSelectedEvent(event);
    window.history.pushState(null, "", `/?event=${event.slug}`);
  };

  const closeEvent = () => {
    setSelectedEvent(null);
    window.history.pushState(null, "", "/");
  };

  return (
    <>
      <section id="upcoming-events">
        <SectionContainer>
          <h2 className="text-3xl md:text-4xl font-semibold mb-3">
            Próximos eventos
          </h2>

          <p className="text-gray-400 mb-10 max-w-xl">
            Descubre los próximos eventos y participa en la experiencia ALTER
            EGO.
          </p>

          {events.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No hay eventos programados todavía.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onClick={openEvent} />
              ))}
            </div>
          )}
        </SectionContainer>
      </section>

      <EventDrawer open={!!selectedEvent} onClose={closeEvent}>
        {selectedEvent && (
          <EventDrawerContent event={selectedEvent} onClose={closeEvent} />
        )}
      </EventDrawer>
    </>
  );
}
  