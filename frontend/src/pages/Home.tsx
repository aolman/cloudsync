import React from 'react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">CloudSync</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Welcome, {user?.email}
                            </span>
                            <button
                                onClick={logout}
                                className="btn-secondary text-sm"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Welcome to CloudSync!
                    </h2>
                    <p className="text-gray-600">
                        Your file management dashboard will appear here soon.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Home;