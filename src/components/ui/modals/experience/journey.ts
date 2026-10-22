// Turns cvData (timeline + leadership) into an ordered list of "checkpoints" on the Map of Time,
// plus the geometry used to lay them out along a winding trail.
import { cvData } from '../../../../data/cvData';
import { UI } from '../../kit/theme';

export type StopKind = 'school' | 'university' | 'work' | 'achievement' | 'leadership' | 'future';

export interface Stop {
  key: string;
  kind: StopKind;
  /** Leadership items are side quests: smaller pins on a branch off the main trail. */
  side: boolean;
  role: string;
  org: string;
  /** Short name for the map label. */
  short: string;
  location?: string;
  period: string;
  startYear: number;
  ongoing: boolean;
  summary?: string;
  bullets: string[];
  skills: string[];
}

/**
 * Facts that the previous (leather folio) Experience modal showed but that are not in cvData yet.
 * TODO: move these into src/data/cvData.ts and delete this constant.
 */
export const LEGACY_FACTS = {
  /** Map coordinates of IIT Jodhpur, shown on the compass rose. */
  coords: "26°14' N, 73°01' E",
  /** Extra skill tags the old modal listed for the IIT Jodhpur checkpoint. */
  extraSkills: { 'edu-iitj': ['GROMACS', 'SciPy'] } as Record<string, string[]>,
};

export const KIND_META: Record<StopKind, { emoji: string; label: string; color: string; text: string }> = {
  school: { emoji: '🎓', label: 'School', color: UI.woodLight, text: UI.ink },
  university: { emoji: '🏛️', label: 'University', color: UI.amber, text: '#fff' },
  work: { emoji: '💼', label: 'Work', color: UI.meadow, text: '#fff' },
  achievement: { emoji: '🏆', label: 'Achievement', color: UI.amberLight, text: UI.ink },
  leadership: { emoji: '🎬', label: 'Side quest', color: UI.plum, text: '#fff' },
  future: { emoji: '❓', label: 'Uncharted', color: UI.paperDeep, text: UI.inkSoft },
};

const years = (s: string) => (s.match(/\d{4}/g) ?? []).map(Number);
const isOngoing = (period: string) => /present/i.test(period);

/** "Indian Institute of Technology Jodhpur (IIT Jodhpur)" -> "IIT Jodhpur", "Central Board of Secondary Education" -> "CBSE". */
export function shortName(org: string): string {
  const paren = org.match(/\(([^)]+)\)/)?.[1];
  if (paren && /^[A-Z]{2}/.test(paren)) return paren;
  const base = org.replace(/\([^)]*\)/g, '').split(',')[0].trim();
  const words = base.split(/\s+/);
  if (words.length > 3) {
    const acronym = words.filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('');
    if (acronym.length >= 2) return acronym;
  }
  return base;
}

function educationKind(role: string, org: string): StopKind {
  return /b\.?tech|institute|university|college|bachelor|master/i.test(`${role} ${org}`) ? 'university' : 'school';
}

function buildStops(): Stop[] {
  const main: Stop[] = cvData.timeline.map((t) => ({
    key: t.id,
    kind: t.type === 'education' ? educationKind(t.role, t.company) : t.type,
    side: false,
    role: t.role,
    org: t.company,
    short: shortName(t.company),
    location: t.location,
    period: t.period,
    startYear: years(t.period)[0] ?? 0,
    ongoing: isOngoing(t.period),
    summary: t.summary,
    bullets: t.bullets,
    skills: [...t.skills, ...(LEGACY_FACTS.extraSkills[t.id] ?? []).filter((s) => !t.skills.includes(s))],
  }));
  const side: Stop[] = cvData.leadership.map((l, i) => ({
    key: `lead-${i}`,
    kind: 'leadership',
    side: true,
    role: l.role,
    org: l.org,
    short: shortName(l.org),
    period: l.period,
    startYear: years(l.period)[0] ?? 0,
    ongoing: isOngoing(l.period),
    bullets: l.bullets,
    skills: [],
  }));
  // Oldest first; on ties the main checkpoint comes before the side quest.
  return [...main, ...side].sort((a, b) => a.startYear - b.startYear || Number(a.side) - Number(b.side));
}

export const STOPS: Stop[] = buildStops();

/** The playful "what's next" pin at the summit. Graduation year comes from the university period. */
const uni = STOPS.find((s) => s.kind === 'university');
export const GRAD_YEAR = uni ? Math.max(...years(uni.period)) : new Date().getFullYear() + 1;

export const FUTURE: Stop = {
  key: 'future',
  kind: 'future',
  side: false,
  role: 'Next checkpoint: ???',
  org: `Graduation ${GRAD_YEAR} / Your team?`,
  short: '???',
  period: `${GRAD_YEAR} →`,
  startYear: GRAD_YEAR,
  ongoing: false,
  bullets: [],
  skills: [],
};

/** Default selection: the current work role, else the newest ongoing stop, else the newest stop. */
export function defaultIndex(stops: Stop[]): number {
  const current = stops.findIndex((s) => s.kind === 'work' && s.ongoing);
  if (current >= 0) return current;
  for (let i = stops.length - 1; i >= 0; i--) if (stops[i].ongoing) return i;
  return Math.max(0, stops.length - 1);
}

/* ------------------------------------------------------------------ geometry */

export interface Pt {
  x: number;
  y: number;
}

export interface MapLayout {
  w: number;
  h: number;
  /** Trail waypoint per slot (stops + future). */
  trail: Pt[];
  /** Pin position per slot (equals the trail point for main stops, offset for side quests). */
  pins: Pt[];
  /** Path through trail[0..n-2] (travelled history) and the last, uncharted leg. */
  pathDone: string;
  pathNext: string;
}

/** Catmull-Rom -> cubic Bezier segment strings between consecutive points. */
function segments(p: Pt[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    out.push(`C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`);
  }
  return out;
}

/**
 * wide: oldest at the bottom-left cottage, climbing to the mountain summit top-right.
 * tall (phones): oldest at the bottom, the trail zig-zags upward to the summit at the top.
 */
export function buildLayout(slots: Stop[], orientation: 'wide' | 'tall'): MapLayout {
  const n = slots.length;
  const trail: Pt[] = [];
  const pins: Pt[] = [];

  if (orientation === 'wide') {
    const w = 1000;
    const h = 510;
    slots.forEach((s, i) => {
      const t = n > 1 ? i / (n - 1) : 0;
      const x = 100 + t * (w - 190);
      const wiggle = i % 2 === 0 ? 28 : -28;
      const y = i === n - 1 ? 120 : Math.round(360 - t * 240 + wiggle);
      trail.push({ x, y });
      if (s.side) {
        // Branch upward when there is room, otherwise downward.
        const up = y - 130 > 70;
        pins.push({ x: x + 10, y: up ? y - 125 : y + 105 });
      } else pins.push({ x, y });
    });
    const seg = segments(trail);
    return {
      w,
      h,
      trail,
      pins,
      pathDone: `M ${trail[0].x} ${trail[0].y} ${seg.slice(0, -1).join(' ')}`,
      pathNext: `M ${trail[n - 2]?.x ?? trail[0].x} ${trail[n - 2]?.y ?? trail[0].y} ${seg.slice(-1).join(' ')}`,
    };
  }

  const w = 360;
  const rowH = 118;
  const h = 150 + (n - 1) * rowH + 90;
  slots.forEach((s, i) => {
    const y = h - 90 - i * rowH;
    const x = i === n - 1 ? 92 : i % 2 === 0 ? 70 : 118;
    trail.push({ x, y });
    pins.push(s.side ? { x: 238, y: y - 12 } : { x, y });
  });
  const seg = segments(trail);
  return {
    w,
    h,
    trail,
    pins,
    pathDone: `M ${trail[0].x} ${trail[0].y} ${seg.slice(0, -1).join(' ')}`,
    pathNext: `M ${trail[n - 2]?.x ?? trail[0].x} ${trail[n - 2]?.y ?? trail[0].y} ${seg.slice(-1).join(' ')}`,
  };
}
