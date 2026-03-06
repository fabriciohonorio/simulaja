import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, DollarSign, Handshake, Calendar, AlertTriangle, MessageCircle, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  last_interaction_at: string | null;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const openWhatsApp = (lead: Lead) => {
  const msg = encodeURIComponent(`Olá ${lead.nome}! Vi que você tem interesse em um consórcio. Vamos conversar?`);
  const phone = "5511999999999"; // Exemplo
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
};

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      setLeads((data as any) ?? []);
      setLoading(false);
    });
  }, []);

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

  // Dados fictícios para o gráfico (agrupados por dia/mês nas próximas iterações)
  const chartData = [
    { name: "Seg", leads: 4, volume: 450000 },
    { name: "Ter", leads: 7, volume: 820000 },
    { name: "Qua", leads: 5, volume: 590000 },
    { name: "Qui", leads: 12, volume: 1400000 },
    { name: "Sex", leads: 8, volume: 920000 },
  ];

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
        {/* Gráfico de Evolução */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Performance Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent)/0.5)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertas / Próximas Ações */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 group cursor-pointer hover:bg-orange-100 transition-colors">
              <div className="p-2 rounded-full bg-white text-orange-500 shadow-sm"><Clock className="h-4 w-4" /></div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-orange-800">12 Leads sem contato</p>
                <p className="text-[10px] sm:text-xs text-orange-700">Há mais de 24h sem primeira interação.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 group cursor-pointer hover:bg-blue-100 transition-colors">
              <div className="p-2 rounded-full bg-white text-blue-500 shadow-sm"><MessageCircle className="h-4 w-4" /></div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-blue-800">5 Propostas vencendo</p>
                <p className="text-[10px] sm:text-xs text-blue-700">Acompanhe hoje para não perder o timing.</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground italic text-center">Última atualização: agora mesmo</p>
            </div>
          </CardContent>
        </Card>

        {/* Intelligence Breakdown */}
        <Card className="shadow-sm border-border bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Inteligência Comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-border shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Por Temperatura</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span>🔥 Quente</span> <b>{leadsPorTemp.Quente}</b></div>
                  <div className="flex justify-between text-xs"><span>🌤 Morno</span> <b>{leadsPorTemp.Morno}</b></div>
                  <div className="flex justify-between text-xs"><span>❄️ Frio</span> <b>{leadsPorTemp.Frio}</b></div>
                  <div className="flex justify-between text-xs text-red-400"><span>☠️ Morto</span> <b>{leadsPorTemp.Morto}</b></div>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-border shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Por Crédito</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span>💎 Premium</span> <b>{leadsPorCredito.Premium}</b></div>
                  <div className="flex justify-between text-xs"><span>🔥 Alto</span> <b>{leadsPorCredito.Alto}</b></div>
                  <div className="flex justify-between text-xs"><span>🚀 Médio</span> <b>{leadsPorCredito.Medio}</b></div>
                  <div className="flex justify-between text-xs"><span>🌱 Baixo</span> <b>{leadsPorCredito.Baixo}</b></div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-[10px] text-primary uppercase font-bold">Oportunidade de Mercado</p>
              <p className="text-lg font-bold text-primary mt-1">{formatCurrency(volumeTotal)}</p>
              <p className="text-[10px] text-primary/70">Volume total em negociação no funil</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recentes / Quick Links */}
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
    </div>
  );
}
