"use client";

import { useState, useEffect } from 'react';
import { Users, MessageCircle, Calendar, CheckCircle } from 'lucide-react';

const A2ATestComponent = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    // Predefined test messages
    const testMessages = [
        'Check availability for tomorrow at 2 PM',
        'Are you free for a meeting on Friday at 3 PM?',
        'Schedule team standup for Monday at 9 AM',
        'What meetings do you have this week?',
        'Create event "Project Review" tomorrow at 4 PM'
    ];

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/boss/employees');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.employees || []);
            } else {
                console.error('Failed to fetch employees');
                // Fallback to mock data for testing
                setEmployees([
                    { id: '1', name: 'John Doe', email: 'john@company.com', timezone: 'America/New_York', agentStatus: 'calendar_connected' },
                    { id: '2', name: 'Jane Smith', email: 'jane@company.com', timezone: 'Europe/London', agentStatus: 'created' },
                    { id: '3', name: 'Mike Johnson', email: 'mike@company.com', timezone: 'Asia/Tokyo', agentStatus: 'calendar_connected' }
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            // Fallback to mock data for testing
            setEmployees([
                { id: '1', name: 'John Doe', email: 'john@company.com', timezone: 'America/New_York', agentStatus: 'calendar_connected' },
                { id: '2', name: 'Jane Smith', email: 'jane@company.com', timezone: 'Europe/London', agentStatus: 'created' },
                { id: '3', name: 'Mike Johnson', email: 'mike@company.com', timezone: 'Asia/Tokyo', agentStatus: 'calendar_connected' }
            ]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const testA2ACommunication = async () => {
        if (!selectedEmployee || !testMessage.trim()) {
            alert('Please select an employee and enter a test message');
            return;
        }

        setIsLoading(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/boss/a2a/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: selectedEmployee,
                    testMessage: testMessage.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                setTestResult({
                    success: true,
                    boss: data.boss,
                    employee: data.employee,
                    testResult: data.testResult,
                    timestamp: new Date().toLocaleTimeString()
                });
            } else {
                setTestResult({
                    success: false,
                    error: data.error || 'Test failed'
                });
            }
        } catch (error) {
            console.error('A2A test error:', error);
            setTestResult({
                success: false,
                error: 'Failed to test A2A communication'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-2">A2A Communication Test</h2>
                <p className="text-gray-600 text-sm">
                    Test Agent-to-Agent communication between Boss AI and Employee AI agents
                </p>
            </div>

            <div className="space-y-6">
                {/* Employee Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Employee
                    </label>
                    {loadingEmployees ? (
                        <div className="text-sm text-gray-500">Loading employees...</div>
                    ) : (
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        >
                            <option value="">Choose an employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.email}) - {emp.timezone} - {emp.agentStatus}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Test Message */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Message
                    </label>
                    <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Enter your message to test A2A communication..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        rows={3}
                    />
                    
                    {/* Quick Test Messages */}
                    <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Quick test messages:</p>
                        <div className="flex flex-wrap gap-2">
                            {testMessages.map((msg, index) => (
                                <button
                                    key={index}
                                    onClick={() => setTestMessage(msg)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                                >
                                    {msg.length > 30 ? msg.substring(0, 30) + '...' : msg}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Test Button */}
                <button
                    onClick={testA2ACommunication}
                    disabled={isLoading || !selectedEmployee || !testMessage.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Testing A2A Communication...
                        </>
                    ) : (
                        <>
                            <MessageCircle size={20} className="mr-2" />
                            Test A2A Communication
                        </>
                    )}
                </button>

                {/* Test Results */}
                {testResult && (
                    <div className={`p-4 rounded-lg border ${
                        testResult.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center mb-3">
                            {testResult.success ? (
                                <CheckCircle size={20} className="text-green-600 mr-2" />
                            ) : (
                                <div className="w-5 h-5 bg-red-500 rounded-full mr-2"></div>
                            )}
                            <h3 className={`font-medium ${
                                testResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                                {testResult.success ? 'A2A Communication Successful' : 'A2A Communication Failed'}
                            </h3>
                        </div>

                        {testResult.success ? (
                            <div className="space-y-3">
                                <div className="text-sm">
                                    <p className="text-green-700">
                                        <strong>Boss:</strong> {testResult.boss?.name} at {testResult.boss?.company}
                                    </p>
                                    <p className="text-green-700">
                                        <strong>Employee:</strong> {testResult.employee?.name} ({testResult.employee?.email})
                                    </p>
                                    <p className="text-green-700">
                                        <strong>Time:</strong> {testResult.timestamp}
                                    </p>
                                </div>

                                {testResult.testResult && (
                                    <div className="bg-white p-3 rounded border border-green-300">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Employee AI Response:</p>
                                        <p className="text-sm text-gray-800">
                                            {testResult.testResult.employee_response || 'No response received'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-red-700 text-sm">
                                {testResult.error}
                            </p>
                        )}
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-blue-900 font-medium mb-2">How A2A Communication Works:</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>1. Boss AI analyzes your message</li>
                        <li>2. Filters employees by timezone (if needed)</li>
                        <li>3. Sends request to Employee AI agent</li>
                        <li>4. Employee AI checks calendar via MCP</li>
                        <li>5. Returns response back to Boss AI</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default A2ATestComponent;