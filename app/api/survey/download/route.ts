import { NextRequest, NextResponse } from 'next/server';
import { readFileBuffer } from '../../../../src/services/xlsxService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type'); // participants|events|images
  if (type !== 'participants' && type !== 'events' && type !== 'images') {
    return new NextResponse('Bad request', { status: 400 });
  }
  const buf = await readFileBuffer(type as 'participants' | 'events' | 'images');
  if (!buf) return new NextResponse('File not found', { status: 404 });
  const filename = `survey_${type}.xlsx`;
  // Convert Node.js Buffer to Uint8Array for NextResponse
  const uint8Array = new Uint8Array(buf);
  return new NextResponse(uint8Array, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
