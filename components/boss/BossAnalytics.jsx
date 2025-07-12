"use client";

import { Activity, Calendar, Clock, Globe, Target, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const BossAnalytics = () => {
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('productivity');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/boss/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.analytics);
            } else if (response.status === 401) {
                router.push('/boss/login');
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    const MetricCard = ({ title, value, change, icon: Icon, color, description }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-black">{value}</p>
                    {change && (
                        <p className={`text-sm mt-1 ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
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

    const ProgressBar = ({ label, value, max, color = 'blue' }) => (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-black">{label}</span>
                <span className="text-gray-600">{value}/{max}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${
                        color === 'blue' ? 'bg-blue-600' :
                        color === 'green' ? 'bg-green-600' :
                        color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-black">Team Analytics</h1>
                            <p className="text-gray-600 mt-2">
                                Comprehensive insights into your team's performance and productivity
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={fetchAnalytics}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Employees"
                        value={analytics?.overview?.totalEmployees || 0}
                        change={{ positive: true, value: `+${analytics?.overview?.newThisMonth || 0} this month` }}
                        icon={Users}
                        color="bg-blue-600"
                        description="Team size"
                    />
                    <MetricCard
                        title="Active AI Agents"
                        value={analytics?.overview?.activeAgents || 0}
                        change={{ positive: true, value: `${analytics?.overview?.activationRate || 0}% activation rate` }}
                        icon={Activity}
                        color="bg-green-600"
                        description="Operational agents"
                    />
                    <MetricCard
                        title="Calendar Integration"
                        value={`${analytics?.overview?.calendarConnectionRate || 0}%`}
                        change={{ positive: true, value: `${analytics?.overview?.calendarConnected || 0} connected` }}
                        icon={Calendar}
                        color="bg-purple-600"
                        description="Google Calendar sync"
                    />
                    <MetricCard
                        title="Avg Productivity"
                        value={`${analytics?.productivity?.averageProductivityScore || 0}%`}
                        change={{ positive: true, value: "+5% this week" }}
                        icon={TrendingUp}
                        color="bg-orange-600"
                        description="Team efficiency"
                    />
                </div>

                {/* Metric Selection Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex flex-wrap gap-4">
                            {[
                                { id: 'productivity', name: 'Productivity', icon: TrendingUp },
                                { id: 'collaboration', name: 'Collaboration', icon: Users },
                                { id: 'calendar', name: 'Calendar Usage', icon: Calendar },
                                { id: 'distribution', name: 'Distribution', icon: Globe }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedMetric(tab.id)}
                                    className={`${
                                        selectedMetric === tab.id
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

                {/* Main Analytics Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column - Charts and Metrics */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Performance Trends */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Performance Trends</h3>
                            
                            {selectedMetric === 'productivity' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {analytics?.productivity?.averageProductivityScore || 85}%
                                            </p>
                                            <p className="text-sm text-gray-600">Average Score</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600">
                                                {analytics?.productivity?.averageMeetingsPerWeek || 12}
                                            </p>
                                            <p className="text-sm text-gray-600">Meetings/Week</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-600">
                                                {analytics?.productivity?.teamCollaborationRate || 88}%
                                            </p>
                                            <p className="text-sm text-gray-600">Collaboration</p>
                                        </div>
                                    </div>
                                    
                                    {/* Weekly Productivity Trend */}
                                    <div>
                                        <h4 className="font-medium text-black mb-4">Timezone Distribution</h4>
                                        <div className="space-y-3">
                                            {Object.entries(analytics?.distributions?.timezone || {}).map(([tz, count]) => (
                                                <div key={tz} className="flex items-center justify-between">
                                                    <span className="text-sm text-black">{tz}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ 
                                                                    width: `${(count / (analytics?.overview?.totalEmployees || 1)) * 100}%` 
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-black w-8">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-black mb-4">Agent Status Distribution</h4>
                                        <div className="space-y-3">
                                            {Object.entries(analytics?.distributions?.agentStatus || {}).map(([status, count]) => (
                                                <div key={status} className="flex items-center justify-between">
                                                    <span className="text-sm text-black capitalize">
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    status === 'calendar_connected' ? 'bg-green-500' :
                                                                    status === 'created' ? 'bg-blue-500' : 'bg-gray-500'
                                                                }`}
                                                                style={{ 
                                                                    width: `${(count / (analytics?.overview?.totalEmployees || 1)) * 100}%` 
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-black w-8">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Monthly Comparison */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Monthly Comparison</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Total Meetings</p>
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-black">
                                                {analytics?.trends?.monthlyComparison?.thisMonth?.totalMeetings || 0}
                                            </p>
                                            <p className="text-xs text-gray-500">This Month</p>
                                        </div>
                                        <div className="text-green-600">
                                            <TrendingUp size={16} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg text-gray-600">
                                                {analytics?.trends?.monthlyComparison?.lastMonth?.totalMeetings || 0}
                                            </p>
                                            <p className="text-xs text-gray-500">Last Month</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Productivity Score</p>
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-black">
                                                {analytics?.trends?.monthlyComparison?.thisMonth?.productivityScore || 0}%
                                            </p>
                                            <p className="text-xs text-gray-500">This Month</p>
                                        </div>
                                        <div className="text-green-600">
                                            <TrendingUp size={16} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg text-gray-600">
                                                {analytics?.trends?.monthlyComparison?.lastMonth?.productivityScore || 0}%
                                            </p>
                                            <p className="text-xs text-gray-500">Last Month</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Active Employees</p>
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-black">
                                                {analytics?.trends?.monthlyComparison?.thisMonth?.activeEmployees || 0}
                                            </p>
                                            <p className="text-xs text-gray-500">This Month</p>
                                        </div>
                                        <div className="text-green-600">
                                            <TrendingUp size={16} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg text-gray-600">
                                                {analytics?.trends?.monthlyComparison?.lastMonth?.activeEmployees || 0}
                                            </p>
                                            <p className="text-xs text-gray-500">Last Month</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Recent Activity & Insights */}
                    <div className="space-y-8">
                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {analytics?.recentActivity?.slice(0, 6).map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${
                                            activity.type === 'agent_created' ? 'bg-green-500' :
                                            activity.type === 'calendar_connected' ? 'bg-blue-500' : 'bg-purple-500'
                                        }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-black">{activity.message}</p>
                                            <p className="text-xs text-gray-500">
                                                {activity.employee} • {new Date(activity.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )) || (
                                    <p className="text-gray-500 text-sm">No recent activity</p>
                                )}
                            </div>
                        </div>

                        {/* Key Insights */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Key Insights</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start space-x-3">
                                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Productivity Improvement</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Team productivity has increased by 5% this week. Calendar integration is driving efficiency.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-start space-x-3">
                                        <Activity className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-green-900">High Engagement</p>
                                            <p className="text-xs text-green-700 mt-1">
                                                {analytics?.overview?.activationRate || 0}% of your team has active AI agents. 
                                                Great adoption rate!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-start space-x-3">
                                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-900">Setup Opportunity</p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                {(analytics?.overview?.totalEmployees || 0) - (analytics?.overview?.activeAgents || 0)} team members 
                                                still need agent setup. Consider sending reminders.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance Goals */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Performance Goals</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-black">Team Activation</span>
                                        <span className="text-sm text-gray-600">
                                            {analytics?.overview?.activationRate || 0}% / 100%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${Math.min(analytics?.overview?.activationRate || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-black">Calendar Integration</span>
                                        <span className="text-sm text-gray-600">
                                            {analytics?.overview?.calendarConnectionRate || 0}% / 90%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{ width: `${Math.min((analytics?.overview?.calendarConnectionRate || 0) / 90 * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-black">Team Productivity</span>
                                        <span className="text-sm text-gray-600">
                                            {analytics?.productivity?.averageProductivityScore || 0}% / 95%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full"
                                            style={{ width: `${Math.min((analytics?.productivity?.averageProductivityScore || 0) / 95 * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                    <p className="text-sm font-medium text-blue-900">Send Setup Reminders</p>
                                    <p className="text-xs text-blue-700">Notify inactive team members</p>
                                </button>
                                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                    <p className="text-sm font-medium text-green-900">Export Analytics Report</p>
                                    <p className="text-xs text-green-700">Download detailed insights</p>
                                </button>
                                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                                    <p className="text-sm font-medium text-purple-900">Schedule Team Review</p>
                                    <p className="text-xs text-purple-700">Plan performance meeting</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BossAnalytics;