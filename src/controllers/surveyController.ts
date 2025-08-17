import { randomUUID } from 'node:crypto';
import { SurveyPayload, SelectedImage } from '../models/survey';
import { computeTipiScores } from '../utils/tipi';
import { appendRows, ensureDataDir, FILES } from '../services/xlsxService';

export async function handleSubmit(payload: SurveyPayload) {
  await ensureDataDir();

  const ParticipantID = randomUUID();
  const scores = computeTipiScores(payload);

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
    // Score_Extraversion:       Number(scores.Extraversion.toFixed(2)),
    // Score_Agreeableness:      Number(scores.Agreeableness.toFixed(2)),
    // Score_Conscientiousness:  Number(scores.Conscientiousness.toFixed(2)),
    // Score_EmotionalStability: Number(scores.EmotionalStability.toFixed(2)),
    // Score_Openness:           Number(scores.Openness.toFixed(2)),
    // AFTER (no rounding)
    Score_Extraversion:       scores.Extraversion,
    Score_Agreeableness:      scores.Agreeableness,
    Score_Conscientiousness:  scores.Conscientiousness,
    Score_EmotionalStability: scores.EmotionalStability,
    Score_Openness:           scores.Openness,
    SubmittedAt: new Date().toISOString(),
  };
  appendRows(FILES.participants, 'Participants', [participantRow]);

const evRows = (payload.ActivityEvents || []).map((e, i) => ({
  ParticipantID,
  Seq: i + 1,
  Type: e?.Type ?? '',
  X: e?.X ?? '',             // may be fractional now
  Y: e?.Y ?? '',
  XPerc: e?.XPerc ?? '',
  YPerc: e?.YPerc ?? '',
  Key: e?.Key ?? '',
  Target: e?.Target ?? '',
  ScrollY: e?.ScrollY ?? '',
  ScrollYFrac: e?.ScrollYFrac ?? '',
  PointerType: e?.PointerType ?? '',
  VW: e?.VW ?? '',
  VH: e?.VH ?? '',
  TimeEpochMs: e?.Time ?? '', // fractional ms
  TimeISO: e?.Time ? new Date(e.Time).toISOString() : '',
}));


  if (evRows.length) appendRows(FILES.events, 'Events', evRows);

  let sel: SelectedImage[] = [];
  try { sel = JSON.parse(payload.SelectedImages || '[]'); } catch {}
  const imgRows = sel.map(x => ({
    ParticipantID,
    ImageID: Number(x.id),
    Sentiment: x.like || '',
  }));
  if (imgRows.length) appendRows(FILES.images, 'ImageReactions', imgRows);

  return { success: true as const, participantId: ParticipantID };
}
