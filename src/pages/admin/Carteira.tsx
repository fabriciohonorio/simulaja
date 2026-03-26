import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  UserX,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";

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
  data_adesao: string | null;
  boleto_url: string | null;
  protocolo_lance_fixo: string | null;
  created_at: string;
  celular?: string | null;
}


export default function Carteira() {
  const [items, setItems] = useState<CarteiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CarteiraItem | null>(null);
  const [cotaContemplada, setCotaContemplada] = useState("");
  const [dataContemplacao, setDataContemplacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isEditingAdesao, setIsEditingAdesao] = useState(false);
  const [newAdesaoDate, setNewAdesaoDate] = useState("");
  const [loteriaFederal, setLoteriaFederal] = useState(() => localStorage.getItem("simulaja_loteria_federal") || "");
  const [participantesPadrao, setParticipantesPadrao] = useState<number>(600);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const groupQuotaMap: Record<string, number> = {
    "5290": 1800,
    "5292": 2500,
    "5291": 1800,
    "6041": 3100,
    "5996": 1800,
    "6037": 2500,
    "5294": 2500,
  };

  useEffect(() => {
    localStorage.setItem("simulaja_loteria_federal", loteriaFederal);
  }, [loteriaFederal]);

  const getLoteriaStatus = (cotaStr: string | null, grupoStr: string | null) => {
    if (!loteriaFederal) return null;
    const lotId = parseInt(loteriaFederal.replace(/\D/g, ''));
    if (isNaN(lotId)) return null;
    
    // Get participants for this group specifically as requested by user
    const participants = grupoStr ? (groupQuotaMap[grupoStr] || participantesPadrao) : participantesPadrao;
    
    if (participants <= 0) return null;
    
    // Lotus algorithm modulo participants
    const winCota = lotId % participants === 0 ? participants : lotId % participants;
    const clientCota = parseInt(cotaStr || "0");
    if (!clientCota) return { winCota, isWinner: false, isClose: false, diff: null, participants };
    
    // Calculate circular distance
    const diff = Math.min(
      Math.abs(clientCota - winCota), 
      participants - Math.abs(clientCota - winCota)
    );
    return { winCota, isWinner: diff === 0, isClose: diff > 0 && diff <= 10, diff, participants };
  };

  const fetchData = async () => {
    const { data } = await supabase.from("carteira").select("*, leads:lead_id(celular)").order("created_at", { ascending: false });
    const mapped = (data ?? []).map((item: any) => ({
      ...item,
      celular: (item.leads as any)?.celular ?? null,
    }));
    setItems(mapped);
    setLoading(false);
  };

  const calculateTimeElapsed = (start: string | null, end: string | null) => {
    if (!start) return "—";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} dias`;
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    return remainingDays > 0 ? `${months}m ${remainingDays}d` : `${months} meses`;
  };

  useEffect(() => { fetchData(); }, []);

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
    await supabase.from("carteira").update({ boleto_url: filePath }).eq("id", item.id);

    toast({ title: "Boleto enviado!", description: `Boleto de ${item.nome} salvo com sucesso.` });
    setUploading(null);
    fetchData();
  };

  const handleUpdateProtocolo = async (item: CarteiraItem, value: string) => {
    const { error } = await supabase.from("carteira").update({ protocolo_lance_fixo: value }).eq("id", item.id);
    
    if (!error) {
      toast({ title: "Sucesso", description: "Protocolo atualizado." });
      
      // Delinquency Mirroring
      if (value.toUpperCase().includes("INADIMPLENTE")) {
        const { error: syncError } = await supabase.from("inadimplentes").insert({
          nome: item.nome,
          celular: item.celular,
          grupo: item.grupo,
          cota: item.cota,
          tipo_consorcio: item.tipo_consorcio,
          status: "em_atraso",
          valor_parcela: 0,
          parcelas_pagas: 0,
          parcelas_atrasadas: 1
        });

        if (syncError) {
          console.error("Erro ao espelhar inadimplência:", syncError);
        } else {
          toast({ 
            title: "Inadimplência Registrada", 
            description: "Cliente espelhado para o módulo de Inadimplentes.",
          });
        }
      }
      
      fetchData();
    }
  };

  const handleSyncInadimplentes = async () => {
    setLoading(true);
    try {
      const phoneOverrides: Record<string, string> = {
        "ANA PAULA LODE DE SOUZA STAMATO": "41996970001",
        "PATRICIA NUNES MAGALHAES": "41998129859",
        "PATRICIA NUNES MAGALHÃES": "41998129859",
        "EDSON VENANCIO BATISTA JUNIOR": "41984762996"
      };

      const normalize = (str: string) => 
        str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";

      const getOverride = (nome: string) => {
        const normalizedInput = normalize(nome);
        for (const [key, val] of Object.entries(phoneOverrides)) {
          if (normalizedInput.includes(normalize(key))) return val;
        }
        return null;
      };

      // Fetch carteira with leads data
      const { data: carteiraData } = await supabase
        .from("carteira")
        .select("*, leads:lead_id(celular)");
      
      const mappedCarteira = (carteiraData ?? []).map((item: any) => ({
        ...item,
        celular: (item.leads as any)?.celular ?? null,
      }));

      const { data: currentInad } = await supabase.from("inadimplentes").select("*");
      
      // Items to insert (not in table yet)
      const toInsert = mappedCarteira.filter(c => {
        const protocolValue = c.protocolo_lance_fixo?.toUpperCase() || "";
        const hasProtocol = protocolValue.includes("INADIM");
        if (!hasProtocol) return false;
        
        return !currentInad?.some(i => 
          normalize(i.nome) === normalize(c.nome) && 
          (i.grupo === c.grupo || !i.grupo) && 
          (i.cota === c.cota || !i.cota)
        );
      });

      // Items to update (already in table but missing phone or has override)
      const toUpdate = mappedCarteira.filter(c => {
        const protocolValue = c.protocolo_lance_fixo?.toUpperCase() || "";
        const hasProtocol = protocolValue.includes("INADIM");
        if (!hasProtocol) return false;
        
        const phone = c.celular || getOverride(c.nome);
        if (!phone) return false;
        
        const exists = currentInad?.find(i => 
          normalize(i.nome) === normalize(c.nome) && 
          (i.grupo === c.grupo || !i.grupo) && 
          (i.cota === c.cota || !i.cota)
        );
        // Update if already in table but phone is missing OR if we have a manual override for them
        return exists && (!exists.celular || getOverride(c.nome));
      });
      
      if (toInsert.length === 0 && toUpdate.length === 0) {
        toast({ title: "Sincronização", description: "Todos os inadimplentes já estão atualizados." });
        setLoading(false);
        return;
      }

      // Execute inserts
      const insertResults = await Promise.all(toInsert.map(async (item) => {
        let phone = item.celular || getOverride(item.nome);
        if (phone && phone.startsWith("55")) phone = phone.substring(2);
        
        if (phone && !item.celular && item.lead_id) {
          await supabase.from("leads").update({ celular: phone }).eq("id", item.lead_id);
        }
        
        return (supabase.from("inadimplentes" as any) as any).insert({
          nome: item.nome,
          celular: phone,
          grupo: item.grupo,
          cota: item.cota,
          tipo_consorcio: item.tipo_consorcio,
          status: "em_atraso",
          valor_parcela: 0,
          parcelas_pagas: 0,
          parcelas_atrasadas: 1,
          organizacao_id: item.organizacao_id
        });
      }));

      const firstInsertError = insertResults.find(r => r.error)?.error;
      if (firstInsertError) {
        console.error("Insert error:", firstInsertError);
        throw new Error(`Erro ao inserir: ${firstInsertError.message}`);
      }

      // Execute updates
      const updateResults = await Promise.all(toUpdate.map(async (item) => {
        let phone = item.celular || getOverride(item.nome);
        if (phone && phone.startsWith("55")) phone = phone.substring(2);
        
        if (phone && (!item.celular || item.celular === "null") && item.lead_id) {
          await supabase.from("leads").update({ celular: phone }).eq("id", item.lead_id);
        }
        
        const existing = currentInad?.find(i => 
          normalize(i.nome) === normalize(item.nome) && 
          (i.grupo === item.grupo || !i.grupo) && 
          (i.cota === item.cota || !i.cota)
        );
        if (!existing?.id) return { error: null };

        return (supabase.from("inadimplentes" as any) as any)
          .update({ celular: phone })
          .eq("id", existing.id);
      }));
      
      const firstUpdateError = updateResults.find(r => r.error)?.error;
      if (firstUpdateError) {
        console.error("Update error:", firstUpdateError);
        throw new Error(`Erro ao atualizar: ${firstUpdateError.message}`);
      }

      toast({ 
        title: "Sucesso", 
        description: `${toInsert.length} novos e ${toUpdate.length} existentes sincronizados.` 
      });
    } catch (err: any) {
      console.error("Erro na sincronização:", err);
      toast({ 
        title: "Falha ao sincronizar", 
        description: err.message || "Erro inesperado. Verifique o console.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      fetchData();
    }
  };

  const handleUpdateAdesao = async () => {
    if (!selectedItem || !newAdesaoDate) return;
    setSaving(true);
    const { error } = await supabase.from("carteira").update({ data_adesao: newAdesaoDate }).eq("id", selectedItem.id);
    
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Data de adesão atualizada." });
      setIsEditingAdesao(false);
      fetchData();
    }
    setSaving(false);
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
    await supabase.from("carteira").update({ boleto_url: null }).eq("id", item.id);
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
      .update({ status: "contemplada", cota_contemplada: cotaContemplada, data_contemplacao: dataContemplacao })
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

  const ProtocoloActions = ({ item }: { item: CarteiraItem }) => {
    const [protocolValue, setProtocolValue] = useState(item.protocolo_lance_fixo || "");
    
    return (
      <div className="flex items-center gap-2">
        <Input 
          size={10} 
          className="h-8 text-[10px] w-24" 
          placeholder="Protocolo Lance" 
          value={protocolValue}
          onChange={(e) => setProtocolValue(e.target.value)}
          onBlur={() => {
            if (protocolValue !== (item.protocolo_lance_fixo || "")) {
              handleUpdateProtocolo(item, protocolValue);
            }
          }}
        />
      </div>
    );
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const title = "Relatorio de Carteira de Clientes";
    const date = format(new Date(), "dd/MM/yyyy HH:mm");

    doc.setFontSize(16);
    doc.text(title, 10, 10);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 10, 16);
    doc.line(10, 18, 200, 18);

    let y = 25;
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 10, y);
    doc.text("Grupo", 100, y);
    doc.text("Cota", 125, y);
    doc.text("Valor", 150, y);
    doc.text("Status", 185, y);
    doc.line(10, y + 2, 200, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.nome.substring(0, 45), 10, y);
      doc.text(item.grupo || "—", 100, y);
      doc.text(item.cota || "—", 125, y);
      doc.text(formatCurrency(Number(item.valor_credito || 0)), 150, y);
      doc.text(item.status || "—", 185, y);
      y += 6;
    });

    doc.save(`relatorio-carteira-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Relatório gerado com sucesso!");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Carteira de Clientes</h1>
        <Button 
          size="sm" 
          onClick={handleSyncInadimplentes} 
          variant="outline" 
          className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
          disabled={loading}
        >
          <UserX className="h-4 w-4 mr-2" />
          Sincronizar Inadimplentes Retroativos
        </Button>
        <Button 
          size="sm" 
          onClick={handleGenerateReport} 
          variant="outline" 
          className="flex-1 sm:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
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
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">{card.label}</p>
                  <p className="text-sm sm:text-lg font-bold leading-tight truncate">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-2 sm:p-3 sm:pt-4 h-full flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy className="h-4 w-4 text-blue-600 animate-bounce" />
              <p className="text-[10px] sm:text-xs font-bold text-blue-900 uppercase tracking-tighter">Prêmio Loteria Federal</p>
            </div>
            <div className="flex gap-1.5">
              <Input 
                type="number" 
                placeholder="Último prêmio..." 
                value={loteriaFederal} 
                onChange={(e) => setLoteriaFederal(e.target.value)} 
                className="bg-white/95 border-blue-200 h-9 text-xs font-black text-blue-900 focus-visible:ring-blue-500 w-full shadow-inner"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="pt-6 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Nome", "Tipo", "Valor", "Adesão", "Lance / Boleto", "Status", "Eficiência"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium">
                    <div className="text-sm font-bold text-slate-800">{item.nome}</div>
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-white text-orange-600 border border-orange-200 text-[11px] font-black py-0.5 px-3 rounded shadow-sm flex items-center gap-1.5">
                          GRUP: <span className="text-orange-700 text-xs">{item.grupo || "—"}</span>
                        </div>
                        <div className="bg-white text-orange-600 border border-orange-200 text-[11px] font-black py-0.5 px-3 rounded shadow-sm flex items-center gap-1.5">
                          COTA: <span className="text-orange-700 text-xs">{item.cota || "—"}</span>
                        </div>
                      </div>
                      {(() => {
                        const lot = getLoteriaStatus(item.cota, item.grupo);
                        if (!lot) return null;
                        if (lot.isWinner) {
                          return (
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-green-100 text-green-800 border-green-400 text-[11px] font-black py-0 px-2 h-5 animate-pulse">
                                🏆 CONTEMPLADO (Sorteio: {lot.winCota})
                              </Badge>
                            </div>
                          );
                        }
                        if (lot.isClose) {
                          return (
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-400 text-[10px] font-black py-0 px-2 h-5 animate-pulse">
                                🔥 PODE GANHAR LANCE FIXO (Sorteio: {lot.winCota} / Dif: {lot.diff})
                              </Badge>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-2 h-5 border-dashed">
                              Sorteio: {lot.winCota} ({lot.participants} parts)
                            </Badge>
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-3 py-2 capitalize">{item.tipo_consorcio}</td>
                  <td className="px-3 py-2 font-bold">{formatCurrency(Number(item.valor_credito || 0))}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col group">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{item.data_adesao ? format(parseISO(item.data_adesao), "dd/MM/yyyy") : "—"}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setSelectedItem(item); setNewAdesaoDate(item.data_adesao || ""); setIsEditingAdesao(true); }}
                        >
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Há {calculateTimeElapsed(item.data_adesao, null)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      <ProtocoloActions item={item} />
                      <BoletoActions item={item} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {item.status === "contemplada" ? (
                      <Badge className="bg-green-600 text-white">🏆 Contemplada</Badge>
                    ) : (
                      <Badge variant="secondary">Aguardando</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {item.status === "aguardando" ? (
                      <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={() => { setSelectedItem(item); setCotaContemplada(""); setDataContemplacao(""); }}>
                        Contemplar
                      </Button>
                    ) : (
                      <div className="text-[10px] leading-tight text-muted-foreground">
                        <p className="font-bold text-green-700">Contemplada em:</p>
                        <p>{item.data_contemplacao ? format(parseISO(item.data_contemplacao), "dd/MM/yyyy") : "—"}</p>
                        <p className="mt-1 font-semibold text-primary">Tempo: {calculateTimeElapsed(item.data_adesao, item.data_contemplacao)}</p>
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
                <div className="col-span-2 flex items-center gap-2.5 bg-gradient-to-r from-orange-50/50 to-white p-2 rounded-xl border border-orange-100 mb-1 shadow-sm">
                  <div className="flex-1 text-center bg-white p-1 rounded border border-orange-50">
                    <p className="text-[9px] text-orange-400 uppercase font-black tracking-tighter">Grupo</p>
                    <p className="text-lg font-black text-orange-600 leading-none">{item.grupo || "—"}</p>
                  </div>
                  <div className="flex-1 text-center bg-white p-1 rounded border border-orange-50">
                    <p className="text-[9px] text-orange-400 uppercase font-black tracking-tighter">Cota</p>
                    <p className="text-lg font-black text-orange-600 leading-none">{item.cota || "—"}</p>
                  </div>
                </div>
                {(() => {
                  const lot = getLoteriaStatus(item.cota, item.grupo);
                  if (!lot) return null;
                  return (
                    <div className="col-span-2 flex items-center justify-center p-1.5 rounded-lg border">
                      {lot.isWinner ? (
                        <p className="text-xs font-black text-green-700 uppercase animate-pulse">🏆 CONTEMPLADO (Sorteio: {lot.winCota})</p>
                      ) : lot.isClose ? (
                        <p className="text-[11px] font-black text-amber-700 animate-pulse">🔥 LANCE FIXO PRÓXIMO: {lot.winCota} (Dif: {lot.diff})</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground font-medium">Sorteio: {lot.winCota} / {lot.participants} participantes</p>
                      )}
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Adesão</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0"
                      onClick={() => { setSelectedItem(item); setNewAdesaoDate(item.data_adesao || ""); setIsEditingAdesao(true); }}
                    >
                      <Calendar className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                  <p className="text-xs">{item.data_adesao ? format(parseISO(item.data_adesao), "dd/MM") : "—"} ({calculateTimeElapsed(item.data_adesao, null)})</p>
                </div>
                {item.status === "contemplada" && (
                  <div className="col-span-2 bg-green-50 p-2 rounded border border-green-100 mt-1">
                    <p className="text-[10px] font-bold text-green-700 uppercase">Dados de Contemplação</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Cota / Data</p>
                        <p className="text-xs font-bold">{item.cota_contemplada || "—"} / {item.data_contemplacao ? format(parseISO(item.data_contemplacao), "dd/MM") : "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Tempo Total</p>
                        <p className="text-xs font-bold text-primary">{calculateTimeElapsed(item.data_adesao, item.data_contemplacao)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <ProtocoloActions item={item} />
                <div className="w-px h-4 bg-border mx-1" />
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

      <Dialog open={!!selectedItem} onOpenChange={(open: boolean) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Contemplação — {selectedItem?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Número da Cota Contemplada</Label>
              <Input value={cotaContemplada} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotaContemplada(e.target.value)} placeholder="Ex: 0012" />
            </div>
            <div className="space-y-2">
              <Label>Data da Assembleia</Label>
              <Input type="date" value={dataContemplacao} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataContemplacao(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleContemplacao} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar Contemplação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Date Edit Dialog */}
      <Dialog open={isEditingAdesao} onOpenChange={setIsEditingAdesao}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Data de Adesão</DialogTitle>
            <DialogDescription>
              Ajuste a data de entrada do cliente {selectedItem?.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data_adesao">Data de Adesão</Label>
              <Input
                id="data_adesao"
                type="date"
                value={newAdesaoDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdesaoDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingAdesao(false)}>Cancelar</Button>
            <Button onClick={handleUpdateAdesao} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
