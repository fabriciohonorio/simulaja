import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { 
    Target, 
    TrendingUp, 
    DollarSign, 
    Clock, 
    Users, 
    AlertTriangle, 
    Trophy, 
    UserX, 
    BarChart3, 
    Flame, 
    Lightbulb, 
    TrendingDown, 
    Home, 
    Car, 
    Bike, 
    Truck, 
    AlertCircle,
    CheckCircle2,
    LucideIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface TermometroMercado {
  id: string;
  mes_referencia: string;
  participantes_ativos: number;
  participantes_ativos_variacao: number;
  vendas_cotas: number;
  vendas_cotas_variacao: number;
  creditos_comercializados: number;
  creditos_comercializados_variacao: number;
  ticket_medio: number;
  ticket_medio_variacao: number;
  contemplacoes: number;
  contemplacoes_variacao: number;
  creditos_disponibilizados: number;
  creditos_disponibilizados_variacao: number;
  temperatura: 'quente' | 'morno' | 'frio';
  temperatura_score: number;
}

export interface DicaEstrategica {
  id: string;
  termometro_id: string;
  categoria: string;
  prioridade: number;
  titulo: string;
  descricao: string;
  emoji: string;
  ativo: boolean;
}

export interface MetricaSegmento {
  segmento: 'imoveis' | 'veiculos' | 'motos' | 'investimentos' | 'pesados';
  total_leads: number;
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  taxa_conversao: number;
  meta_vendas: number;
  progresso_meta: number;
}

interface Lead {
    id: string;
    status: string | null;
    valor_credito: number;
    created_at: string | null;
    updated_at: string | null;
    tipo_consorcio: string | null;
    propensity_score?: number | null;
}


const SEGMENT_CONFIG: Record<string, { icon: LucideIcon, color: string, textColor: string, label: string }> = {
    imoveis: { icon: Home, color: 'bg-blue-600', textColor: 'text-blue-600', label: 'Imóveis' },
    veiculos: { icon: Car, color: 'bg-green-600', textColor: 'text-green-600', label: 'Carros' },
    motos: { icon: Bike, color: 'bg-orange-500', textColor: 'text-orange-500', label: 'Motos' },
    pesados: { icon: Truck, color: 'bg-purple-600', textColor: 'text-purple-600', label: 'Pesados' },
    investimentos: { icon: TrendingUp, color: 'bg-yellow-600', textColor: 'text-yellow-600', label: 'Investimentos' }
};

export default function Metas() {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [metaAnual, setMetaAnual] = useState<number>(0);
    const [metaInput, setMetaInput] = useState<string>("0");
    const [termometro, setTermometro] = useState<TermometroMercado | null>(null);
    const [dicas, setDicas] = useState<DicaEstrategica[]>([]);
    const [segmentos, setSegmentos] = useState<MetricaSegmento[]>([]);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const mesStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

    useEffect(() => { 
        fetchData(); 
        
        const channel = supabase
            .channel('metas-leads-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: leadsData } = await supabase.from("leads").select("*");
            const { data: metaData } = await supabase.from("meta").select("*").eq("ano", currentYear).maybeSingle();
            
            const allLeads = (leadsData as Lead[]) || [];
            setLeads(allLeads);
            
            if (metaData) {
                setMetaAnual(metaData.meta_anual || 0);
                setMetaInput(String(metaData.meta_anual || 0));
            }
            
            // Metas Mensais Pessoais (Fixas conforme solicitado)
            const monthlyMetas: Record<string, number> = {
                imoveis: 500000,
                veiculos: 100000,
                motos: 100000,
                pesados: 180000,
                investimentos: 120000
            };

            const segs: MetricaSegmento[] = [
                { segmento: 'imoveis', keywords: ['imovel', 'imóvel', 'casa', 'apartamento', 'terreno', 'construcao', 'reforma'] },
                { segmento: 'veiculos', keywords: ['veiculo', 'veículo', 'carro', 'auto', 'automovel', 'automóvel'] },
                { segmento: 'motos', keywords: ['moto', 'motocicleta'] },
                { segmento: 'pesados', keywords: ['pesados', 'agricolas', 'caminhao', 'caminhão', 'trator', 'maquina', 'máquina'] },
                { segmento: 'investimentos', keywords: ['investimento', 'capitalizacao', 'aposentadoria', 'investimentos'] }
            ].map(config => {
                const segmentLeads = allLeads.filter(l => {
                    const type = (l.tipo_consorcio || "").toLowerCase();
                    return config.keywords.some(keyword => type.includes(keyword));
                });
                
                const currentMonthLeads = segmentLeads.filter(l => l.created_at?.startsWith(mesStr));
                const segmentVendas = segmentLeads.filter(l => (l.status || "").toLowerCase() === "fechado");
                const currentMonthVendas = segmentVendas.filter(l => l.created_at?.startsWith(mesStr));
                
                const valorTotal = currentMonthVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
                
                // Meta fixa mensal (pessoal) conforme solicitado pelo usuário
                const metaValue = monthlyMetas[config.segmento];
                
                const vendasCount = currentMonthVendas.length;
                const leadsCount = currentMonthLeads.length;
                const conversao = leadsCount > 0 ? (vendasCount / leadsCount) * 100 : 0;
                
                // Using historical ticket médio for planning if current month has few sales
                const historicalVendas = segmentVendas.length;
                const historicalValor = segmentVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
                const ticketMedioRef = historicalVendas > 0 ? historicalValor / historicalVendas : (valorTotal / (vendasCount || 1)) || 100000;
                
                const previsao = leadsCount * (conversao / 100) * ticketMedioRef;
                const progresso = metaValue > 0 ? (valorTotal / metaValue) * 100 : 0;
                
                const leadsNeeded = (conversao > 0 && ticketMedioRef > 0) 
                    ? Math.ceil(metaValue / ((conversao / 100) * ticketMedioRef))
                    : 0;

                return {
                    segmento: config.segmento as any,
                    total_leads: leadsCount,
                    total_vendas: vendasCount,
                    valor_total: valorTotal,
                    ticket_medio: ticketMedioRef,
                    taxa_conversao: conversao,
                    meta_vendas: metaValue,
                    progresso_meta: progresso,
                    full_previsao: previsao,
                    leads_necessarios_total: leadsNeeded
                } as any;
            });

            setSegmentos(segs);
            
            await Promise.all([
                fetchTermometro()
            ]);
        } catch (err) {
            // Error already logged by Supabase if relevant
        } finally {
            setLoading(false);
        }
    };

    async function fetchTermometro() {
        const { data, error } = await (supabase.from('termometro_mercado' as any) as any)
            .select('*')
            .order('mes_referencia', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Erro ao buscar termômetro:', error);
            return;
        }

        setTermometro(data as unknown as TermometroMercado);
    }

    async function fetchDicas(termometroId: string) {
        const { data, error } = await (supabase.from('dicas_estrategicas' as any) as any)
            .select('*')
            .eq('termometro_id', termometroId)
            .eq('ativo', true)
            .order('prioridade')
            .order('created_at');

        if (!error) setDicas((data as unknown as DicaEstrategica[]) || []);
    }


    useEffect(() => {
        if (termometro) {
            fetchDicas(termometro.id);
        }
    }, [termometro]);

    const salvarMeta = async () => {
        const novoValor = parseFloat(metaInput);
        if (isNaN(novoValor)) return;
        await supabase.from("meta").upsert({ ano: currentYear, meta_anual: novoValor }, { onConflict: "ano" });
        setMetaAnual(novoValor);
        toast({ title: "Meta salva com sucesso!" });
    };

        const metaMensal = metaAnual / 12;
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaInput(e.target.value)}
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
                                <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(realizadoMes)}</p>
                                <p className="text-xs text-muted-foreground">de {formatCurrency(metaMensal)}</p>
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
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(realizadoAno)}</p>
                                <p className="text-xs text-muted-foreground">de {formatCurrency(metaAnual)}</p>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-green-600">{progressoAno.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progressoAno}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Falta para Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Target className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Falta para a Meta Anual</p>
                            <p className="text-xl sm:text-2xl font-bold text-amber-800">{formatCurrency(faltaAno)}</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                {faltaAno <= 0 ? "🎉 Meta atingida!" : `${(100 - progressoAno).toFixed(1)}% restante`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-200">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-700 font-semibold uppercase tracking-wide">Necessário por Mês</p>
                            <p className="text-xl sm:text-2xl font-bold text-indigo-800">{formatCurrency(necessarioPorMes)}</p>
                            <p className="text-xs text-indigo-600 mt-0.5">
                                nos {mesesRestantes} {mesesRestantes === 1 ? "mês restante" : "meses restantes"} de {currentYear}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Grid — 2 cols on phones, 4 on md, 7 on xl */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-3">
                {(() => {
                    const faltaMetaMesColor = progressoMes >= 99 ? "text-green-600" : progressoMes >= 70 ? "text-amber-500" : "text-red-500";
                    const faltaMetaMesBg = progressoMes >= 99 ? "bg-green-50 border-green-200" : progressoMes >= 70 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
                    const items = [
                        { icon: DollarSign, color: "text-blue-500", val: formatCurrency(ticketMedio), label: "Ticket Médio", cardClass: "" },
                        { icon: TrendingUp, color: "text-green-500", val: `${taxaConversao.toFixed(1)}%`, label: "Conversão", cardClass: "" },
                        { icon: Users, color: "text-orange-500", val: leadsNecessarios, label: "Leads Necessários", cardClass: "" },
                        { icon: Clock, color: "text-purple-500", val: `${diasMes - diaHoje} dias`, label: "Dias p/ Fechar Mês", cardClass: "" },
                        { icon: Target, color: faltaMetaMesColor, val: formatCurrency(faltaMes), label: "Falta p/ Meta Mês", cardClass: faltaMetaMesBg },
                        { icon: UserX, color: "text-red-500", val: `${taxaPerda.toFixed(1)}%`, label: "Taxa de Perda", cardClass: "" },
                        { icon: BarChart3, color: "text-indigo-500", val: formatCurrency(projecaoMes), label: "Projeção do Mês", cardClass: "" },
                        { icon: AlertTriangle, color: semFollowUp > 0 ? "text-red-600" : "text-gray-400", val: semFollowUp, label: "Sem Follow-up >7d", cardClass: semFollowUp > 0 ? "bg-red-100 border-red-400 border-2 shadow-sm scale-105 transition-all" : "" },
                    ];
                    return items.map((k, i) => (
                        <Card key={i} className={k.cardClass}>
                            <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                                <k.icon className={`h-5 w-5 ${k.color}`} />
                                <p className="text-base sm:text-xl font-bold leading-tight">{k.val}</p>
                                <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
                            </CardContent>
                        </Card>
                    ));
                })()}
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
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="meta" name="Meta" fill="hsl(215,20%,65%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realizado" name="Realizado" fill="hsl(207,90%,35%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Flame className={`h-5 w-5 ${termometro?.temperatura === 'quente' ? 'text-red-500' : termometro?.temperatura === 'morno' ? 'text-yellow-500' : 'text-blue-500'}`} />
                                Termômetro de Mercado
                            </div>
                            {termometro && (
                                <Badge variant="secondary" className={`${
                                    termometro.temperatura === 'quente' ? 'bg-red-100 text-red-700 border-red-200' : 
                                    termometro.temperatura === 'morno' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                    'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                    {termometro.temperatura.toUpperCase()}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {termometro ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Temperatura do Mercado</span>
                                        <span>{termometro.temperatura_score}/100</span>
                                    </div>
                                    <Progress value={termometro.temperatura_score} className={`h-3 ${
                                        termometro.temperatura === 'quente' ? '[&>div]:bg-red-500' : 
                                        termometro.temperatura === 'morno' ? '[&>div]:bg-yellow-500' : 
                                        '[&>div]:bg-blue-500'
                                    }`} />
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { label: 'Créditos Comercializados', val: `R$ ${termometro.creditos_comercializados} bi`, var: termometro.creditos_comercializados_variacao },
                                        { label: 'Vendas de Cotas', val: `${(termometro.vendas_cotas / 1000).toFixed(2)} mil`, var: termometro.vendas_cotas_variacao },
                                        { label: 'Ticket Médio', val: `R$ ${termometro.ticket_medio} mil`, var: termometro.ticket_medio_variacao },
                                        { label: 'Participantes Ativos', val: `${termometro.participantes_ativos}M`, var: termometro.participantes_ativos_variacao },
                                        { label: 'Contemplações', val: `${(termometro.contemplacoes / 1000).toFixed(2)} mil`, var: termometro.contemplacoes_variacao },
                                        { label: 'Créditos Disponíveis', val: `R$ ${termometro.creditos_disponibilizados} bi`, var: termometro.creditos_disponibilizados_variacao },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                                            <span className="text-xs text-muted-foreground">{item.label}</span>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{item.val}</div>
                                                <div className={`text-[10px] flex items-center justify-end gap-1 ${item.var >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.var >= 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                    {Math.abs(item.var)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground">Carregando dados do mercado...</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Alertas de Desempenho Segmentado */}
            <div className="mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    🚨 Alertas de Desempenho por Segmento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segmentos.map(seg => {
                        const alerts = [];
                        if (seg.total_leads === 0) {
                            alerts.push({ title: `Zero Leads: ${SEGMENT_CONFIG[seg.segmento].label}`, desc: "Este segmento não recebeu nenhum lead. Verifique as campanhas de marketing.", variant: "destructive" });
                        } else if (seg.taxa_conversao < 2 && seg.total_leads > 10) {
                            alerts.push({ title: `Baixa Conversão: ${SEGMENT_CONFIG[seg.segmento].label}`, desc: `Taxa de ${seg.taxa_conversao.toFixed(1)}% está abaixo da média esperada.`, variant: "warning" });
                        }
                        if (seg.progresso_meta < 50 && currentMonth > 6) {
                            alerts.push({ title: `Meta em Risco: ${SEGMENT_CONFIG[seg.segmento].label}`, desc: `Apenas ${seg.progresso_meta.toFixed(1)}% da meta atingida no segundo semestre.`, variant: "warning" });
                        }

                        return alerts.map((alert, i) => (
                            <Alert key={`${seg.segmento}-${i}`} variant={alert.variant === "destructive" ? "destructive" : "default"} className={alert.variant === "warning" ? "border-orange-200 bg-orange-50" : ""}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="font-bold">{alert.title}</AlertTitle>
                                <AlertDescription>{alert.desc}</AlertDescription>
                            </Alert>
                        ));
                    })}
                    {semFollowUp > 0 && (
                        <Alert variant="destructive" className="border-red-600 bg-red-50 animate-pulse">
                            <Clock className="h-4 w-4 text-red-600" />
                            <AlertTitle className="font-bold text-red-700">Atenção: Leads Negligenciados</AlertTitle>
                            <AlertDescription className="text-red-600">
                                Existem <b>{semFollowUp} leads</b> sem contato há mais de 7 dias. Priorize o atendimento para evitar a perda dessas oportunidades.
                            </AlertDescription>
                        </Alert>
                    )}
                    {segmentos.every(seg => seg.total_leads > 0 && seg.taxa_conversao >= 2) && (
                        <div className="md:col-span-2 p-8 bg-green-50 border border-dashed border-green-200 rounded-lg text-center">
                            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-green-700 font-medium">Todos os segmentos estão operando dentro das métricas saudáveis!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Dicas Estratégicas */}
            <div className="mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    💡 Dicas Estratégicas do Mês
                </h3>
                
                <div className="grid gap-4">
                    {dicas.map(dica => (
                        <Alert key={dica.id} className={dica.prioridade === 1 ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
                            <AlertCircle className={`h-4 w-4 ${dica.prioridade === 1 ? 'text-red-600' : 'text-blue-600'}`} />
                            <AlertTitle className="flex items-center gap-2">
                                <span className="text-xl">{dica.emoji}</span>
                                <span className="font-bold">{dica.titulo}</span>
                                <Badge variant="outline" className={`ml-auto ${dica.prioridade === 1 ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'}`}>
                                    Prioridade {dica.prioridade}
                                </Badge>
                            </AlertTitle>
                            <AlertDescription className="mt-2 text-sm leading-relaxed">
                                {dica.descricao}
                            </AlertDescription>
                        </Alert>
                    ))}
                    {dicas.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-8 bg-muted/10 rounded-lg border border-dashed">
                            Nenhuma dica estratégica disponível para este mês.
                        </p>
                    )}
                </div>
            </div>

            {/* Performance por Segmento */}
            <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    📊 Performance por Segmento
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    {segmentos.map((seg: any) => {
                        const { icon: Icon, color, textColor, label } = SEGMENT_CONFIG[seg.segmento] || { icon: BarChart3, color: 'bg-gray-600', textColor: 'text-gray-600', label: seg.segmento };
                        
                        const alertColor = seg.progresso_meta >= 70 ? 'text-green-600' : seg.progresso_meta >= 40 ? 'text-yellow-600' : 'text-red-600';
                        const progressColor = seg.progresso_meta >= 70 ? 'bg-green-600' : seg.progresso_meta >= 40 ? 'bg-yellow-500' : 'bg-red-500';

                        return (
                            <Card key={seg.segmento} className="overflow-hidden shadow-md border-none hover:shadow-lg transition-all duration-300">
                                <CardHeader className={`${color} text-white p-2`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-white/20 rounded backdrop-blur-sm">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-[13px] font-bold">{label}</CardTitle>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded">Meta: {formatCurrency(seg.meta_vendas).replace(',00', '')}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-2.5 space-y-2.5">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Realizado Mês</span>
                                            <span className={`text-xs font-black ${alertColor}`}>{seg.progresso_meta.toFixed(1).replace('.', ',')}%</span>
                                        </div>
                                        <div className="w-full bg-secondary/30 rounded-full h-1.5 overflow-hidden">
                                            <div className={`${progressColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, seg.progresso_meta)}%` }} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1 border-b border-border/50 pb-2">
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Vendido</p>
                                            <p className="text-[11px] font-bold text-foreground">{formatCurrency(seg.valor_total).replace(',00', '')}</p>
                                        </div>
                                        <div className="space-y-0.5 text-right">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Conversão</p>
                                            <p className="text-[11px] font-bold text-foreground">{seg.taxa_conversao.toFixed(1).replace('.', ',')}%</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Leads</p>
                                            <p className="text-[11px] font-bold text-foreground">{seg.total_leads}</p>
                                        </div>
                                        <div className="space-y-0.5 text-right">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Vendas</p>
                                            <p className="text-[11px] font-bold text-foreground">{seg.total_vendas}</p>
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Previsão</span>
                                            <span className="text-[8px] font-bold text-primary uppercase">Mês</span>
                                        </div>
                                        <p className="text-sm font-bold text-primary">{formatCurrency(seg.full_previsao).replace(',00', '')}</p>
                                    </div>

                                    <div className="bg-muted/30 p-2 rounded-md border border-border/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Leads Necessários</span>
                                        </div>
                                        <p className="text-sm font-black text-foreground">{seg.leads_necessarios_total}</p>
                                    </div>

                                    <div className="pt-1 space-y-1">
                                        {seg.taxa_conversao < 10 && seg.total_leads > 0 && (
                                            <div className="flex items-center gap-1 text-red-600 bg-red-50 p-1 rounded border border-red-100">
                                                <AlertCircle className="h-3 w-3" />
                                                <span className="text-[8px] font-bold uppercase">Meta de Conv. Baixa</span>
                                            </div>
                                        )}
                                        {seg.full_previsao < seg.meta_vendas && seg.total_leads > 0 && (
                                            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 p-1 rounded border border-orange-100">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span className="text-[8px] font-bold uppercase">Volume Crítico</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Destaque do Ano */}
            <div className="mt-8">
                <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                    <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Destaque do Ano</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4 py-6">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                            <Trophy className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground font-medium">Melhor Mês de Vendas</p>
                            <p className="text-2xl font-black text-primary mt-1">
                                {monthsData.reduce((best, m) => m.realizado > best.realizado ? m : best, monthsData[0])?.name}
                            </p>
                            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                <DollarSign className="h-3.5 w-3.5" />
                                {formatCurrency(monthsData.reduce((best, m) => m.realizado > best.realizado ? m : best, monthsData[0])?.realizado || 0)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
