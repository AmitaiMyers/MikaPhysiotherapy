import { useEffect, type ReactNode } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router';
import { BottomNav } from './components/BottomNav';
import { AboutPage } from './pages/AboutPage';
import { BoneDetailPage, BonesJointsPage, JointDetailPage } from './pages/BonesJointsPages';
import { MuscleDetailPage } from './pages/MuscleDetailPage';
import { MusclesPage } from './pages/MusclesPage';
import { EpisodeFormPage } from './pages/patients/EpisodeFormPage';
import { PatientFolderPage } from './pages/patients/PatientFolderPage';
import { PatientFormPage } from './pages/patients/PatientFormPage';
import { PatientListPage } from './pages/patients/PatientListPage';
import { PatientSettingsPage } from './pages/patients/SettingsPage';
import { VaultGate } from './pages/patients/VaultGate';
import { initVault, startAutoLock } from './patients/vault';
import { NerveDetailPage, NervesPage } from './pages/NervesPages';
import { ProgrammeDetailPage, ProgrammeListPage } from './pages/ProgrammePages';
import { ProtocolDetailPage, ProtocolListPage } from './pages/ProtocolPages';
import { ExerciseDetailPage, ExercisesPage } from './pages/RehabPages';
import { SpecialTestDetailPage, SpecialTestsPage } from './pages/SpecialTestsPages';

/** Start each new screen at the top (a hash router keeps the old scroll position otherwise). */
function ScrollToTop() {
  const { pathname } = useLocation();
  // Block body on purpose: newer browsers return a Promise from scrollTo, which must not become the effect cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Patient screens open only when the vault is unlocked. */
const gated = (page: ReactNode) => <VaultGate>{page}</VaultGate>;

export function App() {
  useEffect(() => {
    void initVault();
    return startAutoLock();
  }, []);
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<MusclesPage />} />
            <Route path="/muscles/:id" element={<MuscleDetailPage />} />
            <Route path="/bones" element={<BonesJointsPage />} />
            <Route path="/bones/:id" element={<BoneDetailPage />} />
            <Route path="/joints/:id" element={<JointDetailPage />} />
            <Route path="/nerves" element={<NervesPage />} />
            <Route path="/nerves/:id" element={<NerveDetailPage />} />
            <Route path="/tests" element={<SpecialTestsPage />} />
            <Route path="/tests/:id" element={<SpecialTestDetailPage />} />
            <Route path="/rehab" element={<ExercisesPage />} />
            <Route path="/rehab/exercises/:id" element={<ExerciseDetailPage />} />
            <Route path="/rehab/fractures" element={<ProtocolListPage kind="fracture" />} />
            <Route path="/rehab/surgeries" element={<ProtocolListPage kind="surgery" />} />
            <Route path="/rehab/protocols/:id" element={<ProtocolDetailPage />} />
            <Route path="/rehab/programmes" element={<ProgrammeListPage />} />
            <Route path="/rehab/programmes/:id" element={<ProgrammeDetailPage />} />
            <Route path="/patients" element={gated(<PatientListPage />)} />
            <Route path="/patients/settings" element={gated(<PatientSettingsPage />)} />
            <Route path="/patients/new" element={gated(<PatientFormPage />)} />
            <Route path="/patients/:id" element={gated(<PatientFolderPage />)} />
            <Route path="/patients/:id/edit" element={gated(<PatientFormPage />)} />
            <Route path="/patients/:id/episodes/:episodeId" element={gated(<EpisodeFormPage />)} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<p className="empty">Page not found.</p>} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
