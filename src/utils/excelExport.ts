import * as XLSX from "xlsx";

export const EXCEL_CELL_TEXT_LIMIT = 32767;

/** Excel's limit is measured in UTF-16 code units, as is String.length. */
export function splitExcelCellText(text: string): string[] {
  if (text.length <= EXCEL_CELL_TEXT_LIMIT) return [text];
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + EXCEL_CELL_TEXT_LIMIT, text.length);
    // Keep a surrogate pair (for example an emoji) together across columns.
    const last = text.charCodeAt(end - 1);
    const next = text.charCodeAt(end);
    if (end < text.length && last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end--;
    parts.push(text.slice(start, end));
    start = end;
  }
  return parts;
}

/** Preserve every field and value; append overflow columns after normal columns. */
export function createExcelSafeSheet(rows: Record<string, unknown>[]) {
  const baseHeaders = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const reservedHeaders = new Set(baseHeaders);
  const continuationHeaders: string[] = [];
  const assignedHeaders = new Map<string, string>();
  let splitFields = 0;

  const prepared = rows.map(row => {
    const output = { ...row };
    for (const [field, value] of Object.entries(row)) {
      if (typeof value !== "string" || value.length <= EXCEL_CELL_TEXT_LIMIT) continue;
      splitFields++;
      const parts = splitExcelCellText(value);
      output[field] = parts[0];
      for (let index = 1; index < parts.length; index++) {
        const key = JSON.stringify([field, index]);
        let header = assignedHeaders.get(key);
        if (!header) {
          const label = `${field} (continued ${index + 1})`;
          header = label;
          let suffix = 2;
          while (reservedHeaders.has(header)) header = `${label} [${suffix++}]`;
          reservedHeaders.add(header);
          continuationHeaders.push(header);
          assignedHeaders.set(key, header);
        }
        output[header] = parts[index];
      }
    }
    return output;
  });

  return {
    worksheet: XLSX.utils.json_to_sheet(prepared, { header: [...baseHeaders, ...continuationHeaders] }),
    splitFields,
  };
}
