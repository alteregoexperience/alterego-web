"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Dialog } from "radix-ui";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImportResult = { insertedCount: number; duplicates: string[] };
type PendingDuplicates = { names: string[]; importId: string; insertedCount: number };

export function ImportParticipantsButton({ eventId, onImported }: {
  eventId: string | null;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingDuplicates | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function importNames(names: string[], importId: string, includeDuplicates = false): Promise<ImportResult> {
    const response = await fetch("/api/participants/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, names, importId, includeDuplicates }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se han podido importar los participantes");
    return data;
  }

  function showResult(count: number) {
    setMessage(count === 1 ? "1 participante añadido" : `${count} participantes añadidos`);
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name)) throw new Error("Selecciona un archivo Excel (.xlsx o .xls)");
      if (file.size > 5 * 1024 * 1024) throw new Error("El Excel no puede superar los 5 MB");
      const { parseParticipantNamesExcel } = await import("@/lib/parseParticipantNamesExcel");
      const names = parseParticipantNamesExcel(await file.arrayBuffer());
      const result = await importNames(names, crypto.randomUUID());
      showResult(result.insertedCount);
      if (result.duplicates.length) {
        setPending({ names: result.duplicates, importId: crypto.randomUUID(), insertedCount: result.insertedCount });
      }
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido leer el Excel");
    } finally {
      setBusy(false);
    }
  }

  async function includeDuplicates() {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await importNames(pending.names, pending.importId, true);
      showResult(pending.insertedCount + result.insertedCount);
      setPending(null);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se han podido incluir los duplicados");
    } finally {
      setBusy(false);
    }
  }

  function discardDuplicates() {
    if (busy) return;
    setPending(null);
    setError("");
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" aria-label="Archivo Excel de participantes" onChange={selectFile} />
      <Button ref={buttonRef} type="button" disabled={!eventId || busy || !!pending} onClick={() => inputRef.current?.click()}
        className="min-h-11 w-full border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800 md:w-auto">
        <Upload aria-hidden="true" />
        {busy ? "Importando…" : "Importar Excel"}
      </Button>
      <p role="status" className="mt-2 text-sm text-purple-300">{message}</p>
      {!pending && error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}

      <Dialog.Root open={!!pending} onOpenChange={(open) => { if (!open) discardDuplicates(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
          <Dialog.Content
            onPointerDownOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
            onCloseAutoFocus={(event) => { event.preventDefault(); buttonRef.current?.focus(); }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-white shadow-xl">
            <Dialog.Title className="text-xl font-semibold text-purple-300">Nombres ya existentes</Dialog.Title>
            <Dialog.Description className="text-sm text-zinc-300">
              Estos nombres ya están en el evento. ¿Quieres añadirlos de nuevo como duplicados?
            </Dialog.Description>
            <ul aria-label="Coincidencias" tabIndex={0} className="max-h-56 shrink-0 space-y-2 overflow-y-auto overscroll-contain rounded-md border border-zinc-800 p-3 text-sm focus-visible:outline-2 focus-visible:outline-purple-400">
              {pending?.names.map((name, index) => <li key={index} className="break-words">{name}</li>)}
            </ul>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" disabled={busy} onClick={discardDuplicates}
                className="min-h-11 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700">Descartar coincidencias</Button>
              <Button type="button" disabled={busy} onClick={includeDuplicates}
                className="min-h-11 bg-purple-600 text-white hover:bg-purple-700">{busy ? "Importando…" : "Incluir duplicados"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
