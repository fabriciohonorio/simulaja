import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, MessageSquare, ClipboardList, TrendingUp, AlertCircle, Clock, CheckCircle2, Search, Filter, ChevronRight, MessageCircle, DollarSign, Calendar, UserPlus, Bot, Zap, Sparkles, ShieldCheck, Check, Copy } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { toast } from "sonner";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";

interface Lead {
    id: string;
    nome: string;
    celular: string;
    cidade: string;
    valor_credito: number;
    lead_score_valor: string | null;
    lead_temperatura: string | null;
    propensity_score: number | null;
    propensity_reason: string | null;
    last_interaction_at: string | null;
}

const SCORE_LABELS: Record<string, string> = {
    premium: "🔥 Lead Premium",
    alto: "🚀 Lead Alto",
    medio: "⚡ Lead Médio",
    baixo: "🧊 Lead Baixo",
};

export default function SDRPanel() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        supabase.from("leads")
            .select("*")
            .not("status", "in", ["fechado", "perdido", "morto"])
            .order("propensity_score", { ascending: false })
            .then(({ data }) => {
                setLeads((data as any) ?? []);
                setLoading(false);
            });
    }, []);

    const generateAIScript = (lead: Lead) => {
        const firstName = lead.nome.split(" ")[0];
        const valor = formatCurrency(lead.valor_credito);
        const cidade = lead.cidade ? ` em ${lead.cidade}` : "";

        if (lead.lead_score_valor === "premium") {
            return `Olá ${firstName}! 👋 Vi que você solicitou uma simulação premium de ${valor}${cidade}. Sou o consultor IA da SimulaJá e gostaria de agendar uma consultoria exclusiva de 5 minutos para te apresentar as melhores taxas do mercado hoje. Podemos falar em 15 minutos?`;
        }

        return `Oi ${firstName}! 😊 Aqui é da SimulaJá. Acabei de analisar sua simulação de ${valor}${cidade}. Tenho uma excelente notícia sobre o prazo que você escolheu. Consegue falar agora rapidinho por aqui ou por ligação?`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Script copiado para a área de transferência!");
        setTimeout(() => setCopied(false), 2000);
    };

    const urgentLeads = leads.filter(l =>
        (l.propensity_score || 0) >= 80 ||
        (l.lead_score_valor === "premium" && l.lead_temperatura === "quente")
    ).slice(0, 3);

    if (loading) return <div className="flex justify-center py-20 animate-pulse text-primary font-bold">Iniciando Agente SDR...</div>;

    const totalCreditoFila = leads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Gamified SDR Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <AdminHeroCard 
                        title="Inteligência de Atendimento" 
                        subtitle="Módulo Agente SDR Jarvis"
                        icon={Bot} 
                        bgIcon={Bot}
                        accentColor="primary"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                                    Seu Vendedor <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Digital Ativo</span>
                                </h1>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                                    O Jarvis analisa o histórico e gera scripts exclusivos para cada oportunidade. Foque nos leads de alta propensão para bater suas metas.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Volume Analisado</p>
                                    <p className="text-lg font-black text-blue-600">{formatLeadValue(totalCreditoFila)}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leads na Mesa</p>
                                    <p className="text-lg font-black text-slate-900">{leads.length}</p>
                                </div>
                            </div>
                        </div>
                    </AdminHeroCard>
                </div>

                <div className="lg:col-span-4 grid grid-cols-1 gap-4">
                    <div className="relative group overflow-hidden p-4 rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-default">
                        <div className="flex items-center gap-2 opacity-90 mb-2">
                            <span className="p-1.5 bg-white/20 rounded-lg"><Sparkles className="h-4 w-4" /></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white">Oportunidades de Ouro</p>
                        </div>
                        <p className="text-3xl font-black text-white">{urgentLeads.length}</p>
                        <p className="text-[10px] bg-white/20 text-white w-fit px-2 py-0.5 rounded-full font-bold mt-2">Leads de Alta Propensão</p>
                        <Bot className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Urgent Recommendations */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Recomendações Críticas
                    </h2>
                    {urgentLeads.map((lead) => (
                        <Card key={lead.id}
                            className={`cursor-pointer transition-all border-l-4 hover:shadow-md ${selectedLead?.id === lead.id ? "border-l-primary bg-primary/5 shadow-sm" : "border-l-red-500"}`}
                            onClick={() => setSelectedLead(lead)}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">{lead.nome}</p>
                                        <p className="text-[10px] text-muted-foreground">{lead.propensity_reason}</p>
                                    </div>
                                    <Badge variant="destructive" className="text-[9px] animate-pulse">URGENTE</Badge>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs font-black text-primary">{Math.round(lead.propensity_score || 0)}% Chance</span>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1">
                                        Agir Agora <Sparkles className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {urgentLeads.length === 0 && (
                        <div className="p-10 text-center border-2 border-dashed rounded-xl opacity-50">
                            <ShieldCheck className="h-10 w-10 mx-auto text-green-500 mb-2" />
                            <p className="text-sm">Tudo sob controle. Nenhum lead crítico aguardando.</p>
                        </div>
                    )}
                </div>

                {/* Center/Right: AI Action Area */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedLead ? (
                        <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-white to-primary/5 h-full">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" /> Próxima Melhor Ação (NBA)
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>Fechar</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-primary/10 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {selectedLead.nome.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedLead.nome}</h3>
                                        <p className="text-sm text-muted-foreground font-bold">{SCORE_LABELS[selectedLead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"} • <span className="font-medium">{selectedLead.cidade}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-bold flex items-center gap-2">
                                        <WhatsAppIcon className="h-4 w-4" /> Script Sugerido pela IA
                                    </p>
                                    <div className="relative group">
                                        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-sm leading-relaxed border-2 border-slate-800 italic">
                                            "{generateAIScript(selectedLead)}"
                                        </div>
                                        <Button
                                            onClick={() => copyToClipboard(generateAIScript(selectedLead))}
                                            className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-xs gap-1"
                                            size="sm"
                                        >
                                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copiar
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <Button variant="default" className="w-full gap-2 bg-green-500 hover:bg-green-600 h-12" asChild>
                                        <a href={`https://wa.me/55${selectedLead.celular.replace(/\D/g, "")}?text=${encodeURIComponent("Olá, bom dia! Aqui é o Fabricio. Vi sua empresa e pensei em uma forma de gerar mais oportunidades com planejamento financeiro… posso te explicar rapidinho?")}`} target="_blank" rel="noreferrer">
                                            <WhatsAppIcon className="h-5 w-5" /> Enviar WhatsApp
                                        </a>
                                    </Button>
                                    <Button variant="outline" className="w-full gap-2 h-12" asChild>
                                        <a href={`tel:${selectedLead.celular.replace(/\D/g, "")}`}>
                                            <Phone className="h-5 w-5" /> Iniciar Ligação
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-border rounded-xl bg-slate-50">
                            <Sparkles className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                            <h3 className="font-bold text-xl">Selecione um lead crítico</h3>
                            <p className="text-muted-foreground text-center max-w-sm mt-1">
                                A IA analisará o perfil e gerará um script de venda exclusivo para você converter agora.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
