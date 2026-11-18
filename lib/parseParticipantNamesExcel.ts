import * as XLSX from "xlsx";

// This import format has no header: A1 is always the first participant.
export function parseParticipantNamesExcel(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: "array", sheetRows: 5001 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet?.["!ref"]) throw new Error("El Excel está vacío");

  const range = XLSX.utils.decode_range(sheet["!fullref"] ?? sheet["!ref"]);
  if (range.e.r >= 5000) {
    throw new Error("El Excel puede tener como máximo 5000 filas");
  }

  const names: string[] = [];
  for (let row = 0; row <= range.e.r; row++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    if (!cell || cell.v === undefined || String(cell.v).trim() === "") continue;
    if (cell.t !== "s" || cell.f) {
      throw new Error(`La celda A${row + 1} debe contener un nombre en texto`);
    }
    const name = String(cell.v).trim().replace(/\s+/g, " ");
    if (name.length > 200) {
      throw new Error(`El nombre de la fila ${row + 1} es demasiado largo`);
    }
    names.push(name);
  }
  if (!names.length) throw new Error("No hay nombres en la primera columna");
  return names;
}
