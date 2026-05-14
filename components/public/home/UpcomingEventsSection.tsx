"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SectionContainer from "./SectionContainer";
import EventCard from "./EventCard";
import EventDrawer from "../events/EventDrawer";
import EventDrawerContent from "../events/EventDrawerContent";
import { Event } from "@/types/Event";

export default function UpcomingEventsSection({ events }: { events: Event[] }) {
  const searchParams = useSearchParams();
  const [manuallySelectedEvent, setManuallySelectedEvent] =
    useState<Event | null>(null);

  const eventFromUrl = useMemo(() => {
    const slug = searchParams.get("event");
    if (!slug) return null;

    return events.find((event) => event.slug === slug) ?? null;
  }, [events, searchParams]);

  const selectedEvent = manuallySelectedEvent ?? eventFromUrl;

  const openEvent = (event: Event) => {
    setManuallySelectedEvent(event);
    window.history.pushState(null, "", `/?event=${event.slug}`);
  };

  const closeEvent = () => {
    setManuallySelectedEvent(null);
    window.history.pushState(null, "", "/");
  };

  return (
    <>
      <section id="upcoming-events">
        <SectionContainer>
          <h2 className="mb-10 text-3xl font-semibold md:text-4xl">
            Próximos eventos
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No hay eventos programados todavía.
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} onClick={openEvent} />
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Link
                  href="/eventos"
                  className="rounded-2xl border border-purple-400/30 bg-purple-500/10 px-6 py-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-600 hover:text-white"
                >
                  Ver todos los eventos
                </Link>
              </div>
            </>
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
