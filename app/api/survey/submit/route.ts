import { NextRequest, NextResponse } from 'next/server';
import { handleSubmit } from '../../../../src/controllers/surveyController';
import type { SurveyPayload } from '../../../../src/models/survey';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SurveyPayload;
    const res = await handleSubmit(body);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : 'error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
