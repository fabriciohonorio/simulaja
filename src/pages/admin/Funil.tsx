import React from "react";
import { useFunil } from "@/hooks/useFunil";
import { FunilHeader } from "@/components/admin/funil/FunilHeader";
import { FunilBoard } from "@/components/admin/funil/FunilBoard";
import { FunilLegend } from "@/components/admin/funil/FunilLegend";
import { FunilModals } from "@/components/admin/funil/FunilModals";
import { TrendingUp, Zap } from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { formatLeadValue } from "@/lib/utils";

export default function Funil() {
  const funilState = useFunil();

  if (funilState.loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalLeads = funilState.leads.length;
  const volumeTotal = funilState.leads.reduce((acc: number, l: any) => acc + Number(l.valor_credito || 0), 0);
  const leadsQuentes = funilState.leads.filter((l: any) => l.lead_temperatura === 'quente').length;
  const emAndamento = funilState.leads.filter((l: any) => !['fechado', 'perdido', 'morto'].includes(l.status)).length;

  return (
    <div className="space-y-6 select-none no-scrollbar w-full animate-in fade-in duration-700">
      {/* Operational Summary Bar */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Rapid Status Stats */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-red-100 p-3 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quentes</span>
            </div>
            <p className="text-xl font-black text-red-600">{leadsQuentes.length}</p>
          </div>
          <div className="bg-white border border-amber-100 p-3 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌤️</span>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Mornos</span>
            </div>
            <p className="text-xl font-black text-amber-600">{leadsMornos.length}</p>
          </div>
          <div className="bg-white border border-blue-100 p-3 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">❄️</span>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Frios</span>
            </div>
            <p className="text-xl font-black text-blue-600">{leadsFrios.length}</p>
          </div>
          <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Ativos</span>
            </div>
            <p className="text-xl font-black text-slate-900">{emAndamento}</p>
          </div>
        </div>

        {/* Compact Hot Leads List */}
        <div className="xl:w-1/3 bg-white border border-blue-100 p-3 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3 w-3 text-blue-600" />
            <span className="text-[9px] font-black uppercase text-slate-500">Próximos Fechamentos:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {leadsQuentes.slice(0, 4).map(l => (
              <span key={l.id} className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 truncate max-w-[120px]">
                {l.nome.split(' ')[0]} {l.nome.split(' ')[1] ? l.nome.split(' ')[1][0] + '.' : ''}
              </span>
            ))}
            {leadsQuentes.length > 4 && <span className="text-[8px] text-slate-300 font-bold">+{leadsQuentes.length - 4} mais</span>}
          </div>
        </div>
      </div>

      <FunilHeader state={funilState} />
      <FunilBoard state={funilState} />
      <FunilLegend />
      <FunilModals state={funilState} />

      <style>{`
        /* Ultra aggressive scrollbar removal - Global and Class based */
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        
        .no-scrollbar { 
          scrollbar-width: none !important; 
          -ms-overflow-style: none !important; 
          overflow: -moz-scrollbars-none !important;
        }
        .no-scrollbar::-webkit-scrollbar { 
          display: none !important; 
          width: 0 !important; 
          height: 0 !important; 
          background: transparent !important;
          -webkit-appearance: none !important;
        }
      `}</style>
    </div>
  );
}
