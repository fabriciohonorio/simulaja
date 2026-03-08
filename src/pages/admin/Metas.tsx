import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Target, TrendingUp, DollarSign, Clock, Users, AlertTriangle, Trophy, UserX, BarChart3, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Lead {
    id: string;
    nome: string;
    status: string | null;
    valor_credito: number;
    created_at: string | null;
    updated_at: string | null;
    propensity_score?: number | null;
    propensity_reason?: string | null;
}

interface Termometro {
    id: number;
    segmento: string;
    percentual: number;
}

export default function Metas() {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [metaAnual, setMetaAnual] = useState<number>(0);
    const [metaInput, setMetaInput] = useState<string>("0");
    const [termometro, setTermometro] = useState<Termometro[]>([]);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: leadsData } = await supabase.from("leads").select("*");
            const { data: metaData } = await supabase.from("meta").select("*").eq("ano", currentYear).maybeSingle();
            const { data: termData } = await supabase.from("mercado_termometro").select("*").order("segmento");
            setLeads((leadsData as Lead[]) || []);
            if (metaData) {
                setMetaAnual(metaData.meta_anual || 0);
                setMetaInput(String(metaData.meta_anual || 0));
            }
            setTermometro(termData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const salvarMeta = async () => {
        const novoValor = parseFloat(metaInput);
        if (isNaN(novoValor)) return;
        await supabase.from("meta").upsert({ ano: currentYear, meta_anual: novoValor }, { onConflict: "ano" });
        setMetaAnual(novoValor);
        toast({ title: "Meta salva com sucesso!" });
    };

    const updateTermometro = async (id: number, novoValor: number) => {
        await supabase.from("mercado_termometro").update({ percentual: novoValor }).eq("id", id);
        setTermometro(prev => prev.map(t => t.id === id ? { ...t, percentual: novoValor } : t));
    };

    const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
    const metaMensal = metaAnual / 12;
    const mesStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
    const fechados = leads.filter(l => (l.status || "").toLowerCase() === "fechado");
    const realizadoMes = fechados.filter(l => l.created_at?.startsWith(mesStr)).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
    const realizadoAno = fechados.filter(l => l.created_at?.startsWith(String(currentYear))).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
    const faltaAno = Math.max(0, metaAnual - realizadoAno);
    const mesesRestantes = Math.max(1, 12 - currentMonth + 1);
    const necessarioPorMes = faltaAno / mesesRestantes;
    const progressoMes = metaMensal > 0 ? Math.min(100, (realizadoMes / metaMensal) * 100) : 0;
    const progressoAno = metaAnual > 0 ? Math.min(100, (realizadoAno / metaAnual) * 100) : 0;
    const ticketMedio = fechados.length > 0 ? realizadoAno / fechados.length : 0;
    const leadsAno = leads.filter(l => l.created_at?.startsWith(String(currentYear)));
    const taxaConversao = leadsAno.length > 0 ? (fechados.length / leadsAno.length) * 100 : 0;
    const perdidos = leads.filter(l => ["perdido", "desistiu"].includes((l.status || "").toLowerCase()));
    const taxaPerda = leadsAno.length > 0 ? (perdidos.length / leadsAno.length) * 100 : 0;
    const faltaMes = Math.max(0, metaMensal - realizadoMes);
    const leadsNecessarios = Math.ceil(ticketMedio > 0 ? faltaMes / ticketMedio : 0);
    const diaHoje = new Date().getDate();
    const diasMes = new Date(currentYear, currentMonth, 0).getDate();
    const projecaoMes = diaHoje > 0 ? (realizadoMes / diaHoje) * diasMes : 0;
    const seteDias = new Date(); seteDias.setDate(seteDias.getDate() - 7);
    const semFollowUp = leads.filter(l => {
        if (["fechado", "perdido", "desistiu"].includes(l.status || "")) return false;
        const u = l.updated_at ? new Date(l.updated_at) : new Date(l.created_at || "");
        return u < seteDias;
    }).length;
    const topLeads = leads
        .filter(l => !["fechado", "perdido", "desistiu", "morto"].includes(l.status || ""))
        .sort((a, b) => Number(b.propensity_score || 0) - Number(a.propensity_score || 0))
        .slice(0, 5);
    const monthsData = Array.from({ length: 12 }, (_, i) => {
        const m = `${currentYear}-${(i + 1).toString().padStart(2, "0")}`;
        const r = fechados.filter(l => l.created_at?.startsWith(m)).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
        return { name: new Date(currentYear, i, 1).toLocaleString("pt-BR", { month: "short" }), realizado: r, meta: metaMensal };
    });

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-4 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="space-y-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Metas e Indicadores</h1>
                    <p className="text-sm text-muted-foreground">Acompanhe seu desempenho de {currentYear}</p>
                </div>
                {/* Meta Anual Card — stacked on mobile */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                                <Target className="h-5 w-5 text-primary" />
                                <span className="font-semibold text-sm">Meta Anual ({currentYear})</span>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-muted-foreground text-sm">R$</span>
                                <Input
                                    type="number"
                                    value={metaInput}
                                    onChange={(e: any) => setMetaInput(e.target.value)}
                                    className="flex-1 h-9 text-right font-bold"
                                />
                                <Button size="sm" onClick={salvarMeta} className="shrink-0">Salvar</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" />Desempenho do Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-xl sm:text-2xl font-bold text-primary">{fmt(realizadoMes)}</p>
                                <p className="text-xs text-muted-foreground">de {fmt(metaMensal)}</p>
                            </div>
                            <span className="text-lg sm:text-xl font-bold">{progressoMes.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressoMes}%` }} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4" />Desempenho do Ano
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{fmt(realizadoAno)}</p>
                                <p className="text-xs text-muted-foreground">de {fmt(metaAnual)}</p>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-green-600">{progressoAno.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progressoAno}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Grid — 2 cols on phones, 4 on md, 7 on xl */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
                {[
                    { icon: DollarSign, color: "text-blue-500", val: fmt(ticketMedio), label: "Ticket Médio" },
                    { icon: TrendingUp, color: "text-green-500", val: `${taxaConversao.toFixed(1)}%`, label: "Conversão" },
                    { icon: Users, color: "text-orange-500", val: leadsNecessarios, label: "Leads Necessários" },
                    { icon: Clock, color: "text-purple-500", val: "0.0 dias", label: "Tempo Fechamento" },
                    { icon: UserX, color: "text-red-500", val: `${taxaPerda.toFixed(1)}%`, label: "Taxa de Perda" },
                    { icon: BarChart3, color: "text-indigo-500", val: fmt(projecaoMes), label: "Projeção do Mês" },
                    { icon: AlertTriangle, color: semFollowUp > 0 ? "text-red-500" : "text-gray-400", val: semFollowUp, label: "Sem Follow-up >7d" },
                ].map((k, i) => (
                    <Card key={i} className={i === 6 && semFollowUp > 0 ? "bg-red-50 border-red-200" : ""}>
                        <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                            <k.icon className={`h-5 w-5 ${k.color}`} />
                            <p className="text-base sm:text-xl font-bold leading-tight">{k.val}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart + Thermometer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-sm sm:text-base">Meta vs Realizado ({currentYear})</CardTitle></CardHeader>
                    <CardContent className="h-56 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={v => `R$${v >= 1000 ? (v / 1000) + "k" : v}`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: number) => fmt(v)} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="meta" name="Meta" fill="hsl(215,20%,65%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realizado" name="Realizado" fill="hsl(207,90%,35%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm sm:text-base flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" />Termômetro de Mercado</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {termometro.map(item => {
                            const cor = item.percentual >= 70 ? "bg-red-500" : item.percentual >= 40 ? "bg-orange-500" : "bg-blue-500";
                            const txt = item.percentual >= 70 ? "text-red-600" : item.percentual >= 40 ? "text-orange-600" : "text-blue-600";
                            const label = item.percentual >= 70 ? "Quente" : item.percentual >= 40 ? "Morno" : "Frio";
                            return (
                                <div key={item.id} className="space-y-1">
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-sm font-medium truncate">{item.segmento}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className={`text-xs font-bold ${txt}`}>{label}</span>
                                            <Input type="number" value={item.percentual} onChange={(e: any) => updateTermometro(item.id, Number(e.target.value))} className="w-14 h-7 text-xs text-center p-1" min="0" max="100" />
                                            <span className="text-xs">%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1.5"><div className={`${cor} h-full rounded-full`} style={{ width: `${item.percentual}%` }} /></div>
                                </div>
                            );
                        })}
                        {termometro.length === 0 && <p className="text-sm text-center text-muted-foreground">Nenhum segmento configurado.</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Top Leads + Destaque */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm sm:text-base">Ranking de Propensão de Compra</CardTitle>
                        <Trophy className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topLeads.map((l, i) => (
                            <div key={l.id} className="space-y-2 p-3 rounded-lg border bg-white shadow-sm">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{i + 1}. {l.nome}</p>
                                        <p className="text-[10px] text-muted-foreground italic truncate">{l.propensity_reason || "Calculando propensão..."}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-primary text-sm">{fmt(l.valor_credito || 0)}</p>
                                        <span className={`text-[10px] font-black ${(l.propensity_score || 0) >= 70 ? "text-green-600" :
                                            (l.propensity_score || 0) >= 40 ? "text-orange-600" : "text-slate-400"
                                            }`}>
                                            {l.propensity_score || 0}% Chance
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${(l.propensity_score || 0) >= 70 ? "bg-green-500" :
                                            (l.propensity_score || 0) >= 40 ? "bg-orange-500" : "bg-slate-300"
                                            }`}
                                        style={{ width: `${l.propensity_score || 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {topLeads.length === 0 && <p className="text-sm text-center text-muted-foreground">Nenhum lead em aberto.</p>}
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader><CardTitle className="text-sm sm:text-base text-center">Destaque do Ano</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center gap-4 py-4 sm:py-6">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/20 flex items-center justify-center">
                            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Melhor Mês</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">{monthsData.reduce((best, m) => m.realizado > best.realizado ? m : best, monthsData[0])?.name}</p>
                            <p className="text-sm font-bold mt-1">{fmt(monthsData.reduce((best, m) => m.realizado > best.realizado ? m : best, monthsData[0])?.realizado || 0)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
