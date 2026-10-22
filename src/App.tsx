import React from 'react';
import { GameProvider } from './context/GameContext';
import { GardenProvider } from './context/GardenContext';
import { GameCanvas } from './components/game/GameCanvas';
import { HUD } from './components/ui/HUD';
import { StartScreen } from './components/ui/StartScreen';
import { Modals } from './components/ui/Modals';
import { MobileControls } from './components/ui/MobileControls';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GardenProvider>
          <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-game">
            {/* 3D World Viewport */}
            <GameCanvas />

            {/* UI Overlay Systems */}
            <StartScreen />
            <HUD />
            <Modals />
            <MobileControls />
          </div>
        </GardenProvider>
      </GameProvider>
    </ErrorBoundary>
  );
};

export default App;
