"use client"
import { useEffect, useRef, useState } from "react"

export default function Hero() {
  const bigCardRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (bigCardRef.current && !isAnimating) {
        const rect = bigCardRef.current.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0

        if (isVisible) {
          setIsAnimating(true)
          bigCardRef.current.classList.remove("scroll-flip-animation")
          bigCardRef.current.offsetHeight
          bigCardRef.current.classList.add("scroll-flip-animation")
          setTimeout(() => {
            setIsAnimating(false)
          }, 1200)
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isAnimating])

  return (
    <div className="min-h-screen bg-white relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover"
        }}
      />
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 py-16 pt-24 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight animate-fade-in-up opacity-0 animation-delay-200">
          SmartCalendarAI
          <br />
          AI-Powered Scheduling Platform
        </h1>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl animate-fade-in-up opacity-0 animation-delay-400">
          Automate your calendar, schedule meetings with ease, and chat with your personal AI agent. Connect Google Calendar, manage events, and boost productivity—all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up opacity-0 animation-delay-600">
          <a
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200 font-medium"
          >
            Get Started Free
          </a>
          <a
            href="/login"
            className="bg-gray-200 text-black px-8 py-3 rounded-full hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium"
          >
            Login
          </a>
        </div>
        {/* Demo Video or Screenshot */}
        <div className="w-full max-w-6xl mx-auto animate-fade-in-up opacity-0 animation-delay-800">
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300 big-card-container h-[250px] sm:h-[350px] md:h-[450px] lg:h-[600px]"
            ref={bigCardRef}
          >
            <iframe
              src="https://www.youtube.com/embed/1-rWZSljrK0?autoplay=0&mute=1&rel=0&modestbranding=1&controls=1&showinfo=0"
              title="SmartCalendarAI Platform Demo"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
        {/* Trusted by Teams */}
        <div className="mt-24 w-full animate-fade-in-up opacity-0 animation-delay-1000">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-16">Trusted by Leading Companies</h2>
          <div className="overflow-hidden">
            {/* First Row - Moving Right */}
            <div className="flex animate-scroll-right mb-8 whitespace-nowrap">
              <div className="flex items-center justify-center min-w-[250px] px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-xl">MICROSOFT</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">GOOGLE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">APPLE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Netflix</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">TESLA</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">AMAZON</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">SPOTIFY</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Airbnb</span>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">MICROSOFT</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">GOOGLE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">APPLE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Netflix</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">TESLA</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">AMAZON</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">SPOTIFY</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Airbnb</span>
              </div>
            </div>
            {/* Second Row - Moving Left */}
            <div className="flex animate-scroll-left whitespace-nowrap">
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">META</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Uber</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">NVIDIA</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">SALESFORCE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">ADOBE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Slack</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">ZOOM</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">SHOPIFY</span>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">META</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Uber</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">NVIDIA</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">SALESFORCE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">ADOBE</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black italic text-lg sm:text-xl">Slack</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">ZOOM</span>
              </div>
              <div className="flex items-center justify-center min-w-[200px] sm:min-w-[250px] px-6 sm:px-8 hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-black text-lg sm:text-xl">SHOPIFY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        .animation-delay-1000 {
          animation-delay: 1.0s;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        .big-card-container {
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }
        .scroll-flip-animation {
          animation: bigCardFlip 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @keyframes bigCardFlip {
          0% {
            transform: perspective(1200px) rotateX(-20deg) translateY(60px);
            opacity: 0.6;
          }
          50% {
            transform: perspective(1200px) rotateX(8deg) translateY(-15px);
            opacity: 0.85;
          }
          100% {
            transform: perspective(1200px) rotateX(0deg) translateY(0px);
            opacity: 1;
          }
        }
        @keyframes scrollRight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        @keyframes scrollLeft {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-scroll-right {
          animation: scrollRight 40s linear infinite;
          opacity: 0.8;
        }
        .animate-scroll-left {
          animation: scrollLeft 40s linear infinite;
          opacity: 0.8;
        }
        .animate-scroll-right:hover,
        .animate-scroll-left:hover {
          animation-play-state: paused;
          opacity: 1;
        }
      `}</style>
    </div>
  )
}