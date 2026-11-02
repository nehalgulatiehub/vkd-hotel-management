import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { createExcelSafeSheet, splitExcelCellText, EXCEL_CELL_TEXT_LIMIT } from "../src/utils/excelExport.ts";

function roundTrip(rows) {
  const result = createExcelSafeSheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, result.worksheet, "Bookings");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const restored = XLSX.read(buffer, { type: "buffer" });
  return { ...result, data: XLSX.utils.sheet_to_json(restored.Sheets.Bookings, { defval: "" }) };
}

test("the reported 33,844-character notes export completely and preserve amounts", () => {
  const notes = "Package AP\n".repeat(3385).slice(0, 33844);
  assert.equal(notes.length, 33844);
  const { data, splitFields } = roundTrip([
    { Booking: "BK13718332", Package: notes, Rooms: 2, Price: 18000 },
    { Booking: "BK-normal", Package: "MAP", Rooms: 1, Price: 7000 },
  ]);
  assert.equal(splitFields, 1);
  assert.equal(data.length, 2);
  assert.equal(data[0].Package + data[0]["Package (continued 2)"], notes);
  assert.equal(data[0].Rooms, 2);
  assert.equal(data[0].Price, 18000);
  assert.equal(data[1].Package, "MAP");
  assert.equal(data[1]["Package (continued 2)"], "");
  assert.deepEqual(Object.keys(data[0]), ["Booking", "Package", "Rooms", "Price", "Package (continued 2)"]);
});

test("Excel boundaries and surrogate pairs reconstruct without data loss", () => {
  for (const text of ["", "a".repeat(32767), "a".repeat(32768), "a".repeat(70000), "a".repeat(32766) + "😀" + "b".repeat(40000)]) {
    const parts = splitExcelCellText(text);
    assert.equal(parts.join(""), text);
    assert.ok(parts.every(part => part.length <= EXCEL_CELL_TEXT_LIMIT));
    assert.ok(parts.every(part => part.isWellFormed()));
    const { data } = roundTrip([{ Notes: text }]);
    assert.equal(Object.values(data[0]).join(""), text);
  }
});

test("all long fields and rows survive, including existing continuation header names", () => {
  const notes = "x".repeat(70000);
  const reference = "y".repeat(33844);
  const { data, splitFields } = roundTrip([
    { Package: notes, Reference: reference, "Package (continued 2)": "original value" },
    { Package: notes, Reference: "normal", "Package (continued 2)": "second value" },
  ]);
  assert.equal(splitFields, 3);
  assert.equal(data[0]["Package (continued 2)"], "original value");
  assert.equal(data[1]["Package (continued 2)"], "second value");
  for (const row of data) assert.equal(row.Package + row["Package (continued 2) [2]"] + row["Package (continued 3)"], notes);
  assert.equal(data[0].Reference + data[0]["Reference (continued 2)"], reference);
  assert.equal(data[1].Reference, "normal");
});
