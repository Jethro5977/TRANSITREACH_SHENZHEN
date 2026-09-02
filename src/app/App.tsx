import { Route, Routes, useLocation } from 'react-router-dom';
import { NavBar } from './NavBar';
import { NAV_ITEMS } from './nav';
import { ToastContainer, PageTransition } from '@/shared/ui';
import { useToasts } from '@/shared/hooks';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Footer } from './Footer';

function App() {
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToasts();
  const isMap = location.pathname === '/map';

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <NavBar items={NAV_ITEMS} />
      <PageTransition pageKey={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<MapPage onToast={addToast} />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageTransition>
      <Footer compact={isMap} />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
