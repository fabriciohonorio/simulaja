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
      {/* Gamified Funnel Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AdminHeroCard 
            title="Gestão de Funil" 
            subtitle="Controle Operacional de Vendas"
            icon={TrendingUp} 
            bgIcon={TrendingUp}
            accentColor="primary"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  Seu Funil de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Alta Performance</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                  Acompanhe a jornada de cada cliente, do primeiro contato ao fechamento. Mova os cards para atualizar o status e ganhar ritmo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Potential Volume</p>
                  <p className="text-lg font-black text-blue-600">{formatLeadValue(volumeTotal)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Active Leads</p>
                  <p className="text-lg font-black text-slate-900">{emAndamento}</p>
                </div>
              </div>
            </div>
          </AdminHeroCard>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          {/* Quick Stats Column */}
          <div className="relative group overflow-hidden p-4 rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 transition-all flex flex-col h-full min-h-[140px]">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 opacity-90">
                  <span className="p-1.5 bg-white/20 rounded-lg"><Zap className="h-4 w-4" /></span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Leads Quentes ({leadsQuentes})</p>
                </div>
                <span className="text-[8px] font-black bg-red-400 px-1.5 py-0.5 rounded-full animate-pulse">ALERTA</span>
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-1">
                {funilState.leads.filter((l: any) => l.lead_temperatura === 'quente').slice(0, 5).map((l: any) => (
                  <div key={l.id} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 p-1.5 rounded-lg flex items-center justify-between transition-colors border border-white/5">
                    <span className="truncate max-w-[120px]">{l.nome}</span>
                    <span className="text-[8px] opacity-70">{formatLeadValue(Number(l.valor_credito) || 0)}</span>
                  </div>
                ))}
                {leadsQuentes > 5 && <p className="text-[8px] opacity-50 text-center pt-1">+ {leadsQuentes - 5} outros leads quentes</p>}
             </div>
             <TrendingUp className="absolute -bottom-4 -right-4 h-20 w-20 opacity-10 rotate-12" />
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
