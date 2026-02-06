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
            padding: '1.25rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1rem',
            background: 'rgba(15, 15, 25, 0.4)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Execution Checklist
                </h4>
                <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: allChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: allChecked ? 'var(--color-success)' : 'var(--color-warning)',
                    fontWeight: 700
                }}>
                    {checkedCount}/{checklistItems.length}
                </span>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}>
                {checklistItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => !item.autoCheck && handleToggle(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: item.checked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${item.checked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                            cursor: item.autoCheck ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.875rem'
                        }}
                    >
                        {item.checked ? (
                            <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
                                <CheckSquare size={18} fill="rgba(16, 185, 129, 0.1)" />
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }}>
                                <Square size={18} />
                            </div>
                        )}
                        <span style={{
                            color: item.checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            fontWeight: item.checked ? 600 : 400
                        }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {allChecked && (
                <div style={{
                    marginTop: '1rem',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    textAlign: 'center',
                    color: 'var(--color-success)',
                    fontSize: '0.875rem',
                    fontWeight: 700
                }}>
                    ✓ ANALYSIS CONFIRMED - READY
                </div>
            )}
        </div>
    );
};

export default PreTradeChecklist;
