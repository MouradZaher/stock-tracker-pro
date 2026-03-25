import React, { useState } from 'react';
import { X, Info, Bot, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
  onOpenAI: () => void;
}

const tutorialContent = [
  {
    category: 'Getting Started',
    title: 'Welcome to Stock Tracker Pro',
    description: 'Stock Tracker Pro helps you track your trades, manage portfolios, analyze performance, and stay on top of taxes. This tutorial walks you through every feature.',
    tips: [
      'Use the sidebar to navigate between tabs.',
      'You can reopen this tutorial anytime from the top menu.'
    ]
  },
  {
    category: 'Home',
    title: 'Market Heatmap',
    description: 'The Home tab features a live, interactive market heatmap. Visualize the entire stock market at a glance, filtered by sectors or indices, to instantly spot daily trend leaders and laggards.',
    tips: [
      'Click any block on the heatmap to jump straight to its detailed analysis page.'
    ]
  },
  {
    category: 'AI',
    title: 'AI Recommendations',
    description: 'Leverage our advanced predictive AI. This tab offers automated stock screens, predictive charting, and algorithmic trade ideas based on real-time market sentiment and technicals.',
    tips: ['Check the AI score confidently before making decisions.']
  },
  {
    category: 'Watch',
    title: 'Watchlist',
    description: 'Keep a close eye on your favorite assets. The Watch tab lets you add stocks and crypto to a personalized list, tracking their live prices and daily changes instantly.',
    tips: ['Use the sidebar to quickly swap between your saved lists.']
  },
  {
    category: 'Portfolio',
    title: 'Portfolio Tracking',
    description: 'Your command center for all your holdings. Track your P&L, manage multiple portfolios, import CSV data from brokers, and monitor total asset diversity.',
    tips: ['Click the Settings gear in the top right to enable dividend and news notifications for your holdings.']
  },
  {
    category: 'Pulse',
    title: 'Market Pulse',
    description: 'Stay updated with the heartbeat of the market! The Pulse tab aggregates breaking financial news, social media sentiment, and major economic events in real-time.',
    tips: ['Look for the AI sentiment indicator next to news articles to quickly gauge market reactions.']
  },
  {
    category: 'Pro',
    title: 'Pro Subscriptions',
    description: 'Upgrade your experience! The Pro tab details our premium features including unlimited portfolios, automatic broker sync via SnapTrade, and advanced predictive AI charting.',
    tips: ['All Pro features come with a 30-day free trial.']
  }
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onOpenAI }) => {
  const [activeStep, setActiveStep] = useState(0);
  const isMobile = window.innerWidth < 768;
  
  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, tutorialContent.length - 1));
  const handlePrev = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const content = tutorialContent[activeStep];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: isMobile ? '10px' : 'var(--spacing-md)'
    }}>
      <div className="glass-card" style={{
        maxWidth: '900px',
        width: '100%',
        height: isMobile ? '90vh' : '80vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--glass-border-bright)'
      }}>
        
        {/* Sidebar / Navigation */}
        <div style={{
          width: isMobile ? '100%' : '240px',
          background: 'rgba(0,0,0,0.2)',
          borderRight: isMobile ? 'none' : '1px solid var(--glass-border)',
          borderBottom: isMobile ? '1px solid var(--glass-border)' : 'none',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          padding: isMobile ? '12px' : '1.5rem',
          overflowX: isMobile ? 'auto' : 'visible',
          overflowY: isMobile ? 'visible' : 'auto',
          gap: '8px',
          flexShrink: 0
        }}>
          {!isMobile && <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Help & Tutorial</h3>}
          
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', width: '100%' }}>
            <button 
                onClick={() => { onClose(); onOpenAI(); }}
                style={{ 
                background: 'var(--color-accent-light)', color: 'var(--color-accent)', 
                border: '1px solid rgba(99,102,241,0.2)', padding: isMobile ? '6px 12px' : '10px 16px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600,
                marginBottom: isMobile ? '0' : '1.5rem', transition: 'all 0.2s', fontSize: isMobile ? '0.75rem' : '0.9rem',
                whiteSpace: 'nowrap'
                }}
            >
                <Bot size={16} />
                Ask AI
            </button>

            {/* Message Us Button - NEW placement inside FAQ */}
            <a 
                href="mailto:support@stocktrackerpro.com"
                style={{ 
                background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)', 
                border: '1px solid var(--glass-border)', padding: isMobile ? '6px 12px' : '10px 16px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s', fontSize: isMobile ? '0.75rem' : '0.9rem',
                whiteSpace: 'nowrap',
                marginBottom: isMobile ? '0' : '1rem'
                }}
            >
                <MessageSquare size={16} />
                Message Us
            </a>

            {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {['Getting Started', 'Home', 'AI', 'Watch', 'Portfolio', 'Pulse', 'Pro'].map((item, idx) => (
                    <button key={item} onClick={() => setActiveStep(idx)} style={{
                        background: idx === activeStep ? 'rgba(255,255,255,0.05)' : 'transparent',
                        border: 'none',
                        color: idx === activeStep ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: idx === activeStep ? 600 : 500,
                        fontSize: '0.85rem'
                    }}>
                        {idx === 0 ? '❓ ' : '⌂ '}{item}
                    </button>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: isMobile ? '8px' : '16px', right: isMobile ? '8px' : '16px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', zIndex: 10, padding: '4px', borderRadius: '50%' }}>
            <X size={isMobile ? 18 : 24} />
          </button>

          <div style={{ padding: isMobile ? '1.5rem' : '3rem', flex: 1, overflowY: 'auto' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {content.category} • {activeStep + 1}/{tutorialContent.length}
            </span>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, margin: '0.75rem 0', color: 'var(--color-text-primary)' }}>
              {content.title}
            </h2>
            <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {content.description}
            </p>

            {content.tips.map((tip, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', 
                padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', marginBottom: '0.75rem', alignItems: 'flex-start'
              }}>
                <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#fbbf24', fontSize: isMobile ? '0.8rem' : '0.9rem', lineHeight: 1.4 }}>
                  <strong style={{ opacity: 0.8 }}>TIP:</strong> {tip}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
                {tutorialContent.map((_, i) => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === activeStep ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={handlePrev}
                disabled={activeStep === 0}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-primary)', borderRadius: '8px', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.3 : 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button 
                onClick={handleNext}
                disabled={activeStep === tutorialContent.length - 1}
                style={{ padding: '8px 16px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '8px', cursor: activeStep === tutorialContent.length - 1 ? 'not-allowed' : 'pointer', opacity: activeStep === tutorialContent.length - 1 ? 0.3 : 1, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;
