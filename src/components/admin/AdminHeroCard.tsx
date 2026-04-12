import React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminHeroCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  bgIcon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  iconColor?: string;
  accentColor?: string; // e.g., 'primary', 'emerald', 'amber'
}

export function AdminHeroCard({
  title,
  subtitle,
  icon: Icon,
  bgIcon: BgIcon,
  children,
  className,
  iconColor = "text-primary",
  accentColor = "primary"
}: AdminHeroCardProps) {
  return (
    <Card className={cn(
      "group relative border-none shadow-2xl bg-[#09090b] text-white overflow-hidden rounded-[24px] transition-all duration-300 hover:ring-1 hover:ring-white/20",
      className
    )}>
      {/* Gamification Glow - Corner Accent */}
      <div className={cn(
        "absolute -top-12 -left-12 w-24 h-24 blur-[40px] opacity-30 pointer-events-none transition-opacity group-hover:opacity-50",
        accentColor === 'primary' ? 'bg-primary' : 
        accentColor === 'emerald' ? 'bg-emerald-500' :
        accentColor === 'amber' ? 'bg-amber-500' : 'bg-purple-500'
      )} />

      {/* Standardized Background Icon - Compact & Subtle */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-all duration-500 group-hover:scale-110">
        <BgIcon className="h-24 w-24 md:h-32 md:w-32 rotate-6" />
      </div>
      
      {/* Layout: Slim Header + Content */}
      <div className="flex flex-col">
        {/* Slim Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-inner",
              "bg-white/5"
            )}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <h3 className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase text-white/90">
                {title}
              </h3>
              {subtitle && (
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          
          {/* Status Indicator (Gamification feel) */}
          <div className="flex gap-1 items-center">
             <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Live</span>
          </div>
        </div>
        
        {/* Content Section - Compact Padding */}
        <div className="px-5 py-4 relative z-10">
          {children}
        </div>
      </div>
    </Card>
  );
}
