import React, { useId, useMemo } from 'react';
import { UI } from '../../kit/theme';
import { buildLayout, KIND_META, type MapLayout, type Stop } from './journey';

const INK = UI.ink;

/* ------------------------------------------------------------------ little drawings */

const Tree: React.FC<{ x: number; y: number; s?: number; tone?: string }> = ({ x, y, s = 1, tone = UI.meadow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-4} y={-4} width={8} height={18} rx={2} fill={UI.wood} stroke={INK} strokeWidth={2.5} />
    <path d="M0 -40 L20 -2 Q0 4 -20 -2 Z" fill={tone} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-7 -22 L-2 -30" stroke="#fff" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
  </g>
);

const Bush: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M-18 6 Q-22 -8 -9 -10 Q-4 -20 6 -14 Q18 -16 18 -2 Q22 6 14 8 Z"
      fill={UI.meadow}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  </g>
);

const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.9}>
    <path
      d="M-30 8 Q-36 -6 -20 -8 Q-16 -22 0 -18 Q12 -26 22 -12 Q36 -10 32 8 Z"
      fill="#fff"
      stroke={INK}
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
  </g>
);

/** The cottage from the yard — where the journey begins. */
const Cottage: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-22} y={-18} width={44} height={30} rx={3} fill={UI.cream} stroke={INK} strokeWidth={3} />
    <path d="M-28 -16 L0 -40 L28 -16 Z" fill={UI.roof} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <rect x={-6} y={-4} width={12} height={16} rx={2} fill={UI.wood} stroke={INK} strokeWidth={2.5} />
    <rect x={10} y={-10} width={8} height={8} rx={1} fill={UI.amberLight} stroke={INK} strokeWidth={2} />
    {/* picket fence */}
    {[-34, -28, 28, 34].map((fx) => (
      <path key={fx} d={`M${fx} 12 L${fx} 2 L${fx + 2} 0 L${fx + 4} 2 L${fx + 4} 12 Z`} fill={UI.paper} stroke={INK} strokeWidth={1.8} />
    ))}
  </g>
);

const Mountain: React.FC<{ x: number; y: number; s?: number; snow?: boolean }> = ({ x, y, s = 1, snow = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-110 0 L-20 -150 Q0 -170 20 -150 L110 0 Z" fill={UI.woodLight} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M0 -158 L30 -110 L60 0 L110 0 L20 -150 Z" fill={UI.wood} opacity={0.55} />
    {snow && (
      <path
        d="M-30 -133 L-20 -150 Q0 -170 20 -150 L32 -130 L18 -122 L6 -134 L-8 -120 Z"
        fill={UI.paper}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    )}
  </g>
);

const Compass: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={26} fill={UI.paper} stroke={INK} strokeWidth={3} />
    <path d="M0 -22 L6 0 L0 22 L-6 0 Z" fill={UI.berry} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    <path d="M0 0 L6 0 L0 22 Z" fill={UI.paperDeep} />
    <path d="M-22 0 L0 -5 L22 0 L0 5 Z" fill="none" stroke={INK} strokeWidth={1.5} />
    <circle r={3} fill={INK} />
  </g>
);

/* ------------------------------------------------------------------ scenery per orientation */

const WideScenery: React.FC = () => (
  <>
    <rect width={1000} height={510} fill={UI.paperDeep} />
    {/* rolling meadow patches */}
    <path d="M0 330 Q160 270 330 320 T640 300 T1000 330 L1000 510 L0 510 Z" fill={UI.meadowLight} stroke={INK} strokeOpacity={0.35} strokeWidth={3} />
    <path d="M0 420 Q200 380 420 430 T1000 420 L1000 510 L0 510 Z" fill="#b5cc68" stroke={INK} strokeOpacity={0.3} strokeWidth={3} />
    <path d="M0 200 Q120 150 260 190 Q360 220 470 180 L470 120 Q300 90 120 130 Q50 145 0 160 Z" fill={UI.meadowLight} opacity={0.6} />
    {/* back hills */}
    <path d="M560 210 Q640 120 720 190 Q770 140 820 200 Z" fill="#a9c86a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    {/* mountains */}
    <Mountain x={800} y={210} s={0.7} snow={false} />
    <Mountain x={915} y={215} s={1.15} />
    {/* summit flag */}
    <g transform="translate(915 30)">
      <path d="M0 0 L0 -26" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M0 -26 L18 -20 L0 -14 Z" fill={UI.berry} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
    {/* river with a plank bridge where the trail crosses */}
    <path
      d="M-10 115 C 160 140 300 190 430 235 S 640 330 760 360 S 920 420 1010 470"
      fill="none"
      stroke={INK}
      strokeWidth={26}
      strokeLinecap="round"
    />
    <path
      d="M-10 115 C 160 140 300 190 430 235 S 640 330 760 360 S 920 420 1010 470"
      fill="none"
      stroke={UI.sky}
      strokeWidth={20}
      strokeLinecap="round"
    />
    <path d="M60 128 q20 4 40 2 M300 196 q18 6 36 8 M680 342 q18 6 36 6" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.8} />
    <g transform="translate(505 248) rotate(-58)">
      <rect x={-26} y={-15} width={52} height={30} rx={4} fill={UI.woodLight} stroke={INK} strokeWidth={3} />
      {[-14, 0, 14].map((bx) => (
        <path key={bx} d={`M${bx} -15 L${bx} 15`} stroke={INK} strokeWidth={2} strokeOpacity={0.5} />
      ))}
    </g>
    {/* trees & bushes */}
    <Tree x={240} y={462} s={0.9} />
    <Tree x={264} y={476} s={0.7} tone={UI.meadowDark} />
    <Tree x={190} y={230} />
    <Tree x={214} y={246} s={0.75} tone={UI.meadowDark} />
    <Tree x={335} y={455} s={0.9} />
    <Tree x={520} y={150} s={0.8} />
    <Tree x={545} y={160} s={0.65} tone={UI.meadowDark} />
    <Tree x={700} y={455} s={0.95} />
    <Tree x={725} y={468} s={0.7} tone={UI.meadowDark} />
    <Tree x={860} y={340} s={0.8} />
    <Bush x={300} y={360} s={0.8} />
    <Bush x={655} y={250} s={0.7} />
    <Bush x={960} y={300} s={0.8} />
    <Bush x={470} y={470} s={0.7} />
    {/* home cottage at the trailhead */}
    <Cottage x={48} y={300} s={0.9} />
    {/* sky details */}
    <Cloud x={300} y={60} />
    <Cloud x={600} y={45} s={0.8} />
    <Compass x={60} y={60} />
  </>
);

const TallScenery: React.FC<{ h: number }> = ({ h }) => (
  <>
    <rect width={360} height={h} fill={UI.paperDeep} />
    <path d={`M0 ${h * 0.55} Q120 ${h * 0.5} 240 ${h * 0.56} T360 ${h * 0.54} L360 ${h} L0 ${h} Z`} fill={UI.meadowLight} stroke={INK} strokeOpacity={0.35} strokeWidth={3} />
    <path d={`M0 ${h * 0.82} Q160 ${h * 0.78} 360 ${h * 0.84} L360 ${h} L0 ${h} Z`} fill="#b5cc68" stroke={INK} strokeOpacity={0.3} strokeWidth={3} />
    <path d={`M0 ${h * 0.28} Q140 ${h * 0.24} 360 ${h * 0.3} L360 ${h * 0.4} Q180 ${h * 0.36} 0 ${h * 0.4} Z`} fill={UI.meadowLight} opacity={0.6} />
    <Mountain x={250} y={175} s={0.9} />
    <Mountain x={110} y={150} s={0.55} snow={false} />
    {/* river crossing the map */}
    <path d={`M-10 ${h * 0.44} C 100 ${h * 0.4} 220 ${h * 0.5} 370 ${h * 0.45}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d={`M-10 ${h * 0.44} C 100 ${h * 0.4} 220 ${h * 0.5} 370 ${h * 0.45}`} fill="none" stroke={UI.sky} strokeWidth={16} strokeLinecap="round" />
    <Tree x={335} y={h * 0.62} s={0.8} />
    <Tree x={320} y={h * 0.64} s={0.6} tone={UI.meadowDark} />
    <Tree x={22} y={h * 0.35} s={0.7} />
    <Tree x={335} y={h * 0.3} s={0.7} tone={UI.meadowDark} />
    <Bush x={22} y={h * 0.7} s={0.7} />
    <Bush x={338} y={h * 0.9} s={0.7} />
    <Cottage x={270} y={h - 30} s={0.85} />
    <Cloud x={50} y={40} s={0.7} />
    <Compass x={330} y={36} s={0.7} />
  </>
);

/* ------------------------------------------------------------------ avatar */

/** The player character: orange beanie + indigo hoodie, like the 3D toon model. */
export const TrailAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 44 52" width={40} height={48} className={className} aria-hidden>
    <ellipse cx={22} cy={50} rx={13} ry={2.5} fill={INK} opacity={0.25} />
    {/* hoodie */}
    <path d="M8 49 Q7 33 22 31 Q37 33 36 49 Z" fill="#4f46e5" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M17 33 Q22 39 27 33" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    <path d="M19 38 L19 44 M25 38 L25 44" stroke="#c7d2fe" strokeWidth={2} strokeLinecap="round" />
    {/* head */}
    <circle cx={22} cy={22} r={10} fill="#f2c39b" stroke={INK} strokeWidth={2.5} />
    <circle cx={18.5} cy={23.5} r={1.4} fill={INK} />
    <circle cx={25.5} cy={23.5} r={1.4} fill={INK} />
    <path d="M19.5 27.5 Q22 29.5 24.5 27.5" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
    {/* beanie */}
    <path d="M11.5 19 Q12 7 22 7 Q32 7 32.5 19 Z" fill="#f97316" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={10.5} y={16.5} width={23} height={5} rx={2.5} fill="#ea580c" stroke={INK} strokeWidth={2.2} />
    <circle cx={22} cy={5.5} r={3.5} fill="#fde68a" stroke={INK} strokeWidth={2.2} />
  </svg>
);

/* ------------------------------------------------------------------ the map */

interface TimeMapProps {
  orientation: 'wide' | 'tall';
  slots: Stop[];
  selected: number;
  onSelect: (i: number) => void;
  /** Number of real checkpoints (slots minus the future pin). */
  total: number;
  className?: string;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export const TimeMap: React.FC<TimeMapProps> = ({ orientation, slots, selected, onSelect, total, className = '' }) => {
  const layout: MapLayout = useMemo(() => buildLayout(slots, orientation), [slots, orientation]);
  const maskId = `trail-${useId().replace(/:/g, '')}`;
  const { w, h, trail, pins } = layout;
  const wide = orientation === 'wide';
  const sel = slots[selected];
  const selPin = pins[selected];
  const avatarLift = sel?.side ? 19 : 24;

  return (
    <div
      className={`relative w-full rounded-[18px] border-[3px] border-[#2b1d16] shadow-[0_4px_0_0_#2b1d16] bg-[#f6ecd6] ${className}`}
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[15px]" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full block" focusable="false">
        {wide ? <WideScenery /> : <TallScenery h={h} />}

        {/* side-quest spurs */}
        {slots.map((s, i) =>
          s.side ? (
            <path
              key={`spur-${s.key}`}
              d={`M ${trail[i].x} ${trail[i].y} Q ${(trail[i].x + pins[i].x) / 2 + (wide ? 18 : 0)} ${(trail[i].y + pins[i].y) / 2 + (wide ? 0 : 14)} ${pins[i].x} ${pins[i].y}`}
              fill="none"
              stroke={UI.plum}
              strokeWidth={4}
              strokeDasharray="2 9"
              strokeLinecap="round"
            />
          ) : null
        )}

        {/* the trail, drawn in on open */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <path
            d={`${layout.pathDone} ${layout.pathNext.replace(/^M [^C]+/, '')}`}
            pathLength={1000}
            className="game-draw-path"
            style={{ ['--path-length' as string]: 1000 } as React.CSSProperties}
            fill="none"
            stroke="#fff"
            strokeWidth={40}
            strokeLinecap="round"
          />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d={layout.pathDone} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={22} strokeLinecap="round" />
          <path d={layout.pathDone} fill="none" stroke="#ecd6a6" strokeWidth={16} strokeLinecap="round" />
          <path d={layout.pathDone} fill="none" stroke={UI.woodDark} strokeWidth={5} strokeDasharray="2 13" strokeLinecap="round" />
          <path d={layout.pathNext} fill="none" stroke={UI.woodDark} strokeOpacity={0.5} strokeWidth={4} strokeDasharray="1 12" strokeLinecap="round" />
        </g>
        {/* trailhead "X" */}
        <path
          d={`M ${trail[0].x - 34} ${trail[0].y - 8} l 12 12 m 0 -12 l -12 12`}
          stroke={UI.berry}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </svg>
      </div>

      {/* pins (real buttons, so they stay crisp, focusable and readable at any size) */}
      {slots.map((s, i) => {
        const meta = KIND_META[s.kind];
        const isSel = i === selected;
        const future = s.kind === 'future';
        const size = s.side ? 'w-[38px] h-[38px] text-lg' : 'w-12 h-12 text-2xl';
        const labelPos = !wide && !s.side ? 'left-full top-1/2 -translate-y-1/2 ml-2 text-left' : 'top-full left-1/2 -translate-x-1/2 mt-1.5 text-center';
        const ariaLabel = future
          ? `${s.role} ${s.org}`
          : `Checkpoint ${i + 1} of ${total}${s.side ? ' (side quest)' : ''}: ${s.role}, ${s.org}, ${s.period}`;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={ariaLabel}
            aria-current={isSel ? 'step' : undefined}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none"
            style={{ left: pct(pins[i].x, w), top: pct(pins[i].y, h) }}
          >
            <span
              className={`relative flex items-center justify-center rounded-full border-[3px] transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:ring-4 group-focus-visible:ring-[#fde68a] ${size} ${
                future ? 'border-dashed border-[#2b1d16]/60 opacity-75' : 'border-[#2b1d16]'
              } ${isSel ? 'scale-110 shadow-[0_0_0_4px_#fde68a,0_4px_0_0_#2b1d16]' : 'shadow-[0_3px_0_0_#2b1d16]'}`}
              style={{ backgroundColor: meta.color }}
            >
              <span aria-hidden className={future ? 'font-black text-[#5c4033]' : ''}>
                {future ? '?' : meta.emoji}
              </span>
              {!future && !s.ongoing && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[#5f9a45] border-2 border-[#2b1d16] text-white text-[10px] leading-none font-black flex items-center justify-center"
                >
                  ✓
                </span>
              )}
            </span>
            <span
              aria-hidden
              className={`absolute ${labelPos} w-max max-w-[7.5rem] px-1.5 py-0.5 rounded-lg bg-[#fffaf0]/90 border-2 leading-tight pointer-events-none ${
                isSel ? 'border-[#2b1d16]' : 'border-[#2b1d16]/20'
              }`}
            >
              <span className="block text-[12px] font-black text-[#2b1d16]">{s.startYear || s.period}</span>
              <span className={`block text-[12px] font-bold ${future ? 'text-[#9a6a43] italic' : 'text-[#5c4033]'}`}>{s.short}</span>
            </span>
          </button>
        );
      })}

      {/* "you are here" avatar walks to the selected checkpoint */}
      {selPin && (
        <div
          className="absolute z-20 pointer-events-none transition-[left,top] duration-700 ease-in-out motion-reduce:transition-none"
          style={{
            left: pct(selPin.x, w),
            top: pct(selPin.y, h),
            transform: `translate(-50%, calc(-100% - ${avatarLift + 4}px))`,
          }}
          aria-hidden
        >
          <div className="game-float flex flex-col items-center">
            <span className="hidden sm:inline mb-0.5 px-1.5 rounded-md bg-[#2b1d16] text-[#fde68a] text-[12px] font-black whitespace-nowrap">You are here</span>
            <TrailAvatar />
          </div>
        </div>
      )}
    </div>
  );
};
