import { useState, useEffect } from "react";
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
import { Mic, MicOff, Volume2, User, Bot, Trash2 } from "lucide-react";

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

interface JarvisAnalysis {
    metaTotal: number;
    realizado: number;
    pipeline: number;
    projecao: number;
    recomendacao: string;
    detalhes: string[];
}

export default function Jarvis() {
    const { toast } = useToast();
    const [question, setQuestion] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<JarvisAnalysis | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
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
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = "pt-BR";
        msg.rate = 1.0;
        msg.pitch = 1.0;
        window.speechSynthesis.speak(msg);
    };

    const startVoiceRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Erro", description: "Reconhecimento de voz não suportado neste navegador.", variant: "destructive" });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuestion(transcript);
            handleAnalyze(transcript);
        };

        recognition.start();
    };

    const suggestedQuestions = [
        "Bom dia Jarvis, quais as novidades de hoje",
        "Quem devo ligar agora",
        "Estou no ritmo da meta",
        "Quais leads têm maior chance de fechar",
        "Que conteúdo devo postar hoje"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes, metaRes] = await Promise.all([
                    supabase.from("leads").select("*"),
                    supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).maybeSingle()
                ]);

                if (leadsRes.data) {
                    const lData = leadsRes.data as Lead[];
                    setLeads(lData);
                    
                    // Saudação automática ao carregar (após carregar os dados)
                    setTimeout(() => {
                        const prioritarios = lData.filter(l => !["fechado", "perdido", "desistiu"].includes((l.status || "").toLowerCase())).length;
                        speak(`Bom dia Fabrício. Você tem ${prioritarios} leads em negociação no seu funil hoje.`);
                    }, 1000);
                }
                if (metaRes.data) setMetaAnual(metaRes.data.meta_anual || 0);
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

        // Simulando processamento inteligente
        setTimeout(() => {
            const queryLower = query.toLowerCase();
            const currentMonthStr = new Date().toISOString().split('T')[0].substring(0, 7);
            const metaMensal = metaAnual / 12;
            
            const fechadosMes = leads.filter(l => (l.status || "").toLowerCase() === "fechado" && l.created_at?.startsWith(currentMonthStr));
            const realizadoMes = fechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            
            const emNegociacao = leads.filter(l => !["fechado", "perdido", "desistiu", "novo"].includes((l.status || "").toLowerCase()));
            const pipelineValue = emNegociacao.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const diaHoje = new Date().getDate();
            const projecao = diaHoje > 0 ? (realizadoMes / diaHoje) * diasNoMes : 0;

            let responseContent = "";
            let newAnalysis: JarvisAnalysis | null = null;

            if (queryLower.includes("bom dia") || queryLower.includes("novidades")) {
                const hotLeads = emNegociacao.filter(l => (l as any).score_final === "A" || (l as any).score_final === "B").slice(0, 2);
                const coldLeads = emNegociacao.filter(l => {
                    const last = l.updated_at || l.created_at || "";
                    if (!last) return false;
                    return (Date.now() - new Date(last).getTime()) > 3 * 24 * 60 * 60 * 1000;
                }).slice(0, 2);
                const compromissos = leads.filter(l => (l as any).data_vencimento && isToday(parseISO((l as any).data_vencimento)));

                responseContent = `Bom dia Fabrício! Aqui estão as novidades do seu CRM hoje:\n\n` +
                    `📊 *Resumo*: Você realizou ${formatCurrency(realizadoMes)} este mês. Seu pipeline está em ${formatCurrency(pipelineValue)}.\n` +
                    `🔥 *Leads Quentes*: ${hotLeads.length > 0 ? hotLeads.map(l => (l as any).nome || "Lead").join(", ") : "Nenhum no momento"}.\n` +
                    `❄️ *Sem Interação*: ${coldLeads.length > 0 ? coldLeads.map(l => (l as any).nome || "Lead").join(", ") : "Todos em dia"}.\n` +
                    `📅 *Compromissos*: Você tem ${compromissos.length} ação(ões) agendada(s) para hoje.\n` +
                    `🚀 *Sugestão*: Fabrício, foque no fechamento dos leads quentes para atingir sua projeção de ${formatCurrency(projecao)}.`;
                
                newAnalysis = {
                    metaTotal: metaMensal, realizado: realizadoMes, pipeline: pipelineValue,
                    projecao: projecao, recomendacao: "FOCO TOTAL EM FECHAMENTO",
                    detalhes: ["Priorizar leads quentes", "Reativar leads sem contato", "Finalizar compromissos do dia"]
                };
            } else if (queryLower.includes("ligar") || queryLower.includes("quem")) {
                const prioritarios = emNegociacao.sort((a, b) => (b.valor_credito || 0) - (a.valor_credito || 0)).slice(0, 3);
                responseContent = `Fabrício, identifiquei que os leads com maior prioridade agora são: ${prioritarios.map(l => (l as any).nome || "Lead").join(", ")}. Eles representam um potencial de ${formatCurrency(prioritarios.reduce((s,l) => s+Number(l.valor_credito), 0))}.`;
            } else if (queryLower.includes("ritmo") || queryLower.includes("meta")) {
                const status = projecao >= metaMensal ? "excelente" : "que exige atenção";
                responseContent = `Fabrício, atualmente você está em um ritmo ${status}. Sua projeção para o fim do mês é de ${formatCurrency(projecao)}, contra uma meta de ${formatCurrency(metaAnual/12)}.`;
            } else {
                responseContent = "Entendi sua dúvida. Analisando os dados, recomendo focar na movimentação do pipeline, que hoje soma um valor estratégico considerável.";
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
            {/* Header com estilo futurista */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-slate-900 to-primary/40 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 relative z-10">
                    <BrainCircuit className="h-12 w-12 text-primary-foreground animate-pulse" />
                </div>
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Pergunte ao Jarvis</h1>
                    <p className="text-primary-foreground/80 font-medium">Sua inteligência artificial dedicada à estratégia comercial e análise do CRM.</p>
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
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={`h-12 w-12 shrink-0 rounded-full transition-all ${isListening ? "bg-red-50 border-red-500 text-red-500 animate-pulse" : "hover:bg-primary/5 hover:text-primary"}`}
                                        onClick={startVoiceRecognition}
                                    >
                                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                    </Button>
                                    <Input 
                                        placeholder="Fale ou digite sua pergunta..."
                                        className="h-12 text-base border-muted focus-visible:ring-primary/20 rounded-xl"
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
