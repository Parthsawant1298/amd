"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
        { name: 'Profile', href: '/profile', requiresAuth: true },
        { name: 'Calendar', href: '/calendar', requiresAuth: true },
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">AI</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Agent Platform</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-8">
                            {/* Navigation Links */}
                            {navLinks.map((link) => {
                                if (link.requiresAuth && !user) return null;
                                
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}

                            {/* User Section */}
                            {!isLoading && (
                                user ? (
                                    <div className="flex items-center space-x-4">
                                        {/* User Info */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                                                {user.profilePhoto ? (
                                                    <img
                                                        src={user.profilePhoto}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                                                        {user.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {user.name}
                                            </span>
                                        </div>

                                        {/* Agent Status */}
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                user.aiAgent?.status === 'calendar_connected' 
                                                    ? 'bg-green-500' 
                                                    : user.aiAgent?.status === 'created'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-gray-400'
                                            }`}></div>
                                            <span className="text-xs text-gray-500">
                                                {user.aiAgent?.status === 'calendar_connected' && 'AI Ready'}
                                                {user.aiAgent?.status === 'created' && 'AI Active'}
                                                {user.aiAgent?.status === 'not_created' && 'AI Pending'}
                                            </span>
                                        </div>

                                        {/* Logout */}
                                        <button
                                            onClick={logout}
                                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            href="/login"
                                            className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-blue-600 focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-white">
                            {/* Mobile Navigation Links */}
                            {navLinks.map((link) => {
                                if (link.requiresAuth && !user) return null;
                                
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}

                            {/* Mobile User Section */}
                            {!isLoading && (
                                user ? (
                                    <div className="border-t border-gray-200 pt-3 mt-3">
                                        {/* User Info */}
                                        <div className="flex items-center px-3 py-2">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 mr-3">
                                                {user.profilePhoto ? (
                                                    <img
                                                        src={user.profilePhoto}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                        {user.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>

                                        {/* Agent Status */}
                                        <div className="px-3 py-2">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    user.aiAgent?.status === 'calendar_connected' 
                                                        ? 'bg-green-500' 
                                                        : user.aiAgent?.status === 'created'
                                                        ? 'bg-yellow-500'
                                                        : 'bg-gray-400'
                                                }`}></div>
                                                <span className="text-xs text-gray-500">
                                                    AI Agent: {user.aiAgent?.status === 'calendar_connected' ? 'Ready' : 
                                                              user.aiAgent?.status === 'created' ? 'Active' : 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    user.googleCalendar?.connected ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                                <span className="text-xs text-gray-500">
                                                    Calendar: {user.googleCalendar?.connected ? 'Connected' : 'Not Connected'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Logout */}
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                                        <Link
                                            href="/login"
                                            className="block px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="block px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors mx-3"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
