import React from 'react';
import type { TabType } from '../types';
import { soundService } from '../services/soundService';
import { Check, Mail } from 'lucide-react';

const PricingPage: React.FC = () => {
  const handleSelectPlan = (planName: string) => {
    soundService.playTap();
    window.location.href = `mailto:admin@stocktrackerpro.com?subject=Interested in ${planName} Plan&body=Hi, I am interested in subscribing to the ${planName} plan.`;
  };

  const PlanCard = ({ title, monthPrice, yearPrice, features, recommended = false }: any) => (
    <div style={{
      background: recommended ? 'var(--gradient-primary)' : 'var(--glass-bg)',
      border: '1px solid',
      borderColor: recommended ? 'transparent' : 'var(--color-border)',
      borderRadius: '24px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      flex: '1',
      minWidth: '280px',
      maxWidth: '350px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: recommended ? '0 20px 40px rgba(59, 130, 246, 0.2)' : 'none',
      transform: recommended ? 'scale(1.02)' : 'none',
      zIndex: recommended ? 2 : 1
    }}>
      {recommended && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '-2rem',
          background: '#10b981',
          color: 'white',
          padding: '4px 3rem',
          transform: 'rotate(45deg)',
          fontSize: '0.75rem',
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
        }}>
          POPULAR
        </div>
      )}
      
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: recommended ? 'white' : 'var(--color-text-primary)' }}>{title}</h3>
      </div>
      
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: recommended ? 'white' : 'var(--color-text-primary)' }}>${monthPrice}</span>
          <span style={{ fontSize: '0.85rem', color: recommended ? 'rgba(255,255,255,0.8)' : 'var(--color-text-tertiary)' }}>USD / mo</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: recommended ? 'rgba(255,255,255,0.7)' : 'var(--color-text-tertiary)', marginTop: '4px' }}>
          ${yearPrice} billed annually
        </div>
      </div>

      <button
        onClick={() => handleSelectPlan(title)}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '12px',
          background: recommended ? 'white' : 'var(--color-accent)',
          color: recommended ? 'var(--color-accent)' : 'white',
          border: 'none',
          fontSize: '1rem',
          fontWeight: 800,
          cursor: 'pointer',
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'transform 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'none'}
      >
        <Mail size={18} />
        Start for Free
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: recommended ? 'rgba(255,255,255,0.9)' : 'var(--color-text-primary)', margin: 0, marginBottom: '4px' }}>
          Features
        </p>
        {features.map((feature: string, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '16px', height: '16px', 
              borderRadius: '50%', 
              background: recommended ? 'rgba(255,255,255,0.2)' : 'var(--color-accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Check size={10} color={recommended ? 'white' : 'var(--color-accent)'} />
            </div>
            <span style={{ fontSize: '0.82rem', color: recommended ? 'white' : 'var(--color-text-secondary)', lineHeight: 1.2 }}>
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ 
          display: 'inline-block',
          padding: '6px 12px',
          background: 'var(--color-success-light)',
          color: 'var(--color-success)',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 800,
          marginBottom: '1rem'
        }}>
          30-DAY FREE TRIAL
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
          No payment card required. Prices include all applicable taxes.
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '1.5rem',
        alignItems: 'stretch'
      }}>
        <PlanCard 
          title="Starter"
          monthPrice="5.99"
          yearPrice="4.99"
          features={[
            "1 portfolio",
            "30 holdings",
            "Portfolio sharing",
            "Export data (CSV)",
            "Dividend sync",
            "Corporate action sync",
            "Advanced filters",
            "Performance report",
            "Trade report",
            "Dividend report",
            "Benchmarking report",
            "Cash account",
            "Contribution report",
            "Diversity report",
            "Multi-Currency report",
            "Multi-Period report"
          ]}
        />
        <PlanCard 
          title="Investor"
          monthPrice="12.99"
          yearPrice="9.99"
          recommended={true}
          features={[
            "10 portfolios",
            "Unlimited holdings",
            "Portfolio sharing",
            "Export data (CSV)",
            "Dividend sync",
            "Corporate action sync",
            "Advanced filters",
            "Performance report",
            "Trade report",
            "Dividend report",
            "Benchmarking report",
            "Cash account",
            "Contribution report",
            "Diversity report",
            "Multi-Currency report",
            "Multi-Period report"
          ]}
        />
        <PlanCard 
          title="Expert"
          monthPrice="17.99"
          yearPrice="14.99"
          features={[
            "20 portfolios",
            "Unlimited holdings",
            "Portfolio sharing",
            "Export data (CSV)",
            "Dividend sync",
            "Corporate action sync",
            "Advanced filters",
            "Performance report",
            "Trade report",
            "Dividend report",
            "Benchmarking report",
            "Cash account",
            "Contribution report",
            "Diversity report",
            "Multi-Currency report",
            "Multi-Period report"
          ]}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
        <p>To subscribe, please click "Start for Free" to email us directly at <strong>admin@stocktrackerpro.com</strong></p>
      </div>
    </div>
  );
}

export default PricingPage;
