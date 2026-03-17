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
    AlertCircle,
    BrainCircuit,
    Zap
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mic, MicOff, Volume2, User, Bot, Trash2, Bike, Home, Car as CarIcon } from "lucide-react";
import JarvisHero from "@/components/admin/JarvisHero";
import { useAuth } from "@/hooks/useAuth";

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
    tipo_consorcio: string | null;
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
    const { profile } = useAuth();
    const { toast } = useToast();
    const [question, setQuestion] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<JarvisAnalysis | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
    const [segmentMetas, setSegmentMetas] = useState<MetricaSegmento[]>([]);
    const [metaAnual, setMetaAnual] = useState(0);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "jarvis",
            content: "Olá Fabrício! Sou o Jarvis, seu assistente estratégico. Como posso ajudar no seu desempenho comercial hoje?",
            timestamp: new Date()
        }
    ]);
    const [isListening, setIsListening] = useState(false);

    const speak = (text: string) => {
        if (typeof window === "undefined") return;
        
        // Humanização: remover markdown (ex: *bold*, _italic_), emojis e caracteres especiais
        const cleanText = text
            .replace(/\*|_|#/g, '') // Remove md symbols
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '') // Remove emojis
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

    // Motor de Simulação Portado do ConsortiumSimulator
    const GRUPOS: Record<string, GrupoItem[]> = {
        imovel: [
            { grupo: "6041", credito: 110000, r50: 405.9, prazo: 216 },
            { grupo: "6041", credito: 150000, r50: 553.49, prazo: 216 },
            { grupo: "6041", credito: 200000, r50: 737.99, prazo: 216 },
            { grupo: "6030", credito: 300000, r50: 1130.06, prazo: 199 },
            { grupo: "6039", credito: 500000, r50: 1672.7, prazo: 230 },
            { grupo: "6039", credito: 1000000, r50: 3043.0, prazo: 230 },
        ],
        veiculo: [
            { grupo: "5293", credito: 25000, r50: 264.63, prazo: 77 },
            { grupo: "5294", credito: 50000, r50: 370.25, prazo: 100 },
            { grupo: "5295", credito: 100000, r50: 740.49, prazo: 100 },
        ],
        pesados: [
            { grupo: "5996", credito: 200000, r50: 1036.26, prazo: 135 },
            { grupo: "5996", credito: 500000, r50: 2590.66, prazo: 135 },
        ],
    };

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
        "Bom dia Jarvis, quais as novidades de hoje",
        "Qual a situação da inadimplência",
        "Quanto custa a parcela de 200 mil em imóveis",
        "Como estão as metas por segmento",
        "Quais leads têm maior chance de fechar"
    ];

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.organizacao_id) {
                if (profile) setLoading(false);
                return;
            }

            try {
                const [leadsRes, metaRes, inadRes] = await Promise.all([
                    supabase.from("leads").select("*").eq("organizacao_id", profile.organizacao_id),
                    supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).eq("organizacao_id", profile.organizacao_id).maybeSingle(),
                    supabase.from("inadimplentes").select("*").eq("organizacao_id", profile.organizacao_id)
                ]);

                let allLeads: Lead[] = [];
                if (leadsRes.data) {
                    allLeads = leadsRes.data as Lead[];
                    setLeads(allLeads);
                    
                    // Saudação automática ao carregar (após carregar os dados)
                    setTimeout(() => {
                        const prioritarios = allLeads.filter(l => !["fechado", "perdido", "desistiu"].includes((l.status || "").toLowerCase())).length;
                        speak(`Bom dia ${profile.nome_completo || 'Fabrício'}. Você tem ${prioritarios} leads em negociação no seu funil hoje.`);
                    }, 1000);
                }

                if (inadRes.data) {
                    setInadimplentes(inadRes.data as Inadimplente[]);
                }

                if (metaRes.data) {
                    setMetaAnual(metaRes.data.meta_anual || 0);
                    
                    // Calcular métricas por segmento baseadas no Metas.tsx
                    const currentMonthStr = new Date().toISOString().substring(0, 7);
                    const monthlyMetas: Record<string, number> = {
                        imoveis: Number(metaRes.data.meta_imoveis || 500000),
                        veiculos: Number(metaRes.data.meta_veiculos || 100000),
                        motos: Number(metaRes.data.meta_motos || 100000),
                        pesados: Number(metaRes.data.meta_pesados || 180000),
                        investimentos: Number(metaRes.data.meta_investimentos || 120000)
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
                        const segmentVendas = segmentLeads.filter(l => (l.status || "").toLowerCase() === "fechado" && l.created_at?.startsWith(currentMonthStr));
                        const valorTotal = segmentVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
                        
                        return {
                            segmento: config.id,
                            total_leads: segmentLeads.length,
                            total_vendas: segmentVendas.length,
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
    }, [profile?.organizacao_id]);

    const handleAnalyze = async (query: string = question) => {
        if (!query.trim()) return;
        
        setIsAnalyzing(true);
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");

        // Simulando processamento inteligente
        setTimeout(() => {
            const queryLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const currentMonthStr = new Date().toISOString().substring(0, 7);
            const metaMensal = metaAnual / 12;
            
            const fechadosMes = leads.filter(l => (l.status || "").toLowerCase() === "fechado" && l.created_at?.startsWith(currentMonthStr));
            const realizadoMes = fechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            
            const currentYear = new Date().getFullYear().toString();
            const realizadoAno = leads.filter(l => (l.status || "").toLowerCase() === "fechado" && l.created_at?.startsWith(currentYear)).reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            const progressoAno = metaAnual > 0 ? (realizadoAno / metaAnual) * 100 : 0;
            
            const emNegociacao = leads.filter(l => !["fechado", "perdido", "desistiu", "novo"].includes((l.status || "").toLowerCase()));
            const pipelineValue = emNegociacao.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const diaHoje = new Date().getDate();
            const projecao = diaHoje > 0 ? (realizadoMes / diaHoje) * diasNoMes : 0;

            // Inadimplência
            const dividaTotal = inadimplentes.filter(i => i.status !== "regularizado").reduce((acc, i) => acc + (i.valor_parcela * i.parcelas_atrasadas), 0);
            const inadCount = inadimplentes.filter(i => i.status !== "regularizado").length;

            let responseContent = "";
            let newAnalysis: JarvisAnalysis | null = null;

            // Lógica de FAQ Dinâmica / Simulação
            if ((queryLower.includes("parcela") || queryLower.includes("quanto custa")) && (queryLower.includes("mil") || queryLower.includes("m") || /\d/.test(query))) {
                const valorMatch = query.match(/(\d+)/g);
                const valor = valorMatch ? parseInt(valorMatch.join("")) : 0;
                if (valor > 0) {
                    const sim = findParcela(valor * (queryLower.includes("mil") ? 1000 : 1), queryLower);
                    responseContent = `Para um crédito de ${formatCurrency(sim.credito)}, a parcela reduzida é de *${formatCurrency(sim.r50)}* no prazo de ${sim.prazo} meses (Grupo ${sim.grupo}). Esta é a melhor opção estratégica hoje.`;
                }
            } else if (queryLower.includes("inadimplencia") || queryLower.includes("devendo") || queryLower.includes("pagar")) {
                responseContent = `Atualmente temos ${inadCount} clientes com parcelas em atraso, totalizando *${formatCurrency(dividaTotal)}* pendentes. Recomendo uma ação de cobrança imediata para os 3 maiores valores.`;
            } else if (queryLower.includes("segmento") || queryLower.includes("setor")) {
                const resumoSeg = segmentMetas.map(s => `${s.segmento.toUpperCase()}: ${Math.round((s.valor_total/s.meta_vendas)*100)}% da meta`).join("\n");
                responseContent = `Aqui está o desempenho por segmento este mês:\n\n${resumoSeg}\n\nO setor de ${segmentMetas.sort((a,b) => (a.valor_total/a.meta_vendas) - (b.valor_total/b.meta_vendas))[0].segmento} é o que mais precisa de atenção agora.`;
            } else if (queryLower.includes("bom dia") || queryLower.includes("novidades") || queryLower.includes("resumo")) {
                const hotLeads = emNegociacao.filter(l => (l as any).lead_score_valor === "premium" || (l as any).lead_score_valor === "alto").slice(0, 2);
                
                responseContent = `Bom dia Fabrício! Aqui está o "afinamento" do seu CRM hoje:\n\n` +
                    `💰 *Financeiro*: Realizado ${formatCurrency(realizadoMes)} vs Meta ${formatCurrency(metaMensal)}. Inadimplência total em ${formatCurrency(dividaTotal)}.\n` +
                    `🔥 *Oportunidades*: Foque em ${hotLeads.length > 0 ? hotLeads.map(l => (l as any).nome || "Lead").join(", ") : "leads de alto ticket"}.\n` +
                    `📉 *Atenção*: Temos ${segmentMetas.filter(s => (s.valor_total/s.meta_vendas) < 0.5).length} segmentos abaixo de 50% da meta.\n\n` +
                    `🚀 *Sugestão Jarvis*: Sua projeção de ${formatCurrency(projecao)} está saudável, mas recuperar ${formatCurrency(dividaTotal / 2)} da inadimplência daria um fôlego extra no caixa este mês.`;
                
                newAnalysis = {
                    metaTotal: metaMensal, realizado: realizadoMes, pipeline: pipelineValue,
                    projecao: projecao, inadimplencia: dividaTotal,
                    recomendacao: projecao >= metaMensal ? "EXPANSÃO E COBRANÇA" : "RECUPERAÇÃO DE VENDAS",
                    detalhes: [
                        `Inadimplência em ${formatCurrency(dividaTotal)}`,
                        `${Math.round(progressoAno || 0)}% da meta anual atingida`,
                        `${emNegociacao.length} leads ativos no pipeline`
                    ]
                };
            } else {
                responseContent = "Fabrício, analisando seu CRM por completo: seu pipeline está saudável, mas recomendo olhar para a inadimplência e para o fechamento de leads premium para garantir o batimento das metas este mês.";
            }

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
        }, 1500);
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header com estilo futurista e visual 3D */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-950/90 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-purple-900/40 opacity-50" />
                
                {/* Visual Premium Gerado */}
                <JarvisHero />

                <div className="relative z-10 text-center md:text-left space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                        <Zap className="h-4 w-4 text-primary animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/90">Estrategista Comercial v2.0</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                        Sistema Central <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Jarvis</span>
                    </h1>
                    <p className="text-lg text-primary-foreground/70 font-medium leading-relaxed">
                        Gerenciando o cérebro das suas vendas com foco em mobilidade (carro/moto) e patrimônio (casas). Sua inteligência artificial dedicada.
                    </p>
                </div>
            </div>

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
                                        <div key={i} className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
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
