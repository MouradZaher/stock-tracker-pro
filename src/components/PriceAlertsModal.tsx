import React, { useState } from 'react';
import { X, Bell, BellOff, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import { formatCurrency } from '../utils/formatters';

interface PriceAlertsModalProps {
    symbol: string;
    currentPrice: number;
    onClose: () => void;
}

const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({ symbol, currentPrice, onClose }) => {
    const { alerts, addAlert, removeAlert, toggleAlert } = usePriceAlerts();
    const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString());
    const [condition, setCondition] = useState<'above' | 'below'>(currentPrice > 0 ? 'above' : 'below');

    const symbolAlerts = alerts.filter(a => a.symbol === symbol);

    const handleAdd = () => {
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) return;
        addAlert(symbol, price, condition);
    };

    return (
        <div className="modal-overlay glass-blur" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bell size={20} className="text-accent" /> Price Alerts: {symbol}
                    </h3>
                    <button className="btn btn-icon glass-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Price</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatCurrency(currentPrice)}</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Alert Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button
                                className={`glass-button ${condition === 'above' ? 'active' : ''}`}
                                onClick={() => setCondition('above')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: condition === 'above' ? 'var(--color-success-light)' : 'rgba(255,255,255,0.05)',
                                    color: condition === 'above' ? 'var(--color-success)' : 'inherit',
                                    border: condition === 'above' ? '1px solid var(--color-success)' : '1px solid transparent'
                                }}
                            >
                                <ArrowUp size={16} /> Price Above
                            </button>
                            <button
                                className={`glass-button ${condition === 'below' ? 'active' : ''}`}
                                onClick={() => setCondition('below')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: condition === 'below' ? 'var(--color-error-light)' : 'rgba(255,255,255,0.05)',
                                    color: condition === 'below' ? 'var(--color-error)' : 'inherit',
                                    border: condition === 'below' ? '1px solid var(--color-error)' : '1px solid transparent'
                                }}
                            >
                                <ArrowDown size={16} /> Price Below
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Target Price</label>
                        <div className="flex gap-sm">
                            <input
                                type="number"
                                className="form-input"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                style={{ flex: 1, fontSize: '1.1rem', fontWeight: 600 }}
                            />
                            <button className="btn btn-primary" onClick={handleAdd}>Set Alert</button>
                        </div>
                    </div>

                    {symbolAlerts.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <label className="form-label">Active Alerts for {symbol}</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {symbolAlerts.map(alert => (
                                    <div key={alert.id} className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ color: alert.condition === 'above' ? 'var(--color-success)' : 'var(--color-error)' }}>
                                                {alert.condition === 'above' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{formatCurrency(alert.targetPrice)}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>Set on {new Date(alert.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-sm">
                                            <button
                                                className="btn-icon glass-button"
                                                onClick={() => toggleAlert(alert.id)}
                                                title={alert.active ? "Deactivate" : "Activate"}
                                            >
                                                {alert.active ? <Bell size={16} className="text-accent" /> : <BellOff size={16} />}
                                            </button>
                                            <button
                                                className="btn-icon glass-button text-error"
                                                onClick={() => removeAlert(alert.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceAlertsModal;
