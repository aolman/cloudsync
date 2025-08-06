import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';


const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header Section */}
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to CloudSync' : 'Create your CloudSync account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            type="button"
                            className="ml-1 font-medium text-blue-600 hover:text-blue-500"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            {/* Email Input */}
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="input-field mt-1"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                required
                                className="input-field mt-1"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </div>
                            ) : (
                                isLogin ? 'Sign in' : 'Create account'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;