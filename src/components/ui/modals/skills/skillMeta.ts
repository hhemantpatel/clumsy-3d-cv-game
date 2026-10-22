import { Code2, Cpu, Layout, Wrench, Server, Database, Sparkles, type LucideIcon } from 'lucide-react';
import { cvData } from '../../../../data/cvData';
import { UI } from '../../kit/theme';

export const MAX_PIPS = 5;

/**
 * Raw 0-100 levels are self-assessed and cluster high, so they are bucketed into
 * pips + tier words instead of being shown as percentages.
 */
export const levelToPips = (level: number) => {
  if (level >= 90) return 5;
  if (level >= 80) return 4;
  if (level >= 70) return 3;
  if (level >= 55) return 2;
  return 1;
};

export const TIERS = [
  { pips: 5, name: 'Master', blurb: 'Ships production work with it and teaches it to others.' },
  { pips: 4, name: 'Expert', blurb: 'Builds complete projects with it independently.' },
  { pips: 3, name: 'Adept', blurb: 'Comfortable on real tasks, still levelling up.' },
  { pips: 2, name: 'Novice', blurb: 'Has used it on smaller builds.' },
] as const;

export const tierFor = (level: number) => {
  const pips = levelToPips(level);
  return TIERS.find((t) => pips >= t.pips) ?? TIERS[TIERS.length - 1];
};

/** Branch palette: [main, pale tint]. Cycles if more categories are added. */
const BRANCH_COLORS: [string, string][] = [
  [UI.amber, '#fdf0cf'],
  [UI.plum, '#ece3f7'],
  [UI.skyDark, '#d9eff9'],
  [UI.meadowDark, '#e6efc9'],
  [UI.roof, '#f8dfd6'],
];
export const branchColor = (i: number) => BRANCH_COLORS[i % BRANCH_COLORS.length];

const BRANCH_ICONS: Record<string, LucideIcon> = { Code2, Cpu, Layout, Wrench, Server, Database };
export const branchIcon = (iconName: string): LucideIcon => BRANCH_ICONS[iconName] ?? Sparkles;

/** Emoji (or short text glyph) for a skill node, matched on keywords in its name. */
const GLYPHS: [RegExp, string][] = [
  [/python/i, '🐍'],
  [/rust/i, '🦀'],
  [/^c\s*\/\s*c\+\+|\bc\+\+/i, 'C++'],
  [/typescript/i, 'TS'],
  [/sql|postgres|mysql/i, '🗄️'],
  [/pytorch|deep learning/i, '🔥'],
  [/\brag\b|\bllm/i, '💬'],
  [/vision|yolo|opencv/i, '👁️'],
  [/scikit|scipy/i, '📈'],
  [/reinforcement|mcts/i, '♟️'],
  [/react three|three\.js/i, '🧊'],
  [/react/i, '⚛️'],
  [/webassembly|wasm/i, '⚙️'],
  [/tailwind|css/i, '🎨'],
  [/rest|api|sse/i, '📡'],
  [/docker|container/i, '🐳'],
  [/linux|shell/i, '🐧'],
  [/git\b/i, '🌿'],
  [/gromacs|slurm|hpc/i, '🧪'],
  [/aspen|hysys/i, '🏭'],
];

export const skillGlyph = (name: string): { text: string; isEmoji: boolean } => {
  for (const [re, glyph] of GLYPHS) {
    if (re.test(name)) return { text: glyph, isEmoji: !/^[A-Za-z+#]+$/.test(glyph) };
  }
  const initials = name
    .replace(/\(.*?\)/g, '')
    .split(/[\s/&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return { text: initials || '★', isEmoji: false };
};

/** Split "Computer Vision (YOLOv8, OpenCV)" into ["computer vision", "yolov8", "opencv"]. */
const skillTerms = (name: string) =>
  name
    .split(/[/&,()]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 1);

/** Where a skill was actually used: projects (by tag) and timeline entries (by skill list). */
export const skillEvidence = (name: string): string[] => {
  const terms = skillTerms(name);
  const hit = (label: string) => terms.includes(label.trim().toLowerCase());
  const projects = cvData.projects.filter((p) => p.tags.some(hit)).map((p) => p.title);
  const roles = cvData.timeline
    .filter((t) => t.skills.some(hit))
    .map((t) => t.company.match(/\(([^)]+)\)/)?.[1] ?? t.company);
  return [...roles, ...projects];
};
