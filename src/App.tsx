import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import type { ElementType } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { soundService } from './services/soundService';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { TabType } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import TutorialModal from './components/TutorialModal';
import SettingsModal from './components/SettingsModal';
import MacroPulseHeader from './components/MacroPulseHeader';
import OmniSearch from './components/OmniSearch';
import WorldMonitorTabs from './components/WorldMonitorTabs';
import InstitutionalAdvisory from './components/InstitutionalAdvisory';
import LeftToolstrip from './components/LeftToolstrip';

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
const LiveIntelligenceStreams = lazy(() => import('./components/LiveIntelligenceStreams'));
const CorporateActionsCalendar = lazy(() => import('./components/CorporateActionsCalendar'));


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
import { Brain, Eye, PieChart, Activity } from 'lucide-react';

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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOmniSearchOpen, setIsOmniSearchOpen] = useState(false);
  
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true);

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


  const handleOpenAI = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  return (
    <BrowserRouter>
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
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOmniSearchOpen={isOmniSearchOpen}
        setIsOmniSearchOpen={setIsOmniSearchOpen}
      />
    </BrowserRouter>
  );
}

interface MainLayoutProps {
  role: string;
  logout: () => void;
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  isOmniSearchOpen: boolean;
  setIsOmniSearchOpen: (open: boolean) => void;
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
  isAdminOpen,
  setIsAdminOpen,
  onOpenTutorial,
  onOpenSettings,
  isOmniSearchOpen,
  setIsOmniSearchOpen
}: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="app" style={{ background: '#000000', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ErrorBoundary>
        <MacroPulseHeader />
        <OmniSearch 
            isOpen={isOmniSearchOpen} 
            onClose={() => setIsOmniSearchOpen(false)} 
            onSelectSymbol={handleSelectSymbol} 
        />
        
        <WorldMonitorTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="main-wrapper" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT TOOLSTRIP (SIDEBAR) */}
          <LeftToolstrip
            onOpenOmniSearch={() => setIsOmniSearchOpen(true)}
            onOpenSettings={onOpenSettings}
            onOpenTutorial={onOpenTutorial}
            onAdminClick={() => setIsAdminOpen(true)}
            onLogout={logout}
            showAdmin={role === 'admin'}
          />

          {/* MAIN DATA MONITOR */}
          <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minWidth: 0, padding: 0 }}>
            <div className="content-route-shell" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home/*" element={
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Dashboard onSelectSymbol={handleSelectSymbol} />
                </div>
              } />
              <Route path="/stock/:symbol" element={
                <StockDetailRoute onBack={() => navigate('/home')} />
              } />
              <Route path="/watchlist" element={
                <div className="tab-content" style={{ padding: '1rem', height: '100%' }}>
                  <WatchlistPage onSelectSymbol={handleSelectSymbol} />
                </div>
              } />
              <Route path="/portfolio" element={
                <div className="tab-content" style={{ padding: '1rem', height: '100%' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <Portfolio onSelectSymbol={handleSelectSymbol} />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="/recommendations" element={
                <div className="tab-content" style={{ padding: 0, height: '100%' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <AIRecommendations onSelectStock={handleSelectSymbol} />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="/pulse" element={
                <div className="tab-content" style={{ padding: '1rem', height: '100%' }}>
                  <MarketPulsePage onSelectStock={handleSelectSymbol} />
                </div>
              } />
              <Route path="/pricing" element={
                <div className="tab-content" style={{ padding: '1rem', height: '100%' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <PricingPage />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="/tv" element={
                <div className="tab-content" style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <LiveIntelligenceStreams />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="/calendar" element={
                <div className="tab-content" style={{ padding: 0, height: '100%', overflow: 'hidden' }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      <CorporateActionsCalendar />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              } />
              <Route path="*" element={<Navigate to={{ pathname: '/home', search: location.search }} replace />} />
            </Routes>
            </div>
          </main>

          {/* RIGHT ADVISORY ENGINE */}
          <aside style={{ width: '300px', borderLeft: '1px solid #111', padding: '1.25rem', background: '#000', display: 'flex', flexDirection: 'column' }}>
             <InstitutionalAdvisory />
          </aside>
        </div>
      </ErrorBoundary>
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
// Last Build: Thu Apr 09 21:01:00 EET 2026
