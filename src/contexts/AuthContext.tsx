import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useWatchlist } from '../hooks/useWatchlist';

// Development-only bypass (disabled in production for security)
const BYPASS_EMAIL = import.meta.env.DEV ? 'bitdegenbiz@gmail.com' : null;
const BYPASS_STORAGE_KEY = 'auth_bypass_active';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: 'admin' | 'user' | null;
    isApproved: boolean;
    isLoading: boolean;
    signInWithEmail: (email: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    // Allow external contexts (like PinAuth) to set the session manually
    setManualSession: (role: 'admin' | 'user') => void;
    setCustomUser: (customUser: { id: string; email: string; role: 'admin' | 'user'; name: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<'admin' | 'user' | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Sync guard to prevent multiple simultaneous syncs and infinite loops
    const syncInProgressRef = useRef(false);
    const lastSyncedUserIdRef = useRef<string | null>(null);

    const getFakeAdminUser = (): User => ({
        id: 'bypass-admin-id',
        email: BYPASS_EMAIL!,  // Safe: only called when BYPASS_EMAIL is non-null in dev mode
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    });

    const getFakeSession = (fakeUser: User): Session => ({
        access_token: 'bypass-token',
        refresh_token: 'bypass-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: fakeUser
    });

    const fetchProfile = async (userId: string) => {
        // If it's the bypass user, return admin profile immediately
        if (userId === 'bypass-admin-id') {
            setRole('admin');
            setIsApproved(true);
            return;
        }

        try {
            // AUTO-APPROVE LOGIC:
            // 1. Fetch profile
            const { data, error } = await supabase
                .from('profiles')
                .select('role, is_approved')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setRole(data.role as 'admin' | 'user');

                // 2. If not approved in DB, approve them now
                if (!data.is_approved) {
                    console.log('⚡ Auto-approving user...');
                    await supabase
                        .from('profiles')
                        .update({ is_approved: true })
                        .eq('id', userId);
                    setIsApproved(true);
                } else {
                    setIsApproved(data.is_approved);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setRole('user');
            // Default to approved even on error to ensure access
            setIsApproved(true);
        }
    };

    const syncUserData = useCallback(async (userId: string, force = false) => {
        // Guard against multiple simultaneous syncs and redundant re-syncs
        if (syncInProgressRef.current) {
            console.log('🔒 Sync already in progress, skipping...');
            return;
        }

        // Skip if we already synced this user (unless forced)
        if (!force && lastSyncedUserIdRef.current === userId) {
            console.log('✅ Already synced for this user, skipping...');
            return;
        }

        syncInProgressRef.current = true;
        console.log('🔄 Syncing user data...');

        try {
            // Sync portfolio data
            const portfolioStore = usePortfolioStore.getState();
            await portfolioStore.syncWithSupabase(userId);

            // Sync watchlist data
            const watchlistStore = useWatchlist.getState();
            await watchlistStore.syncWithSupabase(userId);

            lastSyncedUserIdRef.current = userId;
            console.log('✅ User data sync completed');
        } catch (error) {
            console.error('❌ Error syncing user data:', error);
        } finally {
            syncInProgressRef.current = false;
        }
    }, []);

    useEffect(() => {
        // 1. Check for bypass in localStorage (only in development mode)
        const isBypassActive = import.meta.env.DEV && localStorage.getItem(BYPASS_STORAGE_KEY) === 'true';

        if (isBypassActive) {
            const fakeUser = getFakeAdminUser();
            setUser(fakeUser);
            setSession(getFakeSession(fakeUser));
            setRole('admin');
            setIsApproved(true);
            setIsLoading(false);
            return;
        }

        // 2. Otherwise, check Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => {
                    setIsLoading(false);
                    // Sync user data after authentication
                    syncUserData(session.user.id);
                });
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Only update if not in bypass mode (development only)
            if (import.meta.env.DEV && localStorage.getItem(BYPASS_STORAGE_KEY) === 'true') return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id).finally(() => {
                    setIsLoading(false);
                    // Sync user data when user signs in
                    syncUserData(session.user.id);
                });
            } else {
                setRole(null);
                setIsApproved(false);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string) => {
        const cleanEmail = email.trim().toLowerCase();

        // Development-only bypass (disabled in production for security)
        if (import.meta.env.DEV && BYPASS_EMAIL && cleanEmail === BYPASS_EMAIL) {
            // Enable bypass persistence
            localStorage.setItem(BYPASS_STORAGE_KEY, 'true');

            const fakeUser = getFakeAdminUser();
            await new Promise(resolve => setTimeout(resolve, 800)); // Realism

            setUser(fakeUser);
            setRole('admin');
            setIsApproved(true);
            setSession(getFakeSession(fakeUser));

            return { error: null };
        }

        // Enhanced error handling and logging for production magic links
        try {
            console.log('📧 Sending magic link to:', cleanEmail);

            const { data, error } = await supabase.auth.signInWithOtp({
                email: cleanEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    shouldCreateUser: true, // Auto-create user if doesn't exist
                },
            });

            if (error) {
                console.error('❌ Supabase OTP Error:', error);
                console.error('Error details:', {
                    status: error.status,
                    message: error.message,
                    name: error.name
                });

                // Provide specific error messages
                if (error.message?.includes('rate limit') || error.status === 429) {
                    console.error('⏱️ Rate limit reached. Please wait before trying again.');
                } else if (error.message?.includes('Invalid email')) {
                    console.error('📧 Invalid email format');
                } else {
                    console.error('💥 Unexpected error:', error.message);
                }

                return { error };
            }

            console.log('✅ Magic link sent successfully!', data);
            console.log('📨 Check your inbox for the authentication link');


            return { error: null };
        } catch (err) {
            console.error('💥 Unexpected error sending magic link:', err);
            return { error: err };
        }
    };

    const setManualSession = useCallback((role: 'admin' | 'user') => {
        const fakeUser = getFakeAdminUser();
        fakeUser.id = role === 'admin' ? 'bypass-admin-id' : 'bypass-user-id';

        setUser(fakeUser);
        setRole(role);
        setIsApproved(true);
        setSession(getFakeSession(fakeUser));
    }, []);

    // New bridge function for PIN Auth
    const setCustomUser = useCallback((customUser: { id: string; email: string; role: 'admin' | 'user'; name: string }) => {
        const userObj: User = {
            id: customUser.id,
            email: customUser.email,
            app_metadata: { provider: 'pin' },
            user_metadata: { name: customUser.name },
            aud: 'authenticated',
            created_at: new Date().toISOString()
        };

        const sessionObj: Session = {
            access_token: 'pin-auth-token',
            refresh_token: 'pin-auth-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: userObj
        };

        setUser(userObj);
        setSession(sessionObj);
        setRole(customUser.role);
        setIsApproved(true);

        // Trigger initial sync
        syncUserData(userObj.id);
    }, [syncUserData]);

    const signOut = useCallback(async () => {
        localStorage.removeItem(BYPASS_STORAGE_KEY);
        // Reset sync tracking
        lastSyncedUserIdRef.current = null;
        await supabase.auth.signOut();
        setRole(null);
        setIsApproved(false);
        setUser(null);
        setSession(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, role, isApproved, isLoading, signInWithEmail, signOut, setManualSession, setCustomUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
