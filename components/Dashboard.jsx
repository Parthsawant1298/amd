"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Dashboard = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [agentError, setAgentError] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/agent/status');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setAgentError(null);
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setAgentError('Failed to connect to server');
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
            } else {
                alert('Failed to connect calendar: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Calendar connection error:', error);
            alert('Failed to connect calendar. Please try again.');
        }
    };

    const sendMessage = async () => {
        if (!chatMessage.trim()) return;
        
        setIsChatLoading(true);
        const userMessage = chatMessage;
        setChatMessage('');
        
        setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
        
        try {
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();
            
            if (data.success) {
                setChatHistory(prev => [...prev, { type: 'agent', message: data.response }]);
            } else {
                let errorMessage = 'Sorry, I encountered an error.';
                if (data.error === 'Agent not found. Please ensure your AI agent is created first.') {
                    errorMessage = 'Your AI agent needs to be initialized. Please refresh the page or log out and log back in.';
                }
                setChatHistory(prev => [...prev, { type: 'error', message: errorMessage }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => [...prev, { type: 'error', message: 'Failed to send message. Please check your connection.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const uploadPhoto = async () => {
        if (!selectedFile) return;
        
        const formData = new FormData();
        formData.append('photo', selectedFile);
        
        try {
            const response = await fetch('/api/user/upload-photo', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (data.success) {
                setUser(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
                setSelectedFile(null);
                alert('Profile photo updated!');
            } else {
                alert('Failed to upload photo: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            alert('Failed to upload photo. Please try again.');
        }
    };

    const retryAgentConnection = async () => {
        setIsLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Retry error:', error);
            setIsLoading(false);
        }
    };

    const disconnectCalendar = async () => {
        if (!window.confirm('Are you sure you want to disconnect your Google Calendar?')) return;
        try {
            const response = await fetch('/api/calendar/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                await fetchUserData();
                alert('Calendar disconnected successfully!');
            } else {
                alert('Failed to disconnect calendar: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Calendar disconnect error:', error);
            alert('Failed to disconnect calendar. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Welcome back, {user?.name}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage your AI agent, calendar integration, and productivity settings
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Error Alert */}
                {agentError && (
                    <div className="mb-8 bg-white border-l-4 border-red-500 rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 text-red-500 mr-3">⚠</div>
                                    <span className="text-gray-900 font-medium">{agentError}</span>
                                </div>
                                <button
                                    onClick={retryAgentConnection}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
                            
                            <div className="text-center mb-6">
                                <div className="w-24 h-24 mx-auto mb-4 relative">
                                    {user?.profilePhoto ? (
                                        <img
                                            src={user.profilePhoto}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                            <span className="text-gray-600 text-xl font-medium">
                                                {user?.name?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                                    />
                                    {selectedFile && (
                                        <button
                                            onClick={uploadPhoto}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Update Photo
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-4 border-t border-gray-100 pt-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-black">Email</span>
                                    <span className="text-sm text-black">{user?.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-black">Timezone</span>
                                    <span className="text-sm text-black">{user?.timezone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-black">Member Since</span>
                                    <span className="text-sm text-black">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Agent Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Agent Status</h2>
                            
                            <div className="space-y-6">
                                {/* Agent Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${
                                            user?.aiAgent?.status === 'calendar_connected' ? 'bg-green-500' : 
                                            user?.aiAgent?.status === 'created' ? 'bg-blue-600' : 'bg-gray-400'
                                        }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-black">Agent Status</p>
                                            <p className="text-xs text-black">
                                                {user?.aiAgent?.status === 'calendar_connected' ? 'Fully Active' : 
                                                 user?.aiAgent?.status === 'created' ? 'Ready to Connect' : 'Setting Up'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        user?.aiAgent?.status === 'calendar_connected' ? 'bg-green-100 text-green-800' : 
                                        user?.aiAgent?.status === 'created' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {user?.aiAgent?.status === 'calendar_connected' ? 'Active' : 
                                         user?.aiAgent?.status === 'created' ? 'Ready' : 'Pending'}
                                    </span>
                                </div>
                                
                                {/* Calendar Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${
                                            user?.googleCalendar?.connected ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-black">Google Calendar</p>
                                            <p className="text-xs text-black">
                                                {user?.googleCalendar?.connected ? 'Connected & Synced' : 'Not Connected'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        user?.googleCalendar?.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {user?.googleCalendar?.connected ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    {user?.googleCalendar?.connected ? (
                                        <button
                                            onClick={disconnectCalendar}
                                            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Disconnect Calendar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={connectCalendar}
                                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Connect Google Calendar
                                        </button>
                                    )}

                                    {user?.aiAgent?.status === 'not_created' && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <p className="text-black text-sm mb-3">
                                                Your AI agent is being initialized. This usually takes just a moment.
                                            </p>
                                            <button
                                                onClick={retryAgentConnection}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Retry Setup
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">System Information</h2>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-black uppercase tracking-wide mb-1">Agent ID</p>
                                    <p className="text-sm font-mono text-black break-all">
                                        {user?.aiAgent?.agentId || 'Pending Creation'}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xl font-bold text-blue-600">
                                            {user?.aiAgent?.status === 'calendar_connected' ? '100%' : 
                                             user?.aiAgent?.status === 'created' ? '75%' : '25%'}
                                        </p>
                                        <p className="text-xs text-black mt-1">Setup Complete</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xl font-bold text-black">24/7</p>
                                        <p className="text-xs text-black mt-1">Availability</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Interface */}
                {user?.aiAgent?.status !== 'not_created' && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                            <p className="text-gray-600 mt-1">Ask questions, schedule events, or get help with your calendar</p>
                        </div>
                        
                        <div className="p-6">
                            {/* Chat History */}
                            <div className="h-80 overflow-y-auto mb-6 space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                {chatHistory.length === 0 ? (
                                    <div className="text-center text-gray-500 py-12">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-blue-600 text-xl">🤖</span>
                                        </div>
                                        <p className="font-medium text-gray-900 mb-2">Ready to help you!</p>
                                        <p className="text-sm">Start a conversation with your AI assistant</p>
                                    </div>
                                ) : (
                                    chatHistory.map((chat, index) => (
                                        <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md px-4 py-3 rounded-lg ${
                                                chat.type === 'user' 
                                                    ? 'bg-blue-600 text-white'
                                                    : chat.type === 'error'
                                                    ? 'bg-red-50 text-red-800 border border-red-200'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                            }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Chat Input */}
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="Type your message here..."
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isChatLoading || !chatMessage.trim()}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isChatLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        'Send'
                                    )}
                                </button>
                            </div>
                            
                            {/* Quick Suggestions */}
                            {chatHistory.length === 0 && (
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Try these commands:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            "What can you help me with?",
                                            "Do I have any meetings today?",
                                            "Schedule a meeting tomorrow",
                                            "Check my calendar availability"
                                        ].map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setChatMessage(suggestion)}
                                                className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Agent Setup Required */}
                {user?.aiAgent?.status === 'not_created' && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">⚙️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Agent Initialization</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Your AI agent is being set up. This process usually completes within a few moments.
                            </p>
                            <button
                                onClick={fetchUserData}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Check Status
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;