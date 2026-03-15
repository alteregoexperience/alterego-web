"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  parseParticipantsExcel,
  PreviewRow,
  ImportedParticipant,
} from "@/lib/parseParticipantsExcel";

type ImportSummary = {
  totalRows: number;
  rowsWithoutInstagram: number;
};

export default function ImportarParticipantesPage() {
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
    fetchDbCount();

    const channel = supabase
      .channel("participants-import-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        fetchDbCount,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetPreview = () => {
    setPreviewRows([]);
    setParticipantsToImport([]);
    setSummary(null);
    setError("");
    setSuccess("");
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participants: participantsToImport,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error importando participantes");
      }

      setSuccess(
        `Importación completada. ${data.insertedCount ?? participantsToImport.length} participantes insertados`,
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Importar participantes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Carga un Excel para reemplazar la lista completa de participantes
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Participantes actuales</div>
            <div className="text-2xl font-bold">
              {isCounting ? "..." : dbCount}
            </div>
          </div>
        </div>

        {/* Upload */}
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Excel con dos columnas: <b>Nombre</b> y <b>Instagram</b>
              </div>

              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="max-w-xs cursor-pointer"
              />
            </div>

            {isParsing && (
              <p className="text-sm text-slate-600">Leyendo archivo...</p>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Excel summary */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-6 text-sm text-slate-600"
          >
            <span>
              Filas detectadas:{" "}
              <b className="text-slate-900">{summary.totalRows}</b>
            </span>

            <span>
              Sin instagram:{" "}
              <b className="text-slate-900">{summary.rowsWithoutInstagram}</b>
            </span>

            <span>
              Se insertarán:{" "}
              <b className="text-slate-900">{participantsToImport.length}</b>
            </span>
          </motion.div>
        )}

        {/* Table preview */}
        {summary && (
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b text-sm text-amber-700 bg-amber-50">
                Esta acción reemplazará todos los participantes actuales
              </div>

              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
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
                        ? "bg-red-50"
                        : row.warnings.length
                          ? "bg-amber-50"
                          : "";

                      return (
                        <tr
                          key={`${row.rowNumber}-${row.name}-${row.instagram}`}
                          className={`border-t ${rowClass}`}
                        >
                          <td className="px-4 py-3 text-slate-500">
                            {row.rowNumber}
                          </td>

                          <td className="px-4 py-3 font-medium">
                            {row.name || "-"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {row.instagram || (
                              <span className="text-amber-600">
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

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button
                  variant="outline"
                  onClick={resetPreview}
                  disabled={isImporting}
                >
                  Limpiar
                </Button>

                <Button onClick={handleImport} disabled={!canImport}>
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
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
