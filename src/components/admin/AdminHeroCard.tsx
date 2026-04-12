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
  accentColor?: string; // e.g., 'primary', 'emerald', 'amber', 'purple'
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
  
  // Mapping accent colors to light mode gradients
  const accentGradients: Record<string, string> = {
    primary: "from-blue-600 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-400 to-orange-500",
    purple: "from-purple-500 to-pink-600",
  };

  const currentGradient = accentGradients[accentColor] || accentGradients.primary;

  return (
    <Card className={cn(
      "group relative border-none shadow-xl bg-white text-slate-900 overflow-hidden rounded-[24px] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-slate-100",
      className
    )}>
      {/* Background Icon - Subtle transparency */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-[0.05] pointer-events-none group-hover:opacity-[0.1] transition-all duration-500 group-hover:scale-110">
        <BgIcon className={cn("h-24 w-24 md:h-32 md:w-32 rotate-6 text-slate-400")} />
      </div>
      
      {/* Gamified Header: Vibrant Gradient */}
      <div className={cn(
        "flex items-center justify-between px-5 py-2.5 bg-gradient-to-r text-white shadow-md",
        currentGradient
      )}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md border border-white/30">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col -space-y-0.5">
            <h3 className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase">
              {title}
            </h3>
            {subtitle && (
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-tighter">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex gap-1 items-center bg-white/20 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
           <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
           <span className="text-[8px] font-black uppercase tracking-widest">Ativo</span>
        </div>
      </div>
      
      {/* Content Section - Light and airy */}
      <div className="px-5 py-4 relative z-10 bg-white/40">
        {children}
      </div>
    </Card>
  );
}
