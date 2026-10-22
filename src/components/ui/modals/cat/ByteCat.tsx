import React from 'react';
import { UI } from '../../kit/theme';

// Same palette as the sleeping 3D Byte on the bed (props/Bed.tsx).
const FUR = '#e8913a';
const FUR_DARK = '#c8702a';
const CREAM = '#f6e3c8';
const EAR_PINK = '#f2a3a8';

export type CatPose = 'idle' | 'pet' | 'treat' | 'yarn';

/** Byte, an orange tabby loaf on a cushion. Eyes open while eating/playing, happy-closed otherwise. */
export const ByteCat: React.FC<{ pose: CatPose; grumpy: boolean; className?: string }> = ({ pose, grumpy, className }) => {
  const eyesOpen = pose === 'treat' || pose === 'yarn';
  return (
    <svg viewBox="0 0 240 180" className={className} aria-hidden>
      <g stroke={UI.ink} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        {/* cushion */}
        <path d="M22 150 C22 128 52 124 120 124 C188 124 218 128 218 150 C218 170 188 174 120 174 C52 174 22 170 22 150 Z" fill={UI.plum} />
        <path d="M40 146 C80 156 160 156 200 146" fill="none" stroke="#5e4385" strokeWidth={3} />
        <circle cx="120" cy="150" r="5" fill={UI.amberLight} strokeWidth={3} />

        {/* tail */}
        <path className="cat-tail" d="M176 132 C206 128 214 104 200 92" fill="none" stroke={UI.ink} strokeWidth={16} />
        <path className="cat-tail" d="M176 132 C206 128 214 104 200 92" fill="none" stroke={FUR} strokeWidth={9} />

        {/* body loaf */}
        <path d="M60 138 C56 96 86 80 128 80 C170 80 190 100 186 138 Z" fill={FUR} />
        <path d="M118 84 C116 96 116 106 118 114 M140 82 C140 94 140 104 138 112 M160 88 C158 98 158 106 158 112" fill="none" stroke={FUR_DARK} strokeWidth={5} />
        {/* paws */}
        <ellipse cx="82" cy="138" rx="14" ry="8" fill={CREAM} />
        <ellipse cx="110" cy="139" rx="14" ry="8" fill={CREAM} />

        {/* ears */}
        <path d="M48 66 L50 28 L80 48 Z" fill={FUR} />
        <path d="M140 66 L138 28 L108 48 Z" fill={FUR} />
        <path d="M55 56 L55 38 L70 48 Z" fill={EAR_PINK} strokeWidth={2.5} />
        <path d="M133 56 L133 38 L118 48 Z" fill={EAR_PINK} strokeWidth={2.5} />

        {/* head */}
        <ellipse cx="94" cy="80" rx="52" ry="42" fill={FUR} />
        <path d="M84 42 L86 54 M96 40 L96 54 M108 42 L106 54" fill="none" stroke={FUR_DARK} strokeWidth={4} />
        {/* muzzle */}
        <ellipse cx="94" cy="96" rx="22" ry="15" fill={CREAM} />
      </g>

      {/* eyes */}
      {eyesOpen ? (
        <g>
          <ellipse cx="74" cy="78" rx="7" ry="9" fill={UI.ink} />
          <ellipse cx="114" cy="78" rx="7" ry="9" fill={UI.ink} />
          <circle cx="76" cy="75" r="2.5" fill="#fff" />
          <circle cx="116" cy="75" r="2.5" fill="#fff" />
        </g>
      ) : grumpy ? (
        <g stroke={UI.ink} strokeWidth={4} strokeLinecap="round">
          <path d="M66 78 L82 80" />
          <path d="M106 80 L122 78" />
        </g>
      ) : (
        <g fill="none" stroke={UI.ink} strokeWidth={4} strokeLinecap="round">
          <path d="M66 80 C70 73 78 73 82 80" />
          <path d="M106 80 C110 73 118 73 122 80" />
        </g>
      )}

      {/* blush */}
      <ellipse cx="62" cy="94" rx="7" ry="4" fill="#e5806b" opacity={grumpy ? 0 : 0.5} />
      <ellipse cx="126" cy="94" rx="7" ry="4" fill="#e5806b" opacity={grumpy ? 0 : 0.5} />

      {/* nose + mouth */}
      <path d="M89 89 L99 89 L94 95 Z" fill="#e88a9a" stroke={UI.ink} strokeWidth={2.5} strokeLinejoin="round" />
      {pose === 'treat' ? (
        <ellipse cx="94" cy="103" rx="6" ry="5" fill="#8a3b3b" stroke={UI.ink} strokeWidth={2.5} />
      ) : (
        <path
          d={grumpy ? 'M86 104 C90 100 98 100 102 104' : 'M94 95 C94 101 88 103 85 100 M94 95 C94 101 100 103 103 100'}
          fill="none"
          stroke={UI.ink}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {/* whiskers */}
      <g stroke={UI.ink} strokeWidth={2} strokeLinecap="round" opacity={0.7}>
        <path d="M70 96 L44 92 M70 101 L46 104" />
        <path d="M118 96 L144 92 M118 101 L142 104" />
      </g>
    </svg>
  );
};
