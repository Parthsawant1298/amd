"use client";

import { BarChart2, Bell, Calendar, MessageCircle, Users, Zap } from 'lucide-react';
import Image from "next/image";
import { useEffect, useState } from 'react';

export default function ServicesWithStats() {
  const [animatedStats, setAnimatedStats] = useState({
    events: 0,
    users: 0,
    integrations: 0,
    reminders: 0
  });

  const finalStats = {
    events: 120000,
    users: 10000,
    integrations: 12,
    reminders: 500000
  };

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60; // 60 steps for smooth animation
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        events: Math.floor(finalStats.events * easeOutCubic),
        users: Math.floor(finalStats.users * easeOutCubic),
        integrations: Math.floor(finalStats.integrations * easeOutCubic),
        reminders: Math.floor(finalStats.reminders * easeOutCubic)
      });
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(finalStats);
      }
    }, stepDuration);
    return () => clearInterval(timer);
  }, []);

  const services = [
    {
      title: "AI-Powered Scheduling",
      icon: Calendar,
      image: "/service.webp",
      iconColor: "blue",
      description: "Let AI handle your event scheduling, find optimal times, and avoid conflicts automatically."
    },
    {
      title: "Automated Reminders",
      icon: Bell,
      image: "/service-2.jpeg",
      iconColor: "green",
      description: "Never miss a meeting or deadline with smart, customizable reminders and notifications."
    },
    {
      title: "Natural Language Event Creation",
      icon: MessageCircle,
      image: "/service-3.jpeg",
      iconColor: "blue",
      description: "Create and update events just by chatting with your AI assistant in plain English."
    },
    {
      title: "Productivity Analytics",
      icon: BarChart2,
      image: "/service-4.jpg",
      iconColor: "purple",
      description: "Gain insights into your schedule, meeting habits, and productivity trends with powerful analytics."
    },
    {
      title: "Integrations",
      icon: Zap,
      image: "/service-5.avif",
      iconColor: "blue",
      description: "Connect with Google Calendar, Slack, Teams, and more for seamless workflow automation."
    },
    {
      title: "Team Collaboration",
      icon: Users,
      image: "/service-6.webp",
      iconColor: "orange",
      description: "Coordinate with your team, share calendars, and schedule group events effortlessly."
    }
  ];

  const stats = [
    {
      number: animatedStats.events,
      suffix: '+',
      label: 'Events Scheduled',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
    },
    {
      number: animatedStats.users,
      suffix: '+',
      label: 'Active Users',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
    },
    {
      number: animatedStats.integrations,
      suffix: '+',
      label: 'Integrations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
    },
    {
      number: animatedStats.reminders,
      suffix: '+',
      label: 'Reminders Sent',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
    }
  ];

  return (
    <div className="bg-white">
      {/* Services Section */}
      <section className="bg-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 tracking-tight leading-tight">
              Discover the Power of Smart Scheduling
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Explore our comprehensive AI-powered scheduling services designed to automate your calendar, boost productivity, and simplify your day-to-day life.
            </p>
          </div>
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0" />
                </div>
                <div className="absolute left-4 sm:left-6 top-4 sm:top-6">
                  <div className={`rounded-xl sm:rounded-2xl ${
                    service.iconColor === "green" 
                      ? "bg-green-50/90 hover:bg-green-100" 
                      : service.iconColor === "purple"
                      ? "bg-purple-50/90 hover:bg-purple-100"
                      : service.iconColor === "orange"
                      ? "bg-orange-50/90 hover:bg-orange-100"
                      : "bg-blue-50/90 hover:bg-blue-100"
                  } p-2 sm:p-3 backdrop-blur-sm transition-all duration-300 group-hover:scale-110`}>
                    <service.icon className={`h-5 w-5 sm:h-7 sm:w-7 ${
                      service.iconColor === "green" 
                        ? "text-green-600" 
                        : service.iconColor === "purple"
                        ? "text-purple-600"
                        : service.iconColor === "orange"
                        ? "text-orange-600"
                        : "text-blue-600"
                    }`} />
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-2 sm:mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-left mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              Our Platform Stats
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-lg leading-relaxed">
              We help you unleash the power of AI-driven scheduling to automate your calendar and maximize your productivity.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-500 overflow-hidden"
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              >
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 ${stat.bgColor} rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 ${stat.bgColor} rounded-xl sm:rounded-2xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                {/* Number */}
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.number.toLocaleString()}{stat.suffix}
                  </div>
                  {/* Label */}
                  <div className="text-gray-700 font-semibold text-xs sm:text-sm leading-tight">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}