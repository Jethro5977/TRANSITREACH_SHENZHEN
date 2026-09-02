import { useState } from 'react';
import { NavBar } from './NavBar';
import { NAV_ITEMS } from './nav';
import type { PageId } from './routes';
import { ToastContainer, PageTransition } from '@/shared/ui';
import { useToasts } from '@/shared/hooks';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { TimeComparisonPage } from '@/pages/future/TimeComparisonPage';
import { ScenarioPage } from '@/pages/future/ScenarioPage';
import { TypologyPage } from '@/pages/future/TypologyPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import type { RailStop } from '@/features/reachability';

function App() {
  const [activePage, setActivePage] = useState<PageId>('landing');
  const [searchResult, setSearchResult] = useState<RailStop | null>(null);
  const { toasts, addToast, removeToast } = useToasts();

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSelect = (stop: RailStop) => {
    setSearchResult(stop);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <NavBar items={NAV_ITEMS} activePage={activePage} onNavigate={handleNavigate} />

      <PageTransition pageKey={activePage}>
        {activePage === 'landing' && (
          <LandingPage onNavigate={handleNavigate} onSearchSelect={handleSearchSelect} />
        )}
        {activePage === 'map' && (
          <MapPage initialLocation={searchResult} onToast={addToast} />
        )}
        {activePage === 'services' && <ServicesPage />}
        {activePage === 'time' && <TimeComparisonPage />}
        {activePage === 'scenario' && <ScenarioPage />}
        {activePage === 'typology' && <TypologyPage />}
        {activePage === 'methodology' && <MethodologyPage />}
      </PageTransition>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
