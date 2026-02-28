import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Target, TrendingUp, DollarSign, Clock, Users, Flame, AlertCircle, Trophy, BarChart3, AlertTriangle, UserX } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface Lead {
    id: string;
    nome: string;
    status: string | null;
    valor_credito: number;
    created_at: string | null;
    updated_at: string | null;
}

interface MetaAnual {
    id?: string;
    ano: number;
    valor: number;
}

interface Termometro {
    id: string;
    segmento: string;
    percentual: number;
}

export default function Metas() {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [metaAnualObj, setMetaAnualObj] = useState<MetaAnual | null>(null);
    const [metaAnualInput, setMetaAnualInput] = useState<string>("0");
    const [termometro, setTermometro] = useState<Termometro[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingMeta, setSavingMeta] = useState(false);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Busca leads
            const { data: leadsData, error: leadsError } = await supabase.from("leads").select("*");
            if (leadsError) throw leadsError;

         // Busca meta atual
            const { data: metaData, error: metaError } = await supabase
                .from("meta")
                .select("*")
                .eq("id", 1)
                .single();
            if (metaError && metaError.code !== 'PGRST116') throw metaError;
            // Busca termômetro            const { data: termData, error: termError } = await supabase
                .from("mercado_termometro")
                .select("*")
                .order("segmento");
            if (termError) throw termError;

            setLeads(leadsData || []);
            if (metaData) {
                setMetaAnualObj(metaData);
                setMetaAnualInput(String(metaData.meta_anual || 0));
            }
            }
            setTermometro(termData || []);
        } catch (error: any) {
            console.error("Erro ao buscar dados:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados de metas.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarMeta = async () => {
        try {
            setSavingMeta(true);
            const valorNumerico = parseFloat(metaAnualInput);
            if (isNaN(valorNumerico)) return;

            if (metaAnualObj && metaAnualObj.id) {
                // Atualiza
                const { error } = await supabase
                    .from("meta")
                    .update({ meta_anual: valorNumerico })
                    .eq("id", metaAnualObj.id);
                if (error) throw error;
            } else {
                // Insere nova meta se não existir
const { error } = await supabase
    .from("meta")
    .upsert(
        {
            id: 1,
            meta_anual: Number(valorNumerico),
            created_at: new Date().toISOString()
        },
        {
            onConflict: "id"
        }
    );

if (error) throw error;
            }

            toast({
                title: "Sucesso",
                description: "Meta anual atualizada com sucesso!",
            });
            fetchData(); // Recarrega para pegar o ID novo se for insert
        } catch (error: any) {
            console.error("Erro ao salvar meta:", error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar a meta anual.",
                variant: "destructive",
            });
        } finally {
            setSavingMeta(false);
        }
    };

    const updateTermometro = async (id: string, novoValor: number) => {
        try {
            const { error } = await supabase
                .from("mercado_termometro")
                .update({ percentual: novoValor, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;

            // Atualiza estado local
            setTermometro(prev => prev.map(t => t.id === id ? { ...t, percentual: novoValor } : t));
        } catch (error: any) {
            console.error("Erro ao atualizar termômetro:", error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o indicador do mercado.",
                variant: "destructive",
            });
        }
    };

    // ================= CÁLCULOS ================= //
    const formatCurrency = (val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const leadsFechados = leads.filter(l => l.status === "fechado");
    const leadsPerdidos = leads.filter(l => l.status === "perdido" || l.status === "desistiu");

    // Realizado no ano
    const realizadoAno = leadsFechados
        .filter(l => l.created_at?.startsWith(currentYear.toString()))
        .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    // Realizado no mês
    const mesAtualStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
    const realizadoMes = leadsFechados
        .filter(l => l.created_at?.startsWith(mesAtualStr))
        .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    // Metas
    const metaAnual = metaAnualObj?.valor || 0;
    const metaMensal = metaAnual / 12;

    // Progresso
    const progressoAno = metaAnual > 0 ? Math.min(100, (realizadoAno / metaAnual) * 100) : 0;
    const progressoMes = metaMensal > 0 ? Math.min(100, (realizadoMes / metaMensal) * 100) : 0;

    // Ticket Médio (de leads fechados)
    const ticketMedio = leadsFechados.length > 0 ? realizadoAno / leadsFechados.length : 0;

    // Taxa de Conversão (Fechados / Total de leads do ano)
    const leadsDoAno = leads.filter(l => l.created_at?.startsWith(currentYear.toString()));
    const taxaConversao = leadsDoAno.length > 0 ? (leadsFechados.length / leadsDoAno.length) * 100 : 0;

    // Taxa de Perda
    const taxaPerda = leadsDoAno.length > 0 ? (leadsPerdidos.length / leadsDoAno.length) * 100 : 0;

    // Tempo Médio de Fechamento (estimativa baseada em created e updated)
    const leadsComTempo = leadsFechados.filter(l => l.created_at && l.updated_at);
    const tempoMedioDias = leadsComTempo.length > 0
        ? leadsComTempo.reduce((acc, l) => {
            const start = new Date(l.created_at!).getTime();
            const end = new Date(l.updated_at!).getTime();
            return acc + ((end - start) / (1000 * 60 * 60 * 24));
        }, 0) / leadsComTempo.length
        : 0;

    // Leads Necessários (falta bater vs ticket medio)
    const faltaBaterMes = Math.max(0, metaMensal - realizadoMes);
    const leadsNecessariosMes = Math.ceil(ticketMedio > 0 ? faltaBaterMes / ticketMedio : 0);

    // Projeção do Mês
    const diaHoje = new Date().getDate();
    const diasNoMes = new Date(currentYear, currentMonth, 0).getDate();
    const projecaoMes = diaHoje > 0 ? (realizadoMes / diaHoje) * diasNoMes : 0;

    // Leads sem follow-up > 7 dias (negociacao ou proposta)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const leadsSemFollowUp = leads.filter(l => {
        if (l.status === 'fechado' || l.status === 'perdido' || l.status === 'desistiu') return false;
        const updatedAt = l.updated_at ? new Date(l.updated_at) : (l.created_at ? new Date(l.created_at) : new Date());
        return updatedAt < seteDiasAtras;
    }).length;

    // Top 5 Leads
    const topLeadsEmAberto = leads
        .filter(l => l.status !== 'fechado' && l.status !== 'perdido' && l.status !== 'desistiu')
        .sort((a, b) => Number(b.valor_credito || 0) - Number(a.valor_credito || 0))
        .slice(0, 5);

    // Gráfico Meta vs Realizado Mensal
    const monthsData = Array.from({ length: 12 }, (_, i) => {
        const mStr = `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
        const realizado = leadsFechados
            .filter(l => l.created_at?.startsWith(mStr))
            .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

        // Nome do mês curto
        const label = new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'short' });

        return {
            name: label.charAt(0).toUpperCase() + label.slice(1),
            realizado: realizado,
            meta: metaMensal
        };
    });

    // Melhor Mês
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let melhorMesIdx = 0;
    let melhorResultado = 0;
    monthsData.forEach((d, idx) => {
        if (d.realizado > melhorResultado) {
            melhorResultado = d.realizado;
            melhorMesIdx = idx;
        }
    });


    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Metas e Indicadores</h1>
                    <p className="text-sm text-muted-foreground">Acompanhe seu desempenho e metas de {currentYear}</p>
                </div>

                {/* TOPO: Meta Anual Editável */}
                <Card className="w-full md:w-auto bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-sm">Meta Anual ({currentYear})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium">R$</span>
                            <Input
                                type="number"
                                value={metaAnualInput}
                                onChange={(e) => setMetaAnualInput(e.target.value)}
                                className="w-32 h-8 text-right font-bold"
                            />
                            <Button size="sm" onClick={handleSalvarMeta} disabled={savingMeta}>
                                Salvar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEÇÃO 1: Cards de Resumo */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" /> Desempenho do Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(realizadoMes)}</p>
                                <p className="text-xs text-muted-foreground">de {formatCurrency(metaMensal)}</p>
                            </div>
                            <span className="text-xl font-bold">{progressoMes.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                            <div
                                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, progressoMes)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4" /> Desempenho do Ano
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(realizadoAno)}</p>
                                <p className="text-xs text-muted-foreground">de {formatCurrency(metaAnual)}</p>
                            </div>
                            <span className="text-xl font-bold text-green-600">{progressoAno.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                            <div
                                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, progressoAno)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEÇÃO 2: Indicadores KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        <p className="text-xl font-bold">{formatCurrency(ticketMedio)}</p>
                        <p className="text-xs text-muted-foreground">Ticket Médio</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <p className="text-xl font-bold">{taxaConversao.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Conversão</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        <p className="text-xl font-bold">{leadsNecessariosMes}</p>
                        <p className="text-xs text-muted-foreground">Leads Necessários (Mês)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <Clock className="h-5 w-5 text-purple-500" />
                        <p className="text-xl font-bold">{tempoMedioDias.toFixed(1)} <span className="text-sm font-normal">dias</span></p>
                        <p className="text-xs text-muted-foreground">Tempo Fechamento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <UserX className="h-5 w-5 text-red-500" />
                        <p className="text-xl font-bold">{taxaPerda.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Taxa de Perda</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                        <p className="text-xl font-bold text-indigo-600">{formatCurrency(projecaoMes)}</p>
                        <p className="text-xs text-muted-foreground">Projeção do Mês</p>
                    </CardContent>
                </Card>
                <Card className={`${leadsSemFollowUp > 0 ? 'bg-red-50 border-red-200' : ''}`}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${leadsSemFollowUp > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        <p className={`text-xl font-bold ${leadsSemFollowUp > 0 ? 'text-red-600' : ''}`}>{leadsSemFollowUp}</p>
                        <p className={`text-xs ${leadsSemFollowUp > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>Leads s/ Follow-up {'>'} 7d</p>
                    </CardContent>
                </Card>
            </div>

            {/* SEÇÃO 3 e 4: Gráfico e Termômetro */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Meta vs Realizado ({currentYear})</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthsData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000) + 'k' : value}`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="meta" name="Meta" fill="hsl(215, 20%, 65%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realizado" name="Realizado" fill="hsl(207, 90%, 35%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* SEÇÃO 4: Termômetro do Mercado */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            Termômetro de Mercado
                        </CardTitle>
                        <CardDescription className="text-xs">Potencial de demanda por segmento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {termometro.map(item => {
                            // cores visuais
                            let colorClass = "bg-blue-500";
                            let textClass = "text-blue-600";
                            let label = "Frio";

                            if (item.percentual >= 70) {
                                colorClass = "bg-red-500";
                                textClass = "text-red-600";
                                label = "Quente";
                            } else if (item.percentual >= 40) {
                                colorClass = "bg-orange-500";
                                textClass = "text-orange-600";
                                label = "Morno";
                            }

                            return (
                                <div key={item.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">{item.segmento}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold ${textClass}`}>{label}</span>
                                            <Input
                                                type="number"
                                                value={item.percentual}
                                                onChange={(e) => updateTermometro(item.id, Number(e.target.value))}
                                                className="w-16 h-7 text-xs text-center p-1"
                                                min="0" max="100"
                                            />
                                            <span className="text-xs text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`${colorClass} h-full transition-all`}
                                            style={{ width: `${Math.min(100, Math.max(0, item.percentual))}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {termometro.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Nenhum segmento configurado.</p>}
                    </CardContent>
                </Card>
            </div>

            {/* SEÇÃO 5: Rankings */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Top 5 Leads em Aberto (Maior Valor)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topLeadsEmAberto.map((lead, i) => (
                                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold flex items-center gap-2">
                                            <span className="bg-primary/10 text-primary w-5 h-5 flex items-center justify-center rounded-full text-xs">{i + 1}</span>
                                            {lead.nome}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1 capitalize">{lead.status?.replace('_', ' ')}</span>
                                    </div>
                                    <span className="font-bold text-primary">{formatCurrency(lead.valor_credito || 0)}</span>
                                </div>
                            ))}
                            {topLeadsEmAberto.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground text-sm">Nenhum lead em aberto no momento.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-base flex justify-center">Destaque do Ano</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                            <Trophy className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Melhor Mês de Vendas</p>
                            <h3 className="text-2xl font-bold text-primary">{monthNames[melhorMesIdx]} {currentYear}</h3>
                            <p className="text-sm font-bold mt-2">{formatCurrency(melhorResultado)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
