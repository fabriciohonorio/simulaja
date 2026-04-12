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
  const [selectedCategory, setSelectedCategory] = React.useState<'quente' | 'morno' | 'frio' | 'todos'>('quente');

  if (funilState.loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const leadsQuentes = funilState.leads.filter((l: any) => l.lead_temperatura === 'quente');
  const leadsMornos = funilState.leads.filter((l: any) => l.lead_temperatura === 'morno');
  const leadsFrios = funilState.leads.filter((l: any) => l.lead_temperatura === 'frio');
  const emAndamento = funilState.leads.filter((l: any) => !['fechado', 'perdido', 'morto'].includes(l.status));

  const displayLeads = selectedCategory === 'quente' ? leadsQuentes : 
                       selectedCategory === 'morno' ? leadsMornos : 
                       selectedCategory === 'frio' ? leadsFrios : emAndamento;

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'quente': return { border: 'border-red-100', text: 'text-red-600', bg: 'bg-red-50' };
      case 'morno': return { border: 'border-amber-100', text: 'text-amber-600', bg: 'bg-amber-50' };
      case 'frio': return { border: 'border-blue-100', text: 'text-blue-600', bg: 'bg-blue-50' };
      default: return { border: 'border-slate-100', text: 'text-slate-600', bg: 'bg-slate-50' };
    }
  };

  const activeColor = getCategoryColor(selectedCategory);

  return (
    <div className="space-y-4 select-none no-scrollbar w-full animate-in fade-in duration-700">
      {/* Operational Summary Bar - Condensed & Dynamic */}
      <div className="flex flex-col xl:flex-row gap-3">
        {/* Rapid Status Stats */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
          <button 
            onClick={() => setSelectedCategory('quente')}
            className={`bg-white border ${selectedCategory === 'quente' ? 'border-red-500 ring-1 ring-red-500/20' : 'border-red-100'} p-2 rounded-xl shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Quentes</span>
            </div>
            <p className="text-lg font-black text-red-600">{leadsQuentes.length}</p>
          </button>
          
          <button 
            onClick={() => setSelectedCategory('morno')}
            className={`bg-white border ${selectedCategory === 'morno' ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-amber-100'} p-2 rounded-xl shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🌤️</span>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Mornos</span>
            </div>
            <p className="text-lg font-black text-amber-600">{leadsMornos.length}</p>
          </button>

          <button 
            onClick={() => setSelectedCategory('frio')}
            className={`bg-white border ${selectedCategory === 'frio' ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-blue-100'} p-2 rounded-xl shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">❄️</span>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Frios</span>
            </div>
            <p className="text-lg font-black text-blue-600">{leadsFrios.length}</p>
          </button>

          <button 
            onClick={() => setSelectedCategory('todos')}
            className={`bg-white border ${selectedCategory === 'todos' ? 'border-slate-500 ring-1 ring-slate-500/20' : 'border-slate-100'} p-2 rounded-xl shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Ativos</span>
            </div>
            <p className="text-lg font-black text-slate-900">{emAndamento.length}</p>
          </button>
        </div>

        {/* Dynamic Quick List - Condensed */}
        <div className={`xl:w-2/5 md:w-full bg-white border ${activeColor.border} p-2 rounded-xl shadow-sm flex items-center gap-3 overflow-hidden transition-all duration-300`}>
          <div className="shrink-0 flex items-center gap-1.5 border-r pr-3">
             <Zap className={`h-3 w-3 ${activeColor.text} animate-pulse`} />
             <span className="text-[8px] font-black uppercase text-slate-500">Lista Rápida:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
            {displayLeads.length > 0 ? (
                displayLeads.slice(0, 8).map((l: any) => (
                    <span key={l.id} className={`text-[9px] font-bold ${activeColor.bg} ${activeColor.text} px-2 py-0.5 rounded-full border ${activeColor.border} whitespace-nowrap`}>
                        {l.nome.split(' ')[0]} {l.nome.split(' ')[1] ? l.nome.split(' ')[1][0] + '.' : ''}
                    </span>
                ))
            ) : (
                <span className="text-[9px] font-bold text-slate-300">Nenhum lead nesta categoria</span>
            )}
            {displayLeads.length > 8 && <span className="text-[8px] text-slate-300 font-bold self-center">+{displayLeads.length - 8}</span>}
          </div>
        </div>
      </div>

      <FunilHeader state={funilState} />
      <FunilBoard state={funilState} />
      <FunilLegend />
      <FunilModals state={funilState} />

      <style>{`
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
      `}</style>
    </div>
  );
}
  );
}
