import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Target } from "lucide-react";

interface Lead {
  id: string;
  status: string | null;
  valor_credito: number | null;
  created_at: string | null;
}

interface Meta {
  id: number;
  meta_anual: number | null;
}

export default function Metas() {
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<number>(0);
  const [metaInput, setMetaInput] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, status, valor_credito, created_at");

      if (leadsError) throw leadsError;

      const { data: metaData, error: metaError } = await supabase
        .from("meta")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (metaError) throw metaError;

      setLeads(leadsData || []);

      if (metaData) {
        setMeta(metaData.meta_anual ?? 0);
        setMetaInput(String(metaData.meta_anual ?? 0));
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function salvarMeta() {
    try {
      setSaving(true);

      const valor = parseFloat(metaInput);
      if (isNaN(valor)) {
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
            meta_anual: valor,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      setMeta(valor);

      toast({
        title: "Sucesso",
        description: "Meta anual salva com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a meta.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const leadsFechados = leads.filter((l) => l.status === "fechado");

  const realizadoAno = leadsFechados
    .filter((l) => l.created_at?.startsWith(currentYear.toString()))
    .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

  const realizadoMes = leadsFechados
    .filter((l) =>
      l.created_at?.startsWith(
        `${currentYear}-${currentMonth.toString().padStart(2, "0")}`
      )
    )
    .reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

  const metaMensal = meta / 12;

  const progressoAno =
    meta > 0 ? Math.min(100, (realizadoAno / meta) * 100) : 0;

  const progressoMes =
    metaMensal > 0 ? Math.min(100, (realizadoMes / metaMensal) * 100) : 0;

  function formatCurrency(valor: number) {
    return `R$ ${valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
    })}`;
  }

  if (loading) {
    return <div className="p-10">Carregando...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Metas e Indicadores {currentYear}
        </h1>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Target className="h-5 w-5" />
            <Input
              type="number"
              value={metaInput}
              onChange={(e) => setMetaInput(e.target.value)}
              className="w-32 text-right"
            />
            <Button size="sm" onClick={salvarMeta} disabled={saving}>
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
          <p className="text-xl font-bold">
            {formatCurrency(realizadoAno)}
          </p>
          <p>Meta: {formatCurrency(meta)}</p>
          <p>{progressoAno.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">
            {formatCurrency(realizadoMes)}
          </p>
          <p>Meta Mensal: {formatCurrency(metaMensal)}</p>
          <p>{progressoMes.toFixed(1)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}  
