"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Brain, User, LogOut, ChevronDown, Settings, Calendar, Building2 } from "lucide-react";

const BossNavbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [boss, setBoss] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const profileMenuRef = useRef(null);

    // Navigation items for boss
    const navItems = [
        { name: 'Dashboard', href: '/boss/dashboard', requiresAuth: true },
        { name: 'Profile', href: '/boss/profile', requiresAuth: true },
        { name: 'Team Management', href: '/boss/team', requiresAuth: true },
        { name: 'Analytics', href: '/boss/analytics', requiresAuth: true },
    ];

    // Handle scroll effect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsScrolled(window.scrollY > 10);
        }
        
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        fetchBoss();
    }, []);

    // Handle click outside profile menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        
        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isProfileMenuOpen]);

    const fetchBoss = async () => {
        try {
            const response = await fetch('/api/boss/agent/status');
            if (response.ok) {
                const data = await response.json();
                setBoss(data.boss);
            }
        } catch (error) {
            console.error('Failed to fetch boss:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/boss/auth/logout', { method: 'POST' });
            setBoss(null);
            router.push('/');
        } catch (error) {
            console.error('Boss logout error:', error);
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200" 
                    : "bg-white border-b border-gray-200"
            }`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href={boss ? "/boss/dashboard" : "/"} className="flex items-center gap-2 text-xl font-bold">
                        <Brain className="h-6 w-6 text-blue-600" />
                        <span className="text-gray-900">SmartCalendarAI</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Boss</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {!isLoading && boss && (
                        <nav className="hidden lg:flex items-center">
                            <ul className="flex gap-8">
                                {navItems.map((item) => {
                                    if (item.requiresAuth && !boss) return null;
                                    
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={`text-gray-700 hover:text-blue-600 transition-colors duration-300 relative py-1
                                                 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-blue-600
                                                 after:transition-all after:duration-300 hover:after:w-full ${
                                                   isActive ? "text-blue-600 after:w-full" : ""
                                                 }`}
                                            >
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Boss Profile Section (Desktop) */}
                            <div className="flex items-center ml-8 space-x-4">
                                {/* Boss Profile Dropdown */}
                                <div className="relative" ref={profileMenuRef}>
                                    <button 
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none transition-colors"
                                        aria-expanded={isProfileMenuOpen}
                                        aria-haspopup="true"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-blue-200 overflow-hidden flex items-center justify-center">
                                            {boss?.profilePhoto ? (
                                                <img 
                                                    src={boss.profilePhoto} 
                                                    alt={boss.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Building2 size={20} className="text-blue-600" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <span className="font-medium block">{boss.name?.split(' ')[0]}</span>
                                            <span className="text-xs text-gray-500">{boss.position}</span>
                                        </div>
                                        <ChevronDown 
                                            size={16} 
                                            className={`transition-transform duration-200 ${
                                                isProfileMenuOpen ? 'rotate-180' : ''
                                            }`} 
                                        />
                                    </button>
                                    
                                    {isProfileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-10 border border-gray-200">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900 truncate">{boss.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{boss.email}</p>
                                                <p className="text-xs text-blue-600 font-medium">{boss.company} • {boss.position}</p>
                                                <div className="flex items-center mt-2 space-x-4">
                                                    <div className="flex items-center space-x-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            boss.bossAgent?.status === 'active' 
                                                                ? 'bg-green-500' 
                                                                : boss.bossAgent?.status === 'created'
                                                                ? 'bg-blue-500'
                                                                : 'bg-gray-400'
                                                        }`}></div>
                                                        <span className="text-xs text-gray-500">
                                                            Boss AI {boss.bossAgent?.status === 'active' ? 'Active' : 
                                                                   boss.bossAgent?.status === 'created' ? 'Ready' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            boss.googleCalendar?.connected ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                        <span className="text-xs text-gray-500">
                                                            Calendar {boss.googleCalendar?.connected ? 'On' : 'Off'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link 
                                                href="/boss/profile" 
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            >
                                                <User size={16} className="mr-3" />
                                                <span>Boss Profile</span>
                                            </Link>
                                            
                                            <Link 
                                                href="/boss/team" 
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            >
                                                <Building2 size={16} className="mr-3" />
                                                <span>Team Management</span>
                                            </Link>

                                            <Link 
                                                href="/boss/settings" 
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            >
                                                <Settings size={16} className="mr-3" />
                                                <span>Settings</span>
                                            </Link>
                                            
                                            <div className="border-t border-gray-100 mt-2 pt-2">
                                                <button 
                                                    onClick={logout}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut size={16} className="mr-3" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </nav>
                    )}

                    {/* Guest Navigation (Desktop) */}
                    {!isLoading && !boss && (
                        <div className="hidden lg:flex items-center space-x-4">
                            <Link
                                href="/boss/login"
                                className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                            >
                                Boss Login
                            </Link>
                            <Link
                                href="/boss/register"
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                            >
                                Register as Boss
                            </Link>
                        </div>
                    )}

                    {/* Mobile menu button */}
                    <button 
                        className="lg:hidden text-gray-700 p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle mobile menu"
                        aria-expanded={isMenuOpen}
                    >
                        <div className="space-y-1.5 w-6">
                            <span 
                                className={`block w-6 h-0.5 bg-blue-600 transition-all duration-300 ${
                                    isMenuOpen ? 'rotate-45 translate-y-2' : ''
                                }`}
                            />
                            <span 
                                className={`block w-6 h-0.5 bg-blue-600 transition-all duration-300 ${
                                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                                }`}
                            />
                            <span 
                                className={`block w-6 h-0.5 bg-blue-600 transition-all duration-300 ${
                                    isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                                }`}
                            />
                        </div>
                    </button>
                </div>
                
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-200">
                        <div className="container mx-auto px-4 py-6">
                            {boss ? (
                                <>
                                    {/* Mobile Navigation Links */}
                                    <ul className="flex flex-col space-y-4 mb-6">
                                        {navItems.map((item) => {
                                            if (item.requiresAuth && !boss) return null;
                                            
                                            const isActive = pathname === item.href;
                                            return (
                                                <li key={item.name}>
                                                    <Link
                                                        href={item.href}
                                                        className={`text-gray-700 text-lg font-medium hover:text-blue-600 block py-2 ${
                                                            isActive ? "text-blue-600" : ""
                                                        }`}
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* Boss Profile Section (Mobile) */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-blue-200 overflow-hidden flex items-center justify-center">
                                                {boss?.profilePhoto ? (
                                                    <img 
                                                        src={boss.profilePhoto} 
                                                        alt={boss.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Building2 size={24} className="text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{boss.name}</p>
                                                <p className="text-sm text-gray-500">{boss.email}</p>
                                                <p className="text-sm text-blue-600 font-medium">{boss.company} • {boss.position}</p>
                                                <div className="flex items-center mt-1 space-x-4">
                                                    <div className="flex items-center space-x-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            boss.bossAgent?.status === 'active' 
                                                                ? 'bg-green-500' 
                                                                : boss.bossAgent?.status === 'created'
                                                                ? 'bg-blue-500'
                                                                : 'bg-gray-400'
                                                        }`}></div>
                                                        <span className="text-xs text-gray-500">
                                                            Boss AI {boss.bossAgent?.status === 'active' ? 'Active' : 
                                                                   boss.bossAgent?.status === 'created' ? 'Ready' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            boss.googleCalendar?.connected ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                        <span className="text-xs text-gray-500">
                                                            Calendar {boss.googleCalendar?.connected ? 'On' : 'Off'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Link 
                                                href="/boss/profile" 
                                                className="w-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 px-4 py-3 rounded-lg text-center transition-all duration-300 font-medium flex items-center justify-center"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <User size={18} className="mr-2" />
                                                Boss Profile
                                            </Link>
                                            
                                            <Link 
                                                href="/boss/team" 
                                                className="w-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 px-4 py-3 rounded-lg text-center transition-all duration-300 font-medium flex items-center justify-center"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Building2 size={18} className="mr-2" />
                                                Team Management
                                            </Link>
                                            
                                            <button 
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    logout();
                                                }}
                                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-lg text-center transition-all duration-300 font-medium flex items-center justify-center"
                                            >
                                                <LogOut size={18} className="mr-2" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Guest Mobile Menu */
                                <div className="space-y-4">
                                    <Link
                                        href="/boss/login"
                                        className="block w-full text-center py-3 px-4 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Boss Login
                                    </Link>
                                    <Link
                                        href="/boss/register"
                                        className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Register as Boss
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default BossNavbar;