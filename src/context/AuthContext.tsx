import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    user: { email: string } | null;
    login: (email: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<{ email: string } | null>(null);

    useEffect(() => {
        // Check local storage for persistent login
        const savedUser = localStorage.getItem('vana_hr_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (email: string) => {
        const isAdmin = email === 'c@vana.gt' || email === 'claudia@vana.gt';
        if (isAdmin) {
            const userObj = { email };
            setUser(userObj);
            localStorage.setItem('vana_hr_user', JSON.stringify(userObj));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vana_hr_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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
