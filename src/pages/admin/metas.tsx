import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Target } from "lucide-react";

interface Lead {
    id: string;
    nome: string;
    status: string | null;
    valor_credito: number;
    created_at: string | null;
    updated_at: string | null;
}

interface MetaAnual {
    id: number;
    meta_anual: number;
    created_at?: string;
    updated_at?: string;
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
    const currentMonth = new Date().getMonth() + 1;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Buscar leads
            const { data: leadsData, error: leadsError } = await supabase
                .from("leads")
                .select("id, nome, status, valor_credito, created_at, updated_at");

            if (leadsError) throw leadsError;

            // Buscar meta (pega o primeiro registro)
            const { data: metaData, error: metaError } = await supabase
                .from("meta")
                .select("*")
                .limit(1)
                .maybeSingle();

            if (metaError) throw metaError;

            // Buscar termômetro
            const { data: termData, error: termError } = await supabase
                .from("mercado_termometro")
                .select("*")
                .order("segmento");

            if (termError) throw termError;

            setLeads(leadsData || []);
            setTermometro(termData || []);

            if (metaData) {
                setMetaAnualObj(metaData);
                setMetaAnualInput(String(metaData.meta_anual ?? 0));
            } else {
                setMetaAnualObj(null);
                setMetaAnualInput("0");
            }

        } catch (error: any) {
            console.error("Erro ao buscar dados:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados da meta.",
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
            if (isNaN(valorNumerico)) {
                toast({
                    title: "Valor inválido",
                    description: "Digite um número válido.",
                    variant: "destructive",
                });
                return;
            }

            const { error } = await supabase
                .from("meta")
                .upsert(
                    {
                        id: 1,
                        meta_anual: valorNumerico,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: "id" }
                );

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Meta anual salva com sucesso!",
            });

            fetchData();

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
                .update({
                    percentual: novoValor,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id);

            if (error) throw error;

            setTermometro(prev =>
                prev.map(t =>
                    t.id === id ? { ...t, percentual: novoValor } : t
                )
            );

        } catch (error: any) {
            console.error("Erro ao atualizar termômetro:", error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o indicador.",
                variant: "destructive",
            });
        }
    };

    const formatCurrency = (val: number) =>
        `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

    const leadsFechados = leads.filter(l => l.status === "fechado");

    const realizadoAno = leadsFechados
        .filter(l => l.created_at?.startsWith(currentYear.toString()))
        .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const realizadoMes = leadsFechados
        .filter(l =>
            l.created_at?.startsWith(
                `${currentYear}-${currentMonth.toString().padStart(2, "0")}`
            )
        )
        .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const metaAnual = metaAnualObj?.meta_anual ?? 0;
    const metaMensal = metaAnual / 12;

    const progressoAno =
        metaAnual > 0 ? Math.min(100, (realizadoAno / metaAnual) * 100) : 0;

    const progressoMes =
        metaMensal > 0 ? Math.min(100, (realizadoMes / metaMensal) * 100) : 0;

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">
                    Metas e Indicadores {currentYear}
                </h1>

                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Target className="h-5 w-5 text-primary" />
                        <Input
                            type="number"
                            value={metaAnualInput}
                            onChange={(e) => setMetaAnualInput(e.target.value)}
                            className="w-32 text-right"
                        />
                        <Button
                            size="sm"
                            onClick={handleSalvarMeta}
                            disabled={savingMeta}
                        >
                            Salvar
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Desempenho do Ano</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">
                        {formatCurrency(realizadoAno)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Meta: {formatCurrency(metaAnual)}
                    </p>
                    <p className="text-sm font-bold">
                        {progressoAno.toFixed(1)}%
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Desempenho do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">
                        {formatCurrency(realizadoMes)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Meta Mensal: {formatCurrency(metaMensal)}
                    </p>
                    <p className="text-sm font-bold">
                        {progressoMes.toFixed(1)}%
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
