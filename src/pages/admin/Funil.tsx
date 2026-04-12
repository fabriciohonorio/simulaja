import React from "react";
import { useFunil } from "@/hooks/useFunil";
import { FunilBoard } from "@/components/admin/funil/FunilBoard";
import { FunilModals } from "@/components/admin/funil/FunilModals";
import { TrendingUp, Zap, FileText } from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { formatLeadValue } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ADMINISTRADORAS } from "@/hooks/useFunil";

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

  const leadsQuentes = funilState.leads.filter((l: any) => l.lead_temperatura === 'quente' && l.status !== 'fechado');
  const leadsMornos = funilState.leads.filter((l: any) => l.lead_temperatura === 'morno' && l.status !== 'fechado');
  const leadsFrios = funilState.leads.filter((l: any) => l.lead_temperatura === 'frio' && l.status !== 'fechado');
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
    <div className="space-y-2 select-none no-scrollbar w-full animate-in fade-in duration-700">
      {/* Operational Summary Bar - Ultra Slim */}
      <div className="flex flex-col xl:flex-row gap-2">
        {/* Rapid Status Stats */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-1.5">
          <button 
            onClick={() => setSelectedCategory('quente')}
            className={`bg-white border ${selectedCategory === 'quente' ? 'border-red-500 ring-1 ring-red-500/20' : 'border-red-100'} p-1.5 rounded-lg shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔥</span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Quentes</span>
            </div>
            <p className="text-base font-black text-red-600 leading-none">{leadsQuentes.length}</p>
          </button>
          
          <button 
            onClick={() => setSelectedCategory('morno')}
            className={`bg-white border ${selectedCategory === 'morno' ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-amber-100'} p-1.5 rounded-lg shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">🌤️</span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Mornos</span>
            </div>
            <p className="text-base font-black text-amber-600 leading-none">{leadsMornos.length}</p>
          </button>

          <button 
            onClick={() => setSelectedCategory('frio')}
            className={`bg-white border ${selectedCategory === 'frio' ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-blue-100'} p-1.5 rounded-lg shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">❄️</span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Frios</span>
            </div>
            <p className="text-base font-black text-blue-600 leading-none">{leadsFrios.length}</p>
          </button>

          <button 
            onClick={() => setSelectedCategory('todos')}
            className={`bg-white border ${selectedCategory === 'todos' ? 'border-slate-400 ring-1 ring-slate-400/20' : 'border-slate-100'} p-1.5 rounded-lg shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95`}
          >
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-slate-400" />
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Ativos</span>
            </div>
            <p className="text-base font-black text-slate-900 leading-none">{emAndamento.length}</p>
          </button>
        </div>

        {/* Dynamic Quick List - Ultra Condensed */}
        <div className={`xl:w-2/5 md:w-full bg-white border ${activeColor.border} p-1.5 rounded-lg shadow-sm flex items-center gap-2 overflow-hidden`}>
          <div className="shrink-0 flex items-center gap-1 border-r pr-2">
             <Zap className={`h-2.5 w-2.5 ${activeColor.text} animate-pulse`} />
             <span className="text-[7px] font-black uppercase text-slate-400">Lista:</span>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5 w-full">
            {displayLeads.length > 0 ? (
                displayLeads.slice(0, 10).map((l: any) => (
                    <span key={l.id} className={`text-[8px] font-black ${activeColor.bg} ${activeColor.text} px-1.5 py-0.5 rounded border ${activeColor.border} whitespace-nowrap`}>
                        {l.nome.split(' ')[0]} {l.nome.split(' ')[1] ? l.nome.split(' ')[1][0] + '.' : ''}
                    </span>
                ))
            ) : (
                <span className="text-[8px] font-bold text-slate-300 uppercase">Vazio</span>
            )}
          </div>
        </div>
      </div>

      {/* Unified Control & Status Bar - High Density */}
      <div className="flex flex-col lg:flex-row items-center gap-1.5 p-1 bg-slate-50/50 rounded-lg border border-slate-100">
        <Tabs 
          value={funilState.administradoraFilter} 
          onValueChange={funilState.setAdministradoraFilter} 
          className="shrink-0"
        >
          <TabsList className="h-7 bg-white border border-slate-200 p-0.5">
            <TabsTrigger value="todos" className="text-[9px] font-black px-2 h-6 uppercase tracking-tighter">Todos</TabsTrigger>
            {ADMINISTRADORAS.map(admin => (
              <TabsTrigger key={admin} value={admin} className="text-[9px] font-black px-2 h-6 uppercase tracking-tighter">{admin}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="hidden lg:flex items-center bg-white p-0.5 rounded border border-slate-200 h-7 shrink-0">
          <button
            onClick={() => funilState.setIsWideView(false)}
            className={`px-2 h-5 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${!funilState.isWideView ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
          >
            Padrão
          </button>
          <button
            onClick={() => funilState.setIsWideView(true)}
            className={`px-2 h-5 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${funilState.isWideView ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
          >
            Wide
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex gap-1 overflow-x-auto no-scrollbar w-full">
            {displayLeads.slice(0, 15).map((l: any) => (
              <span key={l.id} className={`text-[8px] font-black ${activeColor.bg} ${activeColor.text} px-1.5 py-0.5 rounded border ${activeColor.border} whitespace-nowrap`}>
                {l.nome.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={funilState.handleGenerateReport}
          className="h-7 px-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-[9px] font-black uppercase tracking-tighter"
        >
          <FileText className="h-3 w-3 mr-1" />
          PDF
        </Button>
      </div>

      <FunilBoard state={funilState} />
      <FunilModals state={funilState} />

      <style>{`
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
      `}</style>
    </div>
  );
}
