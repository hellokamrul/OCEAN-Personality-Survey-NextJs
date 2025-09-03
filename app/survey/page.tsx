'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './survey.css';

/** --- Data & helpers identical to your original --- */
const productLabels = [
  "Mens Premium Blank T-shirt - Charcoal",
  "Single Jersey Knitted Cotton Polo - Olive",
  "Mens Premium T-Shirt- Nyctophilia",
  "Mens Premium Blank T-shirt - Ice Berg Green",
  "Fabrilife Mens Premium Designer Edition T Shirt - Stellar",
  "Fabrilife Mens Premium Designer Edition T Shirt - Nostalgia",
  "Mens Premium T-Shirt -Racing Track",
  "Mens Premium T-Shirt -Elite",
  "Mens Premium T-Shirt - Tranquility",
  "Mens Premium T-Shirt -Furious",
  "Mens Premium T-Shirt- Voyager",
  "Single Jersey Knitted Cotton Polo - Sky blue",
  "Single Jersey Knitted Cotton Polo - Chocolate",
  "Classical Edition Single Jersey Knitted Polo- Saltshake",
  "Single Jersey Knitted Cotton Polo - Gray Melange",
  "Fabrilife Mens Premium T-shirt - Street Light",
  "Mens Premium T-Shirt- Mirage",
  "Mens Premium T-Shirt- Empowered",
  "Mens Premium T-Shirt -Orpheus",
  "Mens Premium Blank T-shirt - Stellar",
  "Mens Premium T-Shirt- Linear Fusion",
  "Mens Premium T-Shirt- Grayscale",
  "Mens Premium Blank T-shirt - Maroon",
  "Single Jersey Knitted Cotton Polo - Black",
  "Mens Premium T-Shirt -Brownie",
  "Mens Premium T-Shirt - Fortune",
  "Mens Premium Classic T-Shirt- Silverline",
  "Premium Designer Edition Double PK Cotton Polo - Marine",
  "Mens Premium Blank T-shirt - Gray Melange",
  "Mens Premium Blank T-shirt - Green",
  "Premium Designer Edition Double PK Cotton Polo - Marooned",
  "Mens Premium Blank T-shirt - Anthra-Melange",
  "Mens Premium Blank T-shirt - Navy",
  "Single Jersey Knitted Cotton Polo - Navy",
  "Mens Premium T-Shirt -Reveal",
  "Mens Premium T-Shirt -Stormy",
  "Fabrilife Mens Premium T-shirt - Transformer",
  "Fabrilife Grameenphone Premium Tshirt - (Shimanar Baire)",
  "Mens Premium T-Shirt- Distortion",
  "Mens Premium T-Shirt - Sublime",
  "Mens Premium T-Shirt -Hope",
  "Fabrilife Mens Premium T-shirt - Smoke",
  "Mens Premium Blank T-shirt - White",
  "Mens Premium Blank T-shirt- Olive",
  "Mens Premium Blank T-shirt -Chocolate",
  "Mens Premium Blank T-shirt- Tan",
  "Mens Premium Blank T-shirt- Silver",
  "Mens Premium Blank T-shirt - Black",
  "Fabrilife Mens Premium T-shirt - Moonlight",
  "Mens Premium Blank T-shirt - Stormy Sea",
  "Mens Premium T-Shirt - Obsecure",
  "Mens Premium T-Shirt- Promenade",
  "Fabrilife Mens Premium Designer Edition T Shirt - Signature",
  "Mens Premium T-Shirt - Wininedow",
  "Mens Premium T-Shirt - Traveler",
  "Mens Premium T-Shirt- Olivicson",
  "Mens Premium Classic T-Shirt - Blackburn",
  "Fabrilife Mens Premium T-shirt - Bangladesh",
  "Mens Premium T-Shirt- Thought",
  "Mens Premium Blank T-shirt - Cream",
  "Fabrilife Mens Premium T-shirt - Grid"
];

const maleImagesPublic = productLabels.map((label, i) => ({
  id: i + 1,
  src: `/male_data/${encodeURIComponent(label)}.jpg`,
  label
}));

const FEMALE_COUNT = 80;
const femaleImagesPublic = Array.from({ length: FEMALE_COUNT }, (_, i) => ({
  id: productLabels.length + i + 1,
  src: `/female_data/${i + 1}.jpg`,
  label: `Female ${i + 1}`,
}));

const LIKERT = [
  { value: '1', label: 'Disagree strongly' },
  { value: '2', label: 'Disagree moderately' },
  { value: '3', label: 'Disagree a little' },
  { value: '4', label: 'Neither agree nor disagree' },
  { value: '5', label: 'Agree a little' },
  { value: '6', label: 'Agree moderately' },
  { value: '7', label: 'Agree strongly' }
];

const TIPI_ITEMS = [
  { id:'q1', text:'I like to talk a lot and enjoy being with people, like in gossip or social gatherings.', rev:false },
  { id:'q2', text:'I often argue with others and point out their mistakes, like during debates or family discussions.', rev:true },
  { id:'q3', text:'I always try to be responsible and finish my work on time, like meeting deadlines in studies or jobs.', rev:false },
  { id:'q4', text:'I worry too much and get stressed quickly, like before exams or job interviews.', rev:true },
  { id:'q5', text:'I love learning new things and thinking deeply, like exploring new technologies or ideas.', rev:false },
  { id:'q6', text:'I prefer staying quiet and don’t talk much, like someone who enjoys personal space instead of social gatherings.', rev:true },
  { id:'q7', text:'I care for others and like helping people, like supporting a friend in need.', rev:false },
  { id:'q8', text:'I often forget things and don’t plan properly, like missing important dates or losing keys.', rev:true },
  { id:'q9', text:'I don’t get stressed easily and stay relaxed, even in tough situations like traffic jams or sudden problems.', rev:false },
  { id:'q10', text:'I prefer following traditions and don’t like trying new things, like sticking to familiar foods or old habits.', rev:true }
];

const rev = (x: number) => 8 - x;
const pct7 = (avg: number) => Math.round(((avg - 1) / 6) * 100);
const band7 = (avg: number) => (avg >= 5 ? 'High' : (avg <= 3 ? 'Low' : 'Medium'));

function deviceInfo() {
  const ua =
    navigator.userAgent ||
    (navigator as unknown as { vendor?: string }).vendor ||
    (window as unknown as { opera?: string }).opera;
  const isTouch = ('ontouchstart' in window) || ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 0;
  const isMobile = /android|iphone|ipad|mobile|ipod|opera mini|iemobile|blackberry|webos/i.test(ua || '');
  let deviceType = 'Desktop';
  if (isMobile) deviceType = 'Mobile'; else if (isTouch) deviceType = 'Tablet';
  return { userAgent: ua, isMobile, isTouch, deviceType };
}

function getNextId(): number {
  const key = 'survey_auto_id';
  const raw = localStorage.getItem(key);
  const next = raw ? parseInt(raw, 10) + 1 : 1;
  localStorage.setItem(key, String(next));
  return next;
}

// helpers for activity capture
const epochNow = () =>
  (performance.timeOrigin || (Date.now() - performance.now())) + performance.now();
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

type RawEvent = {
  Type: string;
  X: number | null;          // 0..1 proportion of container width
  Y: number | null;          // 0..1 proportion of container height
  Key: string | null;
  Target: string | null;
  ScrollY: number | null;    // px (container scrollTop)
  TimeMs: number;            // epoch ms (fractional ok)
};

export default function SurveyPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [profession, setProfession] = useState('');
  const [livingArea, setLivingArea] = useState<'Urban' | 'Rural' | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<Record<number, 'Like' | 'Neutral' | 'Dislike'>>({});
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [scores, setScores] = useState<{[k:string]: number} | null>(null);

  // NEW: lock UI while saving
  const [submitting, setSubmitting] = useState(false);

  // 🔧 scroll container ref (your .container is scrollable)
  const containerRef = useRef<HTMLDivElement>(null);

  type ActivityEvent = RawEvent;
  const eventsRef = useRef<ActivityEvent[]>([]);

  // convenience helpers tied to the container
  const getContainerRect = () => containerRef.current?.getBoundingClientRect();
  const getScrollTop = () => (containerRef.current ? containerRef.current.scrollTop : window.scrollY);

  // activity listeners (only the requested columns, with X/Y as container proportions 0..1)
  useEffect(() => {
    const getTargetTag = (evt: Event): string | null =>
      evt.target instanceof Element ? evt.target.tagName : null;

    const push = (e: Partial<RawEvent>) => {
      eventsRef.current.push({
        Type: e.Type || 'unknown',
        X: e.X ?? null,
        Y: e.Y ?? null,
        Key: e.Key ?? null,
        Target: e.Target ?? null,
        ScrollY: e.ScrollY ?? getScrollTop(),
        TimeMs: e.TimeMs ?? epochNow(),
      });
    };

    // session start marker
    push({ Type: 'session_start', X: null, Y: null, Key: null, Target: null, ScrollY: getScrollTop(), TimeMs: epochNow() });

    // de-dup signature (drop near-identical samples within ~1 frame)
    let lastSig = '';
    let lastTs = 0;
    const makeSig = (type: string, x: number, y: number, sy: number) =>
      `${type}:${x.toFixed(3)}:${y.toFixed(3)}:${Math.round(sy)}`;

    const samplePointer = (pe: PointerEvent) => {
      const rect = getContainerRect();
      const W = rect?.width ?? (window.innerWidth || 1);
      const H = rect?.height ?? (window.innerHeight || 1);

      // position relative to container
      const xpx = pe.clientX - (rect?.left ?? 0);
      const ypx = pe.clientY - (rect?.top ?? 0);

      const x = clamp01(xpx / W);
      const y = clamp01(ypx / H);
      const sy = getScrollTop();

      // de-dup: if same XY+scroll very recently, skip
      const now = epochNow();
      const sig = makeSig(pe.type, x, y, sy);
      if (sig === lastSig && now - lastTs < 17) return;
      lastSig = sig; lastTs = now;

      push({
        Type: pe.type, // 'pointermove'|'pointerdown'|'pointerup'
        X: x,
        Y: y,
        Key: null,
        Target: getTargetTag(pe),
        ScrollY: sy,
        TimeMs: now
      });
    };

    const onPointerMove = (e: PointerEvent) => samplePointer(e);
    const onPointerDown = (e: PointerEvent) => samplePointer(e);
    const onPointerUp   = (e: PointerEvent) => samplePointer(e);

    const onKeyDown = (e: KeyboardEvent) => {
      push({
        Type: 'keydown',
        X: null, Y: null,
        Key: e.key,
        Target: null,
        ScrollY: getScrollTop(),
        TimeMs: epochNow()
      });
    };

    const onScroll = () => {
      push({
        Type: 'scroll',
        X: null, Y: null,
        Key: null,
        Target: null,
        ScrollY: getScrollTop(),
        TimeMs: epochNow()
      });
    };

    // attach to document for pointer/keyboard
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup',   onPointerUp,   { passive: true });
    // 🔕 intentionally NOT listening to 'pointerrawupdate' to reduce duplicates
    document.addEventListener('keydown', onKeyDown);

    // attach scroll to the actual scroller (container)
    const el = containerRef.current;
    el?.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup',   onPointerUp);
      document.removeEventListener('keydown', onKeyDown);
      el?.removeEventListener('scroll', onScroll);
    };
  }, []);

  const images = useMemo(() => {
    if (gender === 'Male') return maleImagesPublic;
    if (gender === 'Female') return femaleImagesPublic;
    return [];
  }, [gender]);

  const onSelectSentiment = (imgId: number, val: 'Like'|'Neutral'|'Dislike') => {
    setSelectedImages(prev => {
      const was = prev[imgId];
      const next = { ...prev };
      if (was === val) { delete next[imgId]; } else { next[imgId] = val; }
      return next;
    });
  };

  const formValidStep1 = () => {
    return name.trim() && age && profession.trim() && livingArea && (gender === 'Male' || gender === 'Female') &&
           TIPI_ITEMS.every(it => answers[it.id]);
  };

  const handleNext = () => {
    if (!formValidStep1()) {
      alert('Please complete all required fields and TIPI items.');
      return;
    }
    setStep(2);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => setStep(1);

  type Scores = {
    Extraversion: number;
    Agreeableness: number;
    Conscientiousness: number;
    EmotionalStability: number;
    Openness: number;
    Neuroticism: number;
  };

  const computeScores = (): Scores => {
    const v = (q: string) => parseInt(answers[q] || '0', 10) || 0;
    const s = {
      Extraversion: (v('q1') + rev(v('q6'))) / 2,
      Agreeableness: (rev(v('q2')) + v('q7')) / 2,
      Conscientiousness: (v('q3') + rev(v('q8'))) / 2,
      EmotionalStability: (rev(v('q4')) + v('q9')) / 2,
      Openness: (v('q5') + rev(v('q10'))) / 2,
      Neuroticism: 0,
    };
    s.Neuroticism = 8 - s.EmotionalStability;
    return s;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // prevent double submits

    if (!Object.keys(selectedImages).length) {
      alert('Please select at least one image and assign a like status.');
      return;
    }

    setSubmitting(true); // lock UI
    try {
      const scoresNow = computeScores();
      setScores(scoresNow);

      const participantID = getNextId();

      const finalEvents = eventsRef.current.map((ev, i) => ({
        ParticipantID: participantID,
        Seq: i + 1,
        Type: ev.Type,
        X: ev.X,                // 0..1 proportion of container width
        Y: ev.Y,                // 0..1 proportion of container height
        Key: ev.Key,
        Target: ev.Target,
        ScrollY: ev.ScrollY,
        TimeISO: new Date(Math.round(ev.TimeMs)).toISOString(),
      }));

      const payload = {
        ID: participantID,
        Name: name,
        Age: Number(age),
        Profession: profession,
        LivingArea: livingArea,
        Gender: gender,
        TIPI1: answers['q1'], TIPI2: answers['q2'], TIPI3: answers['q3'], TIPI4: answers['q4'], TIPI5: answers['q5'],
        TIPI6: answers['q6'], TIPI7: answers['q7'], TIPI8: answers['q8'], TIPI9: answers['q9'], TIPI10: answers['q10'],
        SelectedImages: JSON.stringify(Object.entries(selectedImages).map(([id, like]) => ({ id, like }))),

        // << only these columns are sent for activity events >>
        ActivityEvents: finalEvents,
      };

      const resp = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) throw new Error(data?.message || 'Save failed');
      setModalOpen(true);

      // reset everything for a new session
      setStep(1);
      setName(''); setAge(''); setProfession(''); setLivingArea(''); setGender('');
      setAnswers({}); setSelectedImages({});
      eventsRef.current = [];
      // start new session marker
      eventsRef.current.push({
        Type: 'session_start',
        X: null, Y: null,
        Key: null,
        Target: null,
        ScrollY: getScrollTop(),
        TimeMs: epochNow()
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Server error');
      } else {
        alert('Server error');
      }
    } finally {
      setSubmitting(false); // unlock UI regardless
    }
  };

  return (
    <div className="container" ref={containerRef}>
      <h2>OCEAN Personality Survey</h2>

      <form id="surveyForm" onSubmit={handleSubmit} aria-busy={submitting}>
        {/* Step 1 */}
        {step === 1 && (
          <div id="step1">
            <div className="field">
              <label>Name:</label>
              <input type="text" required value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Age:</label>
              <input type="number" min={10} max={99} required value={age} onChange={e=>setAge(e.target.value? Number(e.target.value):'')} />
            </div>
            <div className="field">
              <label>Profession:</label>
              <input type="text" required value={profession} onChange={e=>setProfession(e.target.value)} />
            </div>
            <div className="field">
              <label>Living Area:</label>
              <select required value={livingArea} onChange={e=>setLivingArea(e.target.value as 'Urban' | 'Rural' | '')}>
                <option value="">Select...</option>
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>
            <div className="field">
              <label>Gender:</label>
              <select required value={gender} onChange={e=>setGender(e.target.value as 'Male' | 'Female' | '')}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="legend"><h1><strong> one option for each statement:</strong></h1></div>
            <div id="tipiBlock" className="tipi-cards">
              {TIPI_ITEMS.map((item, idx) => (
                <div className="qcard" key={item.id}>
                  <div className="qtitle">
                    <span className="qnum">{idx+1}. </span>
                    {item.text}
                    {item.rev && <span className="rev-tag" title="Reverse-scored">reverse-scored</span>}
                  </div>
                  <div className="scale7">
                    {LIKERT.map((opt, i) => (
                      <label className="pill" aria-label={`${opt.value}: ${opt.label}`} key={opt.value}>
                        <input
                          type="radio"
                          name={item.id}
                          value={opt.value}
                          required={i===0}
                          checked={answers[item.id] === opt.value}
                          onChange={()=> setAnswers(prev => ({ ...prev, [item.id]: opt.value }))}
                        />
                        <span className="box">
                          <span className="n">{opt.value}</span>
                          <span className="lab">{opt.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" id="nextStepBtn" onClick={handleNext} disabled={submitting} aria-disabled={submitting}>
              Next
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div id="step2">
            <div className="question">
              <label>Choose the images that best match your mood (multiple allowed):</label>
              <div className="image-choices" id="imageChoices" aria-busy={submitting}>
                {images.map(imgObj => {
                  const sentiment = selectedImages[imgObj.id];
                  return (
                    <div key={imgObj.id} className={`img-block ${sentiment ? 'selected' : ''} ${sentiment==='Like'?'sent-like':sentiment==='Neutral'?'sent-neutral':sentiment==='Dislike'?'sent-dislike':''}`} role="group" aria-label={imgObj.label}>
                      <img src={imgObj.src} alt={imgObj.label} className="img-photo" loading="lazy" />
                      <span className="label">{imgObj.label}</span>
                      <div className="img-like-btns">
                        {(['Like','Neutral','Dislike'] as const).map(val => (
                          <button
                            type="button"
                            key={val}
                            className={`img-like-btn ${val.toLowerCase()} ${sentiment===val?'selected':''}`}
                            onClick={() => onSelectSentiment(imgObj.id, val)}
                            disabled={submitting}
                            aria-disabled={submitting}
                          >
                            {val==='Like' ? '👍 Like' : val==='Neutral' ? '😐 Neutral' : '👎 Dislike'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="step-btns">
              <button
                type="button"
                id="prevStepBtn"
                style={{width:'48%'}}
                onClick={handlePrev}
                disabled={submitting}
                aria-disabled={submitting}
              >
                Back
              </button>
              <button
                type="submit"
                id="submitBtn"
                style={{width:'48%'}}
                disabled={submitting}
                aria-disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" /> Saving…
                  </>
                ) : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Result modal */}
      <div id="resultModal" className={`modal ${modalOpen ? 'show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="resultTitle">
        <div className="modal-card">
          <h3 id="resultTitle">Your Personality Snapshot</h3>
          <div id="resultBody">
            {scores && (
              <>
                {[
                  ['Extraversion', scores.Extraversion],
                  ['Agreeableness', scores.Agreeableness],
                  ['Conscientiousness', scores.Conscientiousness],
                  ['Emotional Stability', scores.EmotionalStability],
                  ['Openness', scores.Openness],
                ].map(([name, val]) => {
                  const p = pct7(val as number);
                  return (
                    <div className="trait" key={name as string}>
                      <div><strong>{name as string}</strong></div>
                      <div className="bar"><span style={{width:`${p}%`}} /></div>
                      <div className="badge">{(val as number).toFixed(2)} / 7 • {band7(val as number)}</div>
                    </div>
                  );
                })}
                <div style={{marginTop:'10px', fontSize:'.95rem'}}>
                  Neuroticism (inverse of Emotional Stability): {scores.Neuroticism.toFixed(2)} / 7 • {band7(scores.Neuroticism)}
                </div>
              </>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" id="closeResultBtn" style={{width:'auto', padding:'10px 16px', background:'#455a64'}} onClick={()=>setModalOpen(false)}>Close</button>
          </div>
        </div>
      </div>

      <div id="message">{message}</div>

      {submitting && (
        <div className="page-loader" role="status" aria-live="polite" aria-label="Saving">
          <div className="page-loader-box">
            <div className="page-loader-ring" />
            <div className="page-loader-text">Saving…</div>
          </div>
        </div>
      )}

    </div>
  );
}
