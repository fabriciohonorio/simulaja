import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Sparkles, 
    Send, 
    Lightbulb, 
    TrendingUp, 
    Target, 
    Users, 
    MessageSquare, 
    Clock, 
    ArrowRight,
    Search,
    Zap,
    Mic, 
    MicOff, 
    Volume2, 
    User, 
    Bot, 
    Trash2, 
    Bike, 
    Home, 
    Car as CarIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import JarvisHero from "@/components/admin/JarvisHero";
import { GRUPOS } from "@/components/ConsortiumSimulator";
import { aiService } from "@/services/aiService";
import { calcularMissoes, Missao } from "@/lib/missoesService";

interface Message {
    id: string;
    role: "user" | "jarvis";
    content: string;
    timestamp: Date;
    type?: "text" | "analysis";
    data?: JarvisAnalysis;
}

interface Lead {
    id: string;
    status: string | null;
    valor_credito: number;
    created_at: string | null;
    updated_at: string | null;
    status_updated_at: string | null;
    tipo_consorcio: string | null;
    dados_cadastro?: any;
}

interface Inadimplente {
    id: string;
    nome: string;
    valor_parcela: number;
    parcelas_atrasadas: number;
    status: string;
}

interface MetricaSegmento {
    segmento: string;
    total_leads: number;
    total_vendas: number;
    valor_total: number;
    meta_vendas: number;
}

interface GrupoItem {
    grupo: string;
    credito: number;
    r50: number;
    prazo: number;
}

interface JarvisAnalysis {
    metaTotal: number;
    realizado: number;
    pipeline: number;
    projecao: number;
    inadimplencia: number;
    recomendacao: string;
    detalhes: string[];
}

export default function Jarvis() {
    const { toast } = useToast();
    const { profile } = useProfile();
    const [question, setQuestion] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<JarvisAnalysis | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
    const [cotasContempladas, setCotasContempladas] = useState<any[]>([]);
    const [historicoContatos, setHistoricoContatos] = useState<any[]>([]);
    const [segmentMetas, setSegmentMetas] = useState<MetricaSegmento[]>([]);
    const [metaAnual, setMetaAnual] = useState(0);
    const [missoes, setMissoes] = useState<Missao[]>([]);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "jarvis",
            content: `Fala ${profile?.nome_completo?.split(' ')[0] || 'Parceiro'}! Sou o Jarvis, seu estrategista comercial. O que vamos atacar hoje?`,
            timestamp: new Date()
        }
    ]);
    const [isListening, setIsListening] = useState(false);

    const speak = (text: string) => {
        if (typeof window === "undefined") return;
        
        // Humanização: remover markdown (ex: *bold*, _italic_), emojis e caracteres especiais, além de adaptar espaços
        const cleanText = text
            .replace(/\*|_|#|\[|\]/g, '') // Remove md symbols
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '') // Remove emojis
            .replace(/FUNIL:|LEADS:|METAS DO MÊS:|INADIMPLÊNCIA:/g, '') // Remove headers para fala mais fluida
            .replace(/\s+/g, ' ') // Remove double spaces
            .trim();

        const msg = new SpeechSynthesisUtterance(cleanText);
        msg.lang = "pt-BR";
        msg.rate = 1.0;
        msg.pitch = 1.0;
        window.speechSynthesis.speak(msg);
    };

    const recognitionRef = useRef<any>(null);

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Erro", description: "Reconhecimento de voz não suportado.", variant: "destructive" });
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = "pt-BR";
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                setQuestion(transcript);
            };

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
        }

        recognitionRef.current.start();
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            // Pequeno delay para garantir que o último transcript foi capturado
            setTimeout(() => {
                if (question.trim()) {
                    handleAnalyze(question);
                }
            }, 500);
        }
    };

    // Motor de Simulação Portado do ConsortiumSimulator (Importado nativamente)

    const findParcela = (valor: number, segmento: string) => {
        const seg = segmento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let key = "imovel";
        if (seg.includes("veic") || seg.includes("carro") || seg.includes("moto")) key = "veiculo";
        else if (seg.includes("pesad") || seg.includes("caminh") || seg.includes("agro")) key = "pesados";

        const lista = GRUPOS[key] || GRUPOS.imovel;
        // Encontra o mais próximo
        return lista.reduce((prev, curr) => {
            return (Math.abs(curr.credito - valor) < Math.abs(prev.credito - valor) ? curr : prev);
        });
    };

    const suggestedQuestions = [
        "E aí Jarvis, qual o resumo de hoje?",
        "Como tá a inadimplência?",
        "Simula uma parcela de 200 mil pra mim",
        "Como estão as metas por segmento?",
        "Quem tem mais chance de fechar?"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes, metaRes, inadRes, cotasRes, histRes] = await Promise.all([
                    supabase.from("leads").select("*"),
                    supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).maybeSingle(),
                    (supabase as any).from("inadimplentes").select("*"),
                    (supabase as any).from("cotas_contempladas").select("*"),
                    supabase.from("historico_contatos").select("*").order("data_contato", { ascending: false })
                ]);

                let allLeads: Lead[] = [];
                if (leadsRes.data) {
                    allLeads = leadsRes.data as Lead[];
                    setLeads(allLeads);
                    
                    if (profile?.id && profile?.organizacao_id) {
                        try {
                            const res = await calcularMissoes(profile.id, profile.organizacao_id, profile.tipo_acesso);
                            setMissoes(res.missoes);
                        } catch(e) {
                            console.error("Erro ao carregar missões no Jarvis:", e);
                        }
                    }

                    // Saudação automática ao carregar (após carregar os dados)
                    setTimeout(() => {
                        const prioritarios = allLeads.filter(l => !["fechado", "perdido", "desistiu"].includes((l.status || "").toLowerCase())).length;
                        speak(`Fala ${profile?.nome_completo?.split(' ')[0] || 'Parceiro'}! Tem ${prioritarios} leads em negociação na mesa. Bora focar hoje e fechar essas pendências.`);
                    }, 1000);
                }

                if (inadRes.data) {
                    setInadimplentes(inadRes.data as Inadimplente[]);
                }
                
                if (cotasRes.data) {
                    setCotasContempladas(cotasRes.data);
                }

                if (histRes.data) {
                    setHistoricoContatos(histRes.data);
                }

                if (metaRes.data) {
                    setMetaAnual(metaRes.data.meta_anual || 0);
                    
                    // Calcular métricas por segmento baseadas no Metas.tsx
                    const currentMonthStr = new Date().toISOString().substring(0, 7);
                    const monthlyMetas: Record<string, number> = {
                        imoveis: Number(metaRes.data.meta_imoveis || 500000),
                        veiculos: Number(metaRes.data.meta_veiculos || 100000),
                        motos: Number(metaRes.data.meta_motos || 100000),
                        pesados: Number((metaRes.data as any).meta_pesados || 180000),
                        investimentos: Number((metaRes.data as any).meta_investimentos || 120000)
                    };

                    const segConfig = [
                        { id: 'imoveis', keywords: ['imovel', 'imóvel', 'casa', 'apartamento', 'terreno', 'construcao', 'reforma'] },
                        { id: 'veiculos', keywords: ['veiculo', 'veículo', 'carro', 'auto', 'automovel', 'automóvel'] },
                        { id: 'motos', keywords: ['moto', 'motocicleta'] },
                        { id: 'pesados', keywords: ['pesados', 'agricolas', 'caminhao', 'caminhão', 'trator', 'maquina', 'máquina'] },
                        { id: 'investimentos', keywords: ['investimento', 'capitalizacao', 'aposentadoria', 'investimentos'] }
                    ];

                    const segs: MetricaSegmento[] = segConfig.map(config => {
                        const segmentLeads = allLeads.filter(l => {
                            const type = (l.tipo_consorcio || "").toLowerCase();
                            return config.keywords.some(kw => type.includes(kw));
                        });
                        const segmentVendas = segmentLeads.filter(l => {
                            const s = (l.status || "").toLowerCase().replace("_", " ");
                            const isRetroativo = l.dados_cadastro?.is_retroativo === true;
                            return (s === "fechado" || s === "venda fechada") && !isRetroativo;
                        });
                        const currentMonthVendas = segmentVendas.filter(l => {
                            const dateToCheck = l.status_updated_at || l.updated_at || "";
                            return dateToCheck.startsWith(currentMonthStr);
                        });
                        const valorTotal = currentMonthVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
                        
                        return {
                            segmento: config.id,
                            total_leads: segmentLeads.length,
                            total_vendas: currentMonthVendas.length,
                            valor_total: valorTotal,
                            meta_vendas: monthlyMetas[config.id]
                        };
                    });
                    setSegmentMetas(segs);
                }
            } catch (err) {
                console.error("Erro ao carregar dados para o Jarvis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAnalyze = async (query: string = question) => {
        if (!query.trim()) return;
        
        setIsAnalyzing(true);
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");

        const currentMonthStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).substring(0, 7);
        const metaMensal = metaAnual / 12;
        
        const fechadosMes = leads.filter(l => {
            const s = (l.status || "").toLowerCase().replace("_", " ");
            const isClosed = s === "fechado" || s === "venda fechada";
            const isRetroativo = l.dados_cadastro?.is_retroativo === true;
            const dateToCheck = l.status_updated_at || l.updated_at || "";
            return isClosed && dateToCheck.startsWith(currentMonthStr) && !isRetroativo;
        });
        const realizadoMes = fechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
        
        const currentYear = new Date().getFullYear().toString();
        const realizadoAno = leads.filter(l => {
            const s = (l.status || "").toLowerCase().replace("_", " ");
            const isClosed = s === "fechado" || s === "venda fechada";
            const isRetroativo = l.dados_cadastro?.is_retroativo === true;
            return isClosed && !isRetroativo && (l.status_updated_at || "").startsWith(currentYear);
        }).reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
        const progressoAno = metaAnual > 0 ? (realizadoAno / metaAnual) * 100 : 0;
        
        const emNegociacao = leads.filter(l => !["fechado", "venda_fechada", "perdido", "desistiu", "novo"].includes((l.status || "").toLowerCase()));
        const pipelineValue = emNegociacao.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
        const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const diaHoje = new Date().getDate();
        const projecao = diaHoje > 0 ? (realizadoMes / diaHoje) * diasNoMes : 0;

        // Inadimplência
        const dividaTotal = inadimplentes.filter(i => i.status !== "regularizado").reduce((acc, i) => acc + (i.valor_parcela * i.parcelas_atrasadas), 0);
        const inadCount = inadimplentes.filter(i => i.status !== "regularizado").length;
        const criticos = inadimplentes.filter(i => i.parcelas_atrasadas > 2);
        const criticosLista = criticos.map(i => `${i.nome} (${formatCurrency(i.valor_parcela * i.parcelas_atrasadas)})`).join(", ");

        const getCount = (st: string) => leads.filter(l => (l.status || "").toLowerCase() === st).length;
        const novosHoje = leads.filter(l => l.created_at?.startsWith(new Date().toISOString().split('T')[0])).length;
        const leadsFrios = leads.filter(l => (l as any).lead_temperatura === "frio").length;
        
        const imo = segmentMetas.find(s => s.segmento === 'imoveis');
        const vei = segmentMetas.find(s => s.segmento === 'veiculos');
        const pctImo = imo && imo.meta_vendas > 0 ? Math.round((imo.valor_total / imo.meta_vendas) * 100) : 0;
        const pctVei = vei && vei.meta_vendas > 0 ? Math.round((vei.valor_total / vei.meta_vendas) * 100) : 0;

        // Construir um super contexto resumido para o Jarvis, sem expor os dados completos de leads,
        // apenas um resumo e as informações essenciais para responder.
        
        // Simulações disponíveis (Grupos)
        const gruposInfo = Object.entries(GRUPOS).map(([tipo, lista]) => {
            return `Segmento ${tipo.toUpperCase()}:\n` + lista.slice(0, 5).map(g => `- Grupo: ${g.grupo}, Crédito: R$ ${g.credito}, Parcela: R$ ${g.r50}, Prazo: ${g.prazo}m`).join("\n");
        }).join("\n\n");

        // Cotas Contempladas
        const qtdAgrupada = cotasContempladas.reduce((acc, cota) => {
            acc[cota.grupo] = (acc[cota.grupo] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const cotasContempladasResumo = Object.entries(qtdAgrupada).map(([g, q]) => `Grupo ${g}: ${q} cotas`).join(", ");

        // Missões Diárias
        const missoesInfo = missoes.map(m => `- ${m.label}: ${m.atual} / ${m.meta} ${m.concluida ? "✅ CONCLUÍDA" : "⏳ PENDENTE"}`).join("\n");

        const contextBuilder = `
--- DADOS EM TEMPO REAL DO CRM ---

DATA DE HOJE: ${new Date().toLocaleDateString('pt-BR')} (Faltam ${Math.max(0, diasNoMes - diaHoje)} dias para o fim do mês)

1. FUNIL E VENDAS DO MÊS:
- Prospecção (Novos): ${getCount('novo')}
- Qualificação (Em Andamento): ${getCount('em_andamento')}
- Proposta: ${getCount('proposta')}
- Negociação: ${getCount('negociacao')}
- Fechamentos: ${getCount('fechado')}
- Realizado no Mês: ${formatCurrency(realizadoMes)} de uma meta de ${formatCurrency(metaMensal)}.
- Projeção de Fechamento Mês: ${formatCurrency(projecao)}
- Progressão Anual: ${Math.round(progressoAno)}% (${formatCurrency(realizadoAno)} de ${formatCurrency(metaAnual)})
- Pipeline Total em Negociação: ${formatCurrency(pipelineValue)} (${emNegociacao.length} leads)
- Novos leads hoje: ${novosHoje}
- Leads esfriando (risco): ${leadsFrios}

2. METAS POR SEGMENTO (MÊS):
- Imóveis: ${pctImo}% (${formatCurrency(imo?.valor_total || 0)} / ${formatCurrency(imo?.meta_vendas || 0)})
- Veículos: ${pctVei}% (${formatCurrency(vei?.valor_total || 0)} / ${formatCurrency(vei?.meta_vendas || 0)})

3. MISSÕES DO DIA (Dashboard de Missões):
${missoesInfo || "Nenhuma missão disponível no momento."}

4. INADIMPLÊNCIA:
- Total Devendo: ${formatCurrency(dividaTotal)} (${inadCount} clientes ativos)
- Clientes Críticos (>2 parcelas): ${criticosLista || "Nenhum no momento."}

5. SIMULADOR E COTAS (Para cálculos de parcelas):
${gruposInfo}

6. HISTÓRICO DE CONTEMPLAÇÕES (Loteria):
Cotas Vencedoras: ${cotasContempladasResumo || "Sem registros ainda."}

--- FIM DOS DADOS ---
Instrução: Se a pergunta do usuário for pedir um resumo ou o cenário atual, use a nova análise que seria gerada abaixo, mas seja humano. 
`;

        const response = await aiService.askJarvis(contextBuilder, query);
        
        let newAnalysis: JarvisAnalysis | null = null;
        if (query.toLowerCase().includes("resumo") || query.toLowerCase().includes("funil") || query.toLowerCase().includes("tudo")) {
            newAnalysis = {
                metaTotal: metaMensal, realizado: realizadoMes, pipeline: pipelineValue,
                projecao: projecao, inadimplencia: dividaTotal,
                recomendacao: projecao >= metaMensal ? "EXPANSÃO E COBRANÇA" : "RECUPERAÇÃO DE VENDAS",
                detalhes: [
                    `Inadimplência em ${formatCurrency(dividaTotal)}`,
                    `${Math.round(progressoAno || 0)}% da meta alcançada`,
                    `${emNegociacao.length} leads no funil`
                ]
            };
        }

        const responseContent = response.answer;

        const jarvisMsg: Message = {
            id: (Date.now()+1).toString(),
            role: "jarvis",
            content: responseContent,
            timestamp: new Date(),
            type: newAnalysis ? "analysis" : "text",
            data: newAnalysis || undefined
        };

        setMessages(prev => [...prev, jarvisMsg]);
        setAnalysis(newAnalysis);
        setIsAnalyzing(false);
        speak(responseContent);
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Jarvis Central - Standardized Slim Style */}
            <AdminHeroCard 
                title="Jarvis Strategist" 
                subtitle="Sistema Central de Inteligência Comercial"
                icon={Zap} 
                bgIcon={Sparkles}
                accentColor="amber"
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Visual Premium Gerado - Smaller Container */}
                    <div className="shrink-0 -my-4 h-32 w-32 md:h-40 md:w-40 flex items-center justify-center">
                        <div className="scale-[0.6] md:scale-[0.7]">
                            <JarvisHero />
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-3 flex-1">
                        <div className="inline-flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">v2.0 Online</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-slate-900">
                            Inteligência <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Jarvis</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                            Estrategista dedicado à sua operação. Analisando leads, metas e performance em tempo real para maximizar conversões.
                        </p>
                    </div>
                </div>
            </AdminHeroCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Pergunta e Sugestões */}
                <div className="lg:col-span-2 space-y-6 flex flex-col h-[600px]">
                    <Card className="border-none shadow-xl bg-white overflow-hidden flex-1 flex flex-col">
                        <CardHeader className="bg-slate-50/50 border-b py-4">
                            <CardTitle className="flex items-center justify-between text-lg">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" /> Chat com Jarvis
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setMessages([{ id: "1", role: "jarvis", content: "Chat resetado. Como posso ajudar?", timestamp: new Date() }])} title="Limpar chat">
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col bg-slate-50/30">
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4 pb-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start animate-in slide-in-from-left-2"}`}>
                                            <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-slate-900 text-white"}`}>
                                                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                                </div>
                                                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-700 border rounded-tl-none"}`}>
                                                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                                    <p className={`text-[10px] mt-2 opacity-60 ${msg.role === "user" ? "text-right" : ""}`}>
                                                        {format(msg.timestamp, "HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isAnalyzing && (
                                        <div className="flex justify-start animate-pulse">
                                            <div className="bg-white border p-3 rounded-2xl flex gap-2 items-center">
                                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            
                            <div className="p-4 bg-white border-t space-y-4">
                                <div className="flex gap-2 p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={`h-14 w-14 shrink-0 rounded-[20px] transition-all relative ${isListening ? "bg-red-500 text-white border-red-400 scale-110 shadow-lg shadow-red-500/20" : "hover:bg-primary/10 hover:text-primary active:scale-90"}`}
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        onMouseLeave={isListening ? stopRecording : undefined}
                                        onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => { e.preventDefault(); startRecording(); }}
                                        onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => { e.preventDefault(); stopRecording(); }}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff className="h-6 w-6 animate-pulse" />
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap animate-bounce shadow-xl">
                                                    Gravando...
                                                </div>
                                            </>
                                        ) : <Mic className="h-6 w-6" />}
                                    </Button>
                                    <Input 
                                        placeholder="Clique e segure para falar, ou digite aqui..."
                                        className="h-14 text-base border-none bg-transparent focus-visible:ring-0 rounded-xl"
                                        value={question}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAnalyze()}
                                    />
                                    <Button 
                                        className="h-12 w-12 shrink-0 rounded-full shadow-lg shadow-primary/20"
                                        onClick={() => handleAnalyze()}
                                        disabled={isAnalyzing || !question.trim()}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                    {suggestedQuestions.map((q, i) => (
                                        <Button 
                                            key={i} 
                                            variant="ghost" 
                                            size="sm" 
                                            className="rounded-full bg-slate-100/50 hover:bg-primary/5 hover:text-primary text-[10px] h-7 whitespace-nowrap"
                                            onClick={() => handleAnalyze(q)}
                                        >
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar com Sugestões do Dia */}
                <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary-foreground">
                                <Clock className="h-5 w-5" /> Sugestões Diárias
                            </CardTitle>
                            <CardDescription className="text-slate-400">Jarvis recomenda hoje:</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 relative z-10">
                            <ScrollArea className="h-auto space-y-4">
                                <div className="space-y-4">
                                    {[
                                        { icon: TrendingUp, text: `Gerar pelo menos ${Math.ceil((metaAnual/12)/100000)} novos leads hoje` },
                                        { icon: Users, text: `O lead 'Consórcio Imobiliário' (R$ 450k) está esfriando` },
                                        { icon: Send, text: "Faltam 4 propostas para bater o ritmo da semana" },
                                        { icon: MessageSquare, text: "Redes: Explique hoje a taxa Selic no consórcio" },
                                        { icon: Target, text: "Prospecção: Foco em médicos e profissionais liberais" }
                                    ].map((s, i) => (
                                        <div 
                                            key={i} 
                                            className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98]"
                                            onClick={() => {
                                                if (s.text.toLowerCase().includes("redes")) {
                                                    toast({
                                                        title: "Sugestão Jarvis",
                                                        description: "Acesse a aba 'Dashboard' para completar missões de redes sociais!"
                                                    });
                                                }
                                            }}
                                        >
                                            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                                <s.icon className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                            <p className="text-xs font-medium text-slate-300">{s.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="link" className="w-full text-primary-foreground text-xs mt-4">Ver plano estratégico completo <ArrowRight className="h-3 w-3 ml-1" /></Button>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-40">
                                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-muted-foreground">Evoluindo o Jarvis...</h4>
                                <p className="text-[10px] text-muted-foreground px-4 uppercase tracking-tighter">O Jarvis aprende com cada interação para ser seu braço direito nas vendas.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
