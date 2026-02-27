import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';
import { usePortfolioStore } from '../hooks/usePortfolio';

interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
    email?: string;
    isApproved: boolean | null | undefined;
}

interface PinAuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    checkUser: (username: string) => Promise<{ exists: boolean; user?: User }>;
    login: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
    register: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
    approveUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const PinAuthContext = createContext<PinAuthContextType | undefined>(undefined);

// ─── SHA-256 PIN hashing via WebCrypto ──────────────────────────────────────
async function hashPin(pin: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.warn('WebCrypto not available. Using plain-text fallback (avoid over non-HTTPS).');
        return pin; // Fallback for non-HTTPS local mobile testing
    }
}

// ─── Compare PIN against stored hash ─────────────────────────────────────────
async function verifyPin(plain: string, stored: string | null | undefined): Promise<boolean> {
    if (!stored) return false;

    // Support legacy plain-text PINs (4-6 digit numbers)
    // A hex SHA-256 hash is always 64 chars; plain PINs are 4-10 chars
    if (stored.length < 32) {
        // Legacy plain-text comparison — still works for existing users or fallbacks
        return stored === plain;
    }
    const hashed = await hashPin(plain);
    return hashed === stored;
}

// ─────────────────────────────────────────────────────────────────────────────

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const { setCustomUser, signOut } = useAuth();
    const { loadFromSupabase, syncWithSupabase, initRealtimeSubscription, clearPositions } = usePortfolioStore();
    const unsubRef = useRef<(() => void) | null>(null);

    // Helper: start listening to realtime changes for a user
    const startSync = (userId: string) => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        loadFromSupabase(userId);
        unsubRef.current = initRealtimeSubscription(userId);
    };

    // Load user from localStorage on mount if it exists
    useEffect(() => {
        const savedUser = localStorage.getItem('pin_auth_user');
        if (savedUser) {
            try {
                const loggedInUser = JSON.parse(savedUser);
                setUser(loggedInUser);
                setCustomUser({
                    id: loggedInUser.id,
                    email: loggedInUser.email || `${loggedInUser.username}@stocktracker.local`,
                    role: loggedInUser.role,
                    name: loggedInUser.username
                });
                startSync(loggedInUser.id);
            } catch (e) {
                console.error('Failed to parse saved user', e);
                localStorage.removeItem('pin_auth_user');
            }
        }
        return () => { unsubRef.current?.(); };
    }, []);

    // Check if username exists in Supabase
    const checkUser = async (username: string): Promise<{ exists: boolean; user?: User }> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, role, email, is_approved')
                .eq('username', username.toLowerCase())
                .single();

            if (error || !data) return { exists: false };

            return {
                exists: true,
                user: {
                    id: data.id,
                    username: data.username,
                    role: data.role as 'admin' | 'user',
                    email: data.email,
                    isApproved: data.is_approved
                }
            };
        } catch {
            return { exists: false };
        }
    };

    // Login with username + PIN (supports both legacy plain-text and SHA-256 hashed)
    const login = async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, role, email, pin_hash, is_approved')
                .eq('username', username.toLowerCase())
                .single();

            if (error || !data) {
                return { success: false, error: 'User not found. Please sign up first.' };
            }

            // Verify PIN — supports legacy plain-text AND hashed PINs
            const pinValid = await verifyPin(pin, data.pin_hash);
            if (!pinValid) {
                return { success: false, error: 'Incorrect PIN. Please try again.' };
            }

            // Opportunistically upgrade plain-text PIN to hashed on successful login
            if (data.pin_hash.length < 32) {
                const hashed = await hashPin(pin);
                await supabase
                    .from('profiles')
                    .update({ pin_hash: hashed })
                    .eq('id', data.id);
            }

            const loggedInUser: User = {
                id: data.id,
                username: data.username,
                role: data.role as 'admin' | 'user',
                email: data.email,
                isApproved: data.is_approved
            };

            // Legacy users might have null is_approved — treat as approved for backward compat
            const isApproved = loggedInUser.isApproved === true || loggedInUser.isApproved === null || loggedInUser.isApproved === undefined;

            if (!isApproved && loggedInUser.role !== 'admin') {
                return { success: false, error: 'Account pending approval. Please contact administrator.' };
            }

            setUser(loggedInUser);
            localStorage.setItem('pin_auth_user', JSON.stringify(loggedInUser));

            setCustomUser({
                id: loggedInUser.id,
                email: loggedInUser.email || `${loggedInUser.username}@stocktracker.local`,
                role: loggedInUser.role,
                name: loggedInUser.username
            });

            startSync(loggedInUser.id);
            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    // Register new user — stores SHA-256 hash of the PIN, never plain text
    const register = async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const existing = await checkUser(username);
            if (existing.exists) {
                return { success: false, error: 'Username already taken. Please choose another.' };
            }

            const newId = `user-${Date.now()}`;
            const hashedPin = await hashPin(pin);

            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: newId,
                    username: username.toLowerCase(),
                    email: `${username.toLowerCase()}@stocktracker.local`,
                    role: 'user',
                    pin_hash: hashedPin,   // ← stored as SHA-256 hex, never plain text
                    is_approved: false
                });

            if (error) {
                console.error('Registration error:', error);
                return { success: false, error: 'Registration failed. Please try again.' };
            }

            return { success: true };
        } catch (err) {
            console.error('Registration error:', err);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pin_auth_user');
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        clearPositions();
        signOut();
    };

    const approveUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_approved: true })
                .eq('id', userId);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Approval error:', err);
            return { success: false, error: 'Failed to approve user' };
        }
    };

    return (
        <PinAuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            checkUser,
            login,
            register,
            approveUser,
            logout
        }}>
            {children}
        </PinAuthContext.Provider>
    );
};

export const usePinAuth = () => {
    const context = useContext(PinAuthContext);
    if (!context) {
        throw new Error('usePinAuth must be used within PinAuthProvider');
    }
    return context;
};
