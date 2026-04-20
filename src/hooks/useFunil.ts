import { useState, useEffect, useCallback, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { DropResult } from "@hello-pangea/dnd";
import { handleKanbanDragEnd } from "@/pages/admin/optimizations/dragDropOptimizations";
import { Lead, HistoricoContato, Membro } from "@/types/funil";
import { COLUMNS, normalizeStatus } from "@/components/admin/funil/constants";
import { googleCalendarService } from "@/services/googleCalendarService";
import { makeService } from "@/services/makeService";

export const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

export function useFunil() {
  const { profile } = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationLead, setCelebrationLead] = useState<Lead | null>(null);
  const [grupo, setGrupo] = useState("");
  const [cota, setCota] = useState("");
  const [administradora, setAdministradora] = useState("");
  const [saving, setSaving] = useState(false);
  const [administradoraFilter, setAdministradoraFilter] = useState("todos");
  
  const [vencimentoLead, setVencimentoLead] = useState<Lead | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [horaAgendamento, setHoraAgendamento] = useState("09:00");
  const [notaAgendamento, setNotaAgendamento] = useState("");
  const [criarNoGcal, setCriarNoGcal] = useState(true);
  const [historicoLead, setHistoricoLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [ultimasTratativas, setUltimasTratativas] = useState<Record<string, HistoricoContato>>({});
  
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [membros, setMembros] = useState<Membro[]>([]);
  const isManager = true; 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    
    (supabase as any).from("perfis").select("id, nome_completo").then(({ data }: any) => {
      setMembros(data || []);
    });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isWideView, setIsWideView] = useState(() => {
    return localStorage.getItem("crm_wide_view") === "true";
  });
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("crm_column_widths");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar larguras das colunas", e);
      }
    }
    return {};
  });

  const handleUpdateLeadField = async (leadId: string, field: string, value: string) => {
    const { error } = await supabase.from("leads").update({ [field]: value }).eq("id", leadId);
    
    if (error) {
      toast.error(`Erro ao atualizar campo: ${error.message}`);
      return;
    }

    const { data: carteiraItem } = await (supabase as any).from("carteira").select("id").eq("lead_id", leadId).maybeSingle();
    if (carteiraItem) {
      await (supabase as any).from("carteira").update({ [field]: value }).eq("lead_id", leadId);
    }

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, [field]: value } : l)));

    const fieldLabels: Record<string, string> = {
      grupo: "Grupo",
      cota: "Cota",
      administradora: "Administradora",
      data_adesao: "Data de Adesão",
    };
    toast.success(`${fieldLabels[field] ?? field} atualizado com sucesso!`);
  };

  useEffect(() => {
    localStorage.setItem("crm_wide_view", String(isWideView));
  }, [isWideView]);

  useEffect(() => {
    localStorage.setItem("crm_column_widths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const startResizing = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      id,
      startX: e.pageX,
      startWidth: columnWidths[id] || (isWideView ? 200 : 280),
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { id, startX, startWidth } = resizingRef.current;
    const newWidth = Math.max(150, Math.min(600, startWidth + (e.pageX - startX)));
    setColumnWidths((prev) => ({ ...prev, [id]: newWidth }));
  };

  const stopResizing = () => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
  };

  const kanbanRef = useRef<HTMLDivElement>(null);
  const isDraggingCardRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowRight") {
        if (kanbanRef.current) kanbanRef.current.scrollLeft += 500;
      } else if (e.key === "ArrowLeft") {
        if (kanbanRef.current) kanbanRef.current.scrollLeft -= 500;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Função reutilizável de fetch de leads ───────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!profile?.organizacao_id) {
      setLoading(false);
      return;
    }

    const { data } = await (supabase as any)
      .from("leads")
      .select("*")
      .eq("organizacao_id", profile.organizacao_id)
      .order("created_at", { ascending: false });

    const uniqueRaw = ((data as unknown as Lead[]) || []).filter(
      (v: Lead, i: number, a: Lead[]) => a.findIndex((t: Lead) => t.id === v.id) === i
    );

    const fetchedLeads = uniqueRaw.map((lead: any) => ({
      ...lead,
      nome: lead.nome || "Lead Sem Nome",
      status: normalizeStatus(lead.status),
    }));
    setLeads(fetchedLeads);
    setLoading(false);

    const now = new Date();
    fetchedLeads.forEach(async (lead: Lead) => {
      const finalStatuses = ["fechado", "perdido", "morto"];
      if (finalStatuses.includes(lead.status || "")) return;

      const lastInteraction = new Date(lead.last_interaction_at || lead.created_at || now.toISOString());
      const hoursDiff = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
      let newTemp = lead.lead_temperatura || "quente";
      let newStatus = lead.status;

      if (hoursDiff > 24 * 7) newTemp = "morto";
      else if (hoursDiff > 24 * 3) newTemp = "frio";
      else if (hoursDiff > 24) newTemp = "morno";

      let score = 0;
      let reasons: string[] = [];

      if (lead.lead_score_valor === "premium") { score += 40; reasons.push("Crédito Premium"); }
      else if (lead.lead_score_valor === "alto") { score += 30; reasons.push("Alto Potencial"); }
      else if (lead.lead_score_valor === "medio") { score += 20; reasons.push("Médio Potencial"); }
      else { score += 10; reasons.push("Baixo Potencial"); }

      if (newTemp === "quente") { score += 40; reasons.push("Lead Ativo"); }
      else if (newTemp === "morno") { score += 20; reasons.push("Aguardando"); }
      else if (newTemp === "frio") { score += 5; }

      if (["simulacao_enviada", "proposta", "negociacao"].includes(newStatus || "")) { score += 20; reasons.push("Fase Avançada"); }
      else if (newStatus === "qualificacao") { score += 15; reasons.push("Em Qualificação"); }
      else if (newStatus === "primeiro_contato" || newStatus === "contato") { score += 10; }
      else { score += 5; }

      const newScore = score;
      const newReason = reasons.join(" + ");

      if (newTemp !== lead.lead_temperatura || newStatus !== lead.status || newScore !== lead.propensity_score) {
        await (supabase as any).from("leads").update({
          lead_temperatura: newTemp,
          status: newStatus,
          status_updated_at: newStatus !== lead.status ? now.toISOString() : lead.status_updated_at,
          propensity_score: newScore,
          propensity_reason: newReason,
        }).eq("id", lead.id).eq("organizacao_id", profile.organizacao_id);

        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, lead_temperatura: newTemp, status: newStatus, propensity_score: newScore, propensity_reason: newReason }
              : l
          )
        );
      }
    });
  }, [profile?.organizacao_id]);

  // refetch público para uso em outras páginas (ex: Leads.tsx)
  const refetch = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  // Carga inicial
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Subscription realtime — qualquer alteração em leads reflete no Funil/Carteira/Dashboard
  useEffect(() => {
    if (!profile?.organizacao_id) return;

    const channel = supabase
      .channel(`funil-leads-realtime-${profile.organizacao_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `organizacao_id=eq.${profile.organizacao_id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Remove lead excluído da lista sem precisar re-fetch
            setLeads((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
          } else if (payload.eventType === 'INSERT') {
            const newLead = payload.new as Lead;
            setLeads((prev) => {
              const exists = prev.find((l) => l.id === newLead.id);
              if (exists) return prev;
              return [{ ...newLead, nome: newLead.nome || 'Lead Sem Nome', status: normalizeStatus(newLead.status) }, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Lead;
            setLeads((prev) =>
              prev.map((l) =>
                l.id === updated.id
                  ? { ...l, ...updated, nome: updated.nome || 'Lead Sem Nome', status: normalizeStatus(updated.status) }
                  : l
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.organizacao_id]);

  useEffect(() => {
    if (leads.length === 0 || !profile?.organizacao_id) return;
    const leadIds = leads.map((l) => l.id);
    (supabase as any)
      .from("historico_contatos")
      .select("*")
      .eq("organizacao_id", profile.organizacao_id)
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        if (!data) return;
        const map: Record<string, HistoricoContato> = {};
        (data as HistoricoContato[]).forEach((h) => {
          if (h.lead_id && !map[h.lead_id]) {
            map[h.lead_id] = h;
          }
        });
        setUltimasTratativas(map);
      });
  }, [leads.length, profile?.organizacao_id]);

  const getColumnLeads = useCallback((columnId: string) => {
     return leads.filter((lead) => {
      const matchStatus = normalizeStatus(lead.status) === columnId;
      const matchAdmin = administradoraFilter === "todos" || lead.administradora === administradoraFilter;
      return matchStatus && matchAdmin;
    })
    .sort((a, b) => {
        const updateA = new Date(a.last_interaction_at || a.status_updated_at || a.created_at || 0).getTime();
        const updateB = new Date(b.last_interaction_at || b.status_updated_at || b.created_at || 0).getTime();
        if (updateA !== updateB) return updateB - updateA;

        const sw: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
        const sA = sw[a.score_final || ""] || 0, sB = sw[b.score_final || ""] || 0;
        if (sA !== sB) return sB - sA;
        return 0;
      });
  }, [leads, administradoraFilter]);

  const fireConfetti = useCallback(() => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handleGenerateReport = useCallback(() => {
    const doc = new jsPDF();
    const title = "Relatorio de Funil de Vendas";
    const date = format(new Date(), "dd/MM/yyyy HH:mm");

    doc.setFontSize(16);
    doc.text(title, 10, 10);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 10, 16);
    doc.line(10, 18, 200, 18);

    let y = 25;
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 10, y);
    doc.text("Status", 80, y);
    doc.text("Valor", 130, y);
    doc.text("Temp", 165, y);
    doc.text("Origem", 185, y);
    doc.line(10, y + 2, 200, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    const filteredLeads = leads.filter(item => administradoraFilter === "todos" || item.administradora === administradoraFilter);
    filteredLeads.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.nome.substring(0, 35), 10, y);
      doc.text((item.status || "Novo").replace("_", " "), 80, y);
      doc.text(String(item.valor_credito || 0), 130, y); // simplified value rendering for report
      doc.text(item.lead_temperatura || "quente", 165, y);
      doc.text((item.origem || "Simulador").substring(0, 10), 185, y);
      y += 6;
    });

    doc.save(`relatorio-funil-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Relatório gerado com sucesso!");
  }, [leads, administradoraFilter]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    isDraggingCardRef.current = false;
    if (!result.destination) return;
    
    const leadId = result.draggableId;
    const oldStatus = result.source.droppableId;
    const newStatus = result.destination.droppableId;

    if (oldStatus === newStatus) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    await handleKanbanDragEnd(result, leads, setLeads, "leads", "Ação concluída com sucesso!");

    if (newStatus === "aguardando_pagamento") {
      setVencimentoLead({ ...lead, status: "aguardando_pagamento" });
      setSelectedDate(lead.data_vencimento ? parseISO(lead.data_vencimento) : undefined);
    }

    if (newStatus === "fechado") {
      setCelebrationLead({ ...lead, status: "fechado" });
      setGrupo(lead.grupo || "");
      setCota(lead.cota || "");
      setAdministradora(lead.administradora || "");
      fireConfetti();
    }
    
    const statusLabel = COLUMNS.find(c => c.id === newStatus)?.label || newStatus;
    const logEntry = `Mudança de etapa: ${statusLabel}`;
    await supabase.from("historico_contatos").insert({
      lead_id: leadId,
      tipo: "sistema",
      observacao: `[${format(new Date(), "dd/MM")}] ${logEntry}`,
      resultado: "neutro",
      organizacao_id: lead.organizacao_id
    });
  }, [leads, fireConfetti]);

  const handleSaveVencimento = async () => {
    if (!vencimentoLead || !selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const updateData: any = {
      data_vencimento: dateStr,
      updated_at: new Date().toISOString(),
    };

    let gcalEventId: string | null = null;
    if (criarNoGcal) {
      const gcalResult = await googleCalendarService.criarEvento({
        leadNome: vencimentoLead.nome,
        leadCelular: vencimentoLead.celular || "",
        valorCredito: Number(vencimentoLead.valor_credito),
        tipoConsorcio: vencimentoLead.tipo_consorcio,
        data: dateStr,
        hora: horaAgendamento,
        nota: notaAgendamento,
      });

      if (gcalResult) {
        gcalEventId = gcalResult.eventId;
        updateData.gcal_event_id = gcalEventId;
        toast.success("Evento criado no Google Calendar!", { duration: 4000 });
      }
    }

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", vencimentoLead.id);

    if (error) {
      toast.error("Erro ao salvar agendamento");
      return;
    }

    const responsavel = membros.find(m => m.id === vencimentoLead.responsavel_id);
    await makeService.notificarAgendamento({
      lead: {
        id: vencimentoLead.id,
        nome: vencimentoLead.nome,
        celular: vencimentoLead.celular,
        tipo_consorcio: vencimentoLead.tipo_consorcio,
        valor_credito: Number(vencimentoLead.valor_credito),
        status: vencimentoLead.status,
      },
      data: dateStr,
      hora: horaAgendamento,
      nota: notaAgendamento,
      responsavel_nome: responsavel?.nome_completo || profile?.nome_completo || "",
    });

    setLeads((prev) =>
      prev.map((l) => (l.id === vencimentoLead.id ? { ...l, data_vencimento: dateStr, gcal_event_id: gcalEventId } : l)),
    );

    toast.success(`Agendado para ${format(selectedDate, "dd/MM/yyyy")} às ${horaAgendamento}`);
    setVencimentoLead(null);
    setSelectedDate(undefined);
    setHoraAgendamento("09:00");
    setNotaAgendamento("");
  };

  const handleSaveCelebration = async () => {
    if (!celebrationLead) return;
    setSaving(true);

    const { error: carteiraError } = await (supabase as any).from("carteira").upsert({
      lead_id: celebrationLead.id,
      nome: celebrationLead.nome,
      tipo_consorcio: celebrationLead.tipo_consorcio,
      valor_credito: Number(celebrationLead.valor_credito),
      grupo,
      cota,
      administradora: (administradora === "none" ? null : administradora) || celebrationLead.administradora,
      status: "aguardando",
      data_adesao: celebrationLead.status_updated_at ? celebrationLead.status_updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
      organizacao_id: celebrationLead.organizacao_id || profile?.organizacao_id,
    }, { onConflict: 'lead_id' });

    if (!carteiraError) {
      await supabase.from("leads").update({
        grupo,
        cota,
        administradora: (administradora === "none" ? null : administradora) || celebrationLead.administradora,
      }).eq("id", celebrationLead.id);
    }

    setSaving(false);

    if (carteiraError) {
      toast.error("Erro ao salvar na carteira");
      return;
    }

    toast.success("Cliente adicionado à carteira!");
    setCelebrationLead(null);
  };

  const handleDeleteLead = async (leadId: string, leadNome: string) => {
    if (!confirm(`Excluir o lead "${leadNome}" permanentemente?`)) return;
    await Promise.all([
      supabase.from("interacoes").delete().eq("lead_id", leadId),
      supabase.from("historico_contatos").delete().eq("lead_id", leadId),
      supabase.from("propostas").delete().eq("lead_id", leadId),
      supabase.from("carteira").delete().eq("lead_id", leadId),
    ]);
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) {
      toast.error("Erro ao excluir lead");
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    toast.success(`Lead "${leadNome}" excluído`);
  };

  const handleCloseHistorico = useCallback(async () => {
    if (!historicoLead) { setHistoricoLead(null); return; }
    const leadId = historicoLead.id;
    setHistoricoLead(null);
    const { data } = await supabase
      .from("historico_contatos")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setUltimasTratativas((prev) => ({ ...prev, [leadId]: data[0] as HistoricoContato }));
    }
  }, [historicoLead]);

  return {
    leads,
    setLeads,
    loading,
    refetch,
    celebrationLead,
    setCelebrationLead,
    grupo,
    setGrupo,
    cota,
    setCota,
    administradora,
    setAdministradora,
    saving,
    administradoraFilter,
    setAdministradoraFilter,
    vencimentoLead,
    setVencimentoLead,
    selectedDate,
    setSelectedDate,
    horaAgendamento,
    setHoraAgendamento,
    notaAgendamento,
    setNotaAgendamento,
    criarNoGcal,
    setCriarNoGcal,
    historicoLead,
    setHistoricoLead,
    ultimasTratativas,
    isMobile,
    mobileColIdx,
    setMobileColIdx,
    membros,
    isManager,
    isWideView,
    setIsWideView,
    columnWidths,
    kanbanRef,
    isDraggingCardRef,
    handleUpdateLeadField,
    startResizing,
    getColumnLeads,
    handleGenerateReport,
    onDragEnd,
    handleSaveVencimento,
    handleSaveCelebration,
    handleDeleteLead,
    handleCloseHistorico,
    editingLead,
    setEditingLead,
    savingLead,
    handleSaveLead: async (formData: any) => {
      if (!editingLead) return;
      setSavingLead(true);
      try {
        const { error } = await supabase
          .from("leads")
          .update({
            nome: formData.nome,
            email: formData.email,
            celular: formData.celular,
            cidade: formData.cidade,
            tipo_consorcio: formData.tipo_consorcio,
            valor_credito: Number(formData.valor_credito),
            prazo_meses: Number(formData.prazo_meses),
            status: formData.status,
            lead_temperatura: formData.lead_temperatura,
            lead_score_valor: formData.lead_score_valor,
            administradora: formData.administradora === "none" ? null : formData.administradora,
            indicador_nome: formData.indicador_nome,
            indicador_celular: formData.indicador_celular,
            grupo: formData.grupo,
            cota: formData.cota,
            dados_cadastro: formData.dados_cadastro,
          })
          .eq("id", editingLead.id);

        if (error) throw error;
        setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...formData } : l));
        setEditingLead(null);
        toast.success("Lead atualizado!");
      } catch (e: any) {
        toast.error("Erro ao salvar: " + e.message);
      } finally {
        setSavingLead(false);
      }
    },
    profile,
  };
}
