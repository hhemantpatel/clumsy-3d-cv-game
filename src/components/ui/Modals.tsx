import React, { Suspense, lazy } from 'react';
import { useGame } from '../../context/GameContext';

const AutomatonGardenWindow = lazy(() =>
  import('./AutomatonGardenWindow').then((m) => ({ default: m.AutomatonGardenWindow }))
);
const AboutModal = lazy(() => import('./modals/AboutModal').then((m) => ({ default: m.AboutModal })));
const ExperienceModal = lazy(() => import('./modals/ExperienceModal').then((m) => ({ default: m.ExperienceModal })));
const ProjectsModal = lazy(() => import('./modals/ProjectsModal').then((m) => ({ default: m.ProjectsModal })));
const SkillsModal = lazy(() => import('./modals/SkillsModal').then((m) => ({ default: m.SkillsModal })));
const ContactModal = lazy(() => import('./modals/ContactModal').then((m) => ({ default: m.ContactModal })));
const CatModal = lazy(() => import('./modals/CatModal').then((m) => ({ default: m.CatModal })));
const RecruiterCVModal = lazy(() => import('./RecruiterCVModal').then((m) => ({ default: m.RecruiterCVModal })));

/** Routes the active zone to its CV menu. Every menu is lazily loaded on demand. */
export const Modals: React.FC = () => {
  const { activeModal, closeModal } = useGame();

  if (!activeModal) return null;

  // The garden console floats over the live 3D farm, without a backdrop
  if (activeModal === 'badminton') {
    return (
      <Suspense fallback={null}>
        <AutomatonGardenWindow onClose={closeModal} />
      </Suspense>
    );
  }

  // The full-page recruiter resume modal
  if (activeModal === 'recruiter') {
    return (
      <Suspense fallback={null}>
        <RecruiterCVModal />
      </Suspense>
    );
  }

  return (
    <div className="game-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2b1d16]/45 backdrop-blur-[3px] overflow-y-auto">
      <div className="fixed inset-0" onClick={closeModal} aria-hidden />

      <div className="relative z-10 w-full flex items-center justify-center my-auto">
        <Suspense fallback={null}>
          {activeModal === 'about' && <AboutModal onClose={closeModal} />}
          {activeModal === 'experience' && <ExperienceModal onClose={closeModal} />}
          {activeModal === 'projects' && <ProjectsModal onClose={closeModal} />}
          {activeModal === 'skills' && <SkillsModal onClose={closeModal} />}
          {activeModal === 'contact' && <ContactModal onClose={closeModal} />}
          {activeModal === 'bed' && <CatModal onClose={closeModal} />}
        </Suspense>
      </div>
    </div>
  );
};
