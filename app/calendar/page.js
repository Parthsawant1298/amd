'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/agent/status');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const connectCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/connect');
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Calendar connection error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Calendar Integration</h1>
          
          {user?.googleCalendar?.connected ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Calendar Connected!</h2>
              <p className="text-gray-600 mb-6">
                Your Google Calendar is connected. Your AI agent can now help you manage your schedule.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">What you can do now:</h3>
                <ul className="text-blue-800 text-left space-y-1">
                  <li>• Ask your AI about upcoming meetings</li>
                  <li>• Schedule new appointments</li>
                  <li>• Check your availability</li>
                  <li>• Get smart scheduling suggestions</li>
                </ul>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Calendar</h2>
              <p className="text-gray-600 mb-6">
                Connect your Google Calendar to unlock the full power of your AI agent.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Permissions needed:</h3>
                <ul className="text-yellow-800 text-left space-y-1">
                  <li>• Read your calendar events</li>
                  <li>• Create new events</li>
                  <li>• Update existing events</li>
                </ul>
              </div>
              
              <button
                onClick={connectCalendar}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Connect Google Calendar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 