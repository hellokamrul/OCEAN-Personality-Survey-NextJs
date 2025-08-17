// app/api/survey/debug/list/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type'); // optional: participants|events|images
    const prefix =
      type && ['participants', 'events', 'images'].includes(type)
        ? `survey/survey_${type}.xlsx`
        : 'survey/';

    const { blobs } = await list({ prefix });

    // newest first
    blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt || 0).getTime() -
        new Date(a.uploadedAt || 0).getTime()
    );

    return NextResponse.json(
      {
        prefix,
        count: blobs.length,
        items: blobs.map(b => ({
          key: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
          url: b.url, // public in your current SDK setup
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
