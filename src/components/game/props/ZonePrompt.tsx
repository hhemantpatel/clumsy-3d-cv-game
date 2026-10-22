import React from 'react';
import { Html } from '@react-three/drei';
import { useGame } from '../../../context/GameContext';
import { ModalType } from '../../../types/game';
import type { V3 } from './kit';

interface ZonePromptProps {
  zone: Exclude<ModalType, null>;
  icon: string;
  label: string;
  position: V3;
}

/** Floating "E" interaction button shown while the player stands in a trigger zone. */
export const ZonePrompt: React.FC<ZonePromptProps> = ({ zone, icon, label, position }) => {
  const { nearbyZone, openModal, activeModal } = useGame();
  if (nearbyZone !== zone || activeModal) return null;
  return (
    <Html position={position} center distanceFactor={11}>
      <button
        onClick={() => openModal(zone)}
        className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
      >
        <span className="text-base">{icon}</span>
        <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">
          E
        </span>
        <span>{label}</span>
      </button>
    </Html>
  );
};
