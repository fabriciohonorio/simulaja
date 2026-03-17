import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, DollarSign, Handshake, Calendar, AlertTriangle, MessageCircle, Clock, CheckCircle2, BarChart3, Bell, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import DashboardCalendar from "@/components/admin/DashboardCalendar";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { toast } from "sonner";

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
}

const openWhatsApp = (lead: Lead) => {
  const msg = encodeURIComponent(`Olá ${lead.nome}! Vi que você tem interesse em um consórcio. Vamos conversar?`);
  const phone = lead.celular ? lead.celular.replace(/\D/g, "") : "";
  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizacao_id) {
      if (profile) setLoading(false);
      return;
    }

    const fetchData = () => {
      supabase.from("leads")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Erro ao carregar dashboard:", error);
            if (error.message.includes("column") && error.message.includes("organizacao_id")) {
                toast.error("Erro de Versão: A coluna 'organizacao_id' não foi encontrada no Dashboard.");
            }
            return;
          }
          setLeads((data as any[]) ?? []);
          setLoading(false);
        });
    };

    fetchData();

    const channel = supabase
      .channel('dashboard-leads-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads',
        filter: `organizacao_id=eq.${profile.organizacao_id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.organizacao_id]);

  const totalLeads = leads.length;
  const leadsNovos = leads.filter(l => l.status === "novo").length;
  const leadsConvertidos = leads.filter(l => l.status === "fechado").length;
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
    supabase.from("meta").select("meta_anual").order("ano", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (data) setMetaAnual(data.meta_anual || 0);
    });
  }, []);

  const metaMensal = metaAnual / 12;
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const realizadoMes = leads
    .filter(l => l.status === "fechado" && l.created_at?.startsWith(currentMonthStr))
    .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
  
  const progressoMes = metaMensal > 0 ? (realizadoMes / metaMensal) * 100 : 0;


  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">Bem-vindo ao painel de controle do SimulaJá.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full outline outline-1 outline-border">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
        </div>
      </div>

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
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Card Meta x Realizado no Dashboard */}
        <Card className="shadow-sm border-border bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Meta x Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[220px] sm:h-[300px] space-y-6">
            <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status do Mês</p>
                <p className="text-3xl font-black text-primary">{progressoMes.toFixed(2).replace('.', ',')}%</p>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                    <span>Realizado</span>
                    <span>Meta</span>
                </div>
                <div className="w-full bg-primary/10 rounded-full h-4 overflow-hidden border border-primary/20">
                    <div 
                        className="bg-primary h-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, progressoMes)}%` }} 
                    />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                    <span>{formatCurrency(realizadoMes)}</span>
                    <span>{formatCurrency(metaMensal)}</span>
                </div>
            </div>

            <div className={`p-3 rounded-lg border text-center ${progressoMes >= 100 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
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
            {leads.filter(l => l.status === "novo" && l.created_at && (Date.now() - new Date(l.created_at).getTime() > 24 * 60 * 60 * 1000)).length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                <div className="p-2 rounded-full bg-white text-orange-500 shadow-sm"><Clock className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-orange-800">
                    {leads.filter(l => l.status === "novo" && l.created_at && (Date.now() - new Date(l.created_at).getTime() > 24 * 60 * 60 * 1000)).length} Leads sem contato
                  </p>
                  <p className="text-[10px] sm:text-xs text-orange-700">Há mais de 24h sem primeira interação.</p>
                </div>
              </div>
            )}
            <div className="pt-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground italic text-center">Última atualização: agora mesmo</p>
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
                .filter(l => l.status !== "fechado" && l.status !== "morto" && l.status !== "perdido")
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
              {leads.filter(l => l.status !== "fechado" && l.status !== "morto" && l.status !== "perdido").length === 0 && (
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
                    <p className="text-xs text-muted-foreground">{new Date(l.created_at || '').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <p className="text-xs sm:text-sm font-medium hidden sm:block">{formatCurrency(Number(l.valor_credito))}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary capitalize shrink-0">
                      {l.status ?? 'novo'}
                    </span>
                    <button onClick={() => openWhatsApp(l)} className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors active:scale-95">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              ))}
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
                  .filter(l => l.data_vencimento)
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
