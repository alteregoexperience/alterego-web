import * as XLSX from "xlsx";

export type ImportedParticipant = {
  name: string;
  instagram: string;
};

export type PreviewRow = {
  rowNumber: number;
  name: string;
  instagram: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
  isDuplicate: boolean;
};

export type ParseParticipantsExcelResult = {
  rows: PreviewRow[];
  participants: ImportedParticipant[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rowsWithoutInstagram: number;
    duplicateNames: number;
  };
};

function normalizeInstagram(value: string) {
  return String(value ?? "")
    .replace("@", "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForCompare(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function rowIsCompletelyEmpty(row: unknown[]) {
  return row.every((cell) => normalizeText(cell) === "");
}

function looksLikeHeader(firstRow: unknown[]) {
  const col1 = normalizeForCompare(String(firstRow[0] ?? ""));
  const col2 = normalizeForCompare(String(firstRow[1] ?? ""));

  const firstLooksLikeName =
    col1 === "nombre" ||
    col1 === "name" ||
    col1.includes("nombre") ||
    col1.includes("name");

  const secondLooksLikeInstagram =
    col2 === "instagram" ||
    col2 === "ig" ||
    col2.includes("instagram") ||
    col2.includes("insta");

  return firstLooksLikeName || secondLooksLikeInstagram;
}

export function parseParticipantsExcel(
  fileBuffer: ArrayBuffer,
): ParseParticipantsExcelResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("El archivo no contiene ninguna hoja");
  }

  const sheet = workbook.Sheets[firstSheetName];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!matrix.length) {
    throw new Error("El archivo está vacío");
  }

  const hasHeader = looksLikeHeader(matrix[0]);
  const rowsMatrix = hasHeader ? matrix.slice(1) : matrix;
  const baseRowNumber = hasHeader ? 2 : 1;

  const cleanedRows = rowsMatrix.filter((row) => !rowIsCompletelyEmpty(row));

  const duplicateKeyCounts = new Map<string, number>();

  cleanedRows.forEach((row) => {
    const name = normalizeText(row[0]);
    const instagram = normalizeText(row[1]);

    if (!name) return;

    const key = normalizeForCompare(name) + "|" + normalizeInstagram(instagram);

    duplicateKeyCounts.set(key, (duplicateKeyCounts.get(key) ?? 0) + 1);
  });

  const seenKeys = new Map<string, number>();

  const rows: PreviewRow[] = cleanedRows.map((row, index) => {
    const name = normalizeText(row[0]);
    const instagram = normalizeText(row[1]);

    const warnings: string[] = [];
    const errors: string[] = [];

    if (!name) {
      errors.push("No tiene nombre → no se insertará");
    }

    if (!instagram) {
      warnings.push("Sin instagram → se insertará igualmente");
    }

    const key = normalizeForCompare(name) + "|" + normalizeInstagram(instagram);

    const seenCount = seenKeys.get(key) ?? 0;
    seenKeys.set(key, seenCount + 1);

    const isDuplicate = seenCount > 0;

    if (isDuplicate) {
      warnings.push("Duplicado → se insertará solo una vez");
    }

    return {
      rowNumber: baseRowNumber + index,
      name,
      instagram,
      isValid: errors.length === 0,
      warnings,
      errors,
      isDuplicate,
    };
  });

  const uniqueParticipants = new Map<string, ImportedParticipant>();

  rows.forEach((row) => {
    if (!row.isValid) return;

    const key =
      normalizeForCompare(row.name) + "|" + normalizeInstagram(row.instagram);

    if (!uniqueParticipants.has(key)) {
      uniqueParticipants.set(key, {
        name: row.name,
        instagram: row.instagram,
      });
    }
  });

  const participants = Array.from(uniqueParticipants.values());

  const rowsWithoutInstagram = rows.filter((row) => !row.instagram).length;
  const duplicateNames = rows.filter((row) => row.isDuplicate).length;
  const invalidRows = rows.filter((row) => !row.isValid).length;
  const validRows = rows.length - invalidRows;

  return {
    rows,
    participants,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
      rowsWithoutInstagram,
      duplicateNames,
    },
  };
}
