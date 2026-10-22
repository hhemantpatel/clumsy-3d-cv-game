import React from 'react';
import { useGame } from '../../context/GameContext';
import { AutomatonGardenWindow } from './AutomatonGardenWindow';
import { AboutModal } from './modals/AboutModal';
import { ExperienceModal } from './modals/ExperienceModal';
import { ProjectsModal } from './modals/ProjectsModal';
import { SkillsModal } from './modals/SkillsModal';
import { ContactModal } from './modals/ContactModal';
import { CatModal } from './modals/CatModal';

/** Routes the active zone to its CV menu. Every menu is built on the cozy kit in ./kit. */
export const Modals: React.FC = () => {
  const { activeModal, closeModal } = useGame();

  if (!activeModal || activeModal === 'recruiter') return null;

  // The garden console floats over the live 3D farm, without a backdrop
  if (activeModal === 'badminton') {
    return <AutomatonGardenWindow onClose={closeModal} />;
  }

  return (
    <div className="game-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2b1d16]/45 backdrop-blur-[3px] overflow-y-auto">
      <div className="fixed inset-0" onClick={closeModal} aria-hidden />

      <div className="relative z-10 w-full flex items-center justify-center my-auto">
        {activeModal === 'about' && <AboutModal onClose={closeModal} />}
        {activeModal === 'experience' && <ExperienceModal onClose={closeModal} />}
        {activeModal === 'projects' && <ProjectsModal onClose={closeModal} />}
        {activeModal === 'skills' && <SkillsModal onClose={closeModal} />}
        {activeModal === 'contact' && <ContactModal onClose={closeModal} />}
        {activeModal === 'bed' && <CatModal onClose={closeModal} />}
      </div>
    </div>
  );
};
