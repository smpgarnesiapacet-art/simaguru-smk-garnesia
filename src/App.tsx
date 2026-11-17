import React, { useState } from 'react';
import { SimaguruProvider, useSimaguru } from './context/SimaguruContext';
import { DashboardView } from './components/DashboardView';
import { GuideModal } from './components/GuideModal';
import { JurnalPresensiView } from './components/JurnalPresensiView';
import { LaporanView } from './components/LaporanView';
import { LayoutShell, NavSection } from './components/LayoutShell';
import { MasterDataView } from './components/MasterDataView';
import { PenilaianView } from './components/PenilaianView';
import { PerangkatAjarView } from './components/PerangkatAjarView';

function AppWorkspace() {
  const { isLoading } = useSimaguru();
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [preselectClassId, setPreselectClassId] = useState<string | undefined>(
    undefined
  );
  const [guideOpen, setGuideOpen] = useState(false);

  const handleNavigate = (section: NavSection, classId?: string) => {
    if (classId) {
      setPreselectClassId(classId);
    }
    setActiveSection(section);
  };

  return (
    <LayoutShell
      activeSection={activeSection}
      onSelectSection={(sec) => handleNavigate(sec)}
      onOpenGuide={() => setGuideOpen(true)}
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {activeSection === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}
          {activeSection === 'master' && <MasterDataView />}
          {activeSection === 'perangkat' && <PerangkatAjarView />}
          {activeSection === 'jurnal' && (
            <JurnalPresensiView preselectedClassId={preselectClassId} />
          )}
          {activeSection === 'penilaian' && <PenilaianView />}
          {activeSection === 'laporan' && <LaporanView />}
        </>
      )}

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </LayoutShell>
  );
}

export default function App() {
  return (
    <SimaguruProvider>
      <AppWorkspace />
    </SimaguruProvider>
  );
}
