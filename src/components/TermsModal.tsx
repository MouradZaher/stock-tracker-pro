import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const termsText = [
  {
    title: "1. Acceptance of Terms",
    content: "By downloading, installing, and using Stock Tracker Pro (the \"App\"), you agree to be bound by these Terms of Use. If you do not agree to these terms, do not use the App. We reserve the right to modify these terms at any time, with modifications taking effect upon posting to the App. Your continued use of the App following notification of such modifications constitutes your acceptance of the modified terms."
  },
  {
    title: "2. Description of Service",
    content: "Stock Tracker Pro is an application designed to help active traders track trades, calculate P&L (profit and loss), manage multiple portfolios, import CSV data from various brokers, and generate tax reports. The App is provided \"as-is\" and we make no warranties regarding its accuracy, completeness, or fitness for a particular purpose."
  },
  {
    title: "3. Disclaimer of Liability",
    content: "Stock Tracker Pro is a record-keeping tool only. We do not provide financial, investment, or tax advice. The App is not designed to replace professional financial advisors, accountants, or tax professionals. You are solely responsible for: Verifying all data accuracy, making your own investment decisions, consulting with licensed professionals for financial and tax advice, and filing accurate tax returns. We are not liable for any financial losses, tax penalties, or consequences resulting from your use of the App or reliance on its data."
  },
  {
    title: "4. Data Accuracy & Verification",
    content: "While we strive to maintain accurate data, Stock Tracker Pro relies on information you enter and data provided by third-party APIs. You are responsible for: Verifying all imported data matches your broker records, correcting any errors or discrepancies, and maintaining backup copies of your data. We are not responsible for errors caused by incorrect data entry, API failures, or third-party data providers."
  },
  {
    title: "5. Limitation of Liability",
    content: "To the fullest extent permitted by law, Stock Tracker Pro, its creators, and contributors are not liable for: Direct or indirect damages, lost profits or data, missed investment opportunities, tax filing errors or penalties, inaccurate P&L calculations, API failures or data unavailability, or any other damages, whether in contract, tort, or otherwise. Your sole remedy is the refund of subscription fees paid within the past 30 days."
  },
  {
    title: "6. User Responsibilities",
    content: "You agree to: Use the App only for lawful purposes, maintain the confidentiality of your account credentials, not reverse-engineer, decompile, or modify the App, not attempt to gain unauthorized access to our systems, not use the App to facilitate illegal activities, comply with all applicable laws and regulations, and take responsibility for all activity under your account. You are liable for all unauthorized access to your account."
  },
  {
    title: "7. Tax Considerations",
    content: "Stock Tracker Pro provides tax reporting tools to assist with record-keeping. However: We do not determine your tax liability, tax laws vary by jurisdiction and individual circumstance, you must consult a qualified CPA or tax professional, wash sale calculations are estimates and may require professional review, you are responsible for accurate tax filings, and we assume no liability for tax penalties or errors. Always verify tax reports with a licensed tax professional before filing."
  },
  {
    title: "8. Data Privacy & Security",
    content: "Your data is stored securely, but: No system is 100% secure, you acknowledge the inherent risks of digital data storage, and we are not liable for unauthorized access due to your negligence. We recommend using strong passwords and two-factor authentication, and regularly backing up your data outside the App. See our Privacy Policy for complete data handling practices."
  },
  {
    title: "9. Third-Party Services",
    content: "Stock Tracker Pro integrates with third-party services (brokers, APIs, payment processors). We are not responsible for: Third-party API failures or inaccuracies, service interruptions or data unavailability, broker-provided data quality, payment processing errors, or changes to third-party services. You are bound by third-party terms of service. We recommend reviewing them."
  },
  {
    title: "10. Subscription & Billing",
    content: "Subscription terms: Free trial: 14 days for paid plans. Auto-renewal: Subscriptions renew automatically unless cancelled. Cancellation: Cancel anytime through account settings. Upon cancellation, no refund is issued — you will retain full access to your plan until the end of the current billing period, after which your account will revert to the Free tier. Pricing: Subject to change with 30 days notice. You are responsible for maintaining valid payment information."
  },
  {
    title: "11. Intellectual Property",
    content: "All content, features, and functionality of Stock Tracker Pro are the exclusive property of Stock Tracker Pro or its licensors. You may not: Copy or reproduce the App or its content, create derivative works, use the App for commercial purposes, distribute or transmit the App, or remove copyright notices or proprietary markings. Your license is limited to personal, non-commercial use."
  },
  {
    title: "12. Termination",
    content: "We reserve the right to terminate or suspend your account if you: Violate these terms, engage in illegal activity, attempt unauthorized access, abuse the service, or create multiple accounts to circumvent restrictions. Termination is effective immediately upon notice."
  },
  {
    title: "13. Governing Law",
    content: "These Terms are governed by applicable laws where Stock Tracker Pro operates. Any disputes shall be resolved in the appropriate jurisdiction. You waive any right to jury trial and agree to mandatory arbitration for any claims."
  },
  {
    title: "14. Modifications to Service",
    content: "We reserve the right to: Modify or discontinue features, change pricing or subscription plans, impose usage limits or restrictions, update data sources and calculations, and change third-party integrations. We will provide reasonable notice of significant changes."
  },
  {
    title: "15. Contact & Support",
    content: "For questions about these Terms of Use or the App:\nEmail: support@stocktrackerpro.com\nIn-app support: Settings → Help → Contact Support\nWe aim to respond to all inquiries within 48 business hours."
  }
];

const TermsModal: React.FC<TermsModalProps> = ({ onAccept, onDecline }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setHasScrolledToBottom(true);
    }
  };

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
        maxWidth: '700px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--glass-border-bright)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--spacing-xl)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'var(--color-accent-light)',
            padding: '12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <Shield size={28} color="var(--color-accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
              Terms of Use
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Please review and accept our terms before continuing to the platform.
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          onScroll={handleScroll}
          style={{
            padding: 'var(--spacing-xl)',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--color-text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          {termsText.map((term, idx) => (
            <div key={idx} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: 'var(--color-text-primary)', 
                fontSize: '1.1rem', 
                marginBottom: '0.5rem',
                fontWeight: 600 
              }}>
                {term.title}
              </h3>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{term.content}</p>
            </div>
          ))}
        </div>

        {/* Footer & Actions */}
        <div style={{
          padding: 'var(--spacing-xl)',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: isChecked ? 'var(--color-accent-light)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isChecked ? 'var(--color-accent)' : 'var(--glass-border)'}`,
            transition: 'all 0.2s',
            marginBottom: '1.5rem'
          }}>
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={{ 
                width: '18px', 
                height: '18px', 
                marginTop: '2px',
                accentColor: 'var(--color-accent)'
              }}
            />
            <span style={{ 
              color: isChecked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}>
              I have read and agree to the Terms of Use
            </span>
          </label>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              onClick={onDecline}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              Decline
            </button>

            <button
              onClick={onAccept}
              disabled={!isChecked}
              style={{
                padding: '12px 32px',
                background: isChecked ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                border: 'none',
                color: isChecked ? '#fff' : 'var(--color-text-tertiary)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: isChecked ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isChecked ? 1 : 0.6
              }}
              onMouseEnter={(e) => { if(isChecked) e.currentTarget.style.background = 'var(--color-accent-hover)'; }}
              onMouseLeave={(e) => { if(isChecked) e.currentTarget.style.background = 'var(--color-accent)'; }}
            >
              <CheckCircle2 size={18} />
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
