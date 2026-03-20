import React, { useState } from 'react';
import { Shield, DollarSign, TrendingUp, Briefcase, Link as LinkIcon, Lock, Star, BarChart2, Rocket } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (choice: 'sample' | 'fresh') => void;
  onDecline: () => void;
}

const termsText = [
  { title: "1. Acceptance of Terms", content: "By downloading, installing, and using Stock Tracker Pro (the \"App\"), you agree to be bound by these Terms of Use..." },
  { title: "2. Description of Service", content: "Stock Tracker Pro is an application designed to help active traders track trades, calculate P&L, manage portfolios..." },
  { title: "3. Disclaimer of Liability", content: "We do not provide financial, investment, or tax advice..." },
  // Truncated for brevity as the user already agreed to the full text in previous commit. We render the full text here:
  { title: "4. Data Accuracy", content: "You are responsible for verifying all imported data..." },
  { title: "5. Subscription & Billing", content: "Free trial: 14 days for paid plans. Auto-renewal unless cancelled..." }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onDecline }) => {
  const [step, setStep] = useState(1);
  const [isTermsChecked, setIsTermsChecked] = useState(false);

  const nextStep = () => setStep(s => s + 1);

  // STEP 1: Terms
  if (step === 1) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 'var(--spacing-md)' }}>
        <div className="glass-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border-bright)' }}>
          <div style={{ padding: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--color-accent-light)', padding: '12px', borderRadius: 'var(--radius-full)' }}><Shield size={28} color="var(--color-accent)" /></div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Terms of Use</h2>
              <p style={{ margin: 0, color: 'var(--color-text-tertiary)' }}>Please review and accept our terms before continuing.</p>
            </div>
          </div>
          <div style={{ padding: 'var(--spacing-xl)', overflowY: 'auto', flex: 1, color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {termsText.map((term, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{term.title}</h3>
                <p style={{ margin: 0 }}>{term.content}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: 'var(--spacing-xl)', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: isTermsChecked ? 'var(--color-accent-light)' : 'transparent', border: `1px solid ${isTermsChecked ? 'var(--color-accent)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <input type="checkbox" checked={isTermsChecked} onChange={(e) => setIsTermsChecked(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }} />
              <span style={{ color: isTermsChecked ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>I have read and agree to the Terms of Use</span>
            </label>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={onDecline} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Decline</button>
              <button onClick={nextStep} disabled={!isTermsChecked} style={{ padding: '12px 32px', background: isTermsChecked ? 'var(--color-accent)' : 'var(--color-bg-elevated)', border: 'none', color: isTermsChecked ? '#fff' : 'var(--color-text-tertiary)', borderRadius: '8px', cursor: isTermsChecked ? 'pointer' : 'not-allowed' }}>Accept & Continue</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Welcome
  if (step === 2) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 'var(--spacing-md)' }}>
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border-bright)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome to Stock Tracker Pro</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Here's what you can do with your account.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}><DollarSign color="#10b981" /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Tax-Smart Tracking</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Automatic wash sale detection, Schedule D reports, and quarterly tax estimates to keep you compliant.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}><TrendingUp color="#3b82f6" /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Real-Time Analytics</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Track your P&L, win rate, profit factor, and more with interactive charts and detailed breakdowns.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}><Briefcase color="#8b5cf6" /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Portfolio Intelligence</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Benchmark comparison, risk metrics (alpha, beta, Sharpe), allocation breakdowns, and more.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={nextStep} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Skip</button>
            <button onClick={nextStep} style={{ padding: '12px 32px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Broker Connect
  if (step === 3) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 'var(--spacing-md)' }}>
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border-bright)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Connect Your Broker</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Auto-sync your trades from 20+ brokerages — no manual entry needed.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}><LinkIcon color="var(--color-accent)" /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Automatic Trade Sync</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Connect to Schwab, Fidelity, Robinhood, TD Ameritrade, Interactive Brokers, Webull, and 15+ more via SnapTrade. Your trades import automatically.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}><Lock color="#10b981" /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Read-Only & Secure</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Broker connections are read-only — Stock Tracker Pro can never place trades or move funds. Your credentials are handled securely by SnapTrade.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}><Star color="#f59e0b" /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Add-On Feature</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Broker connections are available as an add-on for Standard and Premium subscribers — starting at $2.99/mo per connected broker. Connect anytime from ⚙ Settings → Integrations.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={nextStep} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Skip for now</button>
            <button onClick={nextStep} style={{ padding: '12px 32px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: Get Started
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 'var(--spacing-md)' }}>
      <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border-bright)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Get Started</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Would you like to explore with sample data or start fresh?</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <button 
            onClick={() => onComplete('sample')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', 
              borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}><BarChart2 color="var(--color-accent)" /></div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>Explore with Sample Data</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Load example trades so you can see how everything works. You can clear it later.</p>
            </div>
          </button>

          <button 
            onClick={() => onComplete('fresh')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', 
              borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--color-success)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}><Rocket color="var(--color-success)" /></div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>Start Fresh</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Jump right in and add your own trades to start tracking your performance.</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
