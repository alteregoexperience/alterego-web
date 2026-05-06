"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Search,
  Share2,
  Sparkles,
  Ticket,
} from "lucide-react";

import EventDrawer from "@/components/public/events/EventDrawer";
import EventDrawerContent from "@/components/public/events/EventDrawerContent";
import { Event } from "@/types/Event";

type Filter = "all" | "available" | "soon";

function formatEventDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(value: string) {
  return new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSaleState(event: Event) {
  const now = new Date();
  const saleStart = event.ticket_sales_start_at
    ? new Date(event.ticket_sales_start_at)
    : null;

  if (saleStart && saleStart > now) {
    return {
      key: "soon" as const,
      label: `Venta desde ${formatEventDate(event.ticket_sales_start_at!)} · ${formatEventTime(event.ticket_sales_start_at!)}`,
      shortLabel: "Proximamente",
    };
  }

  return {
    key: "available" as const,
    label: "Entradas disponibles",
    shortLabel: "Disponible",
  };
}

function createCalendarHref(event: Event) {
  const start = new Date(event.starts_at);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const toIcsDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${event.id}@alteregoexperience.org`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location ?? ""}`,
    `DESCRIPTION:${event.description ?? "ALTER EGO Experience"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\n"))}`;
}

function createGoogleCalendarHref(event: Event) {
  const start = new Date(event.starts_at);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const formatGoogleDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: event.description ?? "ALTER EGO Experience",
    location: event.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function EventosClient({ events }: { events: Event[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(() => {
    const slug = searchParams.get("event");

    return events.find((event) => event.slug === slug) ?? null;
  });

  const featuredEvent = events[0] ?? null;
  const availableCount = events.filter(
    (event) => getSaleState(event).key === "available",
  ).length;
  const soonCount = events.length - availableCount;

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const saleState = getSaleState(event);
      const matchesFilter = filter === "all" || saleState.key === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        event.title.toLowerCase().includes(normalizedQuery) ||
        (event.location ?? "").toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [events, filter, query]);

  const openEvent = (event: Event) => {
    setSelectedEvent(event);
    window.history.pushState(null, "", `/eventos?event=${event.slug}`);
  };

  const closeEvent = () => {
    setSelectedEvent(null);
    window.history.pushState(null, "", "/eventos");
  };

  const shareEvent = async (event: Event) => {
    const url = `${window.location.origin}/eventos?event=${event.slug}`;

    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: "ALTER EGO Experience",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 text-white md:px-10 md:pt-36">
        <section className="grid min-h-[68vh] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
              <Sparkles className="h-4 w-4" />
              Agenda oficial ALTER EGO
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
              Eventos para vivir la noche en directo
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
              Consulta proximas fechas, activa recordatorios, guarda eventos en
              tu calendario y compra tus entradas cuando la venta este abierta.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Metric
                value={String(events.length)}
                label="Eventos en agenda"
                helper="Fechas publicadas y visibles"
              />
              <Metric
                value={String(availableCount)}
                label="Compra disponible"
                helper="Eventos que ya permiten comprar"
              />
              <Metric
                value={String(soonCount)}
                label="Aviso de apertura"
                helper="Activa recordatorio por email"
              />
            </div>
          </div>

          {featuredEvent && (
            <FeaturedEvent
              event={featuredEvent}
              onOpen={() => openEvent(featuredEvent)}
              onShare={() => shareEvent(featuredEvent)}
            />
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por evento o ubicacion"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
              <FilterButton
                active={filter === "all"}
                label="Todos"
                onClick={() => setFilter("all")}
              />
              <FilterButton
                active={filter === "available"}
                label="Disponibles"
                onClick={() => setFilter("available")}
              />
              <FilterButton
                active={filter === "soon"}
                label="Pronto"
                onClick={() => setFilter("soon")}
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          {filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center text-zinc-400">
              No hay eventos que coincidan con tu busqueda.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventTile
                  key={event.id}
                  event={event}
                  onOpen={() => openEvent(event)}
                  onShare={() => shareEvent(event)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <EventDrawer open={!!selectedEvent} onClose={closeEvent}>
        {selectedEvent && (
          <EventDrawerContent event={selectedEvent} onClose={closeEvent} />
        )}
      </EventDrawer>
    </>
  );
}

function Metric({
  value,
  label,
  helper,
}: {
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-purple-200">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{helper}</p>
    </div>
  );
}

function FeaturedEvent({
  event,
  onOpen,
  onShare,
}: {
  event: Event;
  onOpen: () => void;
  onShare: () => void;
}) {
  const saleState = getSaleState(event);

  return (
    <div className="overflow-hidden rounded-3xl border border-purple-400/25 bg-zinc-950 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
      <div
        className="relative min-h-[520px] bg-cover bg-center"
        style={{
          backgroundImage: `url("${
            event.cover_image_url && event.cover_image_url.trim() !== ""
              ? event.cover_image_url
              : "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop"
          }")`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
          <span className="rounded-full border border-purple-300/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-100 backdrop-blur">
            Evento destacado
          </span>
          <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white backdrop-blur">
            {saleState.shortLabel}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-sm text-purple-200">
            {formatEventDate(event.starts_at)} · {formatEventTime(event.starts_at)}
          </p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-white">
            {event.title}
          </h2>
          {event.location && (
            <p className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
              <MapPin className="h-4 w-4" />
              {event.location}
            </p>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <button
              type="button"
              onClick={onOpen}
              className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Ver entradas
            </button>
            <CalendarMenu event={event} variant="wide" />
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/15"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventTile({
  event,
  onOpen,
  onShare,
}: {
  event: Event;
  onOpen: () => void;
  onShare: () => void;
}) {
  const saleState = getSaleState(event);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-purple-400/50 hover:bg-white/[0.06]">
      <div
        className="relative aspect-[4/5] bg-cover bg-center"
        style={{
          backgroundImage: `url("${
            event.cover_image_url && event.cover_image_url.trim() !== ""
              ? event.cover_image_url
              : "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop"
          }")`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs backdrop-blur ${
            saleState.key === "available"
              ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200"
              : "border-amber-400/30 bg-amber-500/20 text-amber-200"
          }`}
        >
          {saleState.shortLabel}
        </span>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-200">
            {formatEventDate(event.starts_at)}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
            {event.title}
          </h2>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2 text-sm text-zinc-400">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-300" />
            {formatEventTime(event.starts_at)}
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-300" />
              {event.location}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-purple-300" />
            {saleState.label}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Entradas
          </button>
          <CalendarMenu event={event} />
          <button
            type="button"
            onClick={onShare}
            aria-label="Compartir evento"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function CalendarMenu({
  event,
  variant = "icon",
}: {
  event: Event;
  variant?: "icon" | "wide";
}) {
  return (
    <details className="relative">
      <summary
        aria-label="Anadir al calendario"
        className={`flex cursor-pointer list-none items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm text-white transition hover:bg-white/15 [&::-webkit-details-marker]:hidden ${
          variant === "wide" ? "px-4 py-3" : "h-11 w-11"
        }`}
      >
        <CalendarPlus className={variant === "wide" ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {variant === "wide" && "Calendario"}
      </summary>

      <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
        <a
          href={createGoogleCalendarHref(event)}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 hover:text-white"
        >
          Abrir en Google Calendar
        </a>
        <a
          href={createCalendarHref(event)}
          download={`${event.slug}.ics`}
          className="block rounded-xl px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 hover:text-white"
        >
          Apple / Outlook (.ics)
        </a>
      </div>
    </details>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-purple-600 text-white"
          : "text-zinc-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
