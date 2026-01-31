import { useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import type { TabType } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import SearchEngine from './components/SearchEngine';
import StockDetail from './components/StockDetail';
import { PageSkeleton } from './components/LoadingSkeleton';

// Lazy load heavy components
const Portfolio = lazy(() => import('./components/Portfolio'));
const AIRecommendations = lazy(() => import('./components/AIRecommendations'));

import MarketOverview from './components/MarketOverview';
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
  const { isAuthenticated, user, logout } = usePinAuth();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // If not authenticated, show PIN login
  if (!isAuthenticated) {
    return <PinLoginPage />;
  }

  // User is authenticated - determine their role
  const role = user?.role || 'user';

  // 4. Approved User -> Main App
  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab('search');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== 'search') {
      setSelectedSymbol(null);
    }
  };

  return (
    <div className="app">


      {/* Custom Admin Header Button */}
      {role === 'admin' && (
        <div className="admin-button-container" style={{ position: 'fixed', top: '24px', right: '2rem', zIndex: 1001 }}>
          <button
            className="btn btn-primary btn-small"
            style={{ borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsAdminOpen(true)}
          >
            <Shield size={14} /> Admin
          </button>
        </div>
      )}

      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={logout}
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
        {activeTab === 'search' && (
          <div className="tab-content">
            {!selectedSymbol ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', width: '100%', textAlign: 'center' }}>

                  <div style={{ width: '100%', maxWidth: '700px' }}>
                    <SearchEngine onSelectSymbol={handleSelectSymbol} />
                  </div>
                </div>
                <MarketOverview onSelectStock={handleSelectSymbol} />
              </>
            ) : (
              <StockDetail symbol={selectedSymbol} />
            )}
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="tab-content">
            <WatchlistPage onSelectSymbol={handleSelectSymbol} />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="tab-content">
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <Portfolio />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="tab-content" style={{ height: '100%', overflowY: 'auto' }}>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <AIRecommendations onSelectStock={handleSelectSymbol} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'pulse' && (
          <div className="tab-content" style={{ height: '100%', overflowY: 'auto' }}>
            <MarketPulsePage onSelectStock={handleSelectSymbol} />
          </div>
        )}
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
