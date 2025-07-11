"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const LoginPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            setErrors({ submit: 'Email and password are required' });
            return;
        }
        
        setIsLoading(true);
        setErrors({});
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/dashboard');
            } else {
                setErrors({ submit: data.error || 'Login failed' });
            }
        } catch (error) {
            setErrors({ submit: 'Network error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to your account</p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600">
                            ✅ Account created successfully! Please log in.
                        </p>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
                    <div className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Error Message */}
                        {errors.submit && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{errors.submit}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>
                </div>

                {/* Register Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 