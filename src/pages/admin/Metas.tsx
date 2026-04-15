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
    Settings2,
    Sparkles,
    Activity,
    Zap,
    Briefcase,
    Wallet,
    Filter,
    ChevronRight,
    PieChart,
    Plus,
    Settings,
    BarChart,
    FileText,
    Download,
    Building,
    Ship,
    Tractor,
    Plane
} from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
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
    status_updated_at: string | null;
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
    const [metaMensal, setMetaMensal] = useState<number>(0);
    const [metaInput, setMetaInput] = useState<string>("0");
    const [metaMensalInput, setMetaMensalInput] = useState<string>("0");
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
    const { currentYear, currentMonth, mesStr } = React.useMemo(() => {
        const spDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        const parts = spDateStr.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        return {
            currentYear: year,
            currentMonth: month,
            mesStr: spDateStr.substring(0, 7)
        };
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

            const { data: leadsData } = await (supabase as any).from("leads").select("*").eq("organizacao_id", profile.organizacao_id);
            const { data: carteiraData } = await (supabase as any).from("carteira").select("id, data_adesao, data_contemplacao, status").eq("organizacao_id", profile.organizacao_id);
            
            // Defensivo: Usar select("id") para contagem para evitar 400 dependendo da versão do PostgREST
            const { count: countInad } = await (supabase as any)
                .from("inadimplentes")
                .select("id", { count: 'exact', head: true })
                .neq("status", "regularizado")
                .eq("organizacao_id", profile.organizacao_id);
            
            setCarteira((carteiraData as any[]) || []);
            setInadimplentesCount(countInad || 0);
            
            let metaData = null;
            if (selectedVendedor !== "all" || !isManager) {
                const targetId = !isManager ? profile?.id : selectedVendedor;
                const { data: mvData } = await (supabase as any)
                    .from("metas_vendedor")
                    .select("*")
                    .eq("vendedor_id", targetId)
                    .eq("ano", currentYear)
                    .eq("organizacao_id", profile.organizacao_id)
                    .maybeSingle();
                metaData = mvData;
            } else {
                const { data: globalMeta } = await (supabase as any)
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
                const valAnual = metaData.meta_anual || 0;
                const valMensal = metaData.meta_outros || Math.floor(valAnual / 12);
                setMetaAnual(valAnual);
                setMetaInput(String(valAnual));
                setMetaMensal(valMensal);
                setMetaMensalInput(String(valMensal));
                
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
                setMetaMensal(0);
                setMetaMensalInput("0");
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
                const segmentVendas = segmentLeads.filter(l => {
                    const s = (l.status || "").toLowerCase().replace("_", " ");
                    return s === "fechado" || s === "venda fechada";
                });
                const currentMonthVendas = segmentVendas.filter(l => {
                    const dateToCheck = l.status_updated_at || l.created_at || "";
                    return dateToCheck.startsWith(mesStr);
                });
                
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
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
        } finally {
            setLoading(false);
        }
    }, [profile?.organizacao_id, profile?.id, isManager, selectedVendedor, currentYear, mesStr]);

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

    const salvarMeta = async (valorOverride?: number) => {
        const novoValor = valorOverride !== undefined ? valorOverride : parseFloat(metaInput);
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
                    meta_outros: metaMensal, // Ensure monthly goal is preserved
                    organizacao_id: profile?.organizacao_id
                }, { onConflict: "ano" });
                if (error) throw error;
            }
            
            setMetaAnual(novoValor);
            setMetaInput(String(novoValor));
            toast({ title: "Meta anual salva!" });
        } catch (error) {
            console.error("Erro ao salvar meta:", error);
            toast({ 
                title: "Erro ao salvar meta", 
                description: "Verifique sua conexão ou permissões.",
                variant: "destructive" 
            });
        }
    };

    const salvarMetaMensal = async (valorOverride?: number) => {
        const novoValor = valorOverride !== undefined ? valorOverride : parseFloat(metaMensalInput);
        if (isNaN(novoValor)) return;
        
        try {
            if (selectedVendedor !== "all" || !isManager) {
                // Sellers can't set their own monthly goals independently yet in this schema
                toast({ title: "Ação limitada ao gestor", variant: "destructive" });
                return;
            } else {
                const { error } = await supabaseAny.from("meta").upsert({ 
                    ano: currentYear, 
                    meta_anual: metaAnual, // Ensure annual goal is preserved
                    meta_outros: novoValor, // Hijack meta_outros for independent monthly goal
                    organizacao_id: profile?.organizacao_id
                }, { onConflict: "ano" });
                if (error) throw error;
            }
            
            setMetaMensal(novoValor);
            setMetaMensalInput(String(novoValor));
            toast({ title: "Meta mensal salva!" });
        } catch (error) {
            console.error("Erro ao salvar meta mensal:", error);
            toast({ 
                title: "Erro ao salvar meta mensal", 
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

    const fechados = leads.filter(l => {
        const s = (l.status || "").toLowerCase().replace("_", " ");
        return s === "fechado" || s === "venda fechada";
    });
    const realizadoMes = fechados.filter(l => {
        const dateToCheck = l.status_updated_at || l.created_at || "";
        return dateToCheck.startsWith(mesStr);
    }).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
    const realizadoAno = fechados.filter(l => {
        const dateToCheck = l.status_updated_at || l.created_at || "";
        return dateToCheck.startsWith(String(currentYear));
    }).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
    const faltaAno = Math.max(0, metaAnual - realizadoAno);
    const mesesRestantes = Math.max(1, 12 - currentMonth + 1);
    const necessarioPorMes = faltaAno / mesesRestantes;
    const progressoMes = metaMensal > 0 ? (realizadoMes / metaMensal) * 100 : 0;
    const progressoAno = metaAnual > 0 ? (realizadoAno / metaAnual) * 100 : 0;
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

    // Ritmo Diário (Pace) Calculations - Agora usando dias CORRIDOS (mês cheio)
    const diasPassados = diaHoje;
    const diasTotais = diasMes;
    const diasRestantes = Math.max(1, diasTotais - diasPassados);
    
    // Alias para manter compatibilidade com o JSX sem renomear tudo
    const diasUteisTotais = diasTotais;
    const diasUteisPassados = diasPassados;
    const diasUteisRestantes = diasRestantes;

    const ritmoNecessario = faltaMes / diasUteisRestantes;
    const ritmoAtual = realizadoMes / Math.max(1, diasUteisPassados);
    const sugestaoImovel = Math.ceil(faltaMes / 100000);
    const sugestaoVeiculo = Math.ceil(faltaMes / 50000);
    const getRitmoStatus = () => {
        if (ritmoAtual >= ritmoNecessario) return 'verde';
        if (ritmoAtual >= ritmoNecessario * 0.7) return 'amarelo';
        return 'vermelho';
    };
    const ritmoStatus = getRitmoStatus();

    // Resumo Executivo IA
    const mesesParaFim = 12 - currentMonth + 1;
    const segmentosZerados = segmentos.filter(s => s.total_leads === 0).length;
    const nomeMes = new Date(currentYear, currentMonth - 1).toLocaleString("pt-BR", { month: "long" });
    const capitalizedMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    
    let resumoIA = `${capitalizedMes} apresenta ${progressoMes.toFixed(1)}% da meta mensal atingida. `;
    resumoIA += `Faltam ${diasUteisRestantes} dias úteis para o encerramento do mês. `;
    resumoIA += `No acumulado do ano, o desempenho está em ${progressoAno.toFixed(1)}% da meta de R$ ${metaAnual.toLocaleString('pt-br')}. `;
    resumoIA += `Ritmo atual: ${formatCurrency(ritmoAtual)}/dia vs necessário de ${formatCurrency(ritmoNecessario)}/dia. `;
    resumoIA += `Atenção: ${semFollowUp} leads sem contato e ${segmentosZerados} segmentos zerados.`;
    const monthsData = Array.from({ length: 4 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - 1 - (3 - i), 1);
        const mStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        const r = fechados.filter(l => {
            const dateToCheck = l.status_updated_at || l.created_at || "";
            return dateToCheck.startsWith(mStr);
        }).reduce((a, l) => a + Number(l.valor_credito || 0), 0);
        return { name: d.toLocaleString("pt-BR", { month: "short" }).toUpperCase(), realizado: r, meta: metaMensal };
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
                        <h1 className="text-xl font-bold">Metas e Indicadores</h1>
                        <p className="text-[11px] text-muted-foreground -mt-1">Acompanhe seu desempenho de {currentYear}</p>
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
                    <CardContent className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-6 flex-1">
                                {/* Meta Anual */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 shrinks-0">
                                        <Target className="h-5 w-5 text-primary" />
                                        <span className="font-bold text-sm">Meta Anual ({currentYear})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">R$</span>
                                        <Input
                                            type="number"
                                            value={metaInput}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaInput(e.target.value)}
                                            className="h-8 w-24 sm:w-32 text-right font-bold text-xs"
                                        />
                                        <Button size="sm" variant="outline" onClick={() => salvarMeta()} className="h-8 px-2 text-xs">Salvar</Button>
                                    </div>
                                </div>

                                {/* Meta Mensal */}
                                <div className="flex items-center gap-3 border-l border-primary/10 pl-6">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <span className="font-bold text-sm">Meta Mensal (Média)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">R$</span>
                                        <Input
                                            type="number"
                                            value={metaMensalInput}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaMensalInput(e.target.value)}
                                            className="h-8 w-24 sm:w-32 text-right font-bold text-xs"
                                        />
                                        <Button size="sm" variant="outline" onClick={() => salvarMetaMensal()} className="h-8 px-2 text-xs">Salvar</Button>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2 bg-white/50 shrink-0"
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

            {/* Resumo Executivo IA - Standardized Style */}
            {/* Resumo Executivo IA - Standardized Style */}
            <div className="mb-4">
                <AdminHeroCard 
                    title="Jarvis Strategist" 
                    subtitle="IA Insight & Análise de Performance"
                    icon={Sparkles} 
                    bgIcon={Target}
                    accentColor="amber"
                >
                    <div className="flex gap-4 items-start">
                        <div className="space-y-2 flex-1">
                            <p className="text-sm leading-relaxed font-semibold text-slate-800">
                                {resumoIA}
                            </p>
                        </div>
                    </div>
                </AdminHeroCard>
            </div>
            
            {/* Ritmo Diário (Pace) - Standardized Light & Vibrant Style */}
            <div className="mb-4">
                <Card className="relative overflow-hidden border-none shadow-xl bg-white text-slate-900 rounded-[16px] border border-slate-100 transition-all hover:shadow-2xl">
                    {/* Glowing side accent based on status */}
                    <div className={`absolute inset-y-0 left-0 w-1.5 ${
                        ritmoStatus === 'verde' ? 'bg-emerald-500' : 
                        ritmoStatus === 'amarelo' ? 'bg-amber-500' : 
                        'bg-red-500'
                    }`} />

                    <div className="absolute top-1/2 -translate-y-1/2 right-12 opacity-[0.03] pointer-events-none">
                        <Activity className="h-40 w-40 rotate-12 text-slate-400" />
                    </div>

                    <CardContent className="p-0">
                        {/* Header Area - Vibrant Light Header */}
                        <div className={`flex items-center justify-between px-4 py-1.5 text-white bg-gradient-to-r shadow-sm ${
                            ritmoStatus === 'verde' ? 'from-blue-600 to-indigo-700' : 
                            ritmoStatus === 'amarelo' ? 'from-amber-400 to-orange-500' : 
                            'from-red-500 to-pink-600'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-white/20 border border-white/30 backdrop-blur-md">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase">
                                    Status de Performance
                                </h3>
                            </div>
                            <div className="flex gap-1 items-center bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Real-time</span>
                            </div>
                        </div>

                        {/* Main Body - Light Background */}
                        <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 bg-white/50">
                            <div className="flex items-center gap-6">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">Falta para Atingimento da Meta</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-red-500 drop-shadow-sm">
                                            {formatCurrency(faltaMes)}
                                        </h2>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">restante</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
                                            <Target className="h-3 w-3 text-blue-500" />
                                            <span className="text-[10px] text-blue-700 font-bold">Meta Diária:</span>
                                            <span className="text-[10px] font-black text-blue-900">{formatCurrency(ritmoNecessario)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
                                            <Sparkles className="h-3 w-3 text-indigo-500" />
                                            <span className="text-[10px] font-black text-indigo-900">
                                                {sugestaoVeiculo}v (50k) ou {sugestaoImovel}i (100k)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-auto flex flex-col gap-3">
                                <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-[280px]">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.1em]">Cronograma</span>
                                            <p className="text-[11px] font-black text-red-500 flex items-center gap-2">
                                                {diasUteisRestantes} / {diasUteisTotais} 
                                                <span className="text-[8px] text-slate-300 font-bold">DIAS RESTANTES</span>
                                            </p>
                                        </div>
                                        <span className="text-lg font-black text-slate-900">
                                            {((diasUteisPassados / diasUteisTotais) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 shadow-sm" 
                                            style={{ width: `${(diasUteisPassados / diasUteisTotais) * 100}%` }} 
                                        />
                                    </div>
                                </div>

                                {ritmoStatus !== 'verde' && (
                                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 animate-bounce">
                                        <Zap className="h-3 w-3 fill-red-500" />
                                        {ritmoStatus === 'amarelo' ? 'Aumentar pressão operacional' : 'Alerta: Ritmo Crítico'}
                                    </div>
                                )}
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
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <p className={`text-lg sm:text-xl font-bold ${
                                    ritmoStatus === 'verde' ? 'text-emerald-600' : 
                                    ritmoStatus === 'amarelo' ? 'text-amber-600' : 
                                    'text-red-600'
                                }`}>{formatCurrency(realizadoMes)}</p>
                                <p className="text-[10px] text-muted-foreground -mt-0.5">de {formatCurrency(metaMensal)}</p>
                            </div>
                            <span className={`text-base sm:text-lg font-bold ${
                                ritmoStatus === 'verde' ? 'text-emerald-700' : 
                                ritmoStatus === 'amarelo' ? 'text-amber-700' : 
                                'text-red-700'
                            }`}>{progressoMes.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                            <div className={`${
                                ritmoStatus === 'verde' ? 'bg-emerald-500' : 
                                ritmoStatus === 'amarelo' ? 'bg-amber-500' : 
                                'bg-red-500'
                            } h-2.5 rounded-full`} style={{ width: `${progressoMes}%` }} />
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
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <p className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(realizadoAno)}</p>
                                <p className="text-[10px] text-muted-foreground -mt-0.5">de {formatCurrency(metaAnual)}</p>
                            </div>
                            <span className="text-base sm:text-lg font-bold text-green-600">{progressoAno.toFixed(1)}%</span>
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
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Target className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[9px] text-amber-700 font-semibold uppercase tracking-wide">Falta para a Meta Anual</p>
                            <p className="text-lg sm:text-xl font-bold text-amber-800">{formatCurrency(faltaAno)}</p>
                            <p className="text-[10px] text-amber-600 -mt-0.5">
                                {faltaAno <= 0 ? "🎉 Meta atingida!" : `${(100 - progressoAno).toFixed(1)}% restante`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-200">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[9px] text-indigo-700 font-semibold uppercase tracking-wide">Necessário por Mês</p>
                            <p className="text-lg sm:text-xl font-bold text-indigo-800">{formatCurrency(necessarioPorMes)}</p>
                            <p className="text-[10px] text-indigo-600 -mt-0.5">
                                nos {mesesRestantes} {mesesRestantes === 1 ? "mês" : "meses"} restantes
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                    const faltaMetaMesColor = progressoMes >= 99 ? "text-green-600" : progressoMes >= 70 ? "text-amber-500" : "text-red-500";
                    const faltaMetaMesBg = progressoMes >= 99 ? "bg-green-50 border-green-200" : progressoMes >= 70 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
                    const items = [
                        { icon: DollarSign, color: "text-blue-500", val: formatCurrency(ticketMedio), label: "Ticket Médio", cardClass: "" },
                        { icon: TrendingUp, color: "text-green-500", val: `${taxaConversao.toFixed(1)}%`, label: "Conversão", cardClass: "" },
                        { icon: Users, color: "text-orange-500", val: leadsNecessarios, label: "Leads Necessários", cardClass: "" },
                        { icon: Target, color: faltaMetaMesColor, val: formatCurrency(faltaMes), label: "Falta p/ Meta Mês", cardClass: faltaMetaMesBg }
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
            {/* Chart Section */}
            <div className="w-full">
                <Card className="w-full shadow-sm border-slate-200/60 bg-white/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/30">
                        <div>
                           <CardTitle className="text-sm sm:text-base font-bold text-slate-800">Evolução Mensal (Últimos 4 Meses)</CardTitle>
                           <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Desempenho de metas vs realizado</p>
                        </div>
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
                                <Bar dataKey="meta" name="Meta" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="realizado" name="Realizado" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={40} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Fila de Ação Prioritária */}
            <div className="mt-6 mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    ⚡ Fila de Ação Prioritária
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {semFollowUp > 0 && (
                        <Card className="border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                        <Clock className="h-4 w-4" /> Leads sem contato
                                    </div>
                                    <p className="text-sm text-red-800 mb-4">{semFollowUp} leads sem contato há mais de 7 dias.</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full bg-white text-red-700 border-red-200 hover:bg-red-100" onClick={() => window.open('/admin/leads', '_self')}>
                                    Retomar Contato
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    {aguardandoUrgente > 0 && (
                        <Card className="border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
                                        <AlertTriangle className="h-4 w-4" /> Fila de espera
                                    </div>
                                    <p className="text-sm text-amber-900 mb-4">{aguardandoUrgente} clientes aguardando contemplação há mais de 6 meses.</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full bg-white text-amber-700 border-amber-200 hover:bg-amber-100" onClick={() => window.open('/admin/carteira', '_self')}>
                                    Revisar Estratégia
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    {segmentos.filter(seg => seg.total_leads === 0).map(seg => (
                        <Card key={`seg-zero-${seg.segmento}`} className="border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                                        <Users className="h-4 w-4" /> Alerta de Captação
                                    </div>
                                    <p className="text-sm text-slate-800 mb-4">Segmento de {SEGMENT_CONFIG[seg.segmento]?.label || seg.segmento} com 0 leads gerados.</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full bg-white text-slate-700 border-slate-200 hover:bg-slate-200">
                                    Ajustar Campanhas
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {semFollowUp === 0 && aguardandoUrgente === 0 && segmentos.filter(s => s.total_leads === 0).length === 0 && (
                        <div className="col-span-full p-8 border border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                            <p className="text-emerald-800 font-bold">Inbox Zerada!</p>
                            <p className="text-emerald-600 text-sm">Todas as ações pendentes estão em dia. Bom trabalho!</p>
                        </div>
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

                                    <div className="pt-2">
                                        <div className="flex flex-col gap-1 text-xs p-2 bg-indigo-50/80 border border-indigo-100 rounded-md">
                                            <div className="flex items-center gap-1 text-indigo-700 font-bold mb-0.5">
                                                <Sparkles className="h-3 w-3" />
                                                <span className="text-[9px] uppercase tracking-wider">Ação Recomendada</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-indigo-900 leading-tight">
                                                {seg.total_leads === 0 ? "Zerar gap: ativar nova campanha urgente." 
                                                : seg.taxa_conversao < 2 ? "Focar em quebra de objeções e reuniões." 
                                                : seg.progresso_meta < 70 ? "Pipeline lento: oferecer lance embutido."
                                                : "Upsell e indicação: contatar clientes recém-fechados."}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>


        </div>
    );
}
