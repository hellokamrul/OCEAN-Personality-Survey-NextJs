// app/api/survey/debug/list/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
export async function GET() {
  const { blobs } = await list({ prefix: 'survey/' });
  return NextResponse.json(blobs.map(b => ({ key: b.pathname, size: b.size, uploadedAt: b.uploadedAt })));
}
