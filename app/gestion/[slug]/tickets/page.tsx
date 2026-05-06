"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

  const refreshTickets = useCallback(async () => {
    if (!slug) return;

    const response = await fetch(`/api/ticket-types?slug=${slug}`, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data?.error || "Error cargando entradas");
      return;
    }

    setEventId(data.eventId);
    setTickets(data.tickets || []);
  }, [slug]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      refreshTickets();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshTickets]);

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

    await fetch("/api/ticket-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        stock: editForm.stock,
        unlimited: editForm.unlimited,
      }),
    });

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

    await fetch("/api/ticket-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        name: form.name,
        description: form.description,
        price: form.price,
        stock: form.stock,
        unlimited: form.unlimited,
        orderIndex: tickets.length,
      }),
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
    await fetch("/api/ticket-types", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    refreshTickets();
  };

  const updateOrder = async (
    updates: Array<{ id: string; order_index: number }>,
  ) => {
    await fetch("/api/ticket-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderUpdates: updates }),
    });

    refreshTickets();
  };

  const moveUp = async (ticket: TicketType, index: number) => {
    if (index === 0) return;

    const previousTicket = tickets[index - 1];

    await updateOrder([
      { id: ticket.id, order_index: index - 1 },
      { id: previousTicket.id, order_index: index },
    ]);
  };

  const moveDown = async (ticket: TicketType, index: number) => {
    if (index === tickets.length - 1) return;

    const nextTicket = tickets[index + 1];

    await updateOrder([
      { id: ticket.id, order_index: index + 1 },
      { id: nextTicket.id, order_index: index },
    ]);
  };

  return (
    <div className="space-y-6">
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

      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            placeholder="Nombre"
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Descripcion"
            className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Precio EUR"
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
                  placeholder="Descripcion"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Precio EUR"
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
                  {" - "}
                  Vendidas: {ticket.sold || 0}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-white">
                  {ticket.price} EUR
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
