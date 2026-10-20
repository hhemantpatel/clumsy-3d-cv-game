import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ModalType } from '../../types/game';

export const MobileControls: React.FC = () => {
  const { setMoveInput, nearbyZone, openModal, activeModal, hasStarted } = useGame();
  const [touchActive, setTouchActive] = useState<boolean>(false);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    touchOrigin.current = { x: touch.clientX, y: touch.clientY };
    setTouchActive(true);
    setKnobPos({ x: 0, y: 0 });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchId.current) {
        const dx = touch.clientX - touchOrigin.current.x;
        const dy = touch.clientY - touchOrigin.current.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;

        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);
        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;

        setKnobPos({ x: kx, y: ky });

        // Normalize movement vector: X and Z (where dy maps to Z forward/back)
        const normX = kx / maxRadius;
        const normZ = ky / maxRadius;
        setMoveInput({ x: normX, z: normZ });
        break;
      }
    }
  }, [setMoveInput]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchId.current) {
        touchId.current = null;
        setTouchActive(false);
        setKnobPos({ x: 0, y: 0 });
        setMoveInput({ x: 0, z: 0 });
        break;
      }
    }
  }, [setMoveInput]);

  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  // Cancel touch input if modal opens
  useEffect(() => {
    if (activeModal) {
      touchId.current = null;
      setTouchActive(false);
      setKnobPos({ x: 0, y: 0 });
      setMoveInput({ x: 0, z: 0 });
    }
  }, [activeModal, setMoveInput]);

  // Don't render mobile controls when not started or when a modal is open
  if (!hasStarted || activeModal) return null;

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 p-6 pointer-events-none flex items-end justify-between select-none">
      {/* Virtual Joystick Base */}
      <div
        onTouchStart={handleTouchStart}
        className="pointer-events-auto w-28 h-28 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/60 shadow-xl flex items-center justify-center relative touch-none"
      >
        {/* Joystick Stick / Knob */}
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 border border-indigo-300 shadow-md transform transition-transform ${
            touchActive ? 'scale-95' : 'scale-100'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action / Inspect Button for mobile */}
      {nearbyZone && (
        <button
          onClick={() => openModal(nearbyZone as ModalType)}
          className="pointer-events-auto w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-300 text-white font-bold text-sm shadow-2xl flex flex-col items-center justify-center animate-bounce active:scale-90 transition-transform"
        >
          <span className="text-lg">✨</span>
          <span className="text-[10px] tracking-wider uppercase">Open</span>
        </button>
      )}
    </div>
  );
};
