import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';

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

    const fetchProfile = async (userId: string) => {
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
            // Default to safe state if error
            setRole('user');
            setIsApproved(false);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        // DEV BYPASS: Immediately log in specific admin email without Supabase
        if (email.trim().toLowerCase() === 'bitdegenbiz@gmail.com' && import.meta.env.DEV) {
            console.log("BYPASSING SUPABASE FOR ADMIN");
            const fakeUser: User = {
                id: 'dev-admin-id',
                email: 'bitdegenbiz@gmail.com',
                app_metadata: { provider: 'email' },
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            };

            // Artificial delay to feel real
            await new Promise(resolve => setTimeout(resolve, 800));

            // Set state manually
            setUser(fakeUser);
            setRole('admin');
            setIsApproved(true);
            setSession({
                access_token: 'fake-token',
                refresh_token: 'fake-refresh-token',
                expires_in: 3600,
                token_type: 'bearer',
                user: fakeUser
            });

            return { error: null };
        }

        // Use Magic Link for everyone else
        return await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setIsApproved(false);
        setUser(null);
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
