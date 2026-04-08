import { useEffect, useState, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, DollarSign, Handshake, Calendar, AlertTriangle, MessageCircle, Clock, CheckCircle2, BarChart3, Bell, Target, Zap, Trophy, MessageSquare, Phone, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import DashboardCalendar from "@/components/admin/DashboardCalendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from "recharts";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  last_interaction_at: string | null;
  data_vencimento: string | null;
  celular: string | null;
  responsavel_id: string | null;
  propensity_score: number | null;
}
interface CarteiraItem {
  id: string;
  nome: string;
  grupo: string | null;
  cota: string | null;
  valor_credito: number | null;
  celular: string | null;
}


const openWhatsApp = (lead: Lead, consultorName?: string) => {
  const name = consultorName || "sua equipe de consórcio";
  const msg = encodeURIComponent(`Olá, bom dia! Aqui é o ${name}. Vi sua empresa e pensei em uma forma de gerar mais oportunidades com planejamento financeiro… posso te explicar rapidinho?`);
  const phone = lead.celular ? lead.celular.replace(/\D/g, "") : "";
  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
};

export default function Dashboard() {
  const { profile } = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [carteira, setCarteira] = useState<CarteiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLeadFlash, setNewLeadFlash] = useState(false);
  const prevCountRef = useRef(0);
  const { toast } = useToast();

  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este lead?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Lead excluído com sucesso!" });
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Erro ao excluir lead:", error);
      toast({ title: "Erro ao excluir lead", variant: "destructive" });
    }
  };

  const loteriaFederal = localStorage.getItem("simulaja_loteria_federal") || "";
  const groupQuotaMap: Record<string, number> = {
    "5290": 1800, "5292": 2500, "5291": 1800, "6041": 3100, "5996": 1800, "6037": 2500, "5294": 2500
  };

  const getLoteriaStatus = (cotaStr: string | null, grupoStr: string | null) => {
    if (!loteriaFederal) return null;
    const lotId = parseInt(loteriaFederal.replace(/\D/g, ''));
    if (isNaN(lotId)) return null;
    const participants = grupoStr ? (groupQuotaMap[grupoStr] || 600) : 600;
    const winCota = lotId % participants === 0 ? participants : lotId % participants;
    const clientCota = parseInt(cotaStr || "0");
    if (!clientCota) return null;
    const diff = Math.min(Math.abs(clientCota - winCota), participants - Math.abs(clientCota - winCota));
    return { winCota, isWinner: diff === 0, isClose: diff > 0 && diff <= 10, diff };
  };

  useEffect(() => {
    if (!profile?.organizacao_id) return;

    const fetchData = () => {
      (supabase as any)
        .from("leads")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => {
          const sorted = ((data as any[]) ?? []).sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          if (prevCountRef.current > 0 && sorted.length > prevCountRef.current) {
            setNewLeadFlash(true);
            setTimeout(() => setNewLeadFlash(false), 4000);
          }
          prevCountRef.current = sorted.length;
          setLeads(sorted);
        });

      (supabase as any)
        .from("carteira")
        .select("id, nome, grupo, cota, valor_credito, celular")
        .eq("organizacao_id", profile.organizacao_id)
        .then(({ data }: any) => {
          setCarteira((data as any[]) || []);
          setLoading(false);
        });

      (supabase as any)
        .from("perfis")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .then(({ data }: any) => {
          setPerfis((data as any[]) || []);
        });
    };

    fetchData();

    const channel = supabase
      .channel(`dashboard-leads-${profile.organizacao_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads',
        filter: `organizacao_id=eq.${profile.organizacao_id}` 
      }, () => {
        fetchData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'carteira',
        filter: `organizacao_id=eq.${profile.organizacao_id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.organizacao_id]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totalLeads = leads.length;
  const leadsNovos = leads.filter(l => l.status === "novo" || l.status === "novo_lead").length;
  const leadsConvertidos = leads.filter(l => l.status === "fechado" || l.status === "venda_fechada").length;
  const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
  const volumeTotal = leads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
  const volumeFechado = leads.filter(l => l.status === "fechado").reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

  // Intelligence Metrics
  const leadsPorTemp = {
    Quente: leads.filter(l => l.lead_temperatura === "quente").length,
    Morno: leads.filter(l => l.lead_temperatura === "morno").length,
    Frio: leads.filter(l => l.lead_temperatura === "frio").length,
    Morto: leads.filter(l => l.lead_temperatura === "morto").length,
  };

  const leadsPorCredito = {
    Premium: leads.filter(l => l.lead_score_valor === "premium").length,
    Alto: leads.filter(l => l.lead_score_valor === "alto").length,
    Medio: leads.filter(l => l.lead_score_valor === "medio").length,
    Baixo: leads.filter(l => l.lead_score_valor === "baixo").length,
  };

  const avgContactTime = leads.filter(l => l.last_interaction_at).length > 0
    ? leads.filter(l => l.last_interaction_at).reduce((acc, l) => {
      const diff = (new Date(l.last_interaction_at!).getTime() - new Date(l.created_at!).getTime()) / (1000 * 60 * 60);
      return acc + diff;
    }, 0) / leads.filter(l => l.last_interaction_at).length
    : 0;

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Novos", value: leadsNovos, icon: UserPlus, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Fechados", value: leadsConvertidos, icon: Handshake, color: "text-green-500", bg: "bg-green-50" },
    { label: "Taxa Conversão", value: `${taxaConversao.toFixed(1)}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Valor Potencial", value: formatCurrency(volumeTotal), icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Avg Contact", value: `${avgContactTime.toFixed(1)}h`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  // Calcular Performance Semanal Real
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayLeads = leads.filter(l => l.created_at?.startsWith(date));
    return {
      name: format(parseISO(date), "EEE", { locale: ptBR }),
      leads: dayLeads.length,
      volume: dayLeads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0)
    };
  });

  // Meta vs Realizado Data for Dashboard
  const [metaAnual, setMetaAnual] = useState(0);
  useEffect(() => {
    if (!profile?.organizacao_id) return;
    (supabase as any)
      .from("meta")
      .select("meta_anual")
      .eq("organizacao_id", profile.organizacao_id)
      .order("ano", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setMetaAnual(data.meta_anual || 0);
      });
  }, [profile?.organizacao_id]);

  const metaMensal = metaAnual / 12;
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const realizadoMes = leads
    .filter(l => l.status === "fechado" && l.created_at?.startsWith(currentMonthStr))
    .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
  
  const progressoMes = metaMensal > 0 ? (realizadoMes / metaMensal) * 100 : 0;
  
  // Funil de Vendas - Dados Real-time
  const funnelStages = [
    { label: "Novos", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500", statuses: ["novo", "novo_lead"] },
    { label: "Contato", icon: Phone, color: "text-pink-500", bg: "bg-pink-500", statuses: ["primeiro_contato", "contato"] },
    { label: "Negociação", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500", statuses: ["negociacao"] },
    { label: "Proposta", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500", statuses: ["simulacao_enviada", "proposta"] },
    { label: "Fechados", icon: Handshake, color: "text-emerald-600", bg: "bg-emerald-600", statuses: ["fechado", "venda_fechada"] },
    { label: "Perdidos", icon: AlertTriangle, color: "text-slate-400", bg: "bg-slate-400", statuses: ["perdido", "morto", "inadimplente"] },
  ];

  const funnelData = funnelStages.map(stage => {
    const count = leads.filter(l => stage.statuses.includes(l.status || "")).length;
    const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
    return { ...stage, count, percentage };
  });

  // Cálculo de Ranking de Consultores - AGORA MENSAL
  const rankingRaw = leads
    .filter(l => {
      const isSale = l.status === "fechado" || l.status === "venda_fechada";
      const isThisMonth = l.created_at ? new Date(l.created_at) >= startOfMonth : false;
      return isSale && isThisMonth && l.responsavel_id;
    })
    .reduce((acc: Record<string, number>, lead) => {
      const rid = lead.responsavel_id!;
      acc[rid] = (acc[rid] || 0) + Number(lead.valor_credito || 0);
      return acc;
    }, {});

  const ranking = Object.entries(rankingRaw)
    .map(([rid, total]) => {
      const perfil = perfis.find(p => p.id === rid);
      return {
        id: rid,
        nome: perfil?.nome_completo || "Consultor",
        avatar: perfil?.avatar_url,
        total
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);


  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Seção Emocional/Foco de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Quase no Bolso */}
        <div className="relative group overflow-visible p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-default z-10 hover:z-50">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 opacity-90">
               <span className="p-1.5 bg-white/20 rounded-lg"><TrendingUp className="h-4 w-4" /></span>
               <p className="text-[10px] font-black uppercase tracking-widest">💰 Quase no Bolso</p>
             </div>
             <p className="text-2xl font-black">{formatCurrency(leads.filter(l => l.status === 'negociacao' || l.status === 'simulacao_enviada').reduce((acc, l) => acc + Number(l.valor_credito || 0), 0))}</p>
             <p className="text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full font-bold">Volume em Negociação Final</p>
          </div>
          
          {/* Popover Hover */}
          <div className="absolute top-[105%] left-0 w-full min-w-[300px] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-200 z-50 flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-1 border-b pb-1">Em Negociação Final</p>
              {(() => {
                  const filtered = leads.filter(l => l.status === 'negociacao' || l.status === 'simulacao_enviada');
                  if (filtered.length === 0) return <p className="text-xs text-muted-foreground p-2 text-center">Nenhum lead nesta fase.</p>;
                  return filtered.map(l => (
                      <div key={l.id} className="flex flex-col gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                              <span className="text-sm font-bold truncate max-w-[150px]">{l.nome}</span>
                              <span className="text-xs font-black text-emerald-600">{formatCurrency(Number(l.valor_credito))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{(l.status || '').replace('_', ' ')}</span>
                              <div className="flex gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); window.open(`/admin/leads?id=${l.id}`, '_self'); }} className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar Lead"><Pencil className="h-3.5 w-3.5" /></button>
                                  <button onClick={(e) => handleDeleteLead(l.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title="Excluir Lead"><Trash2 className="h-3.5 w-3.5" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); openWhatsApp(l); }} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="WhatsApp"><WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" /></button>
                              </div>
                          </div>
                      </div>
                  ));
              })()}
          </div>
        </div>

        {/* Card 2: Prontos para Fechar */}
        <div className="relative group overflow-visible p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-default z-10 hover:z-50">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 opacity-90">
               <span className="p-1.5 bg-white/20 rounded-lg"><Sparkles className="h-4 w-4" /></span>
               <p className="text-[10px] font-black uppercase tracking-widest">🔥 Prontos para Fechar</p>
             </div>
             <p className="text-2xl font-black">{leads.filter(l => l.lead_temperatura === 'quente' && l.status !== 'fechado').length} Leads</p>
             <p className="text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full font-bold">Temperatura Quente Ativa</p>
          </div>

          {/* Popover Hover */}
          <div className="absolute top-[105%] left-0 w-full min-w-[300px] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-200 z-50 flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-1 border-b pb-1">Leads Quentes</p>
              {(() => {
                  const filtered = leads.filter(l => l.lead_temperatura === 'quente' && l.status !== 'fechado').sort((a,b) => {
                      const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
                      const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
                      return aTime - bTime; // oldest first
                  });
                  if (filtered.length === 0) return <p className="text-xs text-muted-foreground p-2 text-center">Nenhum lead quente no momento.</p>;
                  return filtered.map(l => (
                      <div key={l.id} className="flex flex-col gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                              <span className="text-sm font-bold truncate max-w-[150px]">{l.nome}</span>
                              <span className="text-xs font-black text-blue-600">{formatCurrency(Number(l.valor_credito))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                  {l.last_interaction_at ? `Contato há ${Math.floor((Date.now() - new Date(l.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24))}d` : 'Sem contato'}
                              </span>
                              <div className="flex gap-1 mt-1">
                                  <button onClick={(e) => { e.stopPropagation(); window.open(`/admin/leads?id=${l.id}`, '_self'); }} className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar Lead"><Pencil className="h-3.5 w-3.5" /></button>
                                  <button onClick={(e) => handleDeleteLead(l.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title="Excluir Lead"><Trash2 className="h-3.5 w-3.5" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); openWhatsApp(l); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="WhatsApp"><WhatsAppIcon className="h-3.5 w-3.5 text-blue-600" /></button>
                              </div>
                          </div>
                      </div>
                  ));
              })()}
          </div>
        </div>

        {/* Card 3: Alvos de Hoje */}
        <div className="relative group overflow-visible p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-xl shadow-violet-500/20 transition-all hover:scale-[1.02] cursor-default z-10 hover:z-50">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 opacity-90">
               <span className="p-1.5 bg-white/20 rounded-lg"><Target className="h-4 w-4" /></span>
               <p className="text-[10px] font-black uppercase tracking-widest">🎯 Alvos de Hoje</p>
             </div>
             <p className="text-2xl font-black">{leads.filter(l => (l.propensity_score || 0) >= 80 && l.status !== 'fechado').length} Oportunidades</p>
             <p className="text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full font-bold">Alta Chance de Fechamento</p>
          </div>

          {/* Popover Hover */}
          <div className="absolute top-[105%] left-0 w-full min-w-[300px] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-200 z-50 flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-1 border-b pb-1">Alta Propensão {'>'}80%</p>
              {(() => {
                  const filtered = leads.filter(l => (l.propensity_score || 0) >= 80 && l.status !== 'fechado');
                  if (filtered.length === 0) {
                      const neglected = leads.filter(l => l.last_interaction_at && (Date.now() - new Date(l.last_interaction_at).getTime()) > 7 * 24 * 60 * 60 * 1000 && l.status !== 'fechado');
                      return (
                          <div className="p-2 text-center text-slate-800 dark:text-slate-200">
                              <p className="text-[11px] mb-2 font-medium bg-slate-100 dark:bg-slate-800 py-1 rounded">Nenhum alvo de altíssima propensão.</p>
                              {neglected.length > 0 && (
                                  <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-800 text-left">
                                      <p className="text-[10px] text-orange-700 dark:text-orange-400 font-bold mb-1">Sugestão Automática:</p>
                                      <p className="text-[10px] font-medium">{neglected.length} leads sem contato há +7d</p>
                                      <button onClick={() => window.open(`/admin/leads`, '_self')} className="mt-2 w-full text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-800/50 dark:text-orange-300 py-1.5 rounded font-bold transition-colors">👉 Ver lista</button>
                                  </div>
                              )}
                          </div>
                      );
                  }
                  return filtered.map(l => (
                      <div key={l.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{l.nome}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-500">Score: {l.propensity_score}%</p>
                          </div>
                          <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); window.open(`/admin/leads?id=${l.id}`, '_self'); }} className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar Lead"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={(e) => handleDeleteLead(l.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title="Excluir Lead"><Trash2 className="h-3.5 w-3.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); openWhatsApp(l); }} className="p-1.5 text-violet-600 hover:bg-violet-100 rounded transition-colors" title="WhatsApp"><WhatsAppIcon className="h-3.5 w-3.5 text-violet-600" /></button>
                          </div>
                      </div>
                  ));
              })()}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Dashboard Admin
            {newLeadFlash && (
              <Badge className="animate-pulse bg-green-500 text-white border-none text-xs gap-1">
                <Zap className="h-3 w-3" /> Novo Lead!
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Atualização automática em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full outline outline-1 outline-border">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
        </div>
      </div>

      {/* Ranking de Consultores */}
      {ranking.length > 0 && (
        <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Trophy className="h-32 w-32 rotate-12" />
          </div>
          <CardHeader className="pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="text-lg font-black tracking-tight uppercase">Ranking Mensal de Consultores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {ranking.map((item, i) => (
                <div key={item.id} className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] ${
                  i === 0 ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
                  i === 1 ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" :
                  "bg-violet-500/10 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                }`}>
                  <div className="relative">
                    <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 overflow-hidden flex items-center justify-center text-2xl font-black shrink-0 ${
                      i === 0 ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                      i === 1 ? "border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
                      "border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    }`}>
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.nome} className="h-full w-full object-cover" />
                      ) : (
                        item.nome.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={`absolute -top-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-lg font-black text-sm border-2 ${
                      i === 0 ? "bg-emerald-500 text-white border-emerald-300 rotate-12" :
                      i === 1 ? "bg-blue-500 text-white border-blue-300" :
                      "bg-violet-500 text-white border-violet-300"
                    }`}>
                      {i + 1}º
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base truncate">{item.nome}</p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${
                      i === 0 ? "text-emerald-500" : i === 1 ? "text-blue-400" : "text-violet-500"
                    }`}>
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid — 2-col on phones, 3-col on sm, 6-col on xl */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="overflow-hidden border-none shadow-sm bg-card hover:bg-accent/5 transition-colors">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 sm:p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} />
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-base sm:text-xl font-bold text-foreground truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Funil de Vendas - Estilo Visual Mockup - Full Width on Mobile, Col on Desktop */}
        <Card className="shadow-sm border-border bg-card lg:col-span-3">
          <CardHeader className="pb-2 border-b border-dashed mb-4">
            <CardTitle className="text-base sm:text-lg flex items-center justify-center gap-2 uppercase tracking-tighter font-black py-1">
               📊 Funil de Vendas - Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4 py-2">
            {funnelData.map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-24 sm:w-28 shrink-0 flex items-center gap-2">
                   <div className={`p-1 rounded-md bg-muted/50 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.color}`} />
                   </div>
                   <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight truncate">{item.label}</span>
                   <span className="text-[10px] text-muted-foreground/30 font-light ml-auto">|</span>
                </div>
                
                <div className="flex-1 h-2.5 sm:h-3 bg-muted/50 rounded-sm overflow-hidden border border-border/50 relative">
                   <div 
                     className={`h-full ${item.bg} transition-all duration-1000 ease-out shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]`} 
                     style={{ width: `${item.percentage}%` }}
                   />
                </div>

                <div className="w-16 sm:w-20 text-right shrink-0 flex items-center justify-end gap-1.5">
                   <span className="text-[10px] text-muted-foreground/30 font-light">|</span>
                   <span className="text-xs sm:text-sm font-black text-foreground w-6 text-center">{item.count}</span>
                   <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                     {item.percentage.toFixed(0)}%
                   </span>
                   <span className="text-[10px] text-muted-foreground/30 font-light ml-0.5">|</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Performance Semanal (Novos Leads)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase font-bold">Últimos 7 dias</Badge>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent)/0.5)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [value, "Leads"]}
                />
                <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]} barSize={40}>
                   {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'][index % 7]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" /> Meta x Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[220px] sm:h-[300px] space-y-6">
            <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status do Mês</p>
                <p className="text-3xl font-black text-emerald-600">{progressoMes.toFixed(2).replace('.', ',')}%</p>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                    <span>Realizado</span>
                    <span>Meta</span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-4 overflow-hidden border border-emerald-200">
                    <div 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        style={{ width: `${Math.min(100, progressoMes)}%` }} 
                    />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                    <span>{formatCurrency(realizadoMes)}</span>
                    <span>{formatCurrency(metaMensal)}</span>
                </div>
            </div>

            <div className={`p-3 rounded-lg border text-center ${progressoMes >= 100 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <p className="text-xs font-bold uppercase">
                    {progressoMes >= 100 ? '🚀 Meta Batida!' : `Ainda faltam ${formatCurrency(Math.max(0, metaMensal - realizadoMes))}`}
                </p>
            </div>
          </CardContent>
        </Card>

        {/* Alertas / Próximas Ações */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Vencimentos de pagamento */}
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const aguardando = leads.filter(l => l.status === "aguardando_pagamento" && l.data_vencimento);
              const vencendoHoje = aguardando.filter((l) => {
                const d = parseISO(l.data_vencimento!);
                return (
                  d.getFullYear() === today.getFullYear() &&
                  d.getMonth() === today.getMonth() &&
                  d.getDate() === today.getDate()
                );
              });
              const atrasados = aguardando.filter((l) => parseISO(l.data_vencimento!) < today);
              return (
                <>
                  {atrasados.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                      <div className="p-2 rounded-full bg-white text-red-500 shadow-sm"><Bell className="h-4 w-4 animate-pulse" /></div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-red-800">🔔 {atrasados.length} pagamento(s) ATRASADO(S)</p>
                        <div className="space-y-0.5 mt-1">
                          {atrasados.slice(0, 3).map(l => (
                            <p key={l.id} className="text-[10px] sm:text-xs text-red-700">
                              {l.nome} — venc. {format(parseISO(l.data_vencimento!), "dd/MM")}

                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {vencendoHoje.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="p-2 rounded-full bg-white text-amber-500 shadow-sm"><Bell className="h-4 w-4 animate-bounce" /></div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-amber-800">🔔 {vencendoHoje.length} pagamento(s) vencem HOJE</p>
                        <div className="space-y-0.5 mt-1">
                          {vencendoHoje.map(l => (
                            <p key={l.id} className="text-[10px] sm:text-xs text-amber-700">{l.nome}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            {/* Leads novo_lead sem nenhum contato há mais de 24h */}
            {(() => {
              const semContato = leads.filter(
                l => (l.status === 'novo' || l.status === 'novo_lead') &&
                  l.created_at &&
                  (Date.now() - new Date(l.created_at).getTime() > 24 * 60 * 60 * 1000)
              );
              return semContato.length > 0 ? (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <div className="p-2 rounded-full bg-white text-orange-500 shadow-sm"><Clock className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-orange-800">
                      {semContato.length} lead(s) sem 1º contato há +24h
                    </p>
                    <div className="space-y-0.5 mt-1">
                      {semContato.slice(0, 3).map(l => (
                        <div key={l.id} className="flex items-center gap-2">
                          <p className="text-[10px] sm:text-xs text-orange-700">{l.nome}</p>
                          <button
                            onClick={() => openWhatsApp(l)}
                            className="text-green-600 hover:text-green-700"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Leads quentes sem interação há +48h */}
            {(() => {
              const quentes = leads.filter(
                l => l.lead_temperatura === 'quente' &&
                  l.last_interaction_at &&
                  (Date.now() - new Date(l.last_interaction_at).getTime() > 48 * 60 * 60 * 1000) &&
                  l.status !== 'fechado' && l.status !== 'morto' && l.status !== 'perdido'
              );
              return quentes.length > 0 ? (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div className="p-2 rounded-full bg-white text-yellow-500 shadow-sm"><Bell className="h-4 w-4 animate-bounce" /></div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-yellow-800">
                      🔥 {quentes.length} lead(s) quente(s) sem contato há +48h
                    </p>
                    <div className="space-y-0.5 mt-1">
                      {quentes.slice(0, 3).map(l => (
                        <div key={l.id} className="flex items-center gap-2">
                          <p className="text-[10px] sm:text-xs text-yellow-800 font-semibold">{l.nome}</p>
                          <button
                            onClick={() => openWhatsApp(l)}
                            className="text-green-600 hover:text-green-700"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Alerta de Contemplação (Loteria) */}
            {(() => {
              const proximos = carteira
                .map(item => ({ item, lot: getLoteriaStatus(item.cota, item.grupo) }))
                .filter(res => res.lot && (res.lot.isWinner || res.lot.isClose));

              return proximos.length > 0 ? (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100/50">
                  <div className="p-2 rounded-full bg-white text-indigo-600 shadow-sm">
                    <Trophy className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-black text-indigo-900 uppercase">
                      🎯 {proximos.length} Clientes Próximos da Contemplação
                    </p>
                    <div className="space-y-1 mt-1.5">
                      {proximos.slice(0, 4).map(({ item, lot }) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 p-1 bg-white/50 rounded border border-indigo-50/50">
                          <p className="text-[10px] sm:text-xs text-indigo-800 font-bold truncate flex-1">
                            {item.nome}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${lot?.isWinner ? 'bg-green-500 text-white animate-pulse' : 'bg-indigo-100 text-indigo-700'}`}>
                              {lot?.isWinner ? '🏆 GANHADOR' : `G:${item.grupo} C:${item.cota}`}
                            </span>
                          </div>
                        </div>
                      ))}
                      {proximos.length > 4 && (
                        <p className="text-[9px] text-indigo-400 font-medium italic text-right">+ {proximos.length - 4} outros...</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Nenhum alerta */}
            {(() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const aguardando = leads.filter(l => l.status === 'aguardando_pagamento' && l.data_vencimento);
              const atrasados = aguardando.filter(l => parseISO(l.data_vencimento!) < today);
              const semContato = leads.filter(l => (l.status === 'novo' || l.status === 'novo_lead') && l.created_at && (Date.now() - new Date(l.created_at).getTime() > 24 * 60 * 60 * 1000));
              const quentes = leads.filter(l => l.lead_temperatura === 'quente' && l.last_interaction_at && (Date.now() - new Date(l.last_interaction_at).getTime() > 48 * 60 * 60 * 1000) && l.status !== 'fechado' && l.status !== 'morto' && l.status !== 'perdido');
              return atrasados.length === 0 && semContato.length === 0 && quentes.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-xs text-green-700 font-semibold">Tudo em ordem! Nenhum alerta no momento.</p>
                </div>
              ) : null;
            })()}

            <div className="pt-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground italic text-center flex items-center justify-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Atualização automática via Supabase Realtime
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Leads por Valor */}
        <Card className="shadow-sm border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Maiores Valores para Negociar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {leads
                .filter(l => l.status !== "fechado" && l.status !== "morto" && l.status !== "perdido" && l.status !== "inadimplente")
                .sort((a, b) => Number(b.valor_credito || 0) - Number(a.valor_credito || 0))
                .slice(0, 7)
                .map((l, i) => (
                  <div key={l.id} className="flex items-center justify-between p-3 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg font-black text-muted-foreground/40 w-6 text-center">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{l.nome}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{l.status?.replace("_", " ") ?? "novo"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">{formatCurrency(Number(l.valor_credito))}</p>
                  </div>
                ))}
              {leads.filter(l => l.status !== "fechado" && l.status !== "morto" && l.status !== "perdido" && l.status !== "inadimplente").length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">Nenhum lead em negociação.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendário de Vencimentos */}
        <DashboardCalendar leads={leads} />
      </div>

      {/* Últimos Leads e Agendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Últimos Leads Registrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {leads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-accent/5 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{l.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '—'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <p className="text-xs sm:text-sm font-medium hidden sm:block">{formatCurrency(Number(l.valor_credito))}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary capitalize shrink-0">
                      {(l.status ?? 'novo').replace(/_/g, ' ')}
                    </span>
                    <button onClick={() => openWhatsApp(l)} className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors active:scale-95">
                      <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">Nenhum lead ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Agendamentos — dados reais do Supabase */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" /> Próximos Agendamentos
            </CardTitle>
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">Top 10</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border h-[250px] sm:h-[300px] overflow-y-auto custom-scrollbar">
              {(() => {
                const agendados = leads
                  .filter(l => l.data_vencimento && !["perdido", "morto", "fechado"].includes(l.status || ""))
                  .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime())
                  .slice(0, 10);

                if (agendados.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                      <Calendar className="h-8 w-8 opacity-30" />
                      <p className="text-sm">Nenhum agendamento cadastrado.</p>
                      <p className="text-xs opacity-70">Use o botão 📅 nos cards do funil.</p>
                    </div>
                  );
                }

                return agendados.map((l) => {
                  const data = parseISO(l.data_vencimento!);
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const passado = data < hoje;
                  const eHoje = data.toDateString() === hoje.toDateString();
                  return (
                    <div key={l.id} className={`flex items-center justify-between p-3 hover:bg-orange-50/50 transition-colors ${passado ? "opacity-60" : ""}` }>
                      <div className="flex items-center gap-3">
                        <div className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[50px] ${
                          passado ? "bg-red-100 text-red-700" : eHoje ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          <span className="text-xs font-bold leading-none">{format(data, "dd")}</span>
                          <span className="text-[10px] uppercase font-semibold">{format(data, "MMM", { locale: ptBR }).replace(".", "")}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{l.nome}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                            {passado && <span className="text-red-500 font-bold">ATRASADO • </span>}
                            {eHoje && <span className="text-amber-600 font-bold">HOJE • </span>}
                            {l.status?.replace(/_/g, " ") ?? "novo"}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-primary shrink-0">{formatCurrency(Number(l.valor_credito))}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
