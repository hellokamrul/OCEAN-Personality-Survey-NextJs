// src/models/survey.ts

export interface ActivityEvent {
  Type: string;

  // fractional CSS-pixel coords when available (Pointer Events)
  X?: number | null;
  Y?: number | null;

  // 0..1 normalized to viewport
  XPerc?: number | null;
  YPerc?: number | null;

  Key?: string | null;
  Target?: string | null;

  ScrollY?: number | null;
  ScrollYFrac?: number | null;

  // high-resolution epoch ms (fractional)
  Time?: number | null;

  // optional context
  PointerType?: 'mouse' | 'touch' | 'pen' | string | null;
  VW?: number | null;
  VH?: number | null;

  [k: string]: unknown;
}


export interface SurveyPayload {
  ID: number;
  Name: string;
  Age: number;
  Profession: string;
  LivingArea: string;
  Gender: 'Male' | 'Female';
  TIPI1: string; TIPI2: string; TIPI3: string; TIPI4: string; TIPI5: string;
  TIPI6: string; TIPI7: string; TIPI8: string; TIPI9: string; TIPI10: string;
  SelectedImages: string;
  ActivityEvents: ActivityEvent[];   // ← ensure this uses ActivityEvent[]
}
