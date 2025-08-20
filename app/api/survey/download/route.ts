import { NextRequest, NextResponse } from 'next/server';
import { getDownloadFile } from '../../../../src/services/xlsxService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type'); // participants|events|images
  if (type !== 'participants' && type !== 'events' && type !== 'images') {
    return new NextResponse('Bad request', { status: 400 });
  }

  const file = await getDownloadFile(type as 'participants' | 'events' | 'images');
  if (!file) return new NextResponse('File not found', { status: 404 });

  return new NextResponse(new Uint8Array(file.buf), {
    headers: {
      'Content-Type': file.contentType,
      // If you prefer a fixed name, replace with `survey_${type}.xlsx`
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      // prevent CDN caching stale file
      'Cache-Control': 'no-store',
    },
  });
}
