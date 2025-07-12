"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, Calendar } from 'lucide-react';

const BossDashboard = () => {
    const router = useRouter();
    const [boss, setBoss] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [agentError, setAgentError] = useState(null);

    useEffect(() => {
        fetchBossData();
    }, []);

    const fetchBossData = async () => {
        try {
            const response = await fetch('/api/boss/agent/status');
            if (response.ok) {
                const data = await response.json();
                setBoss(data.boss);
                setAgentError(null);
            } else {
                router.push('/boss/login');
            }
        } catch (error) {
            console.error('Failed to fetch boss data:', error);
            setAgentError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!chatMessage.trim()) return;
        
        setIsChatLoading(true);
        const userMessage = chatMessage;
        setChatMessage('');
        
        setChatHistory(prev => [...prev, { type: 'boss', message: userMessage }]);
        
        try {
            const response = await fetch('/api/boss/agent/chat', {
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
                if (data.error === 'Boss AI Agent not found') {
                    errorMessage = 'Your Boss AI agent needs to be initialized. Please refresh the page or log out and log back in.';
                }
                setChatHistory(prev => [...prev, { type: 'error', message: errorMessage }]);
            }
        } catch (error) {
            console.error('Boss chat error:', error);
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
            const response = await fetch('/api/boss/user/upload-photo', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (data.success) {
                setBoss(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
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
            await fetch('/api/boss/auth/logout', { method: 'POST' });
            router.push('/boss/login');
        } catch (error) {
            console.error('Retry error:', error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Boss Dashboard...</p>
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
                            <h1 className="text-3xl font-bold text-black">
                                Welcome back, {boss?.name}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage your company, team, and AI-powered business operations
                            </p>
                            <div className="flex items-center mt-3 space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Building2 size={16} className="text-blue-600" />
                                    <span className="text-sm text-black font-medium">{boss?.company}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm text-black">{boss?.position}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Boss AI Status</p>
                                <div className="flex items-center mt-1">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                        boss?.bossAgent?.status === 'active' ? 'bg-green-500' : 
                                        boss?.bossAgent?.status === 'created' ? 'bg-blue-600' : 'bg-gray-400'
                                    }`}></div>
                                    <span className="text-sm font-medium text-black">
                                        {boss?.bossAgent?.status === 'active' ? 'Active' : 
                                         boss?.bossAgent?.status === 'created' ? 'Ready' : 'Initializing'}
                                    </span>
                                </div>
                            </div>
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
                                    <span className="text-black font-medium">{agentError}</span>
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                                <p className="text-2xl font-bold text-black">24</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">This Month Meetings</p>
                                <p className="text-2xl font-bold text-black">157</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Productivity Score</p>
                                <p className="text-2xl font-bold text-black">94%</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">AI Efficiency</p>
                                <p className="text-2xl font-bold text-black">89%</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Boss Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-black mb-6">Boss Profile</h2>
                            
                            <div className="text-center mb-6">
                                <div className="w-24 h-24 mx-auto mb-4 relative">
                                    {boss?.profilePhoto ? (
                                        <img
                                            src={boss.profilePhoto}
                                            alt="Boss Profile"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                            <Building2 size={32} className="text-blue-600" />
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
                                    <span className="text-sm font-medium text-gray-600">Email</span>
                                    <span className="text-sm text-black">{boss?.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Company</span>
                                    <span className="text-sm text-black">{boss?.company}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Position</span>
                                    <span className="text-sm text-black">{boss?.position}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Timezone</span>
                                    <span className="text-sm text-black">{boss?.timezone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boss AI Agent Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-black mb-6">Boss AI Agent</h2>
                            
                            <div className="space-y-6">
                                {/* Agent Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${
                                            boss?.bossAgent?.status === 'active' ? 'bg-green-500' : 
                                            boss?.bossAgent?.status === 'created' ? 'bg-blue-600' : 'bg-gray-400'
                                        }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-black">Boss AI Status</p>
                                            <p className="text-xs text-black">
                                                {boss?.bossAgent?.status === 'active' ? 'Fully Operational' : 
                                                 boss?.bossAgent?.status === 'created' ? 'Ready for Management' : 'Setting Up'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        boss?.bossAgent?.status === 'active' ? 'bg-green-100 text-green-800' : 
                                        boss?.bossAgent?.status === 'created' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {boss?.bossAgent?.status === 'active' ? 'Active' : 
                                         boss?.bossAgent?.status === 'created' ? 'Ready' : 'Pending'}
                                    </span>
                                </div>
                                
                                {/* Calendar Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${
                                            boss?.googleCalendar?.connected ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-black">Google Calendar</p>
                                            <p className="text-xs text-black">
                                                {boss?.googleCalendar?.connected ? 'Connected & Synced' : 'Not Connected'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        boss?.googleCalendar?.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {boss?.googleCalendar?.connected ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    {!boss?.googleCalendar?.connected && (
                                        <button
                                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Connect Google Calendar
                                        </button>
                                    )}

                                    {boss?.bossAgent?.status === 'not_created' && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <p className="text-black text-sm mb-3">
                                                Your Boss AI agent is being initialized. This usually takes just a moment.
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

                    {/* Boss System Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-black mb-6">Management System</h2>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-black uppercase tracking-wide mb-1">Boss Agent ID</p>
                                    <p className="text-sm font-mono text-black break-all">
                                        {boss?.bossAgent?.agentId || 'Pending Creation'}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xl font-bold text-blue-600">
                                            {boss?.bossAgent?.status === 'active' ? '100%' : 
                                             boss?.bossAgent?.status === 'created' ? '75%' : '25%'}
                                        </p>
                                        <p className="text-xs text-black mt-1">Setup Complete</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xl font-bold text-black">24/7</p>
                                        <p className="text-xs text-black mt-1">Availability</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-black">Company Performance</span>
                                        <span className="text-sm text-green-600 font-medium">+12%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{width: '89%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boss AI Chat Interface */}
                {boss?.bossAgent?.status !== 'not_created' && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-black">Boss AI Assistant</h2>
                            <p className="text-gray-600 mt-1">Manage your team, analyze performance, schedule meetings, and get business insights</p>
                        </div>
                        
                        <div className="p-6">
                            {/* Chat History */}
                            <div className="h-80 overflow-y-auto mb-6 space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                {chatHistory.length === 0 ? (
                                    <div className="text-center text-gray-500 py-12">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Building2 className="text-blue-600" size={24} />
                                        </div>
                                        <p className="font-medium text-black mb-2">Your Boss AI is ready!</p>
                                        <p className="text-sm">Ask about team management, business insights, or schedule coordination</p>
                                    </div>
                                ) : (
                                    chatHistory.map((chat, index) => (
                                        <div key={index} className={`flex ${chat.type === 'boss' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md px-4 py-3 rounded-lg ${
                                                chat.type === 'boss' 
                                                    ? 'bg-blue-600 text-white'
                                                    : chat.type === 'error'
                                                    ? 'bg-red-50 text-red-800 border border-red-200'
                                                    : 'bg-white text-black border border-gray-200'
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
                                    placeholder="Ask your Boss AI anything..."
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
                            
                            {/* Boss Quick Commands */}
                            {chatHistory.length === 0 && (
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <p className="text-sm font-medium text-black mb-3">Boss Commands:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            "Show team performance metrics",
                                            "Schedule all-hands meeting",
                                            "Analyze this month's productivity",
                                            "Get department status reports",
                                            "Plan quarterly business review",
                                            "Review employee schedules"
                                        ].map((command, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setChatMessage(command)}
                                                className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-sm text-black transition-colors"
                                            >
                                                {command}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Boss Agent Setup Required */}
                {boss?.bossAgent?.status === 'not_created' && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Building2 size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-black mb-3">Boss AI Agent Initialization</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Your Boss AI agent is being set up with management capabilities. This process usually completes within a few moments.
                            </p>
                            <button
                                onClick={fetchBossData}
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

export default BossDashboard;