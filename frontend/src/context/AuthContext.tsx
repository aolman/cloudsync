import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { RegisterResponse, AuthResponse} from '../types/types.ts';
import { authAPI } from '../services/api';

interface AuthContextType {
    user: RegisterResponse | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context == undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<RegisterResponse | null>(null); 

    const [token, setToken] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }

        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response: AuthResponse = await authAPI.login(email, password);

            setToken(response.access_token);
            setUser({
                id: response.user.id,
                email: response.user.email,
                created_date: '',
                is_active: true
            });

            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('user', JSON.stringify({
                id: response.user.id,
                email: response.user.email,
                created_date: '',
                is_active: true
            }));

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (email: string, password: string) => {
        try {
            await authAPI.register(email, password);

            await login(email, password);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);

        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        register,
        logout,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};