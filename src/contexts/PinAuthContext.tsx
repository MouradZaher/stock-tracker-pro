import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

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

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log('🛡️ PinAuthProvider rendering...');
    const [user, setUser] = useState<User | null>(null);
    const { setCustomUser, signOut } = useAuth();

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
            } catch (e) {
                console.error('Failed to parse saved user', e);
                localStorage.removeItem('pin_auth_user');
            }
        }
    }, []);

    // Check if username exists in Supabase
    const checkUser = async (username: string): Promise<{ exists: boolean; user?: User }> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, role, email, is_approved')
                .eq('username', username.toLowerCase())
                .single();

            if (error || !data) {
                return { exists: false };
            }

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

    // Login with username + PIN
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

            // Check PIN (simple comparison - in production use proper hashing)
            if (data.pin_hash !== pin) {
                return { success: false, error: 'Incorrect PIN. Please try again.' };
            }

            const loggedInUser: User = {
                id: data.id,
                username: data.username,
                role: data.role as 'admin' | 'user',
                email: data.email,
                isApproved: data.is_approved
            };

            // Legacy users might have null is_approved. Treat null as approved for backward compatibility.
            const isApproved = loggedInUser.isApproved === true || loggedInUser.isApproved === null || loggedInUser.isApproved === undefined;

            if (!isApproved && loggedInUser.role !== 'admin') {
                return { success: false, error: 'Account pending approval. Please contact administrator.' };
            }

            setUser(loggedInUser);
            localStorage.setItem('pin_auth_user', JSON.stringify(loggedInUser));

            // Sync with main AuthContext
            setCustomUser({
                id: loggedInUser.id,
                email: loggedInUser.email || `${loggedInUser.username}@stocktracker.local`,
                role: loggedInUser.role,
                name: loggedInUser.username
            });

            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    // Register new user
    const register = async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Check if username already exists
            const existing = await checkUser(username);
            if (existing.exists) {
                return { success: false, error: 'Username already taken. Please choose another.' };
            }

            // Generate unique ID
            const newId = `user-${Date.now()}`;

            // Insert new profile
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: newId,
                    username: username.toLowerCase(),
                    email: `${username.toLowerCase()}@stocktracker.local`,
                    role: 'user',
                    pin_hash: pin,
                    is_approved: false
                });

            if (error) {
                console.error('Registration error:', error);
                return { success: false, error: 'Registration failed. Please try again.' };
            }

            // Auto-login after registration
            const newUser: User = {
                id: newId,
                username: username.toLowerCase(),
                role: 'user',
                email: `${username.toLowerCase()}@stocktracker.local`,
                isApproved: false
            };

            // Do NOT auto-login new users anymore, they need approval
            // return { success: true, message: 'Registration successful. Pending admin approval.' };
            return { success: true };
        } catch (err) {
            console.error('Registration error:', err);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pin_auth_user');
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
