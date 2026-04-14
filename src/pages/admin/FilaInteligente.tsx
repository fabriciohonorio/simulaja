import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Phone, MapPin, TrendingUp, Clock, AlertCircle, Sparkles, Calendar, Users, Shield, Zap, Target, Search, Filter, ChevronRight, DollarSign, ArrowUpDown } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { formatToUpper } from "@/lib/formatters";


interface Lead {
    id: string;
    nome: string;
    celular: string;
    cidade: string;
    valor_credito: number;
    lead_score_valor: string | null;
    lead_temperatura: string | null;
    last_interaction_at?: string | null;
    origem?: string | null;
    data_vencimento?: string | null;
    created_at?: string | null;
}

const TEMP_EMOJIS: Record<string, string> = {
    quente: "🔥",
    morno: "🌤",
    frio: "❄️",
    morto: "☠️",
};

const SCORE_LABELS: Record<string, string> = {
    premium: "🔥 Lead Premium",
    alto: "🚀 Lead Alto",
    medio: "⚡ Lead Médio",
    baixo: "🧊 Lead Baixo",
};

export default function FilaInteligente() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Filtro otimizado para excluir leads fechados/perdidos
        const { data } = await supabase.from("leads").select("*")
            .not("status", "in", "(fechado,perdido,morto)");
        setLeads((data as Lead[]) ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveVencimento = async () => {
        if (!selectedLead || !selectedDate) return;
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        const { error } = await supabase
            .from("leads")
            .update({ data_vencimento: dateStr, updated_at: new Date().toISOString() })
            .eq("id", selectedLead.id);

        if (error) {
            toast.error("Erro ao agendar");
            return;
        }

        setLeads((prev) =>
            prev.map((l) => (l.id === selectedLead.id ? { ...l, data_vencimento: dateStr } : l)),
        );

        toast.success(`Agendado para ${format(selectedDate, "dd/MM/yyyy")}`);
        setSelectedLead(null);
        setSelectedDate(undefined);
    };

    const getPriorityScore = (lead: Lead) => {
        let score = 0;
        if (lead.lead_temperatura === "quente") score += 1000;
        else if (lead.lead_temperatura === "morno") score += 500;
        else if (lead.lead_temperatura === "frio") score += 100;

        if (lead.lead_score_valor === "premium") score += 300;
        else if (lead.lead_score_valor === "alto") score += 200;
        else if (lead.lead_score_valor === "medio") score += 100;

        if (lead.last_interaction_at) {
            const hours = (Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60);
            score += Math.min(hours * 10, 200);
        }

        return score;
    };

    const prioritizedLeads = [...leads].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

    if (loading) return <div className="flex justify-center py-20 animate-pulse text-primary font-bold">Gerando fila inteligente...</div>;

    const totalValorFila = prioritizedLeads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
    const leadsQuentesFila = prioritizedLeads.filter(l => l.lead_temperatura === 'quente').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Gamified Fila Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <AdminHeroCard 
                        title="Fila de Atendimento" 
                        subtitle="Inteligência de Priorização Jarvis"
                        icon={Target} 
                        bgIcon={Target}
                        accentColor="primary"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                                    Foco <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">no que Importa</span>
                                </h1>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                                    O Jarvis prioriza seus leads em tempo real baseando-se em Temperatura, Score de Crédito e Tempo de Espera. Siga a ordem e maximize sua conversão.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Volume em Fila</p>
                                    <p className="text-lg font-black text-blue-600">{formatLeadValue(totalValorFila)}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leads Ativos</p>
                                    <p className="text-lg font-black text-slate-900">{prioritizedLeads.length}</p>
                                </div>
                            </div>
                        </div>
                    </AdminHeroCard>
                </div>

                <div className="lg:col-span-4 grid grid-cols-1 gap-4">
                    <div className="relative group overflow-hidden p-4 rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-default">
                        <div className="flex items-center gap-2 opacity-90 mb-2">
                            <span className="p-1.5 bg-white/20 rounded-lg"><Zap className="h-4 w-4" /></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white">Atenção Crítica</p>
                        </div>
                        <p className="text-3xl font-black text-white">{leadsQuentesFila}</p>
                        <p className="text-[10px] bg-white/20 text-white w-fit px-2 py-0.5 rounded-full font-bold mt-2">Leads Quentes na Fila</p>
                        <Target className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Fila Inteligente de Atendimento</h1>
                    <p className="text-sm text-muted-foreground italic">Leads priorizados por Temperatura + Crédito + Tempo de Espera</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                    {prioritizedLeads.length} Leads Ativos
                </Badge>
            </div>

            <div className="space-y-3">
                {prioritizedLeads.map((lead, index) => {
                    const hoursWait = lead.last_interaction_at
                        ? Math.floor((Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60))
                        : 0;

                    return (
                        <Card key={lead.id} className={`overflow-hidden border-l-4 transition-all hover:scale-[1.01] ${index === 0 ? "border-l-primary shadow-md" : "border-l-border"}`}>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex gap-4 items-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">{formatToUpper(lead.nome)}</h3>
                                            <Badge variant={lead.lead_temperatura === "quente" ? "destructive" : "secondary"} className="text-[10px] font-bold">
                                                {TEMP_EMOJIS[lead.lead_temperatura || 'quente']} {lead.lead_temperatura === 'quente' ? 'Quente' : lead.lead_temperatura === 'morno' ? 'Morno' : lead.lead_temperatura === 'frio' ? 'Frio' : 'Morto'}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground font-bold">
                                            <span className="flex items-center gap-1 font-bold"><TrendingUp className="h-3.5 w-3.5" /> {SCORE_LABELS[lead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}</span>
                                            <span className="flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5" /> {lead.cidade || "N/Inf"}</span>
                                            <span className="flex items-center gap-1 text-primary font-bold"><Clock className="h-3.5 w-3.5" /> {hoursWait}h de espera</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                    <p className="text-xl font-black text-foreground">{formatLeadValue(Number(lead.valor_credito))}</p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href="/admin/sdr"
                                            className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors"
                                            title="Conselho da IA"
                                        >
                                            <Sparkles className="h-5 w-5" />
                                        </a>
                                        <a
                                            href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent("Olá, bom dia! Aqui é o Fabricio. Vi sua empresa e pensei em uma forma de gerar mais oportunidades com planejamento financeiro… posso te explicar rapidinho?")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                            title="WhatsApp"
                                        >
                                            <WhatsAppIcon className="h-5 w-5" />
                                        </a>
                                        <a
                                            href={`tel:${(lead.celular || "").replace(/\D/g, "")}`}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                                            title="Ligar"
                                        >
                                            <Phone className="h-5 w-5" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setSelectedDate(lead.data_vencimento ? parseISO(lead.data_vencimento) : undefined);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${lead.data_vencimento ? "bg-amber-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                                            title={lead.data_vencimento ? `Agendado: ${format(parseISO(lead.data_vencimento), "dd/MM/yy")}` : "Agendar"}
                                        >
                                            <Calendar className="h-5 w-5" />
                                        </button>
                                        <Button variant="outline" size="sm" className="hidden sm:inline-flex">Ver Detalhes</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {prioritizedLeads.length === 0 && (
                    <div className="text-center py-20 bg-card rounded-xl border-2 border-dashed border-border opacity-50">
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Nenhum lead aguardando atendimento agora.</p>
                        <p className="text-sm">Bom trabalho! Todos os leads foram processados.</p>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-500" /> Agendar Atendimento
                        </DialogTitle>
                        <DialogDescription>
                            Escolha uma data para o próximo contato com <span className="font-bold">{selectedLead?.nome}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-2">
                        <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={ptBR}
                            className="rounded-md border shadow-sm"
                        />
                        <div className="flex gap-2 w-full">
                            <Button className="flex-1" onClick={handleSaveVencimento} disabled={!selectedDate}>
                                Salvar Agendamento
                            </Button>
                            <Button variant="ghost" onClick={() => setSelectedLead(null)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
