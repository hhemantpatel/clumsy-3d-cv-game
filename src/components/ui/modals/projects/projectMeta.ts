import type { Project } from '../../../../data/cvData';
import { UI } from '../../kit/theme';

/**
 * Derived "item" metadata for the Projects inventory. Everything is computed from a
 * project's tags (never hard-coded per project) so new entries in cvData slot in.
 */

export type CategoryId = 'ai' | 'systems' | 'vision' | 'science';

export interface ItemCategory {
  id: CategoryId;
  label: string;
  short: string;
  emoji: string;
  /** Ribbon / badge colour (white text sits on it). */
  color: string;
  /** Pale tint for the item badge background. */
  tint: string;
  /** Lower-case keywords matched against the start of words in each tag. */
  keywords: string[];
}

export const CATEGORIES: ItemCategory[] = [
  {
    id: 'ai',
    label: 'AI & ML',
    short: 'AI & ML',
    emoji: '🧠',
    color: UI.plum,
    tint: '#ece3f7',
    keywords: [
      'pytorch', 'tensorflow', 'machine learning', 'deep learning', 'reinforcement learning', 'resnet', 'mcts',
      'lstm', 'anfis', 'scikit-learn', 'sklearn', 'neural', 'llm', 'rag', 'yolo', 'transformer', 'gnn',
    ],
  },
  {
    id: 'systems',
    label: 'Rust & Systems',
    short: 'Systems',
    emoji: '🦀',
    color: UI.roof,
    tint: '#f8dfd6',
    keywords: ['rust', 'webassembly', 'wasm', 'c++', 'three.js', 'webgl', 'hpc', 'slurm', 'cuda'],
  },
  {
    id: 'vision',
    label: 'Vision',
    short: 'Vision',
    emoji: '📷',
    color: UI.skyDark,
    tint: '#d9eff9',
    keywords: ['computer vision', 'opencv', 'yolo', 'easyocr', 'ocr', 'image', 'vision-language'],
  },
  {
    id: 'science',
    label: 'Science',
    short: 'Science',
    emoji: '⚗️',
    color: UI.meadowDark,
    tint: '#e6efc9',
    keywords: [
      'chemistry', 'chemical', 'process modelling', 'process modeling', 'molecular dynamics', 'gromacs',
      'opls', 'dynamics', 'kinetics', 'reactor', 'thermodynamics',
    ],
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, ItemCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, ItemCategory>;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Keyword must start a word inside the tag ("yolo" matches "YOLOv8", "rag" does not match "storage"). */
const tagHits = (tag: string, keyword: string) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(keyword)}`, 'i').test(tag.toLowerCase());

export const categoryScore = (project: Project, category: ItemCategory) =>
  project.tags.filter((tag) => category.keywords.some((k) => tagHits(tag, k))).length;

export const inCategory = (project: Project, id: CategoryId | 'all') =>
  id === 'all' || categoryScore(project, CATEGORY_BY_ID[id]) > 0;

/** Ribbon priority when scores tie: the more specific trades win over the broad "AI" bucket. */
const TIE_ORDER: CategoryId[] = ['vision', 'systems', 'science', 'ai'];

export const primaryCategory = (project: Project): ItemCategory | null => {
  let best: ItemCategory | null = null;
  let bestScore = 0;
  for (const id of TIE_ORDER) {
    const score = categoryScore(project, CATEGORY_BY_ID[id]);
    if (score > bestScore) {
      best = CATEGORY_BY_ID[id];
      bestScore = score;
    }
  }
  return best;
};

export const FALLBACK_CATEGORY: Omit<ItemCategory, 'id' | 'keywords'> = {
  label: 'Build',
  short: 'Build',
  emoji: '🛠️',
  color: UI.woodDark,
  tint: UI.paperDeep,
};

/** First matching keyword wins, so the most characterful tags sit at the top. */
const ITEM_ICONS: [string, string][] = [
  ['mcts', '♟️'],
  ['molecular dynamics', '🧬'],
  ['gromacs', '🧬'],
  ['yolo', '🚘'],
  ['computer vision', '📷'],
  ['opencv', '📷'],
  ['process modelling', '🏭'],
  ['chemistry', '⚗️'],
  ['rust', '🦀'],
  ['webassembly', '⚙️'],
  ['three.js', '🧊'],
  ['reinforcement learning', '♟️'],
  ['pytorch', '🔥'],
  ['lstm', '🧠'],
  ['scikit-learn', '📈'],
  ['react', '⚛️'],
  ['python', '🐍'],
];

export const projectEmoji = (project: Project) => {
  for (const [keyword, emoji] of ITEM_ICONS) {
    if (project.tags.some((t) => tagHits(t, keyword))) return emoji;
  }
  return primaryCategory(project)?.emoji ?? FALLBACK_CATEGORY.emoji;
};
