import React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminHeroCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  stats?: string;
  icon: LucideIcon;
  bgIcon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  iconColor?: string;
  accentColor?: string; // e.g., 'primary', 'emerald', 'amber', 'purple'
}

export function AdminHeroCard({
  title,
  subtitle,
  description,
  stats,
  icon: Icon,
  bgIcon: BgIcon,
  children,
  className,
  iconColor = "text-primary",
  accentColor = "primary"
}: AdminHeroCardProps) {
  
  // Mapping accent colors to light mode gradients
  const accentGradients: Record<string, string> = {
    primary: "from-blue-600 to-indigo-700",
    emerald: "from-blue-600 to-indigo-700",
    amber: "from-amber-400 to-orange-500",
    purple: "from-purple-500 to-pink-600",
  };

  const currentGradient = accentGradients[accentColor] || accentGradients.primary;

  return (
    <Card className={cn(
      "group relative border-none shadow-lg bg-white text-slate-900 overflow-hidden rounded-[16px] transition-all duration-300 hover:shadow-xl border border-slate-100",
      className
    )}>
      {/* Background Icon - Subtle transparency */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-all duration-500 group-hover:scale-110">
        {BgIcon ? (
          <BgIcon className={cn("h-16 w-16 md:h-24 md:w-24 rotate-6 text-slate-400")} />
        ) : (
          <Icon className={cn("h-16 w-16 md:h-24 md:w-24 rotate-6 text-slate-400")} />
        )}
      </div>
      
      {/* Gamified Header: Vibrant Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 bg-gradient-to-r text-white shadow-sm",
        currentGradient
      )}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-black tracking-[0.1em] uppercase leading-none">
              {title}
            </h3>
            {(subtitle || stats) && (
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-tighter leading-none mt-1">
                {stats || subtitle}
              </span>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex gap-1 items-center bg-white/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
           <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
           <span className="text-[8px] font-black uppercase tracking-widest leading-none">Live</span>
        </div>
      </div>
      
      {/* Content Section - Light and airy */}
      <div className="px-4 py-3 relative z-10">
        {children}
        {!children && description && (
          <p className="text-[11px] font-bold text-slate-500 italic leading-tight">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
