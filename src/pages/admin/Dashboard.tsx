import { useEffect, useState, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, DollarSign, Handshake, Calendar, AlertTriangle, MessageCircle, Clock, CheckCircle2, BarChart3, Bell, Target, Zap, Trophy, MessageSquare, Phone, Sparkles, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import DashboardCalendar from "@/components/admin/DashboardCalendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from "recharts";
import { getLoteriaStatus } from "@/lib/consortium-logic";
import StreakBadge from "@/components/admin/StreakBadge";
import MissoesDiarias from "@/components/admin/MissoesDiarias";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  status_updated_at: string | null;
  origem: string | null;
  valor_credito: number;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  last_interaction_at: string | null;
  data_vencimento: string | null;
  celular: string | null;
  responsavel_id: string | null;
  propensity_score: number | null;
  dados_cadastro: any | null;
}
interface CarteiraItem {
  id: string;
  nome: string;
  grupo: string | null;
  cota: string | null;
  valor_credito: number | null;
  celular: string | null;
  administradora: string | null;
  tipo_consorcio: string | null;
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
  const [inadimplentes, setInadimplentes] = useState<any[]>([]);
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
        .select("id, nome, grupo, cota, valor_credito, celular, administradora, tipo_consorcio")
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

      (supabase as any)
        .from("inadimplentes")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .then(({ data }: any) => {
          setInadimplentes((data as any[]) || []);
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
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'inadimplentes',
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

  // New Metrics
  const totalClientes = carteira.length;
  const inadimplentesAtivos = inadimplentes.filter(i => i.status !== 'regularizado').length;
  const percentInadimplencia = totalClientes > 0 ? (inadimplentesAtivos / totalClientes) * 100 : 0;
  const percentRetencao = totalClientes > 0 ? ((totalClientes - inadimplentesAtivos) / totalClientes) * 100 : 0;

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Novos", value: leadsNovos, icon: UserPlus, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Fechados", value: leadsConvertidos, icon: Handshake, color: "text-green-500", bg: "bg-green-50" },
    { label: "Taxa Conversão", value: `${taxaConversao.toFixed(1)}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Valor Potencial", value: formatCurrency(volumeTotal), icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Avg Contact", value: `${avgContactTime.toFixed(1)}h`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  // Calcular Performance Semanal Real — usando fuso de Brasília (UTC-3)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    // Usar horário de São Paulo para evitar virada de dia errada
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
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
  const currentMonthStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).substring(0, 7);
  const realizadoMes = leads
    .filter(l => {
      const s = (l.status || "").toLowerCase().replace("_", " ");
      const isClosed = s === "fechado" || s === "venda fechada";
      const dateToCheck = l.status_updated_at || l.created_at || "";
      const isInMonth = dateToCheck.startsWith(currentMonthStr);
      const isShadow = (l as any).origem === "carteira_shadow";
      const isRetroativo = l.dados_cadastro?.is_retroativo === true;
      return isClosed && isInMonth && !isShadow && !isRetroativo;
    })
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
      const s = (l.status || "").toLowerCase().replace("_", " ");
      const isClosed = s === "fechado" || s === "venda fechada";
      const dateToCheck = l.status_updated_at || l.created_at || "";
      const isInMonth = dateToCheck.startsWith(currentMonthStr);
      const isShadow = (l as any).origem === "carteira_shadow";
      const isRetroativo = l.dados_cadastro?.is_retroativo === true;
      return isClosed && isInMonth && l.responsavel_id && !isShadow && !isRetroativo;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Clientes na Carteira */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Clientes na Carteira</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black">{totalClientes}</p>
                <span className="text-[9px] opacity-80 font-bold uppercase tracking-tighter">Contratos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: % Inadimplência */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Inadimplência</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black">{percentInadimplencia.toFixed(1)}%</p>
                <span className="text-[9px] opacity-80 font-bold uppercase tracking-tighter">{inadimplentesAtivos} em atraso</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Retenção */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Retenção</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black">{percentRetencao.toFixed(1)}%</p>
                <span className="text-[9px] opacity-80 font-bold uppercase tracking-tighter">Saúde da Carteira</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {profile?.id && profile?.organizacao_id && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white border border-border rounded-xl px-4 py-3 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center shadow-sm">
            {/* Streak — coluna esquerda */}
            <div className="flex justify-center md:justify-start">
              <StreakBadge userId={profile.id} variant="full" />
            </div>

            {/* Missões — coluna direita */}
            <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <MissoesDiarias
                userId={profile.id}
                orgId={profile.organizacao_id}
                tipoAcesso={profile.tipo_acesso as any}
              />
            </div>
          </div>
        </div>
      )}

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

      {/* Ranking de Consultores - Standardized Slim Style */}
      {ranking.length > 0 && (
        <AdminHeroCard 
          title="Ranking de Consultores" 
          subtitle="Performance Mensal da Equipe"
          icon={Trophy} 
          bgIcon={Trophy}
          accentColor="amber"
          className="mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ranking.map((item, i) => (
              <div key={item.id} className={`group/rank relative flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 transition-all hover:bg-white hover:shadow-md ${
                i === 0 ? "border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : ""
              }`}>
                <div className="relative">
                  <div className={`h-12 w-12 rounded-full border-2 overflow-hidden flex items-center justify-center text-lg font-black shrink-0 ${
                    i === 0 ? "border-emerald-500" :
                    i === 1 ? "border-blue-400" : "border-violet-500"
                  }`}>
                    {item.avatar ? (
                       <img src={item.avatar} alt={item.nome} className="h-full w-full object-cover" />
                    ) : (
                      item.nome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={`absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center shadow-lg font-black text-[10px] border ${
                    i === 0 ? "bg-emerald-500 text-white border-emerald-300" :
                    i === 1 ? "bg-blue-500 text-white border-blue-300" :
                    "bg-violet-500 text-white border-violet-300"
                  }`}>
                    {i + 1}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate text-slate-900">{item.nome}</p>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${
                    i === 0 ? "text-emerald-500" : i === 1 ? "text-blue-400" : "text-violet-500"
                  }`}>
                    {formatLeadValue(item.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AdminHeroCard>
      )}


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
                    <span>{formatLeadValue(realizadoMes)}</span>
                    <span>{formatLeadValue(metaMensal)}</span>
                </div>
            </div>

            <div className={`p-3 rounded-lg border text-center ${progressoMes >= 100 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <p className="text-xs font-bold uppercase">
                    {progressoMes >= 100 ? '🚀 Meta Batida!' : `Ainda faltam ${formatLeadValue(Math.max(0, metaMensal - realizadoMes))}`}
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
                .map(item => ({ item, lot: getLoteriaStatus(loteriaFederal, item.cota, item.grupo, item.administradora, item.tipo_consorcio) }))
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
                    <p className="text-sm font-bold text-primary shrink-0">{formatLeadValue(Number(l.valor_credito))}</p>
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
                    <p className="text-xs sm:text-sm font-medium hidden sm:block">{formatLeadValue(Number(l.valor_credito))}</p>
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
