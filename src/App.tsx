import { useState, lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { TabType } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import OnboardingModal from './components/OnboardingModal';
import TutorialModal from './components/TutorialModal';
import SettingsModal from './components/SettingsModal';

import StockDetail from './components/StockDetail';
import StockHeatmap from './components/StockHeatmap';
import TopBar from './components/TopBar';
import { PageSkeleton } from './components/LoadingSkeleton';
import { MarketProvider } from './contexts/MarketContext';

// Lazy load heavy components
const Portfolio = lazy(() => import('./components/Portfolio'));
const AIRecommendations = lazy(() => import('./components/AIRecommendations'));
const PortfolioIntelligencePanel = lazy(() => import('./components/PortfolioIntelligencePanel'));
const PricingPage = lazy(() => import('./components/PricingPage'));

import WatchlistSidebar from './components/WatchlistSidebar';
import AIChatWidget from './components/AIChatWidget';
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
import Dashboard from './components/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 3000, // 3 seconds for ultra-live feel
      refetchIntervalInBackground: true,
      staleTime: 3000, // Considered stale after 3s to encourage fresh fetches
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

function AppContent() {
  const { isAuthenticated, logout, user } = usePinAuth();
  const syncPrices = usePortfolioStore(state => state.syncPrices);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Track Terms of Use acceptance
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('hasAcceptedTerms') === 'true';
  });

  // Auto-sync portfolio prices on login/refresh to replace $150 placeholders
  useEffect(() => {
    if (isAuthenticated) {
      syncPrices();
      // Also sync every 5 seconds for "sync by seconds" feel
      const interval = setInterval(syncPrices, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, syncPrices]);

  // If not authenticated, show PIN login
  if (!isAuthenticated) {
    return <PinLoginPage />;
  }

  const role = user?.role || 'user';

  const handleLogout = () => {
    localStorage.removeItem('hasAcceptedTerms');
    setHasAcceptedTerms(false);
    logout();
  };

  const handleOnboardingComplete = (choice: 'sample' | 'fresh') => {
    localStorage.setItem('hasAcceptedTerms', 'true');
    setHasAcceptedTerms(true);
    setIsTutorialOpen(true);
    
    // If choice is fresh, we do nothing. If sample, ideally we load sample data
    if (choice === 'sample') {
      // Future: load explicit sample trades here
      console.log('User elected to explore with sample data');
    }
  };

  const handleOpenAI = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  return (
    <BrowserRouter>
      {!hasAcceptedTerms && (
        <OnboardingModal 
          onComplete={handleOnboardingComplete} 
          onDecline={handleLogout} 
        />
      )}
      {isTutorialOpen && (
        <TutorialModal 
          onClose={() => setIsTutorialOpen(false)}
          onOpenAI={handleOpenAI}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      <MainLayout
        role={role}
        logout={handleLogout}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        isWatchlistOpen={isWatchlistOpen}
        setIsWatchlistOpen={setIsWatchlistOpen}
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </BrowserRouter>
  );
}

interface MainLayoutProps {
  role: string;
  logout: () => void;
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
  isWatchlistOpen: boolean;
  setIsWatchlistOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
}

function MainLayout({
  role,
  logout,
  selectedSymbol,
  setSelectedSymbol,
  isWatchlistOpen,
  setIsWatchlistOpen,
  isAdminOpen,
  setIsAdminOpen,
  onOpenTutorial,
  onOpenSettings
}: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.substring(1) || 'home';
  const activeTab = (['home', 'watchlist', 'portfolio', 'recommendations', 'pulse', 'pricing'].includes(currentPath) ? currentPath : 'home') as TabType;

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab}`);
    if (tab !== 'home') setSelectedSymbol(null);
  };

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    navigate('/home');
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
    <div className="app" style={{ display: 'flex', minHeight: '100vh' }}>
      <ErrorBoundary>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} className="main-wrapper">
          <Header
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={logout}
            showAdmin={role === 'admin'}
            onAdminClick={() => setIsAdminOpen(true)}
            onOpenTutorial={onOpenTutorial}
            onOpenSettings={onOpenSettings}
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

          <main className="main-content" style={{ flex: 1, position: 'relative', marginTop: 'var(--header-height)', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={
                <div style={{ position: 'fixed', top: 'calc(var(--header-height) + 32px)', left: 0, right: 0, bottom: 0, zIndex: 0, background: 'var(--color-bg-primary)' }}>
                  {!selectedSymbol ? (
                    <Dashboard onSelectSymbol={handleSelectSymbol} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '1rem', paddingBottom: '80px' }}>
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
              <Route path="/pricing" element={
                <div style={{ position: 'fixed', top: 'calc(var(--header-height) + 32px)', left: 0, right: 0, bottom: 0, zIndex: 0, background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <PricingPage />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
      <div className="noise-overlay" />
      <AIChatWidget />
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
