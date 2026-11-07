import { useEffect, useRef, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { BottomNav } from './components/BottomNav';
import { DialogHost, Toaster } from './components/feedback';
import { OfflineBar } from './components/ui';
import { AboutPage } from './pages/AboutPage';
import { BoneDetailPage, BonesJointsPage, JointDetailPage } from './pages/BonesJointsPages';
import { HomePage } from './pages/HomePage';
import { MuscleDetailPage } from './pages/MuscleDetailPage';
import { SearchPage } from './pages/SearchPage';
import { MusclesPage } from './pages/MusclesPage';
import { EpisodeFormPage } from './pages/patients/EpisodeFormPage';
import { PatientFolderPage } from './pages/patients/PatientFolderPage';
import { PatientFormPage } from './pages/patients/PatientFormPage';
import { PatientListPage } from './pages/patients/PatientListPage';
import { ProgressPage } from './pages/patients/ProgressPage';
import { CalendarPage } from './pages/patients/calendar/CalendarPage';
import { CalendarImportPage } from './pages/patients/calendar/ImportPage';
import { NewSessionPage } from './pages/patients/session/NewSessionPage';
import { SessionPage } from './pages/patients/session/SessionPage';
import { PatientSettingsPage } from './pages/patients/SettingsPage';
import { TemplatesPage } from './pages/patients/TemplatesPage';
import { VaultGate } from './pages/patients/VaultGate';
import { initVault, startAutoLock } from './patients/vault';
import { CustomTechniqueFormPage } from './pages/techniques/CustomTechniqueFormPage';
import { TechniqueConditionPage, TechniqueFamilyPage } from './pages/techniques/FamilyAndConditionPages';
import { TechniqueImportPage } from './pages/techniques/ImportPage';
import { TechniqueDetailPage } from './pages/techniques/TechniqueDetailPage';
import { TechniquesPage } from './pages/techniques/TechniquesPage';
import { initTechniqueStore } from './techniques/store';
import { NerveDetailPage, NervesPage } from './pages/NervesPages';
import { ProgrammeDetailPage, ProgrammeListPage } from './pages/ProgrammePages';
import { ProtocolDetailPage, ProtocolListPage } from './pages/ProtocolPages';
import { ExerciseDetailPage, ExercisesPage } from './pages/RehabPages';
import { SpecialTestDetailPage, SpecialTestsPage } from './pages/SpecialTestsPages';

/**
 * Start each new screen at the top (a hash router keeps the old scroll position otherwise) and
 * move focus to its title, so screen readers announce the new page.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const first = useRef(true);
  // Block body on purpose: newer browsers return a Promise from scrollTo, which must not become the effect cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
    if (first.current) {
      first.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const title = document.querySelector('main h1');
      if (!(title instanceof HTMLElement)) return;
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}

/** Patient screens open only when the vault is unlocked. */
const gated = (page: ReactNode) => <VaultGate>{page}</VaultGate>;

export function App() {
  useEffect(() => {
    void initVault();
    void initTechniqueStore();
    return startAutoLock();
  }, []);
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="app-shell">
        <main className="app-main">
          <OfflineBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/muscles" element={<MusclesPage />} />
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
            <Route path="/rehab/protocols" element={<ProtocolListPage />} />
            <Route path="/rehab/fractures" element={<Navigate to="/rehab/protocols?kind=fracture" replace />} />
            <Route path="/rehab/surgeries" element={<Navigate to="/rehab/protocols?kind=surgery" replace />} />
            <Route path="/rehab/protocols/:id" element={<ProtocolDetailPage />} />
            <Route path="/rehab/programmes" element={<ProgrammeListPage />} />
            <Route path="/rehab/programmes/:id" element={<ProgrammeDetailPage />} />
            <Route path="/techniques" element={<TechniquesPage />} />
            <Route path="/techniques/new" element={<CustomTechniqueFormPage />} />
            <Route path="/techniques/import" element={<TechniqueImportPage />} />
            <Route path="/techniques/families/:id" element={<TechniqueFamilyPage />} />
            <Route path="/techniques/conditions/:id" element={<TechniqueConditionPage />} />
            <Route path="/techniques/:id" element={<TechniqueDetailPage />} />
            <Route path="/techniques/:id/edit" element={<CustomTechniqueFormPage />} />
            <Route path="/patients" element={gated(<PatientListPage />)} />
            <Route path="/patients/settings" element={gated(<PatientSettingsPage />)} />
            <Route path="/patients/templates" element={gated(<TemplatesPage />)} />
            <Route path="/calendar" element={gated(<CalendarPage />)} />
            <Route path="/calendar/import" element={gated(<CalendarImportPage />)} />
            <Route path="/patients/sessions/:sessionId" element={gated(<SessionPage />)} />
            <Route path="/patients/new" element={gated(<PatientFormPage />)} />
            <Route path="/patients/:id/sessions/new" element={gated(<NewSessionPage />)} />
            <Route path="/patients/:id" element={gated(<PatientFolderPage />)} />
            <Route path="/patients/:id/edit" element={gated(<PatientFormPage />)} />
            <Route path="/patients/:id/progress" element={gated(<ProgressPage />)} />
            <Route path="/patients/:id/episodes/:episodeId" element={gated(<EpisodeFormPage />)} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<p className="empty">Page not found.</p>} />
          </Routes>
        </main>
        <Toaster />
        <DialogHost />
        <BottomNav />
      </div>
    </HashRouter>
  );
}
