import React from 'react';

const JarvisAvatar = ({ className = "w-full h-full" }: { className?: string }) => {
  return (
    <div className={`relative ${className} bg-[#0F172A] rounded-full overflow-hidden flex items-center justify-center border-2 border-cyan-500/30`}>
      {/* Robot Face / Visor */}
      <div className="absolute inset-2 bg-slate-900 rounded-[20%] flex flex-col items-center justify-center gap-2">
        <div className="flex gap-4">
          {/* Left Eye */}
          <svg width="24" height="12" viewBox="0 0 24 12" className="eye">
            <path 
              d="M2,10 Q12,0 22,10" 
              fill="none" 
              stroke="#00F2FF" 
              strokeWidth="3" 
              strokeLinecap="round"
              className="drop-shadow-[0_0_5px_rgba(0,242,255,0.8)]"
            />
          </svg>
          {/* Right Eye */}
          <svg width="24" height="12" viewBox="0 0 24 12" className="eye">
            <path 
              d="M2,10 Q12,0 22,10" 
              fill="none" 
              stroke="#00F2FF" 
              strokeWidth="3" 
              strokeLinecap="round"
              className="drop-shadow-[0_0_5px_rgba(0,242,255,0.8)]"
            />
          </svg>
        </div>
        {/* Mouth */}
        <svg width="16" height="8" viewBox="0 0 16 8">
          <path 
            d="M2,2 Q8,8 14,2" 
            fill="none" 
            stroke="#00F2FF" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="drop-shadow-[0_0_3px_rgba(0,242,255,0.5)]"
          />
        </svg>
      </div>
      
      {/* Headphones Glow */}
      <div className="absolute -left-1 w-3 h-1/2 bg-cyan-500/20 blur-sm rounded-full" />
      <div className="absolute -right-1 w-3 h-1/2 bg-cyan-500/20 blur-sm rounded-full" />
    </div>
  );
};

export default JarvisAvatar;
