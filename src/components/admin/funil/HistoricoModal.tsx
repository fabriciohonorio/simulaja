import React, { useState, useCallback, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotebookPen, Plus, PhoneCall, Mail, MessageSquare, Gavel, Zap, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Lead, HistoricoContato } from "@/types/funil";
import { LeadChat } from "./LeadChat";

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
  const [activeTab, setActiveTab] = useState("chat");

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
      toast.error(`Erro ao salvar tratativa: ${error.message}`);
      setSavingNota(false);
      return;
    }

    const updateData: any = {
      ultimo_contato: new Date().toISOString(),
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", lead.id);

    if (updateError) {
      console.error("Erro ao atualizar lead:", updateError);
    }

    toast.success("Tratativa registrada!");

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black">{lead?.nome}</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold">
                {formatCurrency(Number(lead?.valor_credito))} · {lead?.tipo_consorcio?.toUpperCase()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <div className={`h-2 w-2 rounded-full ${lead?.atendimento_ia !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                {lead?.atendimento_ia !== false ? "AI Ativa" : "Mão Humana"}
              </span>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 border-b border-slate-100 bg-white">
            <TabsList className="h-14 bg-transparent gap-8">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black uppercase text-[11px] tracking-widest gap-2"
              >
                <Zap className="h-4 w-4" /> WhatsApp Chat
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black uppercase text-[11px] tracking-widest gap-2"
              >
                <NotebookPen className="h-4 w-4" /> Histórico CRM
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-6 overflow-hidden">
            <TabsContent value="chat" className="m-0 h-full">
              {lead && <LeadChat lead={lead} />}
            </TabsContent>

            <TabsContent value="history" className="m-0 h-full flex flex-col gap-6">
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Nota Interna</p>

                <div className="flex gap-2 flex-wrap">
                  {TIPO_CONTATO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTipoContato(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${tipoContato === opt.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"
                        }`}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <Textarea
                  placeholder="Descreva o que foi tratado..."
                  value={observacao}
                  onChange={(e: any) => setObservacao(e.target.value)}
                  className="min-h-[100px] text-sm resize-none rounded-xl border-slate-200 bg-white"
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {RESULTADO_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setResultado(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${resultado === opt.value ? opt.color + " border-current shadow-sm" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleSaveNota}
                    disabled={savingNota || !observacao.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest px-6 rounded-xl h-10 shadow-lg"
                  >
                    {savingNota ? "Salvando..." : "Salvar Nota"}
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative group/history-scroll overflow-hidden">
                <div 
                  id="history-list-container"
                  className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Atividades</h4>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{historico.length} registros</span>
                  </div>

                  {loadingHistorico ? (
                    <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-slate-300" /></div>
                  ) : historico.length === 0 ? (
                    <div className="text-center py-12 text-slate-300 italic text-sm">Nenhuma nota interna registrada.</div>
                  ) : (
                    <div className="space-y-3">
                      {historico.map((h) => {
                        const tipoOpt = TIPO_CONTATO_OPTIONS.find(t => t.value === h.tipo);
                        return (
                          <div key={h.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {tipoOpt && <tipoOpt.icon className="h-3 w-3 text-indigo-500" />}
                                <span className="text-[10px] font-black uppercase text-slate-600">{tipoOpt?.label}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400">
                                {h.created_at ? format(new Date(h.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : "—"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{h.observacao}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Vertical Scroll Controls */}
                <div className="absolute right-4 bottom-4 flex flex-col gap-1 opacity-0 group-hover/history-scroll:opacity-100 transition-opacity z-20">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg bg-white/90 hover:bg-white border border-slate-200"
                    onClick={() => {
                      const container = document.getElementById('history-list-container');
                      container?.scrollBy({ top: -200, behavior: 'smooth' });
                    }}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg bg-white/90 hover:bg-white border border-slate-200"
                    onClick={() => {
                      const container = document.getElementById('history-list-container');
                      container?.scrollBy({ top: 200, behavior: 'smooth' });
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
