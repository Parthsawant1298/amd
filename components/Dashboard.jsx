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
        
        // Add user message to chat
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
            // Try to trigger agent creation by logging out and back in
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
                await fetchUserData(); // Refresh user state from backend
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.name}!
                    </h1>
                    <p className="text-gray-600">
                        Here's your AI agent dashboard. Manage your profile, check your AI status, and chat with your assistant.
                    </p>
                </div>

                {/* Error Alert */}
                {agentError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠️</span>
                                <span className="text-red-700">{agentError}</span>
                            </div>
                            <button
                                onClick={retryAgentConnection}
                                className="text-red-600 hover:text-red-800 text-sm underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
                        
                        {/* Profile Photo */}
                        <div className="text-center mb-4">
                            <div className="w-20 h-20 mx-auto mb-4">
                                {user?.profilePhoto ? (
                                    <img
                                        src={user.profilePhoto}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover border border-gray-300"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-gray-600 text-2xl">
                                            {user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Photo Upload */}
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {selectedFile && (
                                    <button
                                        onClick={uploadPhoto}
                                        className="w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                                    >
                                        Upload Photo
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Email:</span> {user?.email}</p>
                            <p><span className="font-medium">Timezone:</span> {user?.timezone}</p>
                        </div>
                    </div>

                    {/* AI Agent Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Agent</h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                    user?.aiAgent?.status === 'calendar_connected' 
                                        ? 'bg-green-100 text-green-800'
                                        : user?.aiAgent?.status === 'created'
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {user?.aiAgent?.status === 'calendar_connected' && '✅ Connected'}
                                    {user?.aiAgent?.status === 'created' && '🤖 Created'}
                                    {user?.aiAgent?.status === 'not_created' && '⚠️ Not Created'}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Calendar:</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                    user?.googleCalendar?.connected 
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {user?.googleCalendar?.connected ? '✅ Connected' : '❌ Not Connected'}
                                </span>
                            </div>
                            {user?.googleCalendar?.connected ? (
                                <div className="space-y-2">
                                    <div className="text-sm text-green-600 font-medium">
                                        ✅ Calendar Connected
                                    </div>
                                    <button
                                        onClick={disconnectCalendar}
                                        className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm"
                                    >
                                        Disconnect Calendar
                                    </button>
                                </div>
                            ) : null}
                            {!user?.googleCalendar?.connected && (
                                <button
                                    onClick={connectCalendar}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Connect Google Calendar
                                </button>
                            )}

                            {user?.aiAgent?.status === 'not_created' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="text-yellow-800 text-sm">
                                        Your AI agent is being set up. Please refresh the page or try logging out and back in.
                                    </p>
                                    <button
                                        onClick={retryAgentConnection}
                                        className="mt-2 text-yellow-700 hover:text-yellow-900 text-sm underline"
                                    >
                                        Retry Setup
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h2>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Agent ID:</span>
                                <span className="font-mono text-xs">{user?.aiAgent?.agentId || 'Not created'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Joined:</span>
                                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Section */}
                {user?.aiAgent?.status !== 'not_created' && (
                    <div className="mt-8 bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Chat with your AI Agent</h2>
                            <p className="text-sm text-gray-500 mt-1">Ask questions, get help with scheduling, or just have a conversation!</p>
                        </div>
                        
                        <div className="p-6">
                            {/* Chat History */}
                            <div className="h-64 overflow-y-auto mb-4 space-y-3 border border-gray-200 rounded p-4">
                                {chatHistory.length === 0 ? (
                                    <div className="text-center text-gray-500">
                                        <div className="mb-2">👋</div>
                                        <p>Start a conversation with your AI agent!</p>
                                        <p className="text-xs mt-1">Try asking: "What can you help me with?" or "Do I have any meetings today?"</p>
                                    </div>
                                ) : (
                                    chatHistory.map((chat, index) => (
                                        <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                chat.type === 'user' 
                                                    ? 'bg-blue-600 text-white'
                                                    : chat.type === 'error'
                                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 px-4 py-2 rounded-lg">
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
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="Type your message... (Press Enter to send)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isChatLoading || !chatMessage.trim()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {isChatLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        'Send'
                                    )}
                                </button>
                            </div>
                            
                            {/* Quick Suggestions */}
                            {chatHistory.length === 0 && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "What can you help me with?",
                                            "Do I have any meetings today?",
                                            "Help me schedule a meeting",
                                            "Check my calendar availability"
                                        ].map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setChatMessage(suggestion)}
                                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
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
                
                {/* Agent Not Ready Message */}
                {user?.aiAgent?.status === 'not_created' && (
                    <div className="mt-8 bg-white rounded-lg shadow p-6 text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🔧</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Agent Setup in Progress</h3>
                        <p className="text-gray-600 mb-4">
                            Your AI agent is being initialized. This usually takes just a moment.
                        </p>
                        <button
                            onClick={fetchUserData}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Check Status
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;