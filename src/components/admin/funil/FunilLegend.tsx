import React from "react";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FunilLegend() {
  return (
    <div className="hidden md:flex items-center justify-center gap-8 p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-dashed border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-2 pr-4 border-r border-border/50">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legenda de Temperatura</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 group cursor-help transition-transform hover:scale-105">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-xs font-bold text-slate-600">🔥 Quente (Ativo)</span>
        </div>
        <div className="flex items-center gap-2 group cursor-help transition-transform hover:scale-105">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
          <span className="text-xs font-bold text-slate-600">☀️ Morno (Aguardando)</span>
        </div>
        <div className="flex items-center gap-2 group cursor-help transition-transform hover:scale-105">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
          <span className="text-xs font-bold text-slate-600">❄️ Frio (Parado)</span>
        </div>
        <div className="flex items-center gap-2 group cursor-help transition-transform hover:scale-105">
          <div className="h-2.5 w-2.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.4)]" />
          <span className="text-xs font-bold text-slate-600">💀 Perdido</span>
        </div>
        <div className="flex items-center gap-2 group cursor-help transition-transform hover:scale-105">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <span className="text-xs font-bold text-slate-600">☠️ Lead Morto</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 pl-4 border-l border-border/50">
          <Badge variant="outline" className="bg-primary/5 text-[10px] py-0 border-primary/20 italic">Dashboard de Vendas Inteligente</Badge>
      </div>
    </div>
  );
}
