"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowDown,
  ArrowUp,
  Infinity,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type TicketType = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  sold: number | null;
  order_index: number | null;
};

export default function TicketsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [eventId, setEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    unlimited: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    unlimited: false,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!event) return;

      setEventId(event.id);

      const { data: tickets } = await supabase
        .from("event_ticket_types")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });

      setTickets(tickets || []);
    };

    loadData();
  }, [slug]);

  const startEdit = (ticket: TicketType) => {
    setEditingId(ticket.id);
    setEditForm({
      name: ticket.name,
      description: ticket.description || "",
      price: String(ticket.price),
      stock: ticket.stock ? String(ticket.stock) : "",
      unlimited: ticket.stock === null,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await supabase
      .from("event_ticket_types")
      .update({
        name: editForm.name,
        description: editForm.description || null,
        price: Number(editForm.price),
        stock: editForm.unlimited ? null : Number(editForm.stock),
      })
      .eq("id", editingId);

    setEditingId(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      unlimited: false,
    });

    refreshTickets();
  };

  const refreshTickets = async () => {
    if (!eventId) return;

    const { data } = await supabase
      .from("event_ticket_types")
      .select("*")
      .eq("event_id", eventId)
      .order("order_index", { ascending: true });

    setTickets(data || []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      unlimited: false,
    });
  };

  const createTicket = async () => {
    if (!eventId) return;

    await supabase.from("event_ticket_types").insert({
      event_id: eventId,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock: form.unlimited ? null : Number(form.stock),
      sold: 0,
      order_index: tickets.length,
    });

    setShowCreate(false);
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      unlimited: false,
    });

    refreshTickets();
  };

  const deleteTicket = async (id: string) => {
    await supabase.from("event_ticket_types").delete().eq("id", id);
    refreshTickets();
  };

  const moveUp = async (ticket: TicketType, index: number) => {
    if (index === 0) return;

    const previousTicket = tickets[index - 1];

    await supabase
      .from("event_ticket_types")
      .update({ order_index: index - 1 })
      .eq("id", ticket.id);

    await supabase
      .from("event_ticket_types")
      .update({ order_index: index })
      .eq("id", previousTicket.id);

    refreshTickets();
  };

  const moveDown = async (ticket: TicketType, index: number) => {
    if (index === tickets.length - 1) return;

    const nextTicket = tickets[index + 1];

    await supabase
      .from("event_ticket_types")
      .update({ order_index: index + 1 })
      .eq("id", ticket.id);

    await supabase
      .from("event_ticket_types")
      .update({ order_index: index })
      .eq("id", nextTicket.id);

    refreshTickets();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Tipos de entrada</h2>

        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus size={16} className="mr-2" />
          Nueva entrada
        </Button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            placeholder="Nombre"
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Descripción"
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Precio €"
              type="number"
              className="bg-zinc-800 rounded-lg px-3 py-2 text-sm"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            {!form.unlimited && (
              <input
                placeholder="Stock"
                type="number"
                className="bg-zinc-800 rounded-lg px-3 py-2 text-sm"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={form.unlimited}
              onChange={(e) =>
                setForm({
                  ...form,
                  unlimited: e.target.checked,
                })
              }
            />
            Stock ilimitado
          </label>

          <Button
            onClick={createTicket}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Crear ticket
          </Button>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {tickets.map((ticket, index) => {
          const available =
            ticket.stock === null ? (
              <Infinity size={16} />
            ) : (
              (ticket.stock || 0) - (ticket.sold || 0)
            );

          if (editingId === ticket.id) {
            return (
              <div
                key={ticket.id}
                className="bg-zinc-900 border border-purple-500/30 rounded-xl p-4 space-y-3"
              >
                <input
                  placeholder="Nombre"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />

                <input
                  placeholder="Descripción"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Precio €"
                    type="number"
                    className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                  />

                  {!editForm.unlimited && (
                    <input
                      placeholder="Stock"
                      type="number"
                      className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                      value={editForm.stock}
                      onChange={(e) =>
                        setEditForm({ ...editForm, stock: e.target.value })
                      }
                    />
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={editForm.unlimited}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        unlimited: e.target.checked,
                      })
                    }
                  />
                  Stock ilimitado
                </label>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={saveEdit}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Guardar
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={cancelEdit}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ticket.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-white">{ticket.name}</div>

                {ticket.description && (
                  <div className="text-sm text-zinc-400">
                    {ticket.description}
                  </div>
                )}

                <div className="text-xs text-zinc-500 mt-1">
                  {ticket.stock === null
                    ? "Stock ilimitado"
                    : `Disponible: ${available}`}
                  {" · "}
                  Vendidas: {ticket.sold || 0}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-white">
                  {ticket.price}€
                </div>

                <button
                  onClick={() => moveUp(ticket, index)}
                  className="text-zinc-500 hover:text-white disabled:opacity-30"
                  disabled={index === 0}
                >
                  <ArrowUp size={16} />
                </button>

                <button
                  onClick={() => moveDown(ticket, index)}
                  className="text-zinc-500 hover:text-white disabled:opacity-30"
                  disabled={index === tickets.length - 1}
                >
                  <ArrowDown size={16} />
                </button>

                <button
                  onClick={() => startEdit(ticket)}
                  className="text-zinc-500 hover:text-purple-400"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => deleteTicket(ticket.id)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
