export function computeTipiScores(p: {
  TIPI1: string; TIPI2: string; TIPI3: string; TIPI4: string; TIPI5: string;
  TIPI6: string; TIPI7: string; TIPI8: string; TIPI9: string; TIPI10: string;
}) {
  const num = (x: string) => Number(x ?? 0) || 0;
  const rev = (x: number) => 8 - x;
  const s = {
    Extraversion:       (num(p.TIPI1) + rev(num(p.TIPI6))) / 2,
    Agreeableness:      (rev(num(p.TIPI2)) + num(p.TIPI7)) / 2,
    Conscientiousness:  (num(p.TIPI3) + rev(num(p.TIPI8))) / 2,
    EmotionalStability: (rev(num(p.TIPI4)) + num(p.TIPI9)) / 2,
    Openness:           (num(p.TIPI5) + rev(num(p.TIPI10))) / 2,
  };
  return { ...s, Neuroticism: 8 - s.EmotionalStability };
}
