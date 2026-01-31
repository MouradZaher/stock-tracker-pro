import { useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { TabType } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import SearchEngine from './components/SearchEngine';
import StockDetail from './components/StockDetail';
import StockHeatmap from './components/StockHeatmap';
import { PageSkeleton } from './components/LoadingSkeleton';

// Lazy load heavy components
const Portfolio = lazy(() => import('./components/Portfolio'));
const AIRecommendations = lazy(() => import('./components/AIRecommendations'));

import WatchlistSidebar from './components/WatchlistSidebar';
import WatchlistPage from './components/WatchlistPage';
import MarketPulsePage from './components/MarketPulsePage';
import AdminDashboard from './components/AdminDashboard';
import MobileNav from './components/MobileNav';
import { PinAuthProvider, usePinAuth } from './contexts/PinAuthContext';
import { AuthProvider } from './contexts/AuthContext';
import PinLoginPage from './pages/PinLoginPage';
import { LogOut, Shield } from 'lucide-react';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 30000, // Default: 30 seconds
      refetchIntervalInBackground: true, // Keep refreshing even when tab is inactive
      staleTime: 5000, // Data considered stale after 5 seconds
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

function AppContent() {
  const { isAuthenticated, logout, user } = usePinAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // If not authenticated, show PIN login
  if (!isAuthenticated) {
    return <PinLoginPage />;
  }

  const role = user?.role || 'user';

  return (
    <BrowserRouter>
      <MainLayout
        role={role}
        logout={logout}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        isWatchlistOpen={isWatchlistOpen}
        setIsWatchlistOpen={setIsWatchlistOpen}
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
      />
    </BrowserRouter>
  );
}

function MainLayout({ role, logout, selectedSymbol, setSelectedSymbol, isWatchlistOpen, setIsWatchlistOpen, isAdminOpen, setIsAdminOpen }: any) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.substring(1) || 'search';
  const activeTab = (['search', 'watchlist', 'portfolio', 'recommendations', 'pulse'].includes(currentPath) ? currentPath : 'search') as TabType;

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab}`);
    if (tab !== 'search') setSelectedSymbol(null);
  };

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    navigate('/search');
  };

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={logout}
        showAdmin={role === 'admin'}
        onAdminClick={() => setIsAdminOpen(true)}
      />

      <WatchlistSidebar
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        onSelectSymbol={handleSelectSymbol}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <main className="main-content" style={{ overflowY: activeTab === 'search' ? 'hidden' : 'auto', flex: 1, position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={
            <div className="tab-content" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {!selectedSymbol ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', width: '100%', textAlign: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '700px' }}>
                      <SearchEngine onSelectSymbol={handleSelectSymbol} />
                    </div>
                  </div>
                  <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <StockHeatmap />
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', width: '100%', padding: '1rem' }}>
                  <StockDetail
                    symbol={selectedSymbol}
                    onBack={() => setSelectedSymbol(null)}
                  />
                </div>
              )}
            </div>
          } />
          <Route path="/watchlist" element={
            <div className="tab-content" style={{ paddingBottom: '80px' }}>
              <WatchlistPage onSelectSymbol={handleSelectSymbol} />
            </div>
          } />
          <Route path="/portfolio" element={
            <div className="tab-content" style={{ paddingBottom: '80px' }}>
              <ErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <Portfolio />
                </Suspense>
              </ErrorBoundary>
            </div>
          } />
          <Route path="/recommendations" element={
            <div className="tab-content" style={{ paddingBottom: '80px' }}>
              <ErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <AIRecommendations onSelectStock={handleSelectSymbol} />
                </Suspense>
              </ErrorBoundary>
            </div>
          } />
          <Route path="/pulse" element={
            <div className="tab-content" style={{ paddingBottom: '80px' }}>
              <MarketPulsePage onSelectStock={handleSelectSymbol} />
            </div>
          } />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PinAuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
          <AppContent />
        </QueryClientProvider>
      </PinAuthProvider>
    </AuthProvider>
  );
}

export default App;
// Last Build: Thu Jan 29 19:28:42 EET 2026
