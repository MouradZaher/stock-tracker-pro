import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<'admin' | 'user' | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
            const { data, error } = await supabase
                .from('profiles')
                .select('role, is_approved')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setRole(data.role as 'admin' | 'user');
                setIsApproved(data.is_approved);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setRole('user');
            setIsApproved(false);
        }
    };

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
                fetchProfile(session.user.id).finally(() => setIsLoading(false));
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
                fetchProfile(session.user.id).finally(() => setIsLoading(false));
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
            console.log('🔗 Redirect URL:', `${window.location.origin}/`);

            return { error: null };
        } catch (err) {
            console.error('💥 Unexpected error sending magic link:', err);
            return { error: err };
        }
    };

    const signOut = async () => {
        localStorage.removeItem(BYPASS_STORAGE_KEY);
        await supabase.auth.signOut();
        setRole(null);
        setIsApproved(false);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, role, isApproved, isLoading, signInWithEmail, signOut }}>
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
