"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Mail, Phone, Search, Ticket, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BuyerTicketType = {
  name: string;
  quantity: number;
};

type Buyer = {
  id: string;
  buyer_name: string;
  buyer_birthdate: string;
  buyer_email: string;
  buyer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  stripe_checkout_session_id: string | null;
  ticket_count: number;
  used_ticket_count: number;
  ticket_types: BuyerTicketType[];
};

type BuyersResponse = {
  event: {
    id: string;
    title: string;
  };
  buyers: Buyer[];
  totals: {
    orders: number;
    tickets: number;
    revenue: number;
    usedTickets: number;
  };
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const escapeCsv = (value: string | number | null) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

export default function CompradoresPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [totals, setTotals] = useState<BuyersResponse["totals"] | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBuyers = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/events/${slug}/buyers`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | BuyersResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        const message = data && "error" in data ? data.error : null;

        setError(message ?? "No se pudieron cargar los compradores");
        setIsLoading(false);
        return;
      }

      const payload = data as BuyersResponse;

      setBuyers(payload.buyers ?? []);
      setTotals(payload.totals);
      setIsLoading(false);
    };

    loadBuyers();
  }, [slug]);

  const filteredBuyers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return buyers;

    return buyers.filter((buyer) => {
      const ticketTypes = buyer.ticket_types
        .map((ticketType) => ticketType.name)
        .join(" ");
      const text = `${buyer.buyer_name} ${buyer.buyer_email} ${buyer.buyer_phone} ${ticketTypes}`;

      return text.toLowerCase().includes(term);
    });
  }, [buyers, search]);

  const exportCsv = () => {
    const rows = filteredBuyers.map((buyer) => [
      buyer.buyer_name,
      buyer.buyer_email,
      buyer.buyer_phone,
      buyer.buyer_birthdate,
      buyer.ticket_count,
      buyer.used_ticket_count,
      buyer.ticket_types
        .map((ticketType) => `${ticketType.quantity}x ${ticketType.name}`)
        .join(" + "),
      buyer.total_amount,
      buyer.status,
      formatDateTime(buyer.fulfilled_at ?? buyer.created_at),
      buyer.stripe_checkout_session_id,
    ]);
    const header = [
      "Nombre",
      "Email",
      "Telefono",
      "Fecha nacimiento",
      "Entradas",
      "Usadas",
      "Tipos",
      "Total",
      "Estado",
      "Fecha compra",
      "Stripe session",
    ];
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `compradores-${slug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Compradores de entradas
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Informacion de contacto y resumen de entradas pagadas para este
            evento.
          </p>
        </div>

        <Button
          onClick={exportCsv}
          disabled={filteredBuyers.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Download size={16} className="mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<UserRound size={18} />}
          label="Compradores"
          value={totals?.orders ?? 0}
        />
        <SummaryCard
          icon={<Ticket size={18} />}
          label="Entradas"
          value={totals?.tickets ?? 0}
        />
        <SummaryCard
          icon={<Ticket size={18} />}
          label="Validadas"
          value={totals?.usedTickets ?? 0}
        />
        <SummaryCard
          icon={<Ticket size={18} />}
          label="Ingresos"
          value={formatCurrency(totals?.revenue ?? 0)}
        />
      </div>

      <Card className="bg-zinc-900 border border-zinc-800 shadow-xl">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl text-purple-400">
            Listado de compradores
          </CardTitle>

          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, email o telefono..."
              className="h-10 border-zinc-700 bg-zinc-950 pl-9 text-white placeholder:text-zinc-500"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-zinc-500">
              Cargando compradores...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              No hay compradores para mostrar
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Comprador</TableHead>
                  <TableHead className="text-zinc-400">Contacto</TableHead>
                  <TableHead className="text-zinc-400">Entradas</TableHead>
                  <TableHead className="text-zinc-400">Importe</TableHead>
                  <TableHead className="text-zinc-400">Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuyers.map((buyer) => (
                  <TableRow
                    key={buyer.id}
                    className="border-zinc-800 hover:bg-zinc-800/60"
                  >
                    <TableCell>
                      <div className="font-medium text-white">
                        {buyer.buyer_name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Nacimiento: {buyer.buyer_birthdate || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 text-sm text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-purple-400" />
                          {buyer.buyer_email || "-"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-purple-400" />
                          {buyer.buyer_phone || "-"}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-white">
                        {buyer.ticket_count} compradas
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {buyer.used_ticket_count} validadas
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {buyer.ticket_types.map((ticketType) => (
                          <span
                            key={ticketType.name}
                            className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300"
                          >
                            {ticketType.quantity}x {ticketType.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-white">
                        {formatCurrency(Number(buyer.total_amount ?? 0))}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-zinc-300">
                        {formatDateTime(buyer.fulfilled_at ?? buyer.created_at)}
                      </div>
                      <div className="mt-1 text-xs text-emerald-400">
                        {buyer.status}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="bg-zinc-900/70 border border-zinc-800 shadow-xl">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
          {icon}
        </div>
        <div>
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="text-lg font-semibold text-white">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
