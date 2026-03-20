import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Bell, CreditCard, AlertTriangle, Shield, CheckCircle2, ChevronDown, Mail, Smartphone, RefreshCw, Trash2, Info, Star, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsModalProps {
  onClose: () => void;
  onClearData?: () => void;
  onDeleteAccount?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onClearData, onDeleteAccount }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'subscription' | 'danger'>('preferences');
  
  // Persistent local states for toggles
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem('settings_emailNotif') !== 'false');
  const [pushNotif, setPushNotif] = useState(() => localStorage.getItem('settings_pushNotif') !== 'false');
  const [divEmail, setDivEmail] = useState(() => localStorage.getItem('settings_divEmail') !== 'false');
  const [divPush, setDivPush] = useState(() => localStorage.getItem('settings_divPush') === 'true');
  const [newsEmail, setNewsEmail] = useState(() => localStorage.getItem('settings_newsEmail') !== 'false');
  const [newsPush, setNewsPush] = useState(() => localStorage.getItem('settings_newsPush') !== 'false');

  const [currency, setCurrency] = useState(() => localStorage.getItem('settings_currency') || 'USD');
  const [taxMethod, setTaxMethod] = useState(() => localStorage.getItem('settings_taxMethod') || 'FIFO');
  const [benchmark, setBenchmark] = useState(() => localStorage.getItem('settings_benchmark') || 'SPY');

  // Persistence effects
  React.useEffect(() => {
    localStorage.setItem('settings_emailNotif', String(emailNotif));
    localStorage.setItem('settings_pushNotif', String(pushNotif));
    localStorage.setItem('settings_divEmail', String(divEmail));
    localStorage.setItem('settings_divPush', String(divPush));
    localStorage.setItem('settings_newsEmail', String(newsEmail));
    localStorage.setItem('settings_newsPush', String(newsPush));
    localStorage.setItem('settings_currency', currency);
    localStorage.setItem('settings_taxMethod', taxMethod);
    localStorage.setItem('settings_benchmark', benchmark);
  }, [emailNotif, pushNotif, divEmail, divPush, newsEmail, newsPush, currency, taxMethod, benchmark]);

  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

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
        maxWidth: '850px',
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
          width: '240px',
          background: 'rgba(0,0,0,0.2)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1rem',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem', paddingLeft: '0.5rem', color: 'var(--color-text-primary)' }}>Settings</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: activeTab === tab.id ? 'var(--color-accent-light)' : 'transparent',
                  border: `1px solid ${activeTab === tab.id ? 'var(--glass-border-bright)' : 'transparent'}`,
                  color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <button 
            onClick={onClose} 
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>

          <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 2rem 0', color: 'var(--color-text-primary)' }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* Theme Section */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>Appearance</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {theme === 'dark' ? <Moon color="var(--color-text-secondary)" size={20} /> : <Sun color="var(--color-text-secondary)" size={20} />}
                      <div>
                        <div style={{ fontWeight: 600 }}>Theme Mode</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>Toggle between light and dark mode</div>
                      </div>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      style={{ 
                        padding: '8px 16px', background: 'var(--color-bg-elevated)', border: '1px solid var(--glass-border)', 
                        color: 'var(--color-text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Base Currency</label>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-elevated)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                    <ChevronDown size={16} color="var(--color-text-tertiary)" style={{ position: 'absolute', right: '16px', top: '14px', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Tax Lot Method</label>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <select 
                      value={taxMethod} 
                      onChange={e => setTaxMethod(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-elevated)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="FIFO">First In, First Out (FIFO)</option>
                      <option value="LIFO">Last In, First Out (LIFO)</option>
                      <option value="HIFO">Highest In, First Out (HIFO)</option>
                    </select>
                    <ChevronDown size={16} color="var(--color-text-tertiary)" style={{ position: 'absolute', right: '16px', top: '14px', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Benchmark Index</label>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <select 
                      value={benchmark} 
                      onChange={e => setBenchmark(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg-elevated)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="SPY">S&P 500 ETF (SPY)</option>
                      <option value="QQQ">NASDAQ 100 ETF (QQQ)</option>
                      <option value="DIA">Dow Jones ETF (DIA)</option>
                    </select>
                    <ChevronDown size={16} color="var(--color-text-tertiary)" style={{ position: 'absolute', right: '16px', top: '14px', pointerEvents: 'none' }} />
                  </div>
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', margin: 0, marginTop: '4px' }}>
                    Used for performance comparison, alpha, beta, and risk metrics calculations
                  </p>
                </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>General Notifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Mail color="var(--color-text-secondary)" size={20} />
                        <div>
                          <div style={{ fontWeight: 600 }}>Email Notifications</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>Receive announcements and updates via email</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                        <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: emailNotif ? 'var(--color-success)' : 'var(--color-text-tertiary)', transition: '.4s', borderRadius: '34px' }}>
                          <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: emailNotif ? '22px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Smartphone color="var(--color-text-secondary)" size={20} />
                        <div>
                          <div style={{ fontWeight: 600 }}>Push Notifications</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>Receive push notifications for announcements</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                        <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: pushNotif ? 'var(--color-success)' : 'var(--color-text-tertiary)', transition: '.4s', borderRadius: '34px' }}>
                          <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: pushNotif ? '22px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>Stock Notifications</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Choose how you want to receive dividend reminders and news alerts. Select which stocks to notify on the Portfolio page.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontWeight: 600 }}>Dividend Reminders</div>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={divEmail} onChange={e => setDivEmail(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Email</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={divPush} onChange={e => setDivPush(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Push</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontWeight: 600 }}>News Alerts</div>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={newsEmail} onChange={e => setNewsEmail(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Email</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={newsPush} onChange={e => setNewsPush(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Push</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '50%' }}>
                    <Shield size={32} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Current tier</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      FREE
                      <CheckCircle2 size={24} color="#10b981" />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700 }}>Upgrade to Pro</h4>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>Unlock unlimited portfolios, advanced AI predictive charting, and real-time news aggregation.</p>
                  <button style={{ padding: '12px 24px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} />
                    View Pricing Plans
                  </button>
                </div>
              </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === 'danger' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', overflow: 'hidden' }}>
                  
                  <div style={{ padding: '24px', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Clear All Data</h4>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
                      Delete all trades, portfolios, and analytics data. Your account remains.
                    </p>
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
                            onClearData && onClearData();
                        }
                      }}
                      style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <RefreshCw size={16} />
                      Clear Data
                    </button>
                  </div>

                  <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>Delete Account</h4>
                    <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      Permanently delete your account and all data. This cannot be undone.
                    </p>
                    <button 
                      onClick={() => {
                        if (window.confirm("PERMANENT DELETION: Are you absolutely sure?")) {
                            onDeleteAccount && onDeleteAccount();
                        }
                      }}
                      style={{ padding: '10px 20px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                    >
                      <Trash2 size={16} />
                      Delete Account
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
