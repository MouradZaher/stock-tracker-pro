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
      refetchInterval: 15000, // 15 seconds for real-time feel
      refetchIntervalInBackground: true,
      staleTime: 10000, // Considered stale after 10s to encourage fresh fetches
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
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

      <main className="main-content" style={{ flex: 1, position: 'relative', paddingTop: 'var(--header-height)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={
            <div className="tab-content home-tab-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', paddingBottom: 'calc(var(--mobile-nav-height) + 20px)' }}>
              {!selectedSymbol ? (
                <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '800px', padding: '0 1rem 0.5rem' }}>
                  <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
                      Market <span className="gradient-text">Overview</span>
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      S&P 500 Performance Heatmap • Real-time Sector Breakdown
                    </p>
                  </div>
                  <div style={{ flex: 1, minHeight: '600px' }}>
                    <StockHeatmap />
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', padding: '1rem' }}>
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
                  <Portfolio onSelectSymbol={handleSelectSymbol} />
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
