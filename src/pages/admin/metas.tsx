import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  created_at: string | null;
  updated_at: string | null;
}

interface Termometro {
  id: string;
  segmento: string;
  percentual: number;
}

export default function Metas() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metaAnual, setMetaAnual] = useState<number>(0);
  const [metaInput, setMetaInput] = useState<string>("0");
  const [termometro, setTermometro] = useState<Termometro[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("*");

    const { data: metaData, error: metaError } = await supabase
      .from("meta")
      .select("meta_anual")
      .eq("ano", currentYear)
      .limit(1)
      .maybeSingle();

    const { data: termData, error: termError } = await supabase
      .from("mercado_termometro")
      .select("*")
      .order("segmento");

    if (leadsError) console.error("Erro leads:", leadsError);
    if (metaError) console.error("Erro meta:", metaError);
    if (termError) console.error("Erro termômetro:", termError);

    setLeads(leadsData || []);

    if (metaData?.meta_anual) {
      setMetaAnual(Number(metaData.meta_anual));
      setMetaInput(String(metaData.meta_anual));
    } else {
      setMetaAnual(0);
      setMetaInput("0");
    }

    setTermometro(termData || []);
    setLoading(false);
  };

  const salvarMeta = async () => {
    const valor = parseFloat(metaInput);
    if (isNaN(valor)) return;

    const { error } = await supabase.from("meta").upsert(
      { ano: currentYear, meta_anual: valor },
      { onConflict: "ano" }
    );

    if (error) {
      toast({ title: "Erro ao salvar meta", description: error.message });
      return;
    }

    setMetaAnual(valor);
    toast({ title: "Meta salva com sucesso!" });
  };

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  const metaMensal = metaAnual / 12;
  const mesStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

  const fechados = leads.filter((l) => l.status === "fechado");

  const realizadoMes = fechados
    .filter((l) => l.created_at?.slice(0, 7) === mesStr)
    .reduce((a, l) => a + Number(l.valor_credito || 0), 0);

  const realizadoAno = fechados
    .filter((l) => l.created_at?.slice(0, 4) === String(currentYear))
    .reduce((a, l) => a + Number(l.valor_credito || 0), 0);

  const progressoMes =
    metaMensal > 0 ? Math.min(100, (realizadoMes / metaMensal) * 100) : 0;

  const progressoAno =
    metaAnual > 0 ? Math.min(100, (realizadoAno / metaAnual) * 100) : 0;

  const ticketMedio =
    fechados.length > 0 ? realizadoAno / fechados.length : 0;

  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const m = `${currentYear}-${(i + 1).toString().padStart(2, "0")}`;
    const r = fechados
      .filter((l) => l.created_at?.slice(0, 7) === m)
      .reduce((a, l) => a + Number(l.valor_credito || 0), 0);

    return {
      name: new Date(currentYear, i, 1).toLocaleString("pt-BR", {
        month: "short",
      }),
      realizado: r,
      meta: metaMensal,
    };
  });

  const melhorMes =
    monthsData.length > 0
      ? monthsData.reduce((best, m) =>
          m.realizado > best.realizado ? m : best
        )
      : null;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Metas e Indicadores ({currentYear})
        </h1>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Meta Anual:</span>
          <Input
            type="number"
            value={metaInput}
            onChange={(e) => setMetaInput(e.target.value)}
            className="w-36"
          />
          <Button size="sm" onClick={salvarMeta}>
            Salvar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho do Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-green-600">
            {fmt(realizadoAno)} de {fmt(metaAnual)}
          </p>
          <p>{progressoAno.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta vs Realizado</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="meta" fill="#cbd5e1" />
              <Bar dataKey="realizado" fill="#1e3a8a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destaque do Ano</CardTitle>
        </CardHeader>
        <CardContent>
          {melhorMes ? (
            <>
              <p className="text-lg font-bold">{melhorMes.name}</p>
              <p>{fmt(melhorMes.realizado)}</p>
            </>
          ) : (
            <p>Nenhum dado disponível</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
