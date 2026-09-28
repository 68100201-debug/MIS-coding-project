import React, { useState, useEffect } from 'react';
import { UserProgress, GameState } from './types/game';
import { loadUserProgress, saveUserProgress } from './utils/storage';
import { SHIP_SKINS } from './data/skins';
import { HangarView } from './components/HangarView';
import { GameCanvas } from './components/GameCanvas';
import { LevelSelectModal } from './components/LevelSelectModal';
import { sound } from './utils/audio';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const [gameState, setGameState] = useState<GameState>('HANGAR');
  const [activeSector, setActiveSector] = useState<number>(1);
  const [showSectorModal, setShowSectorModal] = useState<boolean>(false);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(false);

  // Auto-save user progress changes
  useEffect(() => {
    saveUserProgress(progress);
  }, [progress]);

  // Sync initial sound/music states
  useEffect(() => {
    sound.setSoundEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  const handleUpdateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => updater(prev));
  };

  const handleLaunchSector = (sectorNum: number) => {
    if (!hasStartedAudio && progress.musicEnabled) {
      sound.setMusicEnabled(true);
      setHasStartedAudio(true);
    }
    setActiveSector(sectorNum);
    setShowSectorModal(false);
    setGameState('PLAYING');
  };

  const handleReturnToHangar = () => {
    setGameState('HANGAR');
  };

  // Find currently equipped skin object
  const equippedSkin =
    SHIP_SKINS.find((s) => s.id === progress.selectedSkinId) || SHIP_SKINS[0];

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-body">
      {gameState === 'HANGAR' && (
        <HangarView
          progress={progress}
          onLaunch={handleLaunchSector}
          onOpenSectorMap={() => setShowSectorModal(true)}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameCanvas
          progress={progress}
          sectorNumber={activeSector}
          equippedSkin={equippedSkin}
          onUpdateProgress={handleUpdateProgress}
          onReturnToHangar={handleReturnToHangar}
          onLaunchSector={handleLaunchSector}
        />
      )}

      {/* Level Select Modal */}
      {showSectorModal && (
        <LevelSelectModal
          highestSectorUnlocked={progress.highestSectorUnlocked}
          sectorHighScores={progress.sectorHighScores}
          selectedSector={activeSector}
          onSelectSector={(sec) => setActiveSector(sec)}
          onLaunch={(sec) => handleLaunchSector(sec)}
          onClose={() => setShowSectorModal(false)}
        />
      )}
    </div>
  );
}
