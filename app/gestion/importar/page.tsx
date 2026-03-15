"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

import {
  parseParticipantsExcel,
  PreviewRow,
  ImportedParticipant,
} from "@/lib/parseParticipantsExcel";

import { Upload, FileSpreadsheet } from "lucide-react";

type ImportSummary = { totalRows: number; rowsWithoutInstagram: number };

export default function ImportarParticipantesPage() {
  const hasFetched = useRef(false);
  const [dbCount, setDbCount] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(true);

  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [participantsToImport, setParticipantsToImport] = useState<
    ImportedParticipant[]
  >([]);

  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const canImport = useMemo(() => {
    return participantsToImport.length > 0 && !isImporting;
  }, [participantsToImport.length, isImporting]);

  const fetchDbCount = async () => {
    try {
      const response = await fetch("/api/participants/count", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error obteniendo participantes");
      }

      setDbCount(data.count ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCounting(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchDbCount();
  }, []);

  const resetPreview = () => {
    setPreviewRows([]);
    setParticipantsToImport([]);
    setSummary(null);
    setError("");
    setSuccess("");
    setFileName(null);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    setError("");
    setSuccess("");
    setIsParsing(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!["xlsx", "xls", "csv"].includes(extension || "")) {
        throw new Error("Formato no válido");
      }

      const buffer = await file.arrayBuffer();
      const result = parseParticipantsExcel(buffer);

      if (result.summary.totalRows === 0) {
        throw new Error("El archivo no contiene filas válidas");
      }

      setPreviewRows(result.rows);
      setParticipantsToImport(result.participants);

      setSummary({
        totalRows: result.summary.totalRows,
        rowsWithoutInstagram: result.summary.rowsWithoutInstagram,
      });
    } catch (err) {
      console.error(err);
      resetPreview();

      setError(
        err instanceof Error ? err.message : "No se pudo leer el archivo",
      );
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const fakeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await handleFileChange(fakeEvent);
  };

  const handleImport = async () => {
    if (!canImport) return;

    const confirmed = window.confirm(
      `Se eliminarán ${dbCount} participantes actuales y se importarán ${participantsToImport.length}.`,
    );

    if (!confirmed) return;

    setIsImporting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/participants/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: participantsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error importando participantes");
      }

      setSuccess(
        `Importación completada. ${
          data.insertedCount ?? participantsToImport.length
        } participantes insertados`,
      );

      await fetchDbCount();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado durante la importación",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="mx-auto max-w-6xl p-8 flex flex-col gap-6">
        {/* HEADER */}

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-purple-400">
              Importar participantes
            </h1>

            <p className="text-sm text-zinc-400 mt-1">
              Carga un Excel para reemplazar la lista completa de participantes
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-zinc-500">Participantes actuales</div>

            <div className="text-2xl font-bold text-white">
              {isCounting ? "..." : dbCount}
            </div>
          </div>
        </div>

        {/* DROPZONE */}

        <Card className="bg-zinc-900 border border-zinc-800 shadow-xl">
          <CardContent className="p-6 flex flex-col gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all cursor-pointer
              ${
                isDragging
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-zinc-700 hover:border-purple-500 hover:bg-zinc-800/40"
              }
              p-10`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <motion.div
                animate={{ scale: isDragging ? 1.05 : 1 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <Upload className="w-10 h-10 text-purple-400" />

                {fileName ? (
                  <>
                    <p className="text-sm text-zinc-400">
                      Archivo seleccionado
                    </p>

                    <p className="text-white font-medium">{fileName}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300">
                      Arrastra tu archivo Excel aquí
                    </p>

                    <p className="text-xs text-zinc-500">
                      o haz click para seleccionarlo
                    </p>
                  </>
                )}

                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  .xlsx / .xls / .csv
                </div>
              </motion.div>
            </div>

            {isParsing && (
              <p className="text-sm text-zinc-400">Leyendo archivo...</p>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SUMMARY */}

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-6 text-sm text-zinc-400"
          >
            <span>
              Filas detectadas:{" "}
              <b className="text-white">{summary.totalRows}</b>
            </span>

            <span>
              Sin instagram:{" "}
              <b className="text-white">{summary.rowsWithoutInstagram}</b>
            </span>

            <span>
              Se insertarán:{" "}
              <b className="text-white">{participantsToImport.length}</b>
            </span>
          </motion.div>
        )}

        {/* PREVIEW */}

        {summary && (
          <Card className="bg-zinc-900 border border-zinc-800">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-zinc-800 text-sm text-amber-400 bg-amber-500/10">
                Esta acción reemplazará todos los participantes actuales
              </div>

              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-900 sticky top-0 border-b border-zinc-800 text-zinc-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Fila</th>
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Instagram</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {previewRows.map((row) => {
                      const rowClass = row.errors.length
                        ? "bg-red-500/5"
                        : row.warnings.length
                          ? "bg-amber-500/5"
                          : "";

                      return (
                        <tr
                          key={`${row.rowNumber}-${row.name}-${row.instagram}`}
                          className={`border-t border-zinc-800 ${rowClass}`}
                        >
                          <td className="px-4 py-3 text-zinc-500">
                            {row.rowNumber}
                          </td>

                          <td className="px-4 py-3 font-medium text-white">
                            {row.name || "-"}
                          </td>

                          <td className="px-4 py-3 text-zinc-400">
                            {row.instagram || (
                              <span className="text-amber-400">
                                Sin instagram
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {row.errors.length > 0 ? (
                              <Badge tone="danger">No se insertará</Badge>
                            ) : row.isDuplicate ? (
                              <Badge tone="warning">Duplicado</Badge>
                            ) : (
                              <Badge tone="success">Se insertará</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={resetPreview}
                  disabled={isImporting}
                >
                  Limpiar
                </Button>

                <Button
                  onClick={handleImport}
                  disabled={!canImport}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isImporting ? "Importando..." : "Importar participantes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "danger";
}) {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
