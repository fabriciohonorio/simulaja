import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Phone, MapPin, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Lead {
    id: string;
    nome: string;
    celular: string;
    cidade: string;
    valor_credito: number;
    lead_score_valor: string | null;
    lead_temperatura: string | null;
    last_interaction_at: string | null;
    origem: string | null;
}

const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function FilaInteligente() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.from("leads").select("*")
            .not("status", "in", '("fechado", "perdido", "morto")')
            .then(({ data }) => {
                setLeads((data as any) ?? []);
                setLoading(false);
            });
    }, []);

    const getPriorityScore = (lead: Lead) => {
        let score = 0;
        // Temp priority
        if (lead.lead_temperatura === "🔥 Quente") score += 1000;
        else if (lead.lead_temperatura === "🌤 Morno") score += 500;
        else if (lead.lead_temperatura === "❄️ Frio") score += 100;

        // Credit priority
        if (lead.lead_score_valor === "💎 Premium") score += 300;
        else if (lead.lead_score_valor === "🔥 Alto Potencial") score += 200;
        else if (lead.lead_score_valor === "🚀 Médio Potencial") score += 100;

        // Wait time priority
        if (lead.last_interaction_at) {
            const hours = (Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60);
            score += Math.min(hours * 10, 200); // Up to 200 points for waiting
        }

        return score;
    };

    const prioritizedLeads = [...leads].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

    if (loading) return <div className="flex justify-center py-20 animate-pulse text-primary font-bold">Gerando fila inteligente...</div>;

    return (
        <div className="space-y-6">
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
                        <Card key={lead.id} className={`overflow-hidden border-l-4 transition-all hover:scale-[1.01] ${index === 0 ? "border-l-primary shadow-md" : "border-l-border"
                            }`}>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex gap-4 items-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">{lead.nome}</h3>
                                            <Badge variant={lead.lead_temperatura === "🔥 Quente" ? "destructive" : "secondary"} className="text-[10px]">
                                                {lead.lead_temperatura || "🔥 Quente"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {lead.lead_score_valor || "🌱 Baixo"}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {lead.cidade || "N/Inf"}</span>
                                            <span className="flex items-center gap-1 text-primary"><Clock className="h-3.5 w-3.5" /> {hoursWait}h de espera</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                    <p className="text-xl font-black text-foreground">{formatCurrency(Number(lead.valor_credito))}</p>
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                            title="WhatsApp"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                        </a>
                                        <a
                                            href={`tel:${(lead.celular || "").replace(/\D/g, "")}`}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                                            title="Ligar"
                                        >
                                            <Phone className="h-5 w-5" />
                                        </a>
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
        </div>
    );
}
