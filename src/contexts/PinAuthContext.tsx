import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface User {
    id: string;
    pin: string;
    role: 'admin' | 'user';
    name: string;
    email: string;
}

interface PinAuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (pin: string) => { success: boolean; error?: string };
    logout: () => void;
}

const PinAuthContext = createContext<PinAuthContextType | undefined>(undefined);

// PIN to User mapping
const PIN_USERS: Record<string, User> = {
    '1927': {
        id: 'admin-1',
        pin: '1927',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@stocktracker.pro'
    },
    '7777': {
        id: 'user-1',
        pin: '7777',
        role: 'user',
        name: 'User 1',
        email: 'user1@example.com'
    },
    '7778': {
        id: 'user-2',
        pin: '7778',
        role: 'user',
        name: 'User 2',
        email: 'user2@example.com'
    },
    '7779': {
        id: 'user-3',
        pin: '7779',
        role: 'user',
        name: 'User 3',
        email: 'user3@example.com'
    }
};

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const { setCustomUser, signOut } = useAuth();

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('pin_auth_user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                // Verify the PIN still exists in our mapping
                if (PIN_USERS[parsed.pin]) {
                    setUser(parsed);
                    // Sync with main AuthContext
                    setCustomUser({
                        id: parsed.id,
                        email: parsed.email,
                        role: parsed.role,
                        name: parsed.name
                    });
                } else {
                    localStorage.removeItem('pin_auth_user');
                }
            } catch {
                localStorage.removeItem('pin_auth_user');
            }
        }
    }, [setCustomUser]);

    const login = (pin: string): { success: boolean; error?: string } => {
        const user = PIN_USERS[pin];

        if (!user) {
            return { success: false, error: 'Invalid PIN. Please try again.' };
        }

        setUser(user);
        localStorage.setItem('pin_auth_user', JSON.stringify(user));

        // Sync with main AuthContext
        setCustomUser({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pin_auth_user');
        signOut();
    };

    return (
        <PinAuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
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
