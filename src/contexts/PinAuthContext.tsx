import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    pin: string;
    role: 'admin' | 'user';
    name: string;
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
        name: 'Admin User'
    },
    '7777': {
        id: 'user-1',
        pin: '7777',
        role: 'user',
        name: 'User 1'
    },
    '7778': {
        id: 'user-2',
        pin: '7778',
        role: 'user',
        name: 'User 2'
    },
    '7779': {
        id: 'user-3',
        pin: '7779',
        role: 'user',
        name: 'User 3'
    }
};

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('pin_auth_user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                // Verify the PIN still exists in our mapping
                if (PIN_USERS[parsed.pin]) {
                    setUser(parsed);
                } else {
                    localStorage.removeItem('pin_auth_user');
                }
            } catch {
                localStorage.removeItem('pin_auth_user');
            }
        }
    }, []);

    const login = (pin: string): { success: boolean; error?: string } => {
        const user = PIN_USERS[pin];

        if (!user) {
            return { success: false, error: 'Invalid PIN. Please try again.' };
        }

        setUser(user);
        localStorage.setItem('pin_auth_user', JSON.stringify(user));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pin_auth_user');
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
