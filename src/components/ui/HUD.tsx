import React from 'react';
import { useGame } from '../../context/GameContext';
import { Volume2, VolumeX, FileText, Home, Compass, MapPin, RotateCcw, Video } from 'lucide-react';

export const HUD: React.FC = () => {
  const {
    openModal,
    activeModal,
    isMuted,
    toggleMute,
    unlockAudio,
    isInsideHouse,
    triggerTeleport,
    hasStarted,
  } = useGame();

  // Hide HUD if game has not started, or if a modal is open (prevents background clutter)
  if (!hasStarted || activeModal) return null;

  const handleMuteClick = () => {
    unlockAudio();
    toggleMute();
  };

  const handleResetCamera = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-sans animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full">
        {/* Player Identity Plaque (Warm Cozy Game Style) */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl border-2 border-[#d97706]/40 shadow-md text-[#451a03]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 border border-amber-800 shadow-xs flex items-center justify-center text-base shrink-0">
            🧑‍💻
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-[#451a03] font-serif text-sm tracking-tight">Hemant Patel</h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                Rust ⚡
              </span>
            </div>
            <p className="text-[11px] text-[#78350f] font-medium leading-none">IIT Jodhpur • AI & Software</p>
          </div>
        </div>

        {/* Action Controls Tray */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Quick Travel Segments */}
          <div className="hidden sm:flex items-center bg-[#fffdfa]/95 backdrop-blur-sm p-1 rounded-xl border-2 border-[#d97706]/40 shadow-md text-xs font-bold text-[#78350f]">
            <button
              onClick={() => triggerTeleport('spawn')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                !isInsideHouse ? 'bg-[#fef3c7] text-[#92400e] shadow-xs' : 'hover:bg-[#faf5eb]'
              }`}
              title="Teleport to Yard Garden"
            >
              <Compass className="w-3.5 h-3.5 text-[#16a34a]" />
              <span>Yard</span>
            </button>
            <button
              onClick={() => triggerTeleport('desk')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                isInsideHouse ? 'bg-[#fef3c7] text-[#92400e] shadow-xs' : 'hover:bg-[#faf5eb]'
              }`}
              title="Teleport to Work Desk"
            >
              <Home className="w-3.5 h-3.5 text-[#b45309]" />
              <span>Desk</span>
            </button>
          </div>

          {/* Reset Camera View Button */}
          <button
            onClick={handleResetCamera}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#fffdfa]/95 hover:bg-[#faf5eb] backdrop-blur-sm border-2 border-[#d97706]/40 text-[#78350f] shadow-md text-xs font-bold transition cursor-pointer"
            title="Reset Camera View [R]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#b45309]" />
            <span>Reset</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleMuteClick}
            className="p-2 rounded-xl bg-[#fffdfa]/95 hover:bg-[#faf5eb] backdrop-blur-sm border-2 border-[#d97706]/40 text-[#78350f] shadow-md transition cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#dc2626]" /> : <Volume2 className="w-4 h-4 text-[#16a34a]" />}
          </button>

          {/* Recruiter Mode Button (Airmail / Postal Seal Style) */}
          <button
            onClick={() => openModal('recruiter')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs shadow-md border-b-2 border-[#991b1b] active:border-b-0 active:translate-y-0.5 transition cursor-pointer"
            title="Open 2D Printable CV"
          >
            <FileText className="w-3.5 h-3.5 text-amber-200" />
            <span>2D CV</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls / Location Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
        {/* Current Location Badge (Wooden Trail Marker Style) */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#fffdfa]/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border-2 border-[#d97706]/40 text-xs font-medium text-[#451a03] shadow-md font-serif">
          <MapPin className="w-3.5 h-3.5 text-[#d97706]" />
          <span className="text-[#78350f]">Location:</span>
          <span className="font-black text-[#451a03]">
            {isInsideHouse ? 'Work Studio (Desk)' : 'Cottage Yard (Garden)'}
          </span>
        </div>

        {/* Keyboard & 3D Camera Controls Bar (Lightweight Game Legend) */}
        <div className="hidden md:flex items-center gap-3 bg-[#fffdfa]/95 backdrop-blur-sm px-4 py-1.5 rounded-xl border-2 border-[#d97706]/40 text-xs text-[#78350f] shadow-md font-medium">
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] border border-[#fde68a] font-mono font-bold text-[10px] text-[#92400e]">W</span>
            <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] border border-[#fde68a] font-mono font-bold text-[10px] text-[#92400e]">A</span>
            <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] border border-[#fde68a] font-mono font-bold text-[10px] text-[#92400e]">S</span>
            <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] border border-[#fde68a] font-mono font-bold text-[10px] text-[#92400e]">D</span>
            <span className="ml-1 text-[11px] text-[#78350f]">Walk</span>
          </div>
          <div className="w-px h-3 bg-[#d97706]/30" />
          <div className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-[#b45309]" />
            <span className="text-[11px] text-[#78350f]">Orbit / Zoom</span>
          </div>
          <div className="w-px h-3 bg-[#d97706]/30" />
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] border border-[#fde68a] font-mono font-bold text-[10px] text-[#92400e]">E</span>
            <span className="text-[11px] text-[#78350f]">Interact</span>
          </div>
        </div>
      </div>
    </div>
  );
};
