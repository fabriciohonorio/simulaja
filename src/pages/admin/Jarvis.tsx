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

    const suggestedQuestions = [
        "Quem devo ligar agora",
        "Estou no ritmo da meta",
        "Quais leads têm maior chance de fechar",
        "Qual meu gargalo de vendas",
        "Quantas propostas tenho abertas",
        "Que conteúdo devo postar hoje",
        "Que segmento devo prospectar hoje"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes, metaRes] = await Promise.all([
                    supabase.from("leads").select("*"),
                    supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).maybeSingle()
                ]);

                if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
                if (metaRes.data) setMetaAnual(metaRes.data.meta_anual || 0);
            } catch (err) {
                console.error("Erro ao carregar dados para o Jarvis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAnalyze = (query: string = question) => {
        if (!query.trim()) return;
        
        setIsAnalyzing(true);
        setQuestion(query);

        // Simulando processamento do Jarvis
        setTimeout(() => {
            const currentMonth = new Date().getMonth() + 1;
            const currentMonthStr = new Date().toISOString().split('T')[0].substring(0, 7);
            const metaMensal = metaAnual / 12;
            
            const fechadosMes = leads.filter(l => (l.status || "").toLowerCase() === "fechado" && l.created_at?.startsWith(currentMonthStr));
            const realizadoMes = fechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            
            const emNegociacao = leads.filter(l => !["fechado", "perdido", "desistiu", "novo"].includes((l.status || "").toLowerCase()));
            const pipelineValue = emNegociacao.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
            
            const diasNoMes = new Date(new Date().getFullYear(), currentMonth, 0).getDate();
            const diaHoje = new Date().getDate();
            const projecao = diaHoje > 0 ? (realizadoMes / diaHoje) * diasNoMes : 0;
            
            let recomendacao = "";
            let detalhes: string[] = [];

            const queryLower = query.toLowerCase();

            if (queryLower.includes("ligar") || queryLower.includes("quem")) {
                const prioritarios = emNegociacao
                    .sort((a, b) => (b.valor_credito || 0) - (a.valor_credito || 0))
                    .slice(0, 3);
                
                recomendacao = "FOCO EM FECHAMENTO: Você tem leads de alto valor que precisam de atenção imediata.";
                detalhes = prioritarios.length > 0 
                    ? prioritarios.map(l => `Lead interessado em ${l.tipo_consorcio || 'Consórcio'} (R$ ${formatCurrency(l.valor_credito)}) - Status: ${l.status}`)
                    : ["Nenhum lead prioritário no momento. Excelente hora para prospectar novos negócios!"];
            } else if (queryLower.includes("meta") || queryLower.includes("ritmo")) {
                const status = projecao >= metaMensal ? "EXCELENTE" : "ATENÇÃO";
                recomendacao = `${status}: Sua projeção de fechamento é de ${formatCurrency(projecao)}.`;
                detalhes = [
                    projecao >= metaMensal 
                        ? "Você está superando o ritmo necessário. Foque em manter a qualidade do atendimento."
                        : `Para bater a meta mensal de ${formatCurrency(metaMensal)}, você precisa converter mais ${formatCurrency(metaMensal - realizadoMes)} este mês.`,
                    `Faltam ${diasNoMes - diaHoje} dias para o fechamento do mês.`
                ];
            } else if (queryLower.includes("chance") || queryLower.includes("fechar")) {
                const altaProbabilidade = emNegociacao.filter(l => ["proposta", "negociacao", "reuniao"].includes((l.status || "").toLowerCase()));
                recomendacao = "PROBABILIDADE DE FECHAMENTO: Identifiquei oportunidades quentes.";
                detalhes = altaProbabilidade.length > 0
                    ? altaProbabilidade.slice(0, 3).map(l => `Oportunidade de ${formatCurrency(l.valor_credito)} em estágio de ${l.status}.`)
                    : ["Não há leads em estágio avançado. Foque em mover os leads do topo do funil para 'Proposta'."];
            } else if (queryLower.includes("gargalo")) {
                const novosLeads = leads.filter(l => (l.status || "").toLowerCase() === "novo").length;
                recomendacao = "ANÁLISE DE GARGALOS: Foco na velocidade de resposta.";
                detalhes = [
                    novosLeads > 5 
                        ? `Você tem ${novosLeads} leads 'Novos'. O maior gargalo hoje é o primeiro contato.`
                        : "O funil está fluindo bem, mas o volume de propostas enviadas poderia ser 20% maior.",
                    "Dica: Automatize o primeiro contato para ganhar tração."
                ];
            } else if (queryLower.includes("propostas") || queryLower.includes("abertas")) {
                const propostasCount = leads.filter(l => (l.status || "").toLowerCase().includes("proposta")).length;
                recomendacao = `INVENTÁRIO COMERCIAL: Você tem ${propostasCount} propostas em aberto.`;
                detalhes = [
                    `Valor total em propostas: ${formatCurrency(leads.filter(l => (l.status || "").toLowerCase().includes("proposta")).reduce((acc, l) => acc + Number(l.valor_credito || 0), 0))}`,
                    "Agende follow-ups para estas propostas nas próximas 48 horas."
                ];
            } else if (queryLower.includes("conteúdo") || queryLower.includes("postar")) {
                const sugestoes = [
                    "Como usar o consórcio para comprar o segundo imóvel sem descapitalizar.",
                    "A verdade sobre o lance embutido: como funciona na prática.",
                    "Depoimento do cliente que economizou 40% em juros bancários usando consórcio."
                ];
                recomendacao = "ESTRATÉGIA DE CONTEÚDO: Gere autoridade técnica hoje.";
                detalhes = sugestoes;
            } else if (queryLower.includes("segmento") || queryLower.includes("prospectar")) {
                recomendacao = "OPORTUNIDADE DE MERCADO: O setor de agronegócio está em alta.";
                detalhes = [
                    "Foque em Veículos Pesados (Caminhões e Implementos).",
                    "Segmento sugerido: Médicos e Profissionais Liberais para Investimentos.",
                    "O ticket médio de Pesados é 2.5x maior que o de automóveis leves."
                ];
            } else {
                recomendacao = "ANÁLISE COMPLETA: Visão estratégica do seu CRM.";
                detalhes = [
                    `Seu pipeline total é de ${formatCurrency(pipelineValue)}.`,
                    "Converta 10% do seu pipeline para bater a meta hoje.",
                    "Dica do Jarvis: O tempo médio de fechamento caiu 5% na última semana."
                ];
            }

            setAnalysis({
                metaTotal: metaMensal,
                realizado: realizadoMes,
                pipeline: pipelineValue,
                projecao: projecao,
                recomendacao: recomendacao,
                detalhes: detalhes
            });
            setIsAnalyzing(false);
            
            toast({
                title: "Jarvis analisou os dados",
                description: "Confira as recomendações estratégicas abaixo.",
            });
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
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <MessageSquare className="h-5 w-5 text-primary" /> Como posso ajudar?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder="Exemplo: Quem devo ligar hoje? Estou no ritmo da meta? Que conteúdo postar hoje?"
                                        className="h-14 pl-10 text-base shadow-sm border-2 focus-visible:ring-primary/30"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                </div>
                                <Button 
                                    className="h-14 px-8 font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    onClick={() => handleAnalyze()}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="h-5 w-5" />}
                                    Analisar
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                                    <Sparkles className="h-4 w-4 text-amber-400" /> Perguntas Sugeridas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedQuestions.map((q, i) => (
                                        <Button 
                                            key={i} 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded-full hover:bg-primary/5 hover:border-primary transition-all text-xs sm:text-sm font-medium"
                                            onClick={() => handleAnalyze(q)}
                                        >
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resposta do Jarvis */}
                    {analysis && (
                        <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Sparkles className="h-6 w-6 text-primary" /></div>
                                        Análise do Jarvis
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Gerado agora</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-white border shadow-sm">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Meta do Período</p>
                                        <p className="text-lg font-black">{formatCurrency(analysis.metaTotal)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border shadow-sm">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Realizado</p>
                                        <p className="text-lg font-black text-green-600">{formatCurrency(analysis.realizado)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border shadow-sm">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Pipeline Atual</p>
                                        <p className="text-lg font-black text-blue-600">{formatCurrency(analysis.pipeline)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-sm ring-2 ring-primary/10">
                                        <p className="text-[10px] font-bold text-primary uppercase">Projeção Estimada</p>
                                        <p className="text-lg font-black text-primary">{formatCurrency(analysis.projecao)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-lg space-y-2">
                                        <h4 className="font-black text-lg flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5 text-amber-400" /> Insight Principal
                                        </h4>
                                        <p className="text-slate-300 leading-relaxed font-medium">
                                            {analysis.recomendacao}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-700 underline decoration-primary decoration-4 underline-offset-4">Recomendações Práticas:</h4>
                                        <div className="grid gap-3">
                                            {analysis.detalhes.map((d, i) => (
                                                <div key={i} className="flex gap-3 items-start p-4 rounded-xl border bg-white hover:border-primary/50 transition-colors">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <span className="text-primary font-bold text-xs">{i+1}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium">{d}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
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
                                <p className="text-[10px] text-muted-foreground px-4 uppercase tracking-tighter">Em breve: Comando por Voz, Chat Conversacional e Previsão de Probabilidade.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
