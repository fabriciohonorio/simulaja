import React from 'react';
import { Brain, Car, Bike, Home } from 'lucide-react';

const JarvisHero = () => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
      <div className="absolute inset-10 bg-purple-500/20 rounded-full blur-[40px] animate-bounce duration-[5000ms]" />
      
      {/* Central SVG Composition */}
      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Brain - The Core */}
        <g className="animate-pulse" style={{ animationDuration: '3s' }}>
          <circle cx="100" cy="100" r="45" fill="none" stroke="url(#grad1)" strokeWidth="0.5" strokeDasharray="4 2" className="opacity-40" />
          <path 
            d="M100,65 C115,65 125,75 125,90 C125,105 115,115 100,115 C85,115 75,105 75,90 C75,75 85,65 100,65 Z" 
            fill="none" 
            stroke="url(#grad1)" 
            strokeWidth="2" 
            filter="url(#glow)"
          />
          <Brain x="82" y="75" size={36} className="text-white opacity-90" />
        </g>

        {/* Satellite Icons - represent segments */}
        {/* House */}
        <g className="animate-bounce" style={{ animationDuration: '4s' }}>
          <circle cx="50" cy="60" r="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <Home x="40" y="50" size={20} className="text-purple-300" />
        </g>

        {/* Car */}
        <g className="animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '0.5s' }}>
          <circle cx="150" cy="70" r="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <Car x="140" y="60" size={20} className="text-indigo-300" />
        </g>

        {/* Motorcycle */}
        <g className="animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1s' }}>
          <circle cx="100" cy="160" r="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <Bike x="90" y="150" size={20} className="text-pink-300" />
        </g>

        {/* Connecting Lines */}
        <line x1="100" y1="90" x2="50" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="100" y1="90" x2="150" y2="70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="100" y1="90" x2="100" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>

      {/* Dynamic Particles using absolute divs */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-20" />
      <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-primary rounded-full animate-ping [animation-delay:1s] opacity-20" />
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-20" />
    </div>
  );
};

export default JarvisHero;
