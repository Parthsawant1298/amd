"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RegisterPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const timezones = [
        'UTC',
        'America/New_York',
        'America/Los_Angeles', 
        'Europe/London',
        'Asia/Tokyo',
        'Asia/Kolkata',
        'Australia/Sydney'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.password) {
            setErrors({ submit: 'All fields are required' });
            return;
        }
        
        setIsLoading(true);
        setErrors({});
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/login?registered=true');
            } else {
                setErrors({ submit: data.error || 'Registration failed' });
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join our AI-powered platform</p>
                </div>

                {/* Form */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your name"
                            />
                        </div>

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
                                placeholder="Create password"
                            />
                        </div>

                        {/* Timezone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Timezone
                            </label>
                            <select
                                value={formData.timezone}
                                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {timezones.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
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
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </div>

                {/* Login Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage; 