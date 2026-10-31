/**
 * A small RFC 4180 reader: quoted fields, doubled quotes, commas and line
 * breaks inside quotes, CRLF or LF, and a UTF-8 byte-order mark. Blank
 * lines are dropped. Enough for a roster; not a general spreadsheet reader.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.startsWith("﻿") ? text.slice(1) : text;

  const endRow = () => {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    row = [];
    field = "";
  };

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      endRow();
    } else {
      field += ch;
    }
  }
  if (quoted) throw new Error("A quoted field is never closed.");
  if (field !== "" || row.length > 0) endRow();
  return rows;
}
