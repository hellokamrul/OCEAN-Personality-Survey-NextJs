// src/controllers/handleSubmit.ts
import { randomUUID } from 'node:crypto';
import { SurveyPayload } from '../models/survey';
import { computeTipiScores } from '../utils/tipi';
import { appendRows, ensureDataDir, FILES } from '../services/xlsxService';

export async function handleSubmit(payload: SurveyPayload) {
  await ensureDataDir();

  const ParticipantID = randomUUID();
  const scores = computeTipiScores(payload);
  const submittedAtISO = new Date().toISOString();

  const participantRow = {
    ParticipantID,
    LocalAutoID: payload.ID,
    Name: payload.Name,
    Age: payload.Age,
    Profession: payload.Profession,
    LivingArea: payload.LivingArea,
    Gender: payload.Gender,
    TIPI1: payload.TIPI1, TIPI2: payload.TIPI2, TIPI3: payload.TIPI3, TIPI4: payload.TIPI4, TIPI5: payload.TIPI5,
    TIPI6: payload.TIPI6, TIPI7: payload.TIPI7, TIPI8: payload.TIPI8, TIPI9: payload.TIPI9, TIPI10: payload.TIPI10,
    Score_Extraversion: scores.Extraversion,
    Score_Agreeableness: scores.Agreeableness,
    Score_Conscientiousness: scores.Conscientiousness,
    Score_EmotionalStability: scores.EmotionalStability,
    Score_Openness: scores.Openness,
    SubmittedAt: submittedAtISO,
  };

  await appendRows(FILES.participants, 'Participants', [participantRow]);

  // ---- Events: only the requested columns ----
  type AnyEvent = Record<string, unknown>;
  const evs: AnyEvent[] = Array.isArray(payload.ActivityEvents) ? payload.ActivityEvents as AnyEvent[] : [];

  const toNum = (v: unknown) =>
    typeof v === 'number' ? v :
    (typeof v === 'string' ? Number(v) : NaN);

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  const evRows = evs.map((e, i) => {
    const nx = toNum(e?.X);
    const ny = toNum(e?.Y);
    const x = Number.isFinite(nx) ? clamp01(nx) : '';
    const y = Number.isFinite(ny) ? clamp01(ny) : '';

    const scrollRaw = toNum(e?.ScrollY);
    const scrollY = Number.isFinite(scrollRaw) ? Math.round(scrollRaw) : '';

    // Prefer TimeISO from client; else accept TimeEpochMs fallback
    let timeISO = '';
    if (typeof e?.TimeISO === 'string' && e.TimeISO) {
      timeISO = new Date(e.TimeISO).toISOString();
    } else {
      const te = toNum(e?.TimeEpochMs);
      if (Number.isFinite(te)) timeISO = new Date(te).toISOString();
    }

    return {
      ParticipantID,
      Seq: i + 1,
      Type: (e?.Type as string) ?? '',
      X: x,
      Y: y,
      Key: (e?.Key as string) ?? '',
      Target: (e?.Target as string) ?? '',
      ScrollY: scrollY,
      TimeISO: timeISO,
    };
  });

  if (evRows.length) {
    await appendRows(FILES.events, 'Events', evRows);
  }

  // ---- Image reactions (unchanged) ----
  type SelectedImage = { id: number; like?: string };
  let sel: SelectedImage[] = [];
  try { sel = JSON.parse((payload as { SelectedImages?: string }).SelectedImages || '[]'); } catch {}

  const imgRows = sel.map(x => ({
    ParticipantID,
    ImageID: Number(x.id),
    Sentiment: x.like || '',
  }));

  if (imgRows.length) {
    await appendRows(FILES.images, 'ImageReactions', imgRows);
  }

  return { success: true as const, participantId: ParticipantID };
}
