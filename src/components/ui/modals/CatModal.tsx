import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameModal } from '../kit/GameModal';
import { tw, UI } from '../kit/theme';
import { ByteCat, type CatPose } from './cat/ByteCat';

/** Component-scoped keyframes (index.css belongs to the shared kit). */
const CAT_CSS = `
@keyframes cat-heart-rise {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-90px) scale(1.15); opacity: 0; }
}
.cat-heart { animation: cat-heart-rise 1.4s ease-out both; }
@keyframes cat-yarn-roll {
  0% { transform: translateX(-150px) rotate(0deg); }
  55% { transform: translateX(10px) rotate(520deg); }
  75% { transform: translateX(-6px) rotate(470deg); }
  100% { transform: translateX(0) rotate(500deg); }
}
.cat-yarn { animation: cat-yarn-roll 1.3s cubic-bezier(0.3, 0.7, 0.4, 1) both; }
@keyframes cat-treat-drop {
  0% { transform: translateY(-70px) rotate(-30deg); opacity: 0; }
  25% { opacity: 1; }
  60% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(4px) scale(0.2); opacity: 0; }
}
.cat-treat { animation: cat-treat-drop 1.3s ease-in both; }
@keyframes cat-pounce {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px) rotate(-3deg); }
  60% { transform: translateY(0) rotate(2deg); }
}
.cat-pounce { animation: cat-pounce 0.6s ease-out 2; }
@keyframes cat-tail-swish { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-10deg); } }
.cat-tail { transform-origin: 176px 132px; animation: cat-tail-swish 2.4s ease-in-out infinite; }
.cat-tail-fast .cat-tail { animation-duration: 0.6s; }
@media (prefers-reduced-motion: reduce) {
  .cat-heart, .cat-yarn, .cat-treat, .cat-pounce, .cat-tail { animation: none; }
}
`;

const MAX = 100;
const START = 55;
const DECAY_EVERY_MS = 3000;
const REACTION_MS = 1400;

type Action = Exclude<CatPose, 'idle'>;

const ACTIONS: { id: Action; emoji: string; label: string; gain: number; style: string }[] = [
  { id: 'pet', emoji: '✋', label: 'Pet', gain: 8, style: tw.btnPrimary },
  { id: 'treat', emoji: '🐟', label: 'Treat', gain: 15, style: tw.btnSky },
  { id: 'yarn', emoji: '🧶', label: 'Yarn', gain: 10, style: tw.btnGreen },
];

const LINES: Record<Action, string[]> = {
  pet: ['Purrrr… Byte leans into the scritches.', 'Slow blink. That means “I love you” in cat.', 'Byte kneads the cushion like it is bread dough.'],
  treat: ['Nom! A salmon treat vanishes instantly.', 'Crunch crunch. Byte looks at you for another.', 'Treat accepted. Code review approved.'],
  yarn: ['Pounce! The yarn ball never stood a chance.', 'Byte bats the yarn and pretends it was an accident.', 'Zoomies! The yarn is now a tangled mess.'],
};

const mood = (h: number): { face: string; text: string } => {
  if (h >= 95) return { face: '😻', text: 'Pure bliss — purring like a tiny engine' };
  if (h >= 70) return { face: '😸', text: 'Content and cozy' };
  if (h >= 45) return { face: '🐱', text: 'Curious, one ear twitching' };
  if (h >= 20) return { face: '😿', text: 'A little bored… play with me?' };
  return { face: '😾', text: 'Grumpy loaf. Needs attention.' };
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const CatModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [happiness, setHappiness] = useState(START);
  const [pose, setPose] = useState<CatPose>('idle');
  const [reactionKey, setReactionKey] = useState(0);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [log, setLog] = useState('Byte is napping on the cushion. Say hi!');
  const [milestones, setMilestones] = useState(0);

  const timers = useRef(new Set<number>());
  const treatTimes = useRef<number[]>([]);
  const confettiArmed = useRef(true);
  const heartId = useRef(0);
  const lineIdx = useRef<Record<Action, number>>({ pet: 0, treat: 0, yarn: 0 });

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  // Clean every pending timeout on unmount.
  useEffect(() => {
    const set = timers.current;
    return () => set.forEach((id) => window.clearTimeout(id));
  }, []);

  // Happiness slowly drains over time.
  useEffect(() => {
    const id = window.setInterval(() => setHappiness((h) => Math.max(0, h - 1)), DECAY_EVERY_MS);
    return () => window.clearInterval(id);
  }, []);

  // Confetti only when the meter fills up; re-arms once it drops well below.
  useEffect(() => {
    if (happiness >= MAX && confettiArmed.current) {
      confettiArmed.current = false;
      setMilestones((m) => m + 1);
      setLog('MAX HAPPINESS! Byte rolls over and shows the belly. (It is a trap.)');
      if (!prefersReducedMotion()) {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors: [UI.amber, UI.meadow, UI.sky, UI.berry, UI.amberLight] });
      }
    } else if (happiness < 80) {
      confettiArmed.current = true;
    }
  }, [happiness]);

  const act = (a: (typeof ACTIONS)[number]) => {
    let gain = a.gain;
    let line: string;

    if (a.id === 'treat') {
      const now = Date.now();
      treatTimes.current = treatTimes.current.filter((t) => now - t < 20000);
      if (treatTimes.current.length >= 3) {
        gain = 0;
        line = 'Byte sniffs the treat and walks away. Too full — try some play instead!';
      } else {
        treatTimes.current.push(now);
        line = LINES.treat[lineIdx.current.treat++ % LINES.treat.length];
      }
    } else {
      line = LINES[a.id][lineIdx.current[a.id]++ % LINES[a.id].length];
    }

    setHappiness((h) => Math.min(MAX, h + gain));
    setLog(line);
    setPose(a.id);
    setReactionKey((k) => k + 1);

    if (gain > 0) {
      const newHearts = Array.from({ length: a.id === 'pet' ? 3 : 2 }, () => ({
        id: ++heartId.current,
        x: 25 + Math.random() * 50,
      }));
      setHearts((hs) => [...hs, ...newHearts]);
      const ids = new Set(newHearts.map((h) => h.id));
      later(() => setHearts((hs) => hs.filter((h) => !ids.has(h.id))), 1500);
    }

    later(() => setPose((p) => (p === a.id ? 'idle' : p)), REACTION_MS);
  };

  const m = mood(happiness);
  const grumpy = happiness < 20;
  const meterColor = happiness >= 70 ? UI.meadow : happiness >= 35 ? UI.amber : UI.berry;

  return (
    <GameModal
      onClose={onClose}
      icon="🐈"
      kicker="Cottage companion"
      title="Byte’s cozy corner"
      subtitle="Head of naps, chief code reviewer"
      accent={UI.amberLight}
      width="max-w-xl"
    >
      <style>{CAT_CSS}</style>
      <div className="space-y-4">
        {/* ---------- Stage ---------- */}
        <div
          className={`${tw.card} relative overflow-hidden h-56 sm:h-64`}
          style={{ background: `linear-gradient(180deg, #fef3d6 0%, #fde7b8 68%, ${UI.woodLight} 68%, ${UI.wood} 100%)` }}
        >
          {/* window with sky */}
          <div aria-hidden className="absolute top-4 right-4 w-16 h-14 rounded-lg border-[3px] border-[#2b1d16] bg-[#7cc4e4] overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 h-[3px] bg-[#2b1d16]" />
            <div className="absolute inset-y-0 left-1/2 w-[3px] bg-[#2b1d16]" />
            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#fde68a]" />
          </div>
          <span aria-hidden className="absolute top-4 left-4 text-2xl game-float">🪴</span>

          {/* the cat */}
          <div
            key={`cat-${reactionKey}`}
            className={`absolute left-1/2 bottom-2 w-[240px] max-w-[85%] -translate-x-1/2 ${pose !== 'idle' ? 'cat-tail-fast' : ''}`}
          >
            <div className={pose === 'pet' ? 'game-wiggle' : pose === 'yarn' ? 'cat-pounce' : ''} style={pose === 'pet' ? { animationDuration: '0.35s' } : undefined}>
              <ByteCat pose={pose} grumpy={grumpy && pose === 'idle'} className="w-full h-auto" />
            </div>
          </div>

          {/* reactions */}
          {pose === 'yarn' && (
            <span key={`yarn-${reactionKey}`} aria-hidden className="cat-yarn absolute bottom-3 left-[18%] text-3xl">
              🧶
            </span>
          )}
          {pose === 'treat' && (
            <span key={`treat-${reactionKey}`} aria-hidden className="cat-treat absolute bottom-[78px] left-[calc(50%-40px)] text-2xl">
              🐟
            </span>
          )}
          {hearts.map((h) => (
            <span key={h.id} aria-hidden className="cat-heart absolute bottom-[45%] text-2xl" style={{ left: `${h.x}%` }}>
              💕
            </span>
          ))}

          {milestones > 0 && (
            <span className={`${tw.chip} !text-xs absolute top-4 left-1/2 -translate-x-1/2 bg-[#fffaf0] text-[#2b1d16] whitespace-nowrap`}>
              🏆 Max happiness ×{milestones}
            </span>
          )}
        </div>

        {/* ---------- Meter + mood ---------- */}
        <div className={`${tw.inset} p-3`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span aria-hidden className="text-2xl">{m.face}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a43]">Happiness</p>
              <p className="text-sm font-bold text-[#2b1d16] leading-tight">{m.text}</p>
            </div>
            <span className="font-black text-[#2b1d16] tabular-nums">{happiness}%</span>
          </div>
          <div
            role="meter"
            aria-label="Byte's happiness"
            aria-valuemin={0}
            aria-valuemax={MAX}
            aria-valuenow={happiness}
            aria-valuetext={`${happiness}% — ${m.text}`}
            className="h-4 rounded-full bg-[#fffaf0] border-2 border-[#2b1d16] overflow-hidden"
          >
            <div
              className="h-full border-r-2 border-[#2b1d16] transition-[width,background-color] duration-500"
              style={{ width: `${happiness}%`, backgroundColor: meterColor, borderRightWidth: happiness === 0 ? 0 : undefined }}
            />
          </div>
          <p className="mt-2 text-[13px] text-[#5c4033] min-h-[2.5rem]" aria-live="polite">
            {log}
          </p>
        </div>

        {/* ---------- Actions ---------- */}
        <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Interact with Byte">
          {ACTIONS.map((a) => (
            <button key={a.id} type="button" onClick={() => act(a)} className={`${tw.btn} ${a.style} flex-col !gap-0.5 !py-2.5`}>
              <span aria-hidden className="text-2xl leading-none">{a.emoji}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-center text-[#9a6a43] font-semibold">
          Happiness slowly drifts down, so check back on Byte now and then. Fill the meter for a surprise!
        </p>
      </div>
    </GameModal>
  );
};

export default CatModal;
