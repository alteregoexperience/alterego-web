"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Html5Qrcode,
  Html5QrcodeCameraScanConfig,
} from "html5-qrcode";
import { CheckCircle2, QrCode, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type ScanStatus = "idle" | "checking" | "valid" | "used" | "invalid" | "error";

type TicketInfo = {
  usedAt: string | null;
  ticketType: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
};

type ValidationResponse = {
  status: "valid" | "used" | "invalid";
  message: string;
  ticket?: TicketInfo;
  error?: string;
};

type ScanResult = {
  status: ScanStatus;
  message: string;
  ticket?: TicketInfo;
};

const readerId = "ticket-qr-reader";

function formatUsedAt(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function ValidarEntradasPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockedRef = useRef(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isStarting, setIsStarting] = useState(true);
  const [result, setResult] = useState<ScanResult>({
    status: "idle",
    message: "Apunta la camara al QR de la entrada",
  });

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) return;

      const { data } = await supabase
        .from("events")
        .select("id, title")
        .eq("slug", slug)
        .single();

      if (data) {
        setEventId(data.id);
        setEventTitle(data.title);
      }
    };

    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (!eventId) return;

    let isMounted = true;

    const validateQr = async (qrCode: string) => {
      if (lockedRef.current) return;

      lockedRef.current = true;
      setResult({ status: "checking", message: "Validando entrada..." });

      try {
        const response = await fetch("/api/tickets/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, qrCode }),
        });

        const data = (await response.json()) as ValidationResponse;

        if (!response.ok) {
          throw new Error(data?.error || data?.message || "Error validando QR");
        }

        setResult({
          status: data.status,
          message: data.message,
          ticket: data.ticket,
        });
      } catch (error) {
        setResult({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Error inesperado validando entrada",
        });
      } finally {
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

        resetTimeoutRef.current = setTimeout(() => {
          lockedRef.current = false;
          setResult({
            status: "idle",
            message: "Listo para escanear la siguiente entrada",
          });
        }, 2600);
      }
    };

    const startScanner = async () => {
      setIsStarting(true);
      setCameraError("");

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (!isMounted) return;

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        scannerRef.current = scanner;

        const config: Html5QrcodeCameraScanConfig = {
          fps: 12,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          validateQr,
          undefined,
        );
      } catch (error) {
        console.error(error);
        setCameraError(
          "No se pudo abrir la camara. Revisa permisos y usa HTTPS en movil.",
        );
      } finally {
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;

      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [eventId]);

  const restartScanner = () => {
    window.location.reload();
  };

  const isPositive = result.status === "valid";
  const isNegative =
    result.status === "used" ||
    result.status === "invalid" ||
    result.status === "error";

  return (
    <div className="min-h-[calc(100vh-180px)] space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Validar entradas
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {eventTitle || "Cargando evento..."}
          </p>
        </div>

        <Button
          onClick={restartScanner}
          variant="ghost"
          className="w-fit text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar camara
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl">
          <div id={readerId} className="min-h-[420px] w-full" />

          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-zinc-300">
              Abriendo camara...
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
              <ShieldAlert className="h-12 w-12 text-red-400" />
              <p className="max-w-sm text-sm text-zinc-300">{cameraError}</p>
              <Button
                onClick={restartScanner}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Reintentar
              </Button>
            </div>
          )}

          {(isPositive || isNegative || result.status === "checking") && (
            <div
              className={`absolute inset-0 flex items-center justify-center p-6 text-center ${
                isPositive
                  ? "bg-emerald-500/90"
                  : result.status === "checking"
                    ? "bg-purple-600/80"
                    : "bg-red-600/90"
              }`}
            >
              <div className="space-y-4">
                {isPositive ? (
                  <CheckCircle2 className="mx-auto h-28 w-28 text-white" />
                ) : result.status === "checking" ? (
                  <QrCode className="mx-auto h-24 w-24 animate-pulse text-white" />
                ) : (
                  <XCircle className="mx-auto h-28 w-28 text-white" />
                )}

                <div>
                  <p className="text-4xl font-black uppercase tracking-wide text-white">
                    {isPositive
                      ? "Acceso permitido"
                      : result.status === "checking"
                        ? "Validando"
                        : "Acceso denegado"}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white/90">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div
            className={`rounded-xl border p-5 ${
              isPositive
                ? "border-emerald-500/40 bg-emerald-500/10"
                : isNegative
                  ? "border-red-500/40 bg-red-500/10"
                  : "border-purple-500/30 bg-purple-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              {isPositive ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              ) : isNegative ? (
                <XCircle className="h-7 w-7 text-red-300" />
              ) : (
                <QrCode className="h-7 w-7 text-purple-300" />
              )}

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                  Estado
                </p>
                <p className="text-lg font-semibold text-white">
                  {result.message}
                </p>
              </div>
            </div>

            {result.ticket && (
              <div className="mt-5 space-y-3 text-sm">
                <InfoRow label="Entrada" value={result.ticket.ticketType} />
                <InfoRow label="Nombre" value={result.ticket.buyerName || "-"} />
                {result.ticket.buyerEmail && (
                  <InfoRow label="Email" value={result.ticket.buyerEmail} />
                )}
                {result.ticket.buyerPhone && (
                  <InfoRow label="Telefono" value={result.ticket.buyerPhone} />
                )}
                {result.status === "used" && (
                  <InfoRow
                    label="Usada el"
                    value={formatUsedAt(result.ticket.usedAt)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-400">
            La camara sigue activa. Despues de cada lectura, el sistema vuelve a
            estar listo automaticamente para la siguiente entrada.
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}
