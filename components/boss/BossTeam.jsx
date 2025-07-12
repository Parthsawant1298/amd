"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, MessageCircle, Calendar, Clock, TrendingUp, Activity, AlertCircle, CheckCircle } from 'lucide-react';

const BossTeam = () => {
    const router = useRouter();
    const [teamData, setTeamData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            const response = await fetch('/api/boss/team');
            if (response.ok) {
                const data = await response.json();
                setTeamData(data.team);
            } else if (response.status === 401) {
                router.push('/boss/login');
            }
        } catch (error) {
            console.error('Failed to fetch team data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessageToEmployee = async (employeeId) => {
        if (!messageText.trim()) {
            alert('Please enter a message');
            return;
        }

        setIsSendingMessage(true);
        try {
            const response = await fetch('/api/boss/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send_message',
                    employeeId,
                    message: messageText
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Message sent successfully!');
                setMessageText('');
                setSelectedEmployee(null);
            } else {
                alert(`Failed to send message: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        } finally {
            setIsSendingMessage(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Setup Required': return 'bg-yellow-100 text-yellow-800';
            case 'Inactive': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Active': return <CheckCircle size={16} className="text-green-600" />;
            case 'Setup Required': return <Clock size={16} className="text-yellow-600" />;
            case 'Inactive': return <AlertCircle size={16} className="text-red-600" />;
            default: return <AlertCircle size={16} className="text-gray-600" />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Team Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-black">Team Management</h1>
                            <p className="text-gray-600 mt-2">
                                Manage your team members and their AI agents
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">{teamData?.statistics?.total || 0}</p>
                                <p className="text-sm text-gray-500">Total Members</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Team Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Members</p>
                                <p className="text-2xl font-bold text-black">{teamData?.statistics?.total || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                                <p className="text-2xl font-bold text-black">{teamData?.statistics?.active || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Activity className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Setup Required</p>
                                <p className="text-2xl font-bold text-black">{teamData?.statistics?.setupRequired || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Calendar Connected</p>
                                <p className="text-2xl font-bold text-black">{teamData?.statistics?.calendarConnected || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Members List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-black">Team Members</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                    {teamData?.statistics?.active || 0} active of {teamData?.statistics?.total || 0} total
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {teamData?.employees?.length > 0 ? (
                            <div className="space-y-4">
                                {teamData.employees.map((employee) => (
                                    <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            {/* Profile Photo */}
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                {employee.profilePhoto ? (
                                                    <img 
                                                        src={employee.profilePhoto} 
                                                        alt={employee.name} 
                                                        className="w-12 h-12 rounded-full object-cover" 
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {employee.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Employee Info */}
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <p className="font-medium text-black">{employee.name}</p>
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                                        {getStatusIcon(employee.status)}
                                                        <span>{employee.status}</span>
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{employee.email}</p>
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <span className="text-xs text-gray-500">{employee.timezone}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {employee.daysSinceJoining} days since joining
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance & Actions */}
                                        <div className="flex items-center space-x-6">
                                            {/* Performance Metrics */}
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-black">
                                                    {employee.performance?.productivityScore || 0}%
                                                </p>
                                                <p className="text-xs text-gray-600">Productivity</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-black">
                                                    {employee.performance?.meetingsThisWeek || 0}
                                                </p>
                                                <p className="text-xs text-gray-600">Meetings</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-black">
                                                    {employee.performance?.availability || 0}%
                                                </p>
                                                <p className="text-xs text-gray-600">Available</p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setSelectedEmployee(employee)}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                                                >
                                                    <MessageCircle size={12} />
                                                    <span>Message</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const message = `Check your availability for tomorrow's team meeting`;
                                                        fetch('/api/boss/team', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                action: 'send_message',
                                                                employeeId: employee.id,
                                                                message
                                                            }),
                                                        }).then(res => res.json())
                                                        .then(data => {
                                                            if (data.success) {
                                                                alert('Availability check sent!');
                                                            } else {
                                                                alert('Failed to send message');
                                                            }
                                                        });
                                                    }}
                                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                                                >
                                                    <Calendar size={12} />
                                                    <span>Check</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No team members found</p>
                                <p className="text-sm text-gray-400 mt-2">Team members will appear here once they register</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timezone Groups */}
                {teamData?.timezoneGroups && Object.keys(teamData.timezoneGroups).length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-black">Team by Timezone</h3>
                            <p className="text-gray-600 mt-1">Organize your team based on geographic distribution</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(teamData.timezoneGroups).map(([timezone, employees]) => (
                                    <div key={timezone} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-black">{timezone}</h4>
                                            <span className="text-sm text-gray-500">{employees.length} members</span>
                                        </div>
                                        <div className="space-y-2">
                                            {employees.map((emp) => (
                                                <div key={emp.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-black">{emp.name}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(emp.status)}`}>
                                                        {emp.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Performance Overview */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-black">Team Performance</h3>
                        <p className="text-gray-600 mt-1">Overall team metrics and productivity insights</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <TrendingUp className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-black">{teamData?.performance?.averageProductivity || 85}%</p>
                                <p className="text-sm text-gray-600">Avg Productivity</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Calendar className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-black">{teamData?.performance?.totalMeetings || 150}</p>
                                <p className="text-sm text-gray-600">Total Meetings</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Users className="w-8 h-8 text-purple-600" />
                                </div>
                                <p className="text-2xl font-bold text-black">{teamData?.performance?.collaborationRate || 90}%</p>
                                <p className="text-sm text-gray-600">Collaboration</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Activity className="w-8 h-8 text-orange-600" />
                                </div>
                                <p className="text-2xl font-bold text-black">{teamData?.performance?.efficiency || 92}%</p>
                                <p className="text-sm text-gray-600">Efficiency</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-black mb-4">
                            Send Message to {selectedEmployee.name}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                    rows={4}
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setSelectedEmployee(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    disabled={isSendingMessage}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => sendMessageToEmployee(selectedEmployee.id)}
                                    disabled={isSendingMessage || !messageText.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSendingMessage ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                        {/* Quick Message Templates */}
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Quick Messages:</p>
                            <div className="space-y-2">
                                {[
                                    "Check your availability for tomorrow's meeting",
                                    "Please update your calendar for this week",
                                    "Schedule a 1-on-1 meeting with me",
                                    "Review the project deadline"
                                ].map((template, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setMessageText(template)}
                                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1"
                                    >
                                        {template}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BossTeam;