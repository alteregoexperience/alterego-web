"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  value?: string | null;
  onChange: (value: string) => void;
};

export function DateTimePicker({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const date = value ? new Date(value) : undefined;

  // cerrar click fuera
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (selected?: Date) => {
    if (!selected) return;

    const hours = date?.getHours() ?? 0;
    const minutes = date?.getMinutes() ?? 0;

    selected.setHours(hours);
    selected.setMinutes(minutes);

    onChange(selected.toISOString());
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;

    const [hours, minutes] = e.target.value.split(":");

    const newDate = new Date(date);
    newDate.setHours(Number(hours));
    newDate.setMinutes(Number(minutes));

    onChange(newDate.toISOString());
  };

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      {/* INPUT */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
        w-full
        flex items-center justify-between
        bg-zinc-950 border border-zinc-700
        rounded-md px-3 py-2
        text-left text-white
        hover:border-purple-500
        transition
      "
      >
        {date ? (
          <span>{format(date, "dd/MM/yyyy HH:mm")}</span>
        ) : (
          <span className="text-zinc-500">Seleccionar fecha</span>
        )}

        <CalendarIcon className="w-4 h-4 text-zinc-400" />
      </button>

      {/* POPOVER */}
      {open && (
        <div
          className="
            mt-2
            w-full
            bg-zinc-900
            border border-zinc-800
            rounded-xl
            p-3
            shadow-xl
            "
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            className="mx-auto text-white"
            classNames={{
              months: "text-white",
              day_selected: "bg-purple-600 text-white",
              day_today: "text-purple-400",
              day: "hover:bg-zinc-800 rounded-md",
              nav_button: "text-zinc-400 hover:text-white",
            }}
          />

          <input
            type="time"
            className="
              mt-3 w-full
              bg-zinc-950 border border-zinc-700
              rounded-md px-2 py-1
              text-white
              focus:outline-none
              focus:border-purple-500
            "
            value={
              date
                ? `${String(date.getHours()).padStart(2, "0")}:${String(
                    date.getMinutes(),
                  ).padStart(2, "0")}`
                : ""
            }
            onChange={handleTimeChange}
          />
        </div>
      )}
    </div>
  );
}
