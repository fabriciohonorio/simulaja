import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Clock, Trophy, TrendingUp } from "lucide-react";

interface CarteiraItem {
  id: string;
  lead_id: string | null;
  nome: string;
  tipo_consorcio: string | null;
  valor_credito: number | null;
  grupo: string | null;
  cota: string | null;
  status: string;
  cota_contemplada: string | null;
  data_contemplacao: string | null;
  created_at: string;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function Carteira() {
  const [items, setItems] = useState<CarteiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CarteiraItem | null>(null);
  const [cotaContemplada, setCotaContemplada] = useState("");
  const [dataContemplacao, setDataContemplacao] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await (supabase.from("carteira" as any) as any).select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const total = items.length;
  const aguardando = items.filter((i) => i.status === "aguardando").length;
  const contemplados = items.filter((i) => i.status === "contemplada").length;
  const pctContemplacao = total > 0 ? ((contemplados / total) * 100).toFixed(1) : "0";

  const handleContemplacao = async () => {
    if (!selectedItem) return;
    setSaving(true);
    await (supabase.from("carteira" as any) as any)
      .update({ status: "contemplada", cota_contemplada: cotaContemplada, data_contemplacao: dataContemplacao })
      .eq("id", selectedItem.id);
    setSaving(false);
    setSelectedItem(null);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Carteira de Clientes</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total de Clientes", value: total, icon: Users, color: "text-primary" },
          { label: "Aguardando", value: aguardando, icon: Clock, color: "text-muted-foreground" },
          { label: "Contemplados", value: contemplados, icon: Trophy, color: "text-green-600" },
          { label: "% Contemplação", value: `${pctContemplacao}%`, icon: TrendingUp, color: "text-primary" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Cota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.tipo_consorcio}</TableCell>
                  <TableCell>{fmt(Number(item.valor_credito || 0))}</TableCell>
                  <TableCell>{item.grupo || "—"}</TableCell>
                  <TableCell>{item.cota || "—"}</TableCell>
                  <TableCell>
                    {item.status === "contemplada" ? (
                      <Badge className="bg-green-600 text-white">🏆 Contemplada</Badge>
                    ) : (
                      <Badge variant="secondary">Aguardando</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.status === "aguardando" ? (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setCotaContemplada(""); setDataContemplacao(""); }}>
                        Registrar Contemplação
                      </Button>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <p>Cota: {item.cota_contemplada}</p>
                        <p>{item.data_contemplacao}</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cliente na carteira</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Contemplação — {selectedItem?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Número da Cota Contemplada</Label>
              <Input value={cotaContemplada} onChange={(e) => setCotaContemplada(e.target.value)} placeholder="Ex: 0012" />
            </div>
            <div className="space-y-2">
              <Label>Data da Assembleia</Label>
              <Input type="date" value={dataContemplacao} onChange={(e) => setDataContemplacao(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleContemplacao} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar Contemplação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
