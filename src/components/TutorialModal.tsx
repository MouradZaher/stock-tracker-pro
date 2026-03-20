import React, { useState } from 'react';
import { X, HelpCircle, Activity, Box, LayoutPanelLeft, ArrowDownToLine, Wallet, FileText, Settings, Download, Bell, PieChart, Info, Bot } from 'lucide-react';

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
      'Use the top nav to switch between pages.',
      'You can reopen this tutorial anytime from the help button (?) in the top menu.'
    ]
  },
  {
    category: 'Dashboard',
    title: 'P&L Overview',
    description: 'The dashboard shows your total profit & loss across all portfolios at a glance. The summary cards display today\'s P&L, total realized gains, and unrealized gains.',
    tips: ['Click any summary card to navigate to the relevant detail page.']
  },
  {
    category: 'Open Trades',
    title: 'Real-time Position Tracking',
    description: 'The Open Trades section lists your current trades with real-time price data. Each row shows the ticker, quantity, average cost, current price, and unrealized P&L.',
    tips: ['Click a trade row to see full details and trade history.']
  },
  {
    category: 'Quick Actions',
    title: 'Managing Your Data',
    description: 'Use the quick action buttons to add a trade, import a CSV, or jump to common tasks without navigating away from the dashboard.',
    tips: []
  }
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onOpenAI }) => {
  const [activeStep, setActiveStep] = useState(0);
  
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
      padding: 'var(--spacing-md)'
    }}>
      <div className="glass-card" style={{
        maxWidth: '900px',
        width: '100%',
        height: '80vh',
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--glass-border-bright)'
      }}>
        
        {/* Sidebar */}
        <div style={{
          width: '280px',
          background: 'rgba(0,0,0,0.2)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Help & Tutorial</h3>
          
          <button 
            onClick={() => { onClose(); onOpenAI(); }}
            style={{ 
              background: 'var(--color-accent-light)', color: 'var(--color-accent)', 
              border: '1px solid rgba(99,102,241,0.2)', padding: '10px 16px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600,
              marginBottom: '2rem', transition: 'all 0.2s'
            }}
          >
            <Bot size={18} />
            Ask AI ✨
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Getting Started', 'Dashboard', 'Trades List', 'CSV Import', 'Portfolio', 'Broker Connections'].map((item, idx) => (
              <button key={item} onClick={() => setActiveStep(Math.min(idx, tutorialContent.length - 1))} style={{
                background: idx === activeStep ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: 'none',
                color: idx === activeStep ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                padding: '8px 12px',
                borderRadius: '6px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: idx === activeStep ? 600 : 500
              }}>
                {idx === 0 ? '❓ ' : '⌂ '}{item}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>

          <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step {activeStep + 1}/{tutorialContent.length}: {content.category}
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '1rem 0', color: 'var(--color-text-primary)' }}>
              {content.title}
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              {content.description}
            </p>

            {content.tips.map((tip, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', 
                padding: '1rem', borderRadius: '8px', display: 'flex', gap: '12px', marginBottom: '1rem', alignItems: 'flex-start'
              }}>
                <Info size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#fbbf24', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  <strong style={{ opacity: 0.8 }}>💡 TIP:</strong> {tip}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              {activeStep + 1} / {tutorialContent.length}
            </span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handlePrev}
                disabled={activeStep === 0}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-primary)', borderRadius: '6px', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.3 : 1 }}
              >
                Previous
              </button>
              <button 
                onClick={handleNext}
                disabled={activeStep === tutorialContent.length - 1}
                style={{ padding: '10px 24px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '6px', cursor: activeStep === tutorialContent.length - 1 ? 'not-allowed' : 'pointer', opacity: activeStep === tutorialContent.length - 1 ? 0.3 : 1, fontWeight: 600 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;
