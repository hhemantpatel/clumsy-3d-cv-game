// Cozy storybook UI theme — matches the toon-shaded 3D world (cream picket fence,
// warm wood, meadow greens, dark-brown ink outlines) and the in-world HUD / zone prompts.
// Every modal should build from these tokens + the GameModal frame in ./GameModal.

export const UI = {
  ink: '#2b1d16', // outline colour, same as the character's toon outline
  inkSoft: '#5c4033',
  paper: '#fffaf0',
  paperDeep: '#f6ecd6',
  cream: '#f4ead2',
  wood: '#9a6a43',
  woodDark: '#6b4730',
  woodLight: '#c49563',
  amber: '#d97706',
  amberDark: '#92400e',
  amberLight: '#fde68a',
  meadow: '#5f9a45',
  meadowDark: '#355f25',
  meadowLight: '#c5d77a',
  sky: '#7cc4e4',
  skyDark: '#2b6f8f',
  berry: '#c43a4c',
  roof: '#b1503d',
  plum: '#7c5ba6',
} as const;

/** Tailwind class fragments shared by every menu. Only Tailwind 3.4 classes / arbitrary values. */
export const tw = {
  // Thick ink outline + hard offset "toon" drop shadow
  card: 'bg-[#fffaf0] border-[3px] border-[#2b1d16] rounded-[22px] shadow-[0_6px_0_0_#2b1d16]',
  cardSoft: 'bg-[#fffaf0] border-2 border-[#2b1d16]/80 rounded-2xl shadow-[0_3px_0_0_rgba(43,29,22,0.8)]',
  inset: 'bg-[#f6ecd6] border-2 border-[#2b1d16]/15 rounded-2xl',
  // Chunky pressable button
  btn: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-sm border-2 border-[#2b1d16] shadow-[0_3px_0_0_#2b1d16] active:translate-y-[3px] active:shadow-none transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]',
  btnPrimary: 'bg-[#d97706] text-white',
  btnGreen: 'bg-[#5f9a45] text-white',
  btnSky: 'bg-[#7cc4e4] text-[#2b1d16]',
  btnPaper: 'bg-[#fffaf0] text-[#2b1d16]',
  chip: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-[#2b1d16] border-2 border-[#2b1d16]/70',
  heading: 'font-game font-black text-[#2b1d16] tracking-tight',
  body: 'text-[#4a3426] text-sm leading-relaxed',
  label: 'text-xs font-black uppercase tracking-[0.14em] text-[#9a6a43]',
} as const;
