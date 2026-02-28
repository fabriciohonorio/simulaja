import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, DollarSign, Handshake, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  tipo_consorcio: string;
  valor_credito: number;
  cidade: string;
  created_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  proposta_enviada: "Proposta Enviada",
  em_negociacao: "Em Negociação",
  fechado: "Fechado",
};

const PIE_COLORS = [
  "hsl(207, 90%, 35%)",
  "hsl(32, 95%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(350, 70%, 50%)",
  "hsl(270, 60%, 55%)",
  "hsl(45, 90%, 50%)",
];

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      setLeads(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const leadsHoje = leads.filter((l) => l.created_at?.slice(0, 10) === today).length;
  const fechados = leads.filter((l) => l.status === "fechado").length;
  const emNeg = leads.filter((l) => l.status === "em_negociacao").length;
  const taxaConversao = leads.length > 0 ? ((fechados / leads.length) * 100).toFixed(1) : "0";
  const ticketMedio = leads.length > 0 ? leads.reduce((s, l) => s + Number(l.valor_credito), 0) / leads.length : 0;

  // Funnel data
  const funnelData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    quantidade: leads.filter((l) => (l.status ?? "novo") === key).length,
  }));

  // Monthly evolution
  const monthlyMap: Record<string, number> = {};
  leads.forEach((l) => {
    const m = l.created_at?.slice(0, 7) ?? "N/A";
    monthlyMap[m] = (monthlyMap[m] ?? 0) + 1;
  });
  const monthlyData = Object.entries(monthlyMap).sort().slice(-12).map(([mes, total]) => ({ mes, total }));

  // Top 5 cities
  const cityMap: Record<string, number> = {};
  leads.forEach((l) => { cityMap[l.cidade] = (cityMap[l.cidade] ?? 0) + 1; });
  const topCidades = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Pie by type
  const typeMap: Record<string, number> = {};
  leads.forEach((l) => { typeMap[l.tipo_consorcio] = (typeMap[l.tipo_consorcio] ?? 0) + 1; });
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  const metrics = [
    { label: "Total Leads", value: leads.length, icon: Users, color: "text-primary" },
    { label: "Leads Hoje", value: leadsHoje, icon: UserPlus, color: "text-primary" },
    { label: "Taxa Conversão", value: `${taxaConversao}%`, icon: TrendingUp, color: "text-green-600" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-secondary" },
    { label: "Em Negociação", value: emNeg, icon: Handshake, color: "text-secondary" },
    { label: "Fechados", value: fechados, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="shadow-sm border-border/50">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <m.icon className={`h-6 w-6 ${m.color}`} />
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel bar */}
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <CardHeader><CardTitle className="text-base">Funil de Vendas</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="hsl(207, 90%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly line */}
        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(32, 95%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top cities */}
        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle className="text-base">Top 5 Cidades</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCidades.map(([cidade, count], i) => (
                <div key={cidade} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{i + 1}. {cidade}</span>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{count} leads</span>
                </div>
              ))}
              {topCidades.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            </div>
          </CardContent>
        </Card>

        {/* Pie by type */}
        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle className="text-base">Distribuição por Tipo</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" labelLine={false} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
