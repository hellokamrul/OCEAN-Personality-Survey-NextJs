// src/services/xlsxService.ts
import * as XLSX from 'xlsx';
import path from 'node:path';
import fs from 'node:fs/promises';
import { put, list } from '@vercel/blob';

const CT_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Use Blob on Vercel (or when STORAGE=blob), FS locally
const USE_BLOB =
  (process.env.STORAGE || '').toLowerCase() === 'blob' || !!process.env.VERCEL;

// ---------- paths / keys ----------
const FS_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

export const FILES = {
  participants: USE_BLOB
    ? 'survey/survey_participants.xlsx'
    : path.join(FS_DIR, 'survey_participants.xlsx'),
  events: USE_BLOB
    ? 'survey/survey_events.xlsx'
    : path.join(FS_DIR, 'survey_events.xlsx'),
  images: USE_BLOB
    ? 'survey/survey_images.xlsx'
    : path.join(FS_DIR, 'survey_images.xlsx'),
} as const;

export async function ensureDataDir() {
  if (!USE_BLOB) await fs.mkdir(FS_DIR, { recursive: true });
}

// ---------- I/O primitives ----------
async function readBinary(keyOrPath: string): Promise<Buffer | null> {
  if (!USE_BLOB) {
    try { return await fs.readFile(keyOrPath); } catch { return null; }
  }

  // No `get` in this SDK version → list by prefix, prefer exact match, else newest
  try {
    const { blobs } = await list({ prefix: keyOrPath });
    if (!blobs.length) return null;

    // exact match first
    let item = blobs.find(b => b.pathname === keyOrPath);
    if (!item) {
      // pick newest by uploadedAt
      blobs.sort(
        (a, b) =>
          new Date(b.uploadedAt || 0).getTime() -
          new Date(a.uploadedAt || 0).getTime()
      );
      item = blobs[0];
    }

    const r = await fetch(item.url, { cache: 'no-store' });
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

// async function writeBinary(keyOrPath: string, buf: Buffer) {
//   if (!USE_BLOB) {
//     await fs.mkdir(path.dirname(keyOrPath), { recursive: true });
//     await fs.writeFile(keyOrPath, buf);
//     return;
//   }

// src/services/xlsxService.ts
async function writeBinary(keyOrPath: string, buf: Buffer) {
  if (!USE_BLOB) {
    await fs.mkdir(path.dirname(keyOrPath), { recursive: true });
    await fs.writeFile(keyOrPath, buf);
    return;
  }

  // Older SDK supports only 'public'
  await put(keyOrPath, buf, {
     access: 'public',          // your current SDK only supports "public"
    addRandomSuffix: false,    // keep stable filename
    contentType: CT_XLSX,
    allowOverwrite: true, 
    //cacheControl: 'no-store',
  });
}

async function readSheetJSON(fileKeyOrPath: string, sheetName: string) {
  const buf = await readBinary(fileKeyOrPath);
  if (!buf) return [];
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
  return ws ? XLSX.utils.sheet_to_json(ws) : [];
}

async function writeSheetJSON(
  fileKeyOrPath: string,
  sheetName: string,
  rows: Record<string, unknown>[]
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // show full precision for numbers in Excel/Sheets
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const cell: XLSX.CellObject = (ws as Record<string, XLSX.CellObject>)[addr];
    if (cell && cell.t === 'n') cell.z = '0.###############';
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  await writeBinary(fileKeyOrPath, buf);
}

export async function appendRows(
  fileKeyOrPath: string,
  sheetName: string,
  newRows: Record<string, unknown>[]
) {
  const cur = (await readSheetJSON(fileKeyOrPath, sheetName)) as Record<string, unknown>[];
  await writeSheetJSON(fileKeyOrPath, sheetName, [...cur, ...newRows]);
}

export async function readFileBuffer(which: keyof typeof FILES) {
  return await readBinary(FILES[which]);
}
