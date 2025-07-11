'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/agent/status');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to AI Agent Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your personal AI assistant for productivity, calendar management, and smart task organization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600">Get help with scheduling, reminders, and productivity tasks.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Integration</h3>
              <p className="text-gray-600">Seamlessly connect with Google Calendar for smart scheduling.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Automation</h3>
              <p className="text-gray-600">Automate repetitive tasks and boost your productivity.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}