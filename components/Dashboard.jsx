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

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/agent/status');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
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
                setChatHistory(prev => [...prev, { type: 'error', message: 'Sorry, I encountered an error.' }]);
            }
        } catch (error) {
            setChatHistory(prev => [...prev, { type: 'error', message: 'Failed to send message.' }]);
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
            }
        } catch (error) {
            console.error('Photo upload error:', error);
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
                            
                            {!user?.googleCalendar?.connected && (
                                <button
                                    onClick={connectCalendar}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Connect Google Calendar
                                </button>
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
                                <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Section */}
                {user?.aiAgent?.status !== 'not_created' && (
                    <div className="mt-8 bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Chat with your AI Agent</h2>
                        </div>
                        
                        <div className="p-6">
                            {/* Chat History */}
                            <div className="h-64 overflow-y-auto mb-4 space-y-3 border border-gray-200 rounded p-4">
                                {chatHistory.length === 0 ? (
                                    <p className="text-gray-500 text-center">Start a conversation with your AI agent!</p>
                                ) : (
                                    chatHistory.map((chat, index) => (
                                        <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                chat.type === 'user' 
                                                    ? 'bg-blue-600 text-white'
                                                    : chat.type === 'error'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                <p className="text-sm">{chat.message}</p>
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
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isChatLoading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard; 