import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    ArrowRight,
    LucideIcon,
    Settings2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ComposedChart, Bar, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  full_previsao: number;
  leads_necessarios_total: number;
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

interface CarteiraItem {
    id: string;
    data_adesao: string | null;
    data_contemplacao: string | null;
    status: string;
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
    const { profile, isManager } = useProfile();
    const supabaseAny: any = supabase;
    const [leads, setLeads] = useState<Lead[]>([]);
    const [carteira, setCarteira] = useState<CarteiraItem[]>([]);
    const [metaAnual, setMetaAnual] = useState<number>(0);
    const [metaInput, setMetaInput] = useState<string>("0");
    const [termometro, setTermometro] = useState<TermometroMercado | null>(null);
    const [dicas, setDicas] = useState<DicaEstrategica[]>([]);
    const [segmentos, setSegmentos] = useState<MetricaSegmento[]>([]);
    const [loading, setLoading] = useState(true);
    const [membros, setMembros] = useState<{ id: string; nome_completo: string | null }[]>([]);
    const [inadimplentesCount, setInadimplentesCount] = useState(0);
    const [selectedVendedor, setSelectedVendedor] = useState<string>("all");
    const [segmentMetas, setSegmentMetas] = useState<Record<string, number>>({
        imoveis: 500000,
        veiculos: 100000,
        motos: 100000,
        pesados: 180000,
        investimentos: 120000
    });
    const [isEditingSegmentMetas, setIsEditingSegmentMetas] = useState(false);
    const [tempSegmentMetas, setTempSegmentMetas] = useState<Record<string, string>>({});
    const { currentYear, mesStr } = React.useMemo(() => {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        return {
            currentYear: year,
            mesStr: `${year}-${month.toString().padStart(2, "0")}`
        };
    }, []);

    const fetchTermometro = useCallback(async () => {
        try {
            const { data, error } = await supabaseAny
                .from('termometro_mercado')
                .select('*')
                .order('mes_referencia', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setTermometro(data as unknown as TermometroMercado);
            } else {
                // Fallback com dados ABAC 2025 (Consolidado 2024)
                setTermometro({
                    id: 'fallback-2025',
                    mes_referencia: '2025-01',
                    participantes_ativos: 10.29,
                    participantes_ativos_variacao: 3.7,
                    vendas_cotas: 4280000,
                    vendas_cotas_variacao: 3.4,
                    creditos_comercializados: 334.16,
                    creditos_comercializados_variacao: 5.6,
                    ticket_medio: 165.4,
                    ticket_medio_variacao: 11.7,
                    contemplacoes: 1600000,
                    contemplacoes_variacao: 5.2,
                    creditos_disponibilizados: 84.1,
                    creditos_disponibilizados_variacao: 4.8,
                    temperatura: 'quente',
                    temperatura_score: 92
                });
            }
        } catch (err) {
            console.error('Erro ao buscar termômetro:', err);
        }
    }, []);

    const fetchDicas = useCallback(async (termometroId: string) => {
        const { data, error } = await supabaseAny
            .from('dicas_estrategicas')
            .select('*')
            .eq('termometro_id', termometroId)
            .eq('ativo', true)
            .order('prioridade')
            .order('created_at');

        if (!error) setDicas((data as unknown as DicaEstrategica[]) || []);
    }, []);

    const fetchData = useCallback(async () => {
        if (!profile?.organizacao_id) return;
        
        try {
            setLoading(true);

            if (isManager) {
                const { data: membrosData } = await supabaseAny
                    .from("perfis")
                    .select("id, nome_completo")
                    .eq("organizacao_id", profile.organizacao_id);
                setMembros((membrosData as { id: string; nome_completo: string | null }[]) || []);
            }

            const { data: leadsData } = await supabase.from("leads").select("*").eq("organizacao_id", profile.organizacao_id);
            const { data: carteiraData } = await supabase.from("carteira").select("id, data_adesao, data_contemplacao, status").eq("organizacao_id", profile.organizacao_id);
            
            // Defensivo: Usar select("id") para contagem para evitar 400 dependendo da versão do PostgREST
            const { count: countInad } = await supabase
                .from("inadimplentes")
                .select("id", { count: 'exact', head: true })
                .neq("status", "regularizado")
                .eq("organizacao_id", profile.organizacao_id);
            
            setCarteira((carteiraData as any[]) || []);
            setInadimplentesCount(countInad || 0);
            
            let metaData = null;
            if (selectedVendedor !== "all" || !isManager) {
                const targetId = !isManager ? profile?.id : selectedVendedor;
                const { data: mvData } = await supabase
                    .from("metas_vendedor")
                    .select("*")
                    .eq("vendedor_id", targetId)
                    .eq("ano", currentYear)
                    .eq("organizacao_id", profile.organizacao_id)
                    .maybeSingle();
                metaData = mvData;
            } else {
                const { data: globalMeta } = await supabase
                    .from("meta")
                    .select("*")
                    .eq("ano", currentYear)
                    .eq("organizacao_id", profile.organizacao_id)
                    .maybeSingle();
                metaData = globalMeta;
            }
            
            let allLeads = (leadsData as Lead[]) || [];
            if (!isManager) {
                allLeads = allLeads.filter((l: Lead) => (l as any).responsavel_id === profile?.id);
            } else if (selectedVendedor !== "all") {
                allLeads = allLeads.filter((l: Lead) => (l as any).responsavel_id === selectedVendedor);
            }

            setLeads(allLeads);
            
            let currentSegmentMetas = segmentMetas;
            
            if (metaData) {
                setMetaAnual(metaData.meta_anual || 0);
                setMetaInput(String(metaData.meta_anual || 0));
                
                currentSegmentMetas = {
                    imoveis: metaData.meta_imoveis || 0,
                    veiculos: metaData.meta_veiculos || 0,
                    motos: metaData.meta_motos || 0,
                    pesados: metaData.meta_pesados || 0,
                    investimentos: metaData.meta_investimentos || 0
                };
                
                if (selectedVendedor === "all" && isManager) {
                    setSegmentMetas(currentSegmentMetas);
                }
            } else {
                setMetaAnual(0);
                setMetaInput("0");
            }
            
            const segs: MetricaSegmento[] = [
                { segmento: 'imoveis', keywords: ['imovel', 'imóvel', 'casa', 'apartamento', 'terreno', 'construcao', 'reforma'] },
                { segmento: 'veiculos', keywords: ['veiculo', 'veículo', 'carro', 'auto', 'automovel', 'automóvel'] },
                { segmento: 'motos', keywords: ['moto', 'motocicleta'] },
                { segmento: 'pesados', keywords: ['pesados', 'agricolas', 'caminhao', 'caminhão', 'trator', 'maquina', 'máquina'] },
                { segmento: 'investimentos', keywords: ['investimento', 'capitalizacao', 'aposentadoria', 'investimentos'] }
            ].map(config => {
                const segmentLeads = allLeads.filter(l => {
                    const type = (l.tipo_consorcio || "").toLowerCase();
                    return (config as any).keywords.some((keyword: string) => type.includes(keyword));
                });
                
                const currentMonthLeads = segmentLeads.filter(l => l.created_at?.startsWith(mesStr));
                const segmentVendas = segmentLeads.filter(l => (l.status || "").toLowerCase() === "fechado");
                const currentMonthVendas = segmentVendas.filter(l => l.created_at?.startsWith(mesStr));
                
                const valorTotal = currentMonthVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
                const metaValue = currentSegmentMetas[config.segmento as keyof typeof currentSegmentMetas] || 0;
                
                const vendasCount = currentMonthVendas.length;
                const leadsCount = currentMonthLeads.length;
                const conversao = leadsCount > 0 ? (vendasCount / leadsCount) * 100 : 0;
                
                const historicalVendas = segmentVendas.length;
                const historicalValor = segmentVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
                const ticketMedioRef = historicalVendas > 0 ? historicalValor / historicalVendas : (valorTotal / (vendasCount || 1)) || 100000;
                
                const previsao = leadsCount * (conversao / 100) * ticketMedioRef;
                const progresso = metaValue > 0 ? (valorTotal / metaValue) * 100 : 0;
                
                const leadsNeeded = (conversao > 0 && ticketMedioRef > 0) 
                    ? Math.ceil(metaValue / ((conversao / 100) * ticketMedioRef))
                    : 0;

                return {
                    segmento: config.segmento as 'imoveis' | 'veiculos' | 'motos' | 'investimentos' | 'pesados',
                    total_leads: leadsCount,
                    total_vendas: vendasCount,
                    valor_total: valorTotal,
                    ticket_medio: ticketMedioRef,
                    taxa_conversao: conversao,
                    meta_vendas: metaValue,
                    progresso_meta: progresso,
                    full_previsao: previsao,
                    leads_necessarios_total: leadsNeeded
                };
            });

            setSegmentos(segs);
            await fetchTermometro();
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
        } finally {
            setLoading(false);
        }
    }, [profile?.organizacao_id, profile?.id, isManager, selectedVendedor, currentYear, mesStr, fetchTermometro]);

    // 1. Initial Load
    useEffect(() => { 
        if (!profile?.organizacao_id) return;
        fetchData(); 
    }, [profile?.organizacao_id, fetchData]);

    // 2. Separate Realtime Subscription (Only depends on orgId)
    useEffect(() => {
        const orgId = profile?.organizacao_id;
        if (!orgId) return;

        const channel = supabase
            .channel(`metas-leads-changes-${orgId}`)
            .on('postgres_changes' as any, { 
                event: '*', 
                schema: 'public', 
                table: 'leads',
                filter: `organizacao_id=eq.${orgId}`
            }, () => {
                // We call fetchData, but this effect DOES NOT depend on fetchData
                // to avoid re-subscribing if fetchData happens to change.
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.organizacao_id]); // DO NOT add fetchData here

    useEffect(() => {
        if (termometro) {
            fetchDicas(termometro.id);
        }
    }, [termometro, fetchDicas]);

    const salvarMeta = async () => {
        const novoValor = parseFloat(metaInput);
        if (isNaN(novoValor)) return;
        
        try {
            if (selectedVendedor !== "all" || !isManager) {
                const targetId = !isManager ? profile?.id : selectedVendedor;
                const { error } = await supabaseAny.from("metas_vendedor").upsert({ 
                    vendedor_id: targetId, 
                    ano: currentYear, 
                    meta_anual: novoValor,
                    organizacao_id: profile?.organizacao_id
                }, { onConflict: "vendedor_id,ano" });
                
                if (error) throw error;
            } else {
                const { error } = await supabaseAny.from("meta").upsert({ 
                    ano: currentYear, 
                    meta_anual: novoValor,
                    organizacao_id: profile?.organizacao_id
                }, { onConflict: "ano" });
                if (error) throw error;
            }
            
            setMetaAnual(novoValor);
            toast({ title: "Meta salva com sucesso!" });
        } catch (error) {
            console.error("Erro ao salvar meta:", error);
            toast({ 
                title: "Erro ao salvar meta", 
                description: "Verifique sua conexão ou permissões.",
                variant: "destructive" 
            });
        }
    };

    const salvarMetasSegmento = async (newMetas: Record<string, number>) => {
        if (!isManager || selectedVendedor !== "all") {
             setSegmentMetas(newMetas);
             return;
        }

        try {
            const { error } = await supabaseAny.from("meta").upsert({
                ano: currentYear,
                meta_imoveis: newMetas.imoveis,
                meta_veiculos: newMetas.veiculos,
                meta_motos: newMetas.motos,
                meta_pesados: newMetas.pesados,
                meta_investimentos: newMetas.investimentos,
                organizacao_id: profile?.organizacao_id
            }, { onConflict: "ano" } as any);

            if (error) throw error;

            setSegmentMetas(newMetas);
            toast({ title: "Metas por segmento salvas!" });
        } catch (error) {
            console.error("Erro ao salvar metas por segmento:", error);
            toast({ 
                title: "Erro ao salvar metas", 
                variant: "destructive" 
            });
        }
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

    const contempladosCarteira = carteira.filter(c => c.status === "contemplada" && c.data_adesao && c.data_contemplacao);
    const totalMeses = contempladosCarteira.reduce((acc, c) => {
        const start = new Date(c.data_adesao!);
        const end = new Date(c.data_contemplacao!);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return acc + (diffDays / 30);
    }, 0);
    const prazoMedio = contempladosCarteira.length > 0 ? (totalMeses / contempladosCarteira.length).toFixed(1) : "—";

    const aguardandoUrgente = carteira.filter(c => {
        if (c.status !== "aguardando" || !c.data_adesao) return false;
        const start = new Date(c.data_adesao);
        const diffMonths = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return diffMonths > 6;
    }).length;


    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-4 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Metas e Indicadores</h1>
                        <p className="text-sm text-muted-foreground">Acompanhe seu desempenho de {currentYear}</p>
                    </div>
                    {isManager && (
                        <div className="w-full sm:w-64">
                            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                                <SelectTrigger className="w-full h-9 bg-white">
                                    <SelectValue placeholder="Visão Global" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Visão Global (Todos)</SelectItem>
                                    {membros.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                {/* Meta Anual Card — stacked on mobile */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                                <div className="flex items-center gap-2 shrink-0">
                                    <Target className="h-5 w-5 text-primary" />
                                    <span className="font-semibold text-sm">Meta Anual ({currentYear})</span>
                                </div>
                                <div className="flex items-center gap-2 max-w-[200px]">
                                    <span className="text-muted-foreground text-xs">R$</span>
                                    <Input
                                        type="number"
                                        value={metaInput}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaInput(e.target.value)}
                                        className="h-8 text-right font-bold text-xs"
                                    />
                                    <Button size="sm" variant="outline" onClick={salvarMeta} className="h-8 px-2 text-xs">Salvar</Button>
                                </div>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2 bg-white/50"
                                onClick={() => {
                                    const temp: Record<string, string> = {};
                                    Object.entries(segmentMetas).forEach(([k, v]) => temp[k] = String(v));
                                    setTempSegmentMetas(temp);
                                    setIsEditingSegmentMetas(true);
                                }}
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                Configurar Metas/Segmento
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog para Editar Metas por Segmento */}
            <Dialog open={isEditingSegmentMetas} onOpenChange={setIsEditingSegmentMetas}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Metas Mensais por Segmento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {Object.entries(tempSegmentMetas).map(([segmento, valor]) => (
                            <div key={segmento} className="grid grid-cols-2 items-center gap-4">
                                <Label className="capitalize font-medium">{segmento}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">R$</span>
                                    <Input
                                        type="number"
                                        value={valor}
                                        onChange={(e) => setTempSegmentMetas(prev => ({ ...prev, [segmento]: e.target.value }))}
                                        className="h-9 pl-8 text-right font-bold text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingSegmentMetas(false)}>Cancelar</Button>
                        <Button size="sm" onClick={() => {
                            const newMetas: Record<string, number> = {};
                            Object.entries(tempSegmentMetas).forEach(([k, v]) => newMetas[k] = Number(v) || 0);
                            salvarMetasSegmento(newMetas);
                            setIsEditingSegmentMetas(false);
                        }}>
                            Aplicar e Salvar Metas
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        { icon: Clock, color: "text-primary", val: `${prazoMedio} meses`, label: "Prazo Médio Contem.", cardClass: "" },
                        { icon: UserX, color: inadimplentesCount > 0 ? "text-red-600" : "text-gray-400", val: inadimplentesCount, label: "Inadimplentes", cardClass: inadimplentesCount > 0 ? "bg-red-50 border-red-200 shadow-sm" : "" },
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
            {/* Chart + Thermometer Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Meta vs Realizado (Internal) */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200/60 bg-white/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/30">
                        <div>
                           <CardTitle className="text-sm sm:text-base font-bold text-slate-800">Meta vs Realizado ({currentYear})</CardTitle>
                           <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Desempenho da consultoria</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5 px-2 py-0.5">Operação Interna</Badge>
                    </CardHeader>
                    <CardContent className="h-56 sm:h-72 pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthsData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(207,90%,45%)" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="hsl(207,90%,25%)" stopOpacity={1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={v => `R$${v >= 1000 ? (v / 1000) + "k" : v}`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(value: number) => [formatCurrency(value), "Valor"]}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                                <Bar dataKey="meta" name="Meta" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="realizado" name="Realizado" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={24} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Termômetro de Mercado (Sidebar) */}
                <Card className="lg:col-span-1 shadow-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Flame className={`h-5 w-5 ${termometro?.temperatura === 'quente' ? 'text-red-500' : termometro?.temperatura === 'morno' ? 'text-yellow-500' : 'text-blue-500'}`} />
                                Termômetro do Setor
                            </div>
                            {termometro && (
                                <Badge className={`${
                                    termometro.temperatura === 'quente' ? 'bg-red-500' : 
                                    termometro.temperatura === 'morno' ? 'bg-amber-500' : 
                                    'bg-blue-500'
                                } text-white border-transparent text-[10px]`}>
                                    {termometro.temperatura.toUpperCase()}
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Resiliência do Consórcio 2025</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {termometro ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                                        <span>Confiança do Mercado</span>
                                        <span>{termometro.temperatura_score}%</span>
                                    </div>
                                    <Progress value={termometro.temperatura_score} className={`h-2 ${
                                        termometro.temperatura === 'quente' ? '[&>div]:bg-red-500' : 
                                        termometro.temperatura === 'morno' ? '[&>div]:bg-amber-500' : 
                                        '[&>div]:bg-blue-500'
                                    }`} />
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    {[
                                        { label: 'Volume (Bi)', val: `R$ ${termometro.creditos_comercializados}`, var: termometro.creditos_comercializados_variacao },
                                        { label: 'Contemplações', val: `${(termometro.contemplacoes / 1000).toFixed(0)}k`, var: termometro.contemplacoes_variacao },
                                        { label: 'Ticket Médio', val: `R$ ${termometro.ticket_medio}k`, var: termometro.ticket_medio_variacao },
                                        { label: 'Ativos', val: `${termometro.participantes_ativos}M`, var: termometro.participantes_ativos_variacao },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-slate-800">{item.val}</div>
                                                <div className={`text-[9px] font-bold flex items-center justify-end gap-0.5 ${item.var >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.var >= 0 ? '+' : ''}{item.var}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                <BarChart3 className="h-8 w-8 animate-pulse mb-2" />
                                <p className="text-[10px] uppercase font-bold">Carregando dados ABAC...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Market Intelligence Dashboard (ABAC 2021-2024) - Full Width Below */}
                <Card className="lg:col-span-3 border-none bg-slate-900 text-white relative overflow-hidden shadow-2xl rounded-[32px]">
                    {/* Background effects */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                    
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 gap-6 relative z-10 p-8 sm:p-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-2xl bg-green-500/20 backdrop-blur-md flex items-center justify-center border border-green-500/30">
                                    <TrendingUp className="h-6 w-6 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                        Market Intelligence <span className="text-green-400">ABAC 2025</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">volume recorde de créditos comercializados</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Crescimento Acumulado</p>
                                <p className="text-2xl font-black text-white">+50.5% <span className="text-xs text-green-400 font-medium ml-1">📈</span></p>
                            </div>
                            <Badge className="bg-green-500 hover:bg-green-400 text-slate-950 font-black py-2 px-4 rounded-xl text-xs shadow-lg shadow-green-500/20 transition-all uppercase tracking-tighter">
                                Recorde 2024: R$ 334.1 Bi
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="relative z-10 px-6 sm:px-10 pb-10">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                            {/* Gráfico Principal */}
                            <div className="xl:col-span-3 h-[320px] sm:h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={[
                                        { ano: '2021', valor: 222.04 },
                                        { ano: '2022', valor: 252.10 },
                                        { ano: '2023', valor: 316.70 },
                                        { ano: '2024', valor: 334.16 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="abacBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity={1}/>
                                            </linearGradient>
                                            <linearGradient id="abacAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2}/>
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                                        <XAxis 
                                            dataKey="ano" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 13, fontWeight: 900, fill: '#94a3b8' }}
                                            dy={15}
                                        />
                                        <YAxis hide domain={[0, 400]} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', padding: '16px' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            formatter={(v: number) => [`R$ ${v} Bilhões`, "Volume Anual"]}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="valor" 
                                            fill="url(#abacAreaGrad)" 
                                            stroke="none" 
                                            animationDuration={2000}
                                        />
                                        <Bar 
                                            dataKey="valor" 
                                            fill="url(#abacBarGrad)" 
                                            radius={[15, 15, 5, 5]} 
                                            barSize={60}
                                            label={{ position: 'top', fill: '#4ade80', fontSize: 14, fontWeight: 900, offset: 15 }}
                                            animationDuration={1500}
                                        >
                                            { [0,1,2,3].map((_, index) => (
                                                <Cell key={`cell-${index}`} fillOpacity={0.4 + (index * 0.2)} />
                                            ))}
                                        </Bar>
                                        <Line 
                                            type="monotone" 
                                            dataKey="valor" 
                                            stroke="#4ade80" 
                                            strokeWidth={5} 
                                            dot={{ r: 8, fill: '#0f172a', stroke: '#4ade80', strokeWidth: 4 }}
                                            activeDot={{ r: 10, strokeWidth: 4, stroke: '#fff' }}
                                            animationDuration={2500}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Dashboard Sidebar Stats */}
                            <div className="flex flex-col gap-6 justify-center max-w-sm mx-auto xl:mx-0">
                                <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all cursor-default">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
                                        <Flame className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <h4 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">Oportunidade 2025</h4>
                                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                        Com a economia estabilizada, a projeção é de mais um ano recorde. O consultor que domina os números tem fechamento garantido.
                                    </p>
                                </div>
                                
                                <div className="p-6 rounded-[24px] bg-green-500 text-slate-950 shadow-xl shadow-green-500/10 group overflow-hidden relative active:scale-95 transition-transform cursor-pointer">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-150 transition-transform duration-500">
                                        <Trophy className="h-24 w-24" />
                                    </div>
                                    <h4 className="text-lg font-black tracking-tight">Potencial Consultivo</h4>
                                    <p className="text-sm font-bold opacity-80 mt-1">O volume de participantes ativos atingiu 10.29 milhões em dezembro.</p>
                                    <div className="mt-5 flex items-center gap-2 font-black text-xs uppercase tracking-tighter">
                                        <span>Explorar dados ABAC</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Quote */}
                        <div className="mt-12 flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 italic text-slate-300">
                            <Lightbulb className="h-6 w-6 text-amber-400 shrink-0 mt-1 opacity-50" />
                            <div className="space-y-1">
                                <p className="text-sm sm:text-base leading-relaxed tracking-wide">
                                    "O consórcio vive seu melhor momento histórico, consolidando-se como a principal escolha de autofinanciamento do brasileiro. Este crescimento de 50% em 4 anos é um divisor de águas."
                                </p>
                                <p className="text-[10px] font-black text-slate-500 not-italic uppercase tracking-[0.2em] mt-3">Anuário consolidado ABAC 2025 &middot; volume de créditos</p>
                            </div>
                        </div>
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
                    {aguardandoUrgente > 0 && (
                        <Alert variant="default" className="border-orange-600 bg-orange-100">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="font-bold text-orange-700">Atenção: Clientes em Espera Longa</AlertTitle>
                            <AlertDescription className="text-orange-600">
                                Existem <b>{aguardandoUrgente} clientes</b> aguardando contemplação há mais de 6 meses. Verifique se há estratégias de lance para acelerar o processo.
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
                    {segmentos.map((seg) => {
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
