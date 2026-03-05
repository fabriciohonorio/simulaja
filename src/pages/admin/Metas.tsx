import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Target, TrendingUp, DollarSign, Users, Trophy, Flame, ArrowDown, CalendarDays, Lightbulb, Home, Car, Bike,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  tipo_consorcio: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const ABAC_DATA = [
  { segmento: "Imóveis", participacao: 38.2, crescimento: 12.5 },
  { segmento: "Veículos Leves", participacao: 28.4, crescimento: 8.3 },
  { segmento: "Veículos Pesados", participacao: 14.1, crescimento: 15.7 },
  { segmento: "Motocicletas", participacao: 10.8, crescimento: 22.1 },
  { segmento: "Serviços", participacao: 5.3, crescimento: 18.9 },
  { segmento: "Outros", participacao: 3.2, crescimento: 6.4 },
];

const PIE_COLORS = ["hsl(215,70%,40%)","hsl(150,60%,40%)","hsl(40,80%,50%)","hsl(0,65%,50%)","hsl(280,55%,50%)","hsl(195,60%,45%)"];

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

const SEGMENTS = [
  { key: "imoveis", label: "Imóveis", icon: Home, filter: "Imóveis" },
  { key: "veiculos", label: "Veículos", icon: Car, filter: "Veículos" },
  { key: "motos", label: "Motos", icon: Bike, filter: "Motos" },
  { key: "outros", label: "Outros", icon: Target, filter: null },
] as const;

type SegKey = typeof SEGMENTS[number]["key"];

export default function Metas() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metaAnual, setMetaAnual] = useState(0);
  const [metaInput, setMetaInput] = useState("0");
  const [segMetas, setSegMetas] = useState<Record<SegKey, number>>({ imoveis: 0, veiculos: 0, motos: 0, outros: 0 });
  const [segInputs, setSegInputs] = useState<Record<SegKey, string>>({ imoveis: "0", veiculos: "0", motos: "0", outros: "0" });
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const dayOfWeek = new Date().getDay();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [leadsRes, metaRes] = await Promise.all([
      supabase.from("leads").select("*"),
      supabase.from("meta" as any).select("*").eq("ano", currentYear).limit(1).maybeSingle(),
    ]);
    setLeads(leadsRes.data || []);
    const m = metaRes.data as any;
    if (m) {
      setMetaAnual(Number(m.meta_anual || 0));
      setMetaInput(String(m.meta_anual || 0));
      const sm = { imoveis: Number(m.meta_imoveis || 0), veiculos: Number(m.meta_veiculos || 0), motos: Number(m.meta_motos || 0), outros: Number(m.meta_outros || 0) };
      setSegMetas(sm);
      setSegInputs({ imoveis: String(sm.imoveis), veiculos: String(sm.veiculos), motos: String(sm.motos), outros: String(sm.outros) });
    }
    setLoading(false);
  };

  const salvarMeta = async () => {
    const valor = parseFloat(metaInput);
    if (isNaN(valor)) return;
    const { error } = await (supabase.from("meta" as any) as any).upsert(
      { ano: currentYear, meta_anual: valor },
      { onConflict: "ano" }
    );
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setMetaAnual(valor);
    toast({ title: "Meta salva!" });
  };

  const salvarSegMeta = async (key: SegKey) => {
    const valor = parseFloat(segInputs[key]);
    if (isNaN(valor)) return;
    const update: any = {};
    update[`meta_${key}`] = valor;
    const { error } = await (supabase.from("meta" as any) as any).upsert(
      { ano: currentYear, ...update },
      { onConflict: "ano" }
    );
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setSegMetas((p) => ({ ...p, [key]: valor }));
    toast({ title: `Meta ${key} salva!` });
  };

  // Calculations
  const metaMensal = metaAnual / 12;
  const mesStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
  const fechados = leads.filter((l) => l.status === "fechado");
  const fechadosMes = fechados.filter((l) => l.created_at?.slice(0, 7) === mesStr);
  const fechadosAno = fechados.filter((l) => l.created_at?.slice(0, 4) === String(currentYear));
  const realizadoMes = fechadosMes.reduce((a, l) => a + Number(l.valor_credito || 0), 0);
  const realizadoAno = fechadosAno.reduce((a, l) => a + Number(l.valor_credito || 0), 0);
  const faltaMes = Math.max(0, metaMensal - realizadoMes);
  const faltaAno = Math.max(0, metaAnual - realizadoAno);
  const progressoMes = metaMensal > 0 ? Math.min(100, (realizadoMes / metaMensal) * 100) : 0;
  const progressoAno = metaAnual > 0 ? Math.min(100, (realizadoAno / metaAnual) * 100) : 0;
  const ticketMedio = fechadosAno.length > 0 ? realizadoAno / fechadosAno.length : 0;
  const leadsNecessariosMes = ticketMedio > 0 ? Math.ceil(faltaMes / ticketMedio) : 0;
  const mesesRestantes = 12 - currentMonth + 1;
  const leadsNecessariosAno = ticketMedio > 0 ? Math.ceil(faltaAno / ticketMedio) : 0;

  // Segment calculations
  const getSegLeads = (filter: string | null) => {
    const known = ["Imóveis", "Veículos", "Motos"];
    if (filter) return fechadosMes.filter((l) => l.tipo_consorcio === filter);
    return fechadosMes.filter((l) => !known.includes(l.tipo_consorcio || ""));
  };
  const segData = SEGMENTS.map((s) => {
    const segLeads = getSegLeads(s.filter);
    const realizado = segLeads.reduce((a, l) => a + Number(l.valor_credito || 0), 0);
    const metaSeg = segMetas[s.key];
    const metaMesSeg = metaSeg / 12;
    const pct = metaMesSeg > 0 ? Math.min(100, (realizado / metaMesSeg) * 100) : 0;
    const falta = Math.max(0, metaMesSeg - realizado);
    return { ...s, realizado, metaMesSeg, pct, falta };
  });

  // Dica do dia logic
  const generateDica = (): string => {
    const leadsNovos = leads.filter((l) => {
      if (!l.created_at) return false;
      const diff = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7 && (l.status === "novo" || l.status === "contatado");
    });

    const worstSeg = segData.filter((s) => s.metaMesSeg > 0).sort((a, b) => a.pct - b.pct)[0];

    if (dayOfWeek === 1) return "💪 Semana nova! Faça pelo menos 5 follow-ups hoje.";
    if (dayOfWeek === 5) return "🏁 Último dia útil! Feche pendências antes do fim de semana.";
    if (leadsNovos.length >= 5) return `⚠️ Você tem ${leadsNovos.length} leads sem contato há 7+ dias. Reative agora!`;
    if (worstSeg && worstSeg.pct < 50) return `🔥 ${worstSeg.label} está abaixo de 50% da meta mensal! Faltam ${fmt(worstSeg.falta)} para bater.`;
    return "📈 Continue focado! Revise seu funil e priorize os leads em negociação.";
  };

  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const m = `${currentYear}-${(i + 1).toString().padStart(2, "0")}`;
    const r = fechados.filter((l) => l.created_at?.slice(0, 7) === m).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
    return { name: MONTH_NAMES[i], realizado: r, meta: metaMensal };
  });
  const melhorMes = monthsData.reduce((best, m) => m.realizado > best.realizado ? m : best);
  const pieMes = [{ name: "Realizado", value: realizadoMes }, { name: "Faltante", value: faltaMes }];
  const pieAno = [{ name: "Realizado", value: realizadoAno }, { name: "Faltante", value: faltaAno }];

  // Segment atingimento for thermometer
  const segAtingimento: Record<string, number> = {};
  SEGMENTS.forEach((s) => {
    const d = segData.find((sd) => sd.key === s.key);
    segAtingimento[s.label] = d?.pct || 0;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Dica do Dia */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-sm mb-1">Dica do Dia</p>
              <p className="text-sm text-muted-foreground">{generateDica()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with Meta Input */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Metas e Indicadores ({currentYear})</h1>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Meta Anual:</span>
          <Input type="number" value={metaInput} onChange={(e) => setMetaInput(e.target.value)} className="w-36" />
          <Button size="sm" onClick={salvarMeta}>Salvar</Button>
        </div>
      </div>

      {/* Auto monthly */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Meta Mensal (automática)</p><p className="text-xl font-bold">{fmt(metaMensal)}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Meta Anual</p><p className="text-xl font-bold">{fmt(metaAnual)}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="mes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mes">📅 Meta do Mês</TabsTrigger>
          <TabsTrigger value="ano">📊 Meta do Ano</TabsTrigger>
        </TabsList>

        <TabsContent value="mes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Realizado no Mês</p><p className="text-lg font-bold">{fmt(realizadoMes)}</p><p className="text-xs text-muted-foreground">de {fmt(metaMensal)}</p></div></div><Progress value={progressoMes} className="mt-3 h-2" /><p className="text-xs text-right mt-1 text-muted-foreground">{progressoMes.toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><ArrowDown className="h-5 w-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">Falta p/ Meta</p><p className="text-lg font-bold">{fmt(faltaMes)}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Leads Necessários</p><p className="text-lg font-bold">{leadsNecessariosMes}</p><p className="text-xs text-muted-foreground">Ticket médio: {fmt(ticketMedio)}</p></div></div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base">Atingimento Mensal</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieMes} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={2}><Cell fill="hsl(215,70%,40%)" /><Cell fill="hsl(var(--muted))" /></Pie><Tooltip formatter={(v: number) => fmt(v)} /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
        </TabsContent>

        <TabsContent value="ano" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Realizado no Ano</p><p className="text-lg font-bold">{fmt(realizadoAno)}</p><p className="text-xs text-muted-foreground">de {fmt(metaAnual)}</p></div></div><Progress value={progressoAno} className="mt-3 h-2" /><p className="text-xs text-right mt-1 text-muted-foreground">{progressoAno.toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><ArrowDown className="h-5 w-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">Falta p/ Meta</p><p className="text-lg font-bold">{fmt(faltaAno)}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Leads Necessários</p><p className="text-lg font-bold">{leadsNecessariosAno}</p><p className="text-xs text-muted-foreground">~{leadsNecessariosAno > 0 ? Math.ceil(leadsNecessariosAno / mesesRestantes) : 0}/mês ({mesesRestantes} meses restantes)</p></div></div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base">Atingimento Anual</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieAno} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={2}><Cell fill="hsl(150,60%,40%)" /><Cell fill="hsl(var(--muted))" /></Pie><Tooltip formatter={(v: number) => fmt(v)} /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Meta por Segmento */}
      <h2 className="text-lg font-bold">Meta por Segmento</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segData.map((seg) => {
          const progressColor = seg.pct >= 70 ? "bg-green-500" : seg.pct >= 40 ? "bg-yellow-500" : "bg-red-500";
          return (
            <Card key={seg.key}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <seg.icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">{seg.label}</span>
                  </div>
                  <span className="text-xs font-bold">{seg.pct.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={segInputs[seg.key]}
                    onChange={(e) => setSegInputs((p) => ({ ...p, [seg.key]: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Meta anual"
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={() => salvarSegMeta(seg.key)}>
                    Salvar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Mensal: {fmt(seg.metaMesSeg)}</p>
                <p className="text-xs text-muted-foreground">Realizado: {fmt(seg.realizado)}</p>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${Math.min(100, seg.pct)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Falta: {fmt(seg.falta)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bar Chart */}
      <Card><CardHeader><CardTitle className="text-base">Meta vs Realizado por Mês</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthsData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => fmt(v)} /><Legend /><Bar dataKey="meta" name="Meta" fill="hsl(var(--muted))" radius={[4,4,0,0]} /><Bar dataKey="realizado" name="Realizado" fill="hsl(215,70%,40%)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>

      {/* KPIs extras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-lg font-bold">{fmt(ticketMedio)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Leads Fechados (Mês / Ano)</p><p className="text-lg font-bold">{fechadosMes.length} / {fechadosAno.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Trophy className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Melhor Mês</p><p className="text-lg font-bold">{melhorMes.name}</p><p className="text-xs text-muted-foreground">{fmt(melhorMes.realizado)}</p></div></div></CardContent></Card>
      </div>

      {/* Termômetro ABAC + Integração com Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" /> Termômetro do Mercado — Consórcio (Ref. ABAC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">Dados de referência ABAC com integração às suas metas por segmento.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ABAC_DATA} cx="50%" cy="50%" outerRadius={100} dataKey="participacao" nameKey="segmento" label={({ segmento, participacao }) => `${segmento}: ${participacao}%`} labelLine={false}>
                    {ABAC_DATA.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ABAC_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="segmento" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="crescimento" name="Crescimento %" fill="hsl(150,60%,40%)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
            {ABAC_DATA.map((item, i) => {
              const matchSeg = item.segmento === "Imóveis" ? "Imóveis" : item.segmento === "Veículos Leves" ? "Veículos" : item.segmento === "Motocicletas" ? "Motos" : null;
              const pct = matchSeg ? segAtingimento[matchSeg === "Veículos" ? "Veículos" : matchSeg === "Motos" ? "Motos" : "Imóveis"] || 0 : 0;
              const icon = matchSeg ? (pct >= 70 ? "✅" : pct >= 40 ? "⚠️" : "❌") : "";
              return (
                <div key={item.segmento} className="text-center p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <p className="text-xs font-medium">{item.segmento}</p>
                  <p className="text-sm font-bold">{item.participacao}%</p>
                  <p className="text-xs text-primary">+{item.crescimento}%</p>
                  {matchSeg && <p className="text-xs mt-1">{icon} {pct.toFixed(0)}% meta</p>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
