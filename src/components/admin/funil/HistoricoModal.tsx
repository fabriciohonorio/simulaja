import React, { useState, useCallback, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotebookPen, Plus, PhoneCall, Mail, MessageSquare, Gavel } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { atualizarStreak } from "@/lib/streakService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Lead, HistoricoContato } from "@/types/funil";

export const TIPO_CONTATO_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon },
  { value: "ligacao", label: "Ligação", icon: PhoneCall },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "presencial", label: "Presencial", icon: MessageSquare },
  { value: "lance", label: "Lance", icon: Gavel },
];

export const RESULTADO_OPTIONS = [
  { value: "positivo", label: "✅ Positivo", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "neutro", label: "🔄 Neutro", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "negativo", label: "❌ Negativo", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "sem_retorno", label: "📵 Sem Retorno", color: "text-gray-600 bg-gray-50 border-gray-200" },
];

export function HistoricoModal({
  lead,
  onClose,
  allLeads = [],
}: {
  lead: Lead | null;
  onClose: () => void;
  allLeads?: Lead[];
}) {
  const [historico, setHistorico] = useState<HistoricoContato[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [savingNota, setSavingNota] = useState(false);
  const [tipoContato, setTipoContato] = useState("whatsapp");
  const [observacao, setObservacao] = useState("");
  const [resultado, setResultado] = useState("positivo");

  const fetchHistorico = useCallback(async (leadId: string) => {
    setLoadingHistorico(true);
    const { data } = await supabase
      .from("historico_contatos")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setHistorico((data as HistoricoContato[]) ?? []);
    setLoadingHistorico(false);
  }, []);

  useEffect(() => {
    if (lead) fetchHistorico(lead.id);
  }, [lead, fetchHistorico]);

  const handleSaveNota = async () => {
    if (!lead || !observacao.trim() || savingNota) return;
    setSavingNota(true);

    const dataHoje = format(new Date(), "dd/MM");
    const observacaoComData = `[${dataHoje}] ${observacao.trim()}`;
 
    const organizationFromOtherLeads = allLeads.find(l => l.organizacao_id)?.organizacao_id;
    const finalOrgId = lead.organizacao_id || organizationFromOtherLeads;

    const { error } = await supabase.from("historico_contatos").insert({
      lead_id: lead.id,
      tipo: tipoContato,
      observacao: observacaoComData,
      resultado,
      organizacao_id: finalOrgId,
    });

    if (error) {
      console.error("Erro ao salvar histórico:", error);
      toast.error(`Erro ao salvar tratativa: ${error.message}${error.details ? ' - ' + error.details : ''}`);
      setSavingNota(false);
      return;
    }

    const updateData: any = {
      ultimo_contato: new Date().toISOString(),
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!lead.organizacao_id && organizationFromOtherLeads) {
      updateData.organizacao_id = organizationFromOtherLeads;
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", lead.id);

    if (updateError) {
      console.error("Erro ao atualizar lead:", updateError);
      toast.error(`Erro ao atualizar lead: ${updateError.message}`);
    }

    toast.success("Tratativa registrada!");

    // Atualiza o streak do usuário
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await atualizarStreak(user.id);
    } catch (e) {
      console.error("Erro silencioso ao atualizar streak:", e);
    }
    setObservacao("");
    setResultado("positivo");
    setTipoContato("whatsapp");
    await fetchHistorico(lead.id);
    setSavingNota(false);
  };

  return (
    <Dialog open={!!lead} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            Tratativas — {lead?.nome}
          </DialogTitle>
          <DialogDescription>
            {formatCurrency(Number(lead?.valor_credito))} · {lead?.tipo_consorcio}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Nova Tratativa</p>

          <div className="flex gap-2 flex-wrap">
            {TIPO_CONTATO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTipoContato(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${tipoContato === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="O que foi tratado? Anotações importantes..."
            value={observacao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacao(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />

          <div className="flex gap-2 flex-wrap">
            {RESULTADO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResultado(opt.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${resultado === opt.value ? opt.color + " border-current" : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSaveNota}
            disabled={savingNota || !observacao.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            {savingNota ? "Salvando..." : "Registrar Tratativa"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico ({historico.length})
          </p>

          {loadingHistorico ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <NotebookPen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma tratativa registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((h, i) => {
                const resultadoOpt = RESULTADO_OPTIONS.find(r => r.value === h.resultado);
                const tipoOpt = TIPO_CONTATO_OPTIONS.find(t => t.value === h.tipo);
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${h.resultado === "positivo" ? "bg-green-500" :
                        h.resultado === "negativo" ? "bg-red-500" :
                          h.resultado === "sem_retorno" ? "bg-gray-400" :
                            "bg-yellow-500"
                        }`} />
                      {i < historico.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        {tipoOpt && <tipoOpt.icon className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                          {tipoOpt?.label ?? h.tipo}
                        </span>
                        {resultadoOpt && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${resultadoOpt.color}`}>
                            {resultadoOpt.label}
                          </span>
                        )}
                        <span className="ml-auto text-[9px] text-muted-foreground/60">
                          {h.created_at
                            ? formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })
                            : "—"}
                        </span>
                      </div>
                      {h.observacao && (
                        <p className="text-xs text-foreground bg-background rounded px-2 py-1.5 border border-border/50">
                          {h.observacao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
