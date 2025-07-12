"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, Calendar, MessageSquare, Clock, Target, BarChart3, Activity } from 'lucide-react';
import A2ATestComponent from './A2ATestComponent';

const BossDashboard = () => {
    const router = useRouter();
    const [boss, setBoss] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [agentError, setAgentError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchBossData();
        fetchAnalytics();
        fetchTeamData();
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

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/boss/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.analytics);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const fetchTeamData = async () => {
        try {
            const response = await fetch('/api/boss/team');
            if (response.ok) {
                const data = await response.json();
                setTeamData(data.team);
            }
        } catch (error) {
            console.error('Failed to fetch team data:', error);
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

    const sendMessageToEmployee = async (employeeId, message) => {
        try {
            const response = await fetch('/api/boss/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send_message',
                    employeeId,
                    message
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(`Message sent to employee successfully!`);
            } else {
                alert(`Failed to send message: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to send message to employee:', error);
            alert('Failed to send message to employee');
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

    const StatCard = ({ title, value, icon: Icon, color, change, description }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-black">{value}</p>
                    {change && (
                        <p className={`text-sm ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {change.positive ? '↗' : '↘'} {change.value}
                        </p>
                    )}
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    )}
                </div>
                <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

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
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'overview', name: 'Overview', icon: BarChart3 },
                                { id: 'team', name: 'Team Management', icon: Users },
                                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                                { id: 'chat', name: 'AI Assistant', icon: MessageSquare }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                                >
                                    <tab.icon size={16} />
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

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
                                    onClick={fetchBossData}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Employees"
                                value={analytics?.overview?.totalEmployees || 0}
                                icon={Users}
                                color="bg-blue-600"
                                change={{ positive: true, value: `+${analytics?.overview?.newThisMonth || 0} this month` }}
                                description="Team members"
                            />
                            <StatCard
                                title="Active AI Agents"
                                value={analytics?.overview?.activeAgents || 0}
                                icon={Activity}
                                color="bg-green-600"
                                change={{ positive: true, value: `${analytics?.overview?.activationRate || 0}% activated` }}
                                description="Operational agents"
                            />
                            <StatCard
                                title="Calendar Connected"
                                value={analytics?.overview?.calendarConnected || 0}
                                icon={Calendar}
                                color="bg-purple-600"
                                change={{ positive: true, value: `${analytics?.overview?.calendarConnectionRate || 0}% connected` }}
                                description="Google Calendar sync"
                            />
                            <StatCard
                                title="Productivity Score"
                                value={`${analytics?.productivity?.averageProductivityScore || 0}%`}
                                icon={TrendingUp}
                                color="bg-orange-600"
                                change={{ positive: true, value: "+5% this week" }}
                                description="Team efficiency"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setActiveTab('team')}
                                    className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <Users className="w-6 h-6 text-blue-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-black">Manage Team</p>
                                        <p className="text-sm text-gray-600">View and manage employees</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-black">View Analytics</p>
                                        <p className="text-sm text-gray-600">Team performance insights</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                >
                                    <MessageSquare className="w-6 h-6 text-purple-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-black">AI Assistant</p>
                                        <p className="text-sm text-gray-600">Chat with Boss AI</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {analytics?.recentActivity?.slice(0, 5).map((activity, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                        <div className={`w-2 h-2 rounded-full ${
                                            activity.type === 'agent_created' ? 'bg-green-500' :
                                            activity.type === 'calendar_connected' ? 'bg-blue-500' : 'bg-purple-500'
                                        }`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-black">{activity.message}</p>
                                            <p className="text-xs text-gray-500">{activity.employee} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) || (
                                    <p className="text-gray-500 text-sm">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Management Tab */}
                {activeTab === 'team' && (
                    <div className="space-y-8">
                        {/* Team Overview Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Team Members"
                                value={teamData?.statistics?.total || 0}
                                icon={Users}
                                color="bg-blue-600"
                            />
                            <StatCard
                                title="Active Agents"
                                value={teamData?.statistics?.active || 0}
                                icon={Activity}
                                color="bg-green-600"
                            />
                            <StatCard
                                title="Setup Required"
                                value={teamData?.statistics?.setupRequired || 0}
                                icon={Clock}
                                color="bg-yellow-600"
                            />
                            <StatCard
                                title="Calendar Connected"
                                value={teamData?.statistics?.calendarConnected || 0}
                                icon={Calendar}
                                color="bg-purple-600"
                            />
                        </div>

                        {/* Employee List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-black">Team Members</h3>
                                <p className="text-gray-600 mt-1">Manage your team and their AI agents</p>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {teamData?.employees?.map((employee) => (
                                        <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    {employee.profilePhoto ? (
                                                        <img src={employee.profilePhoto} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-600">
                                                            {employee.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-black">{employee.name}</p>
                                                    <p className="text-sm text-gray-600">{employee.email}</p>
                                                    <p className="text-xs text-gray-500">{employee.timezone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center">
                                                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                                                        employee.statusColor === 'green' ? 'bg-green-500' :
                                                        employee.statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}></div>
                                                    <span className="text-xs text-gray-600">{employee.status}</span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-black">{employee.performance?.productivityScore || 0}%</p>
                                                    <p className="text-xs text-gray-600">Productivity</p>
                                                </div>
                                                <button
                                                    onClick={() => sendMessageToEmployee(employee.id, "Check your availability for tomorrow's team meeting")}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                    )) || (
                                        <p className="text-gray-500 text-center py-8">No team members found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        {/* Performance Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Average Productivity"
                                value={`${analytics?.productivity?.averageProductivityScore || 0}%`}
                                icon={TrendingUp}
                                color="bg-green-600"
                                change={{ positive: true, value: "+3% vs last month" }}
                            />
                            <StatCard
                                title="Team Meetings"
                                value={analytics?.productivity?.averageMeetingsPerWeek || 0}
                                icon={Calendar}
                                color="bg-blue-600"
                                change={{ positive: true, value: "+2 this week" }}
                            />
                            <StatCard
                                title="Collaboration Rate"
                                value={`${analytics?.productivity?.teamCollaborationRate || 0}%`}
                                icon={Users}
                                color="bg-purple-600"
                                change={{ positive: true, value: "+5% improvement" }}
                            />
                        </div>

                        {/* Charts and Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Timezone Distribution */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-black mb-4">Timezone Distribution</h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics?.distributions?.timezone || {}).map(([tz, count]) => (
                                        <div key={tz} className="flex items-center justify-between">
                                            <span className="text-sm text-black">{tz}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${(count / (analytics?.overview?.totalEmployees || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-black">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Agent Status Distribution */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-black mb-4">Agent Status</h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics?.distributions?.agentStatus || {}).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm text-black capitalize">{status.replace('_', ' ')}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            status === 'calendar_connected' ? 'bg-green-500' :
                                                            status === 'created' ? 'bg-blue-500' : 'bg-gray-500'
                                                        }`}
                                                        style={{ width: `${(count / (analytics?.overview?.totalEmployees || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-black">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && boss?.bossAgent?.status !== 'not_created' && (
                    <div className="space-y-8">
                        {/* Boss AI Chat Interface */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-black">Boss AI Assistant</h2>
                                <p className="text-gray-600 mt-1">Manage your team, analyze performance, schedule meetings, and get business insights</p>
                            </div>
                            
                            <div className="p-6">
                                {/* Chat History */}
                                <div className="h-96 overflow-y-auto mb-6 space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
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

                        {/* A2A Testing Component */}
                        <A2ATestComponent />
                    </div>
                )}

                {/* Agent Setup Required */}
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