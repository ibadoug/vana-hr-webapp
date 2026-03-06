import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (login(email)) {
            navigate('/home');
        } else {
            setError('Access restricted to System Admins only.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 sm:p-10 transition-all duration-300 transform hover:shadow-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-[#4F7BFE] rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm">
                        V
                    </div>
                    <h2 className="text-2xl font-bold text-[#2E3A45]">Welcome to Vana HR</h2>
                    <p className="text-gray-500 text-sm mt-2 text-center">
                        Sign in to manage your team and access the system admin console.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7BFE] focus:border-[#4F7BFE] transition-colors outline-none"
                            placeholder="e.g., c@vana.gt"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-[#4F7BFE] hover:bg-[#3B5BDB] text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Phase 1 MVP • Allowed Emails: c@vana.gt, claudia@vana.gt</p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
