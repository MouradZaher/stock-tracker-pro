import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ClipboardCheck } from 'lucide-react';
import type { ChecklistItem } from '../../types/trading';

interface PreTradeChecklistProps {
    items: ChecklistItem[];
    onItemToggle?: (id: string, checked: boolean) => void;
}

const PreTradeChecklist: React.FC<PreTradeChecklistProps> = ({ items, onItemToggle }) => {
    const [checklistItems, setChecklistItems] = useState(items);

    useEffect(() => {
        setChecklistItems(items);
    }, [items]);

    const handleToggle = (id: string) => {
        setChecklistItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
        const item = checklistItems.find(i => i.id === id);
        if (item && onItemToggle) {
            onItemToggle(id, !item.checked);
        }
    };

    const checkedCount = checklistItems.filter(i => i.checked).length;
    const allChecked = checkedCount === checklistItems.length;

    return (
        <div className="pre-trade-checklist glass-effect" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1rem'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardCheck size={16} style={{ color: 'var(--color-accent)' }} />
                    <h4 style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        Pre-Trade Checklist
                    </h4>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: allChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: allChecked ? 'var(--color-success)' : 'var(--color-warning)',
                    fontWeight: 600
                }}>
                    {checkedCount}/{checklistItems.length}
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem'
            }}>
                {checklistItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => !item.autoCheck && handleToggle(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: item.checked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                            cursor: item.autoCheck ? 'default' : 'pointer',
                            transition: 'background 0.2s ease',
                            fontSize: '0.75rem'
                        }}
                    >
                        {item.checked ? (
                            <CheckSquare size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                        ) : (
                            <Square size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                        )}
                        <span style={{
                            opacity: item.checked ? 1 : 0.7,
                            textDecoration: item.checked ? 'none' : 'none'
                        }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {allChecked && (
                <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                    textAlign: 'center',
                    color: 'var(--color-success)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}>
                    ✓ Ready to Execute Trade
                </div>
            )}
        </div>
    );
};

export default PreTradeChecklist;
