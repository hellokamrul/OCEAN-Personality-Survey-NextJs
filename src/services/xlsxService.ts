// import * as XLSX from 'xlsx';
// import path from 'node:path';
// import fs from 'node:fs/promises';

// const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// export const FILES = {
//   participants: path.join(DATA_DIR, 'survey_participants.xlsx'),
//   events:       path.join(DATA_DIR, 'survey_events.xlsx'),
//   images:       path.join(DATA_DIR, 'survey_images.xlsx'),
// } as const;

// export async function ensureDataDir() {
//   await fs.mkdir(DATA_DIR, { recursive: true });
// }

// async function readSheetJSON(filePath: string, sheetName: string) {
//   try {
//     const buf = await fs.readFile(filePath);                 // read as buffer
//     const wb = XLSX.read(buf, { type: 'buffer' });
//     const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
//     return ws ? XLSX.utils.sheet_to_json(ws) : [];
//   } catch {
//     return [];
//   }
// }

// async function writeSheetJSON(
//   filePath: string,
//   sheetName: string,
//   rows: Record<string, unknown>[]
// ) {
//   const wb = XLSX.utils.book_new();
//   const ws = XLSX.utils.json_to_sheet(rows);

//   // ▼ NEW: ensure Excel displays full precision for numeric cells
//   for (const addr of Object.keys(ws)) {
//     if (addr[0] === '!') continue;
//     const cell = (ws as Record<string, XLSX.CellObject>)[addr];
//     if (cell && cell.t === 'n') {
//       // up to 15 decimals shown when present; integers remain integers
//       cell.z = '0.###############';
//     }
//   }

//   XLSX.utils.book_append_sheet(wb, ws, sheetName);

//   const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }); // get buffer
//   await fs.mkdir(path.dirname(filePath), { recursive: true });       // ensure folder
//   await fs.writeFile(filePath, buf);                                 // write buffer
// }

// export async function appendRows(
//   filePath: string,
//   sheetName: string,
//   newRows: Record<string, unknown>[]
// ) {
//   const cur = (await readSheetJSON(filePath, sheetName)) as Record<string, unknown>[];
//   await writeSheetJSON(filePath, sheetName, [...cur, ...newRows]);
// }

// export async function readFileBuffer(which: keyof typeof FILES) {
//   try {
//     return await fs.readFile(FILES[which]);
//   } catch {
//     return null;
//   }
// }



import * as XLSX from 'xlsx';
import path from 'node:path';
import fs from 'node:fs/promises';
import { put, list } from '@vercel/blob';

const CONTENT_TYPE_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Use Blob in production on Vercel (or when STORAGE=blob), FS locally
const USE_BLOB = (process.env.STORAGE || '').toLowerCase() === 'blob' || !!process.env.VERCEL;

// ---------- paths / keys ----------
const FS_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

export const FILES = {
  // For Blob we use fixed "pathnames" so we overwrite (no random suffix)
  participants: USE_BLOB ? 'survey/survey_participants.xlsx'
                         : path.join(FS_DIR, 'survey_participants.xlsx'),
  events:       USE_BLOB ? 'survey/survey_events.xlsx'
                         : path.join(FS_DIR, 'survey_events.xlsx'),
  images:       USE_BLOB ? 'survey/survey_images.xlsx'
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

  // Blob: find object, then fetch its bytes
  const { blobs } = await list({ prefix: keyOrPath });
  const item = blobs.find(b => b.pathname === keyOrPath);
  if (!item) return null;

  // Private access: SDK URLs are fetchable from the server without extra params
  const r = await fetch(item.url, { cache: 'no-store' });
  if (!r.ok) return null;
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

async function writeBinary(keyOrPath: string, buf: Buffer) {
  if (!USE_BLOB) {
    await fs.mkdir(path.dirname(keyOrPath), { recursive: true });
    await fs.writeFile(keyOrPath, buf);
    return;
  }

  // Blob: overwrite same pathname (no random suffix)
  await put(keyOrPath, buf, {
    access: 'public',
    addRandomSuffix: false,
    contentType: CONTENT_TYPE_XLSX,
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

  // show full precision (no rounding in Excel UI)
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
