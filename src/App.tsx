import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { soundService } from './services/soundService';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import ARIAVoiceAssistant from './components/ARIAVoiceAssistant';
import ThemeMoodManager from './components/ThemeMoodManager';
import FloatingStream from './components/FloatingStream';
import { usePiPStore } from './services/usePiPStore';
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
      // Also sync every 2 seconds for "sync by seconds" feel
      const interval = setInterval(syncPrices, 2000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, syncPrices]);

  // Global click sound for all interactive clicks (playTap everywhere)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // In addition to buttons, trigger on all elements with role=button, <a>, input clickables
      const clickable = target.closest('button, [role="button"], a, input[type="button"], input[type="submit"], .btn, .glass-button');
      if (clickable) {
        soundService.playTap();
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // If not authenticated, show PIN login
  if (!isAuthenticated) {
    return <PinLoginPage />;
  }

  const role = user?.role || 'user';

  const handleLogout = () => {
    // Keep terms acceptance persistent across logout sessions
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
          onClearData={() => {
            localStorage.clear();
            window.location.reload();
          }}
          onDeleteAccount={() => {
            localStorage.clear();
            handleLogout();
          }}
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

/**
 * Stock Detail Wrapper that reads symbol from Route params 
 * for persistence across page refreshes.
 */
function StockDetailRoute({ onBack }: { onBack: () => void }) {
  const { symbol } = useParams<{ symbol: string }>();
  if (!symbol) return <Navigate to="/home" replace />;
  return (
    <div className="tab-content">
      <StockDetail
        symbol={symbol}
        onBack={onBack}
      />
    </div>
  );
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
  
  const activeTab = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromTab = searchParams.get('from');
    const path = location.pathname;
    
    if (path.startsWith('/stock/')) {
      return (fromTab || 'home') as TabType;
    }
    
    const tabName = path.substring(1) || 'home';
    const validTabs: TabType[] = ['home', 'watchlist', 'portfolio', 'recommendations', 'pulse', 'pricing', 'admin'];
    return (validTabs.includes(tabName as TabType) ? tabName : 'home') as TabType;
  }, [location.pathname, location.search]);

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab}`);
    if (tab !== 'home') setSelectedSymbol(null);
  };

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    // Explicitly pass current tab as 'from' context
    const currentTab = activeTab || 'home';
    navigate(`/stock/${symbol}?from=${currentTab}`);
  };

  // Listen for symbol query parameters (from legacy heatmap deep-linking)
  // Now redirects to the new persistent /stock/ route while preserving other params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const symbolFromUrl = params.get('symbol');
    if (symbolFromUrl) {
      params.delete('symbol');
      const search = params.toString();
      navigate(`/stock/${symbolFromUrl}${search ? `?${search}` : ''}`, { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="app">
      <ErrorBoundary>
        <TopBar onSelectSymbol={handleSelectSymbol} />
        <div className="main-wrapper">
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
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={
                <div className="tab-content home-tab-content">
                  <Dashboard onSelectSymbol={handleSelectSymbol} />
                </div>
              } />
              <Route path="/stock/:symbol" element={
                <StockDetailRoute onBack={() => navigate('/home')} />
              } />
              <Route path="/watchlist" element={
                <div className="tab-content" style={{ padding: '1rem', paddingBottom: '80px' }}>
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
                <div className="tab-content" style={{ padding: 0 }}>
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
                <div className="tab-content" style={{ overflow: 'hidden' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <PricingPage />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="*" element={<Navigate to={{ pathname: '/home', search: location.search }} replace />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
      <div className="noise-overlay" />
      {activeTab !== 'home' && <AIChatWidget />}
      {activeTab !== 'home' && (
        <ARIAVoiceAssistant
          onNavigate={handleTabChange}
          onSelectSymbol={handleSelectSymbol}
        />
      )}
      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />
      {activeTab !== 'pulse' && <FloatingStream />}
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
              <ThemeMoodManager>
                <AppContent />
              </ThemeMoodManager>
            </QueryClientProvider>
          </NotificationProvider>
        </PinAuthProvider>
      </AuthProvider>
    </MarketProvider>
  );
}

export default App;
// Last Build: Thu Jan 29 19:28:42 EET 2026
