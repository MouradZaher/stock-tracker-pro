import React, { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// TEMPORARY: Commenting out framer-motion to fix build - this component is not currently used

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    height?: 'auto' | 'half' | 'full';
}

/**
 * iOS-style Bottom Sheet Component
 * Slides up from the bottom with drag-to-dismiss functionality
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    children,
    title,
    height = 'auto',
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Add safe area padding for iOS
            document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingBottom = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingBottom = '';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const getMaxHeight = () => {
        switch (height) {
            case 'full':
                return '95vh';
            case 'half':
                return '50vh';
            default:
                return 'auto';
        }
    };

    return (
        <>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            zIndex: 9998,
                        }}
                        aria-hidden="true"
                    />

                    {/* Bottom Sheet */}
                    <div
                        ref={sheetRef}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            background: 'var(--color-bg-elevated)',
                            borderTopLeftRadius: 'var(--radius-xl)',
                            borderTopRightRadius: 'var(--radius-xl)',
                            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)',
                            maxHeight: getMaxHeight(),
                            display: 'flex',
                            flexDirection: 'column',
                            paddingBottom: 'env(safe-area-inset-bottom)',
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
                    >
                        {/* Drag Handle */}
                        <div
                            style={{
                                width: '40px',
                                height: '4px',
                                background: 'var(--color-border)',
                                borderRadius: 'var(--radius-full)',
                                margin: '12px auto 8px',
                                cursor: 'grab',
                            }}
                            aria-hidden="true"
                        />

                        {/* Header */}
                        {title && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    borderBottom: '1px solid var(--color-border)',
                                }}
                            >
                                <h2
                                    id="bottom-sheet-title"
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        margin: 0,
                                    }}
                                >
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="btn-icon"
                                    aria-label="Close"
                                    style={{
                                        padding: 'var(--spacing-sm)',
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: 'var(--spacing-lg)',
                                WebkitOverflowScrolling: 'touch',
                            }}
                        >
                            {children}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default BottomSheet;
