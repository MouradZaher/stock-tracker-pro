import { useState, lazy, Suspense, useEffect } from 'react';
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
import { MarketProvider } from './contexts/MarketContext';

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

import { NotificationProvider } from './contexts/NotificationContext';
import { usePortfolioStore } from './hooks/usePortfolio';
import { useWatchlist } from './hooks/useWatchlist';
import PriceAlertManager from './components/PriceAlertManager';

import './index.css';
import './styles/ios-mobile.css';

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

  // Listen for symbol query parameters (from heatmap deep-linking)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const symbolFromUrl = params.get('symbol');
    if (symbolFromUrl && symbolFromUrl !== selectedSymbol) {
      setSelectedSymbol(symbolFromUrl);
      // Clear the query param to keep URL clean after processing
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, selectedSymbol, setSelectedSymbol]);

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

      <main className="main-content" style={{ flex: 1, position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          {/* ===== LOCKED: Desktop Home Tab Layout — DO NOT MODIFY (approved 2026-02-16) ===== */}
          <Route path="/search" element={
            <div
              className="tab-content home-tab-content"
              style={{
                position: 'relative',
                overflowY: 'auto',
                height: !selectedSymbol ? '100%' : 'auto'
              }}
            >
              {!selectedSymbol ? (
                <>
                  {/* Heatmap fills the rest — top controlled by CSS media queries */}
                  <div className="heatmap-wrapper">
                    <StockHeatmap />
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', padding: '1rem', paddingBottom: '80px' }}>
                  <StockDetail
                    symbol={selectedSymbol}
                    onBack={() => setSelectedSymbol(null)}
                  />
                </div>
              )}
            </div>
          } />
          <Route path="/watchlist" element={
            <div className="tab-content">
              <WatchlistPage onSelectSymbol={handleSelectSymbol} />
            </div>
          } />
          <Route path="/portfolio" element={
            <div className="tab-content">
              <ErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <Portfolio onSelectSymbol={handleSelectSymbol} />
                </Suspense>
              </ErrorBoundary>
            </div>
          } />
          <Route path="/recommendations" element={
            <div className="tab-content">
              <ErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <AIRecommendations onSelectStock={handleSelectSymbol} />
                </Suspense>
              </ErrorBoundary>
            </div>
          } />
          <Route path="/pulse" element={
            <div className="tab-content">
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
    <MarketProvider>
      <AuthProvider>
        <PinAuthProvider>
          <NotificationProvider>
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
              <PriceAlertManager />
              <AppContent />
            </QueryClientProvider>
          </NotificationProvider>
        </PinAuthProvider>
      </AuthProvider>
    </MarketProvider>
  );
}

export default App;
// Last Build: Thu Jan 29 19:28:42 EET 2026
