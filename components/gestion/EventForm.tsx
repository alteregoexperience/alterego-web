"use client";

import { useState } from "react";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  initial?: any;
  onSubmit: (data: any) => Promise<void>;
  submitLabel: string;
};

export default function EventForm({ initial, onSubmit, submitLabel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startsAt, setStartsAt] = useState(initial?.starts_at ?? "");
  const [endsAt, setEndsAt] = useState(initial?.ends_at ?? "");
  const [ticketsAt, setTicketsAt] = useState(
    initial?.ticket_sales_start_at ?? new Date().toISOString(),
  );
  const [isTicketingEnabled, setIsTicketingEnabled] = useState(
    initial?.is_visible ?? false,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");

    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!startsAt) {
      setError("La fecha de inicio es obligatoria");
      return;
    }

    setLoading(true);

    await onSubmit({
      title,
      location,
      description,
      starts_at: startsAt,
      ends_at: endsAt || null,
      ticket_sales_start_at: ticketsAt,
      is_visible: isTicketingEnabled,
    });

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Título del evento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-zinc-950 border-zinc-700 text-white"
      />

      <Input
        placeholder="Ubicación (opcional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="bg-zinc-950 border-zinc-700 text-white"
      />

      <Input
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-zinc-950 border-zinc-700 text-white"
      />

      <div className="space-y-2">
        <label className="text-xs text-zinc-400">Fecha inicio</label>
        <DateTimePicker value={startsAt} onChange={setStartsAt} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-400">Fecha fin</label>
        <DateTimePicker value={endsAt} onChange={setEndsAt} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-400">Fecha apertura tickets</label>

        <DateTimePicker value={ticketsAt} onChange={setTicketsAt} />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <input
          id="is_visible"
          type="checkbox"
          checked={isTicketingEnabled}
          onChange={(e) => setIsTicketingEnabled(e.target.checked)}
          className="mt-1 h-4 w-4 accent-purple-600"
        />

        <div>
          <label
            htmlFor="is_visible"
            className="text-sm font-medium text-white cursor-pointer"
          >
            Mostrar evento en la web.
          </label>

          <p className="text-xs text-zinc-500 mt-1">
            Si está desactivado, el evento no se mostrará en la web pública.
          </p>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <Button
        onClick={submit}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
