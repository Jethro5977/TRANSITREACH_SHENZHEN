import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { NavBar } from './NavBar';
import { NAV_ITEMS } from './nav';
import { ToastContainer, PageTransition } from '@/shared/ui';
import { useToasts } from '@/shared/hooks';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Footer } from './Footer';

const MapPage = lazy(() => import('@/pages/MapPage').then(module => ({ default: module.MapPage })));
const MethodologyPage = lazy(() => import('@/pages/MethodologyPage').then(module => ({ default: module.MethodologyPage })));

function RouteLoading() {
  return (
    <main className="min-h-screen pt-16 flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <div className="w-6 h-6 rounded-full border-2 border-teal-100 border-t-teal-600 spinner" />
        正在加载页面…
      </div>
    </main>
  );
}

function App() {
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToasts();
  const isMap = location.pathname === '/map';

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <NavBar items={NAV_ITEMS} />
      <PageTransition pageKey={location.pathname}>
        <Suspense fallback={<RouteLoading />}>
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/map" element={<MapPage onToast={addToast} />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageTransition>
      <Footer compact={isMap} />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
