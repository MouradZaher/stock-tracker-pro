import React, { useState, useEffect, useCallback } from 'react';
import { Search, Command, X, ArrowRight, Zap, Globe, Layout } from 'lucide-react';

interface OmniSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSymbol: (symbol: string) => void;
}

const QUICK_ACTIONS = [
    { id: 'us', label: 'Switch to US Market', icon: Globe },
    { id: 'egypt', label: 'Switch to Egypt', icon: Globe },
    { id: 'minimize', label: 'Minimize All Sectors', icon: Layout },
    { id: 'expand', label: 'Expand All Sectors', icon: Layout },
];

const OmniSearch: React.FC<OmniSearchProps> = ({ isOpen, onClose, onSelectSymbol }) => {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) onClose();
                else window.dispatchEvent(new CustomEvent('open-omni-search'));
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'center', 
            paddingTop: '15vh',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div style={{ 
                width: '100%', 
                maxWidth: '600px', 
                background: 'rgba(20,20,30,0.95)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search className="text-tertiary" size={20} />
                    <input 
                        autoFocus
                        placeholder="Search assets, sectors, or commands (Ctrl+K)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ 
                            flex: 1, 
                            background: 'none', 
                            border: 'none', 
                            outline: 'none', 
                            color: 'white', 
                            fontSize: '1rem',
                            fontWeight: 500
                        }}
                    />
                    <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                        ESC
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                    <div style={{ padding: '1rem 0.5rem 0.5rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Quick Actions
                    </div>
                    {QUICK_ACTIONS.map(action => (
                        <div 
                            key={action.id}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '0.75rem 1rem', 
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            className="omni-item-hover"
                            onClick={() => {
                                // Action Logic would go here
                                onClose();
                            }}
                        >
                            <action.icon size={16} className="text-accent" />
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{action.label}</span>
                            <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                        </div>
                    ))}
                </div>

                <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Command size={10} /> <span>↑↓ to navigate</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={10} /> <span>Enter to select</span>
                    </div>
                </div>
            </div>

            <style>{`
                .omni-item-hover:hover {
                    background: rgba(255,255,255,0.05);
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );
};

export default OmniSearch;
