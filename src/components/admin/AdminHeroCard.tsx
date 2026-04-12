import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminHeroCardProps {
  title: string;
  icon: LucideIcon;
  bgIcon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  iconColor?: string;
}

export function AdminHeroCard({
  title,
  icon: Icon,
  bgIcon: BgIcon,
  children,
  className,
  iconColor = "text-primary"
}: AdminHeroCardProps) {
  return (
    <Card className={cn(
      "border-none shadow-xl bg-slate-950 text-white overflow-hidden relative rounded-[32px] md:rounded-[40px]",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
        <BgIcon className="h-32 w-32 md:h-48 md:w-48 rotate-12" />
      </div>
      
      {/* Dynamic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-900/20 opacity-40 pointer-events-none" />

      <CardHeader className="pb-2 border-b border-white/5 relative z-10 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/5 shadow-inner">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <CardTitle className="text-sm md:text-lg font-black tracking-[0.15em] uppercase text-white/95">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 relative z-10 p-4 md:p-5">
        {children}
      </CardContent>
    </Card>
  );
}
