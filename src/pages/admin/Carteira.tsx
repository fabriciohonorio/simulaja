import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Users,
  Clock,
  Trophy,
  TrendingUp,
  CheckCircle,
  Calendar,
  Upload,
  FileText,
  Trash2,
  Send,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

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
  boleto_url: string | null;
  created_at: string;
  celular?: string | null;
}


export default function Carteira() {
  const { profile } = useAuth();
  const [items, setItems] = useState<CarteiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CarteiraItem | null>(null);
  const [cotaContemplada, setCotaContemplada] = useState("");
  const [dataContemplacao, setDataContemplacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchData = async () => {
    if (!profile?.organizacao_id) return;
    const { data } = await supabase.from("carteira")
      .select("*, leads:lead_id(celular)")
      .eq("organizacao_id", profile.organizacao_id)
      .order("created_at", { ascending: false });
    const mapped = (data ?? []).map((item: any) => ({
      ...item,
      celular: (item.leads as any)?.celular ?? null,
    }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.organizacao_id) {
      fetchData();
    } else if (profile) {
      setLoading(false);
    }
  }, [profile?.organizacao_id]);

  const total = items.length;
  const aguardando = items.filter((i) => i.status === "aguardando").length;
  const contemplados = items.filter((i) => i.status === "contemplada").length;
  const pctContemplacao = total > 0 ? ((contemplados / total) * 100).toFixed(1) : "0";

  const handleUploadBoleto = async (item: CarteiraItem, file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Erro", description: "Apenas arquivos PDF são aceitos.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "Arquivo deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setUploading(item.id);
    const filePath = `${item.id}/${Date.now()}_boleto.pdf`;

    // Remove old file if exists
    if (item.boleto_url) {
      const oldPath = item.boleto_url.split("/boletos/")[1];
      if (oldPath) await supabase.storage.from("boletos").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage.from("boletos").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("boletos").getPublicUrl(filePath);
    // Since bucket is private, we store the path and generate signed URLs on demand
    await supabase.from("carteira")
      .update({ boleto_url: filePath, organizacao_id: profile?.organizacao_id })
      .eq("id", item.id);

    toast({ title: "Boleto enviado!", description: `Boleto de ${item.nome} salvo com sucesso.` });
    setUploading(null);
    fetchData();
  };

  const handleViewBoleto = async (item: CarteiraItem) => {
    if (!item.boleto_url) return;
    const { data, error } = await supabase.storage.from("boletos").createSignedUrl(item.boleto_url, 300);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro", description: "Não foi possível abrir o boleto.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDeleteBoleto = async (item: CarteiraItem) => {
    if (!item.boleto_url) return;
    await supabase.storage.from("boletos").remove([item.boleto_url]);
    await supabase.from("carteira").update({ boleto_url: null, organizacao_id: profile?.organizacao_id }).eq("id", item.id);
    toast({ title: "Boleto removido", description: `Boleto de ${item.nome} foi excluído.` });
    fetchData();
  };

  const handleSendWhatsApp = async (item: CarteiraItem) => {
    if (!item.boleto_url) {
      toast({ title: "Sem boleto", description: "Faça o upload do boleto antes de enviar.", variant: "destructive" });
      return;
    }
    if (!item.celular) {
      toast({ title: "Sem celular", description: "Este cliente não possui celular cadastrado.", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.storage.from("boletos").createSignedUrl(item.boleto_url, 86400);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro", description: "Não foi possível gerar o link do boleto.", variant: "destructive" });
      return;
    }
    const phone = item.celular.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${item.nome}! 😊\n\nSegue o link para download do seu boleto:\n${data.signedUrl}\n\n⚠️ Este link é válido por 24 horas.`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  const handleContemplacao = async () => {
    if (!selectedItem) return;
    setSaving(true);
    await supabase.from("carteira")
      .update({ 
        status: "contemplada", 
        cota_contemplada: cotaContemplada, 
        data_contemplacao: dataContemplacao,
        organizacao_id: profile?.organizacao_id
      })
      .eq("id", selectedItem.id);
    setSaving(false);
    setSelectedItem(null);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const BoletoActions = ({ item }: { item: CarteiraItem }) => (
    <div className="flex items-center gap-1">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={(el) => { fileInputRefs.current[item.id] = el; }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadBoleto(item, file);
          e.target.value = "";
        }}
      />
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        disabled={uploading === item.id}
        onClick={() => fileInputRefs.current[item.id]?.click()}
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading === item.id ? "Enviando..." : item.boleto_url ? "Trocar" : "Boleto"}
      </Button>
      {item.boleto_url && (
        <>
          <Button size="sm" variant="ghost" onClick={() => handleViewBoleto(item)} title="Ver boleto">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleSendWhatsApp(item)} title="Enviar por WhatsApp">
            <Send className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteBoleto(item)} title="Excluir boleto">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Carteira de Clientes</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total de Clientes", value: total, icon: Users, color: "text-primary" },
          { label: "Aguardando", value: aguardando, icon: Clock, color: "text-muted-foreground" },
          { label: "Contemplados", value: contemplados, icon: Trophy, color: "text-green-600" },
          { label: "% Contemplação", value: `${pctContemplacao}%`, icon: TrendingUp, color: "text-primary" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-3 sm:p-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
                  <p className="text-lg font-bold leading-tight">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="pt-6 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Nome", "Tipo", "Valor", "Grupo", "Cota", "Status", "Boleto", "Ações"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium">{item.nome}</td>
                  <td className="px-3 py-2">{item.tipo_consorcio}</td>
                  <td className="px-3 py-2">{formatCurrency(Number(item.valor_credito || 0))}</td>
                  <td className="px-3 py-2">{item.grupo || "—"}</td>
                  <td className="px-3 py-2">{item.cota || "—"}</td>
                  <td className="px-3 py-2">
                    {item.status === "contemplada" ? (
                      <Badge className="bg-green-600 text-white">🏆 Contemplada</Badge>
                    ) : (
                      <Badge variant="secondary">Aguardando</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <BoletoActions item={item} />
                  </td>
                  <td className="px-3 py-2">
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
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-8">Nenhum cliente na carteira</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum cliente na carteira</p>
        )}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.nome}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.tipo_consorcio}</p>
                </div>
                {item.status === "contemplada" ? (
                  <Badge className="bg-green-600 text-white shrink-0">🏆 Contemplada</Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">Aguardando</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-medium text-primary">{formatCurrency(Number(item.valor_credito || 0))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grupo / Cota</p>
                  <p>{item.grupo || "—"} / {item.cota || "—"}</p>
                </div>
                {item.status === "contemplada" && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Cota Contemplada</p>
                      <p>{item.cota_contemplada || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</p>
                      <p>{item.data_contemplacao || "—"}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <BoletoActions item={item} />
              </div>

              {item.status === "aguardando" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => { setSelectedItem(item); setCotaContemplada(""); setDataContemplacao(""); }}
                >
                  <CheckCircle className="h-4 w-4" /> Registrar Contemplação
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
