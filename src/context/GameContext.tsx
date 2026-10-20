import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { GameContextType, ModalType } from '../types/game';
import { soundManager } from '../utils/audio';

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isInsideHouse, setIsInsideHouse] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [nearbyZone, setNearbyZone] = useState<string | null>(null);
  const [moveInput, setMoveInput] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [teleportTarget, setTeleportTarget] = useState<'spawn' | 'desk' | null>(null);

  const startGame = useCallback(() => {
    setHasStarted(true);
    soundManager.unlock();
    soundManager.playInteract();
  }, []);

  const openModal = useCallback((type: ModalType) => {
    setActiveModal(type);
    if (type) {
      soundManager.playInteract();
    }
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const toggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const unlockAudio = useCallback(() => {
    soundManager.unlock();
  }, []);

  const triggerTeleport = useCallback((target: 'spawn' | 'desk') => {
    setTeleportTarget(target);
  }, []);

  const clearTeleport = useCallback(() => {
    setTeleportTarget(null);
  }, []);

  // Keyboard shortcut for closing modal with Escape, or inspecting with 'E'
  useEffect(() => {
    (window as any).__openModal = openModal;
    (window as any).__closeModal = closeModal;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      if (!hasStarted && (e.key === 'Enter' || e.key === ' ')) {
        startGame();
        return;
      }
      if (e.key === 'Escape' && activeModal) {
        closeModal();
      } else if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && nearbyZone && !activeModal) {
        openModal(nearbyZone as ModalType);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, startGame, activeModal, nearbyZone, openModal, closeModal]);

  const contextValue = useMemo(
    () => ({
      hasStarted,
      startGame,
      activeModal,
      openModal,
      closeModal,
      isInsideHouse,
      setIsInsideHouse,
      isMuted,
      toggleMute,
      unlockAudio,
      nearbyZone,
      setNearbyZone,
      moveInput,
      setMoveInput,
      teleportTarget,
      triggerTeleport,
      clearTeleport,
    }),
    [
      hasStarted,
      startGame,
      activeModal,
      openModal,
      closeModal,
      isInsideHouse,
      setIsInsideHouse,
      isMuted,
      toggleMute,
      unlockAudio,
      nearbyZone,
      setNearbyZone,
      moveInput,
      setMoveInput,
      teleportTarget,
      triggerTeleport,
      clearTeleport,
    ]
  );

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
