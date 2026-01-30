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
import SentimentGauge from './components/SentimentGauge';
import MobileNav from './components/MobileNav';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import { LogOut, Shield } from 'lucide-react';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function AppContent() {
  const { user, isApproved, role, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  // 2. Unauthenticated State -> Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // 3. Authenticated but Not Approved -> Pending Screen
  if (!isApproved) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', background: 'var(--color-bg-elevated)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <Shield size={48} color="var(--color-warning)" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Account Pending Approval</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Thanks for signing up! Your account is currently under review.
            <br />
            An admin needs to verify your account before you can access the platform.
            Please check back later.
          </p>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)' }}>Logged in as: {user.email}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => signOut()}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '1.5rem', width: '100%' }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>
                      Track Your Investments
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', maxWidth: '600px' }}>
                      Search for any US stock or ETF to view real-time data, charts, and comprehensive metrics
                    </p>
                    <SearchEngine onSelectSymbol={handleSelectSymbol} />
                  </div>
                  <SentimentGauge />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
// Last Build: Wed Jan 28 02:07:29 EET 2026
// Last Build: Thu Jan 29 19:28:42 EET 2026
