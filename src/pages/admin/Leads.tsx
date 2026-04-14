import { useState, useEffect, useCallback } from "react";
import { useFunil } from "@/hooks/useFunil";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import {
  Filter,
  Search,
  MoreHorizontal,
  UserRound,
  UserPlus,
  Trash2,
  Pencil,
  Plus,
  MapPin,
  Package,
  CalendarCheck,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadForm, LeadFormData } from "@/components/admin/LeadForm";
import { useProfile } from "@/hooks/useProfile";
import { format, parseISO } from "date-fns";

const STATUS_FECHADOS = ["venda_fechada", "fechado"];

export default function Leads() {
  const { leads, loading, setLeads } = useFunil();
  const { profile } = useProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = leads.filter(l => {
    const nomeSearch = (l.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "todos" || l.status === statusFilter;
    return nomeSearch && statusMatch;
  });

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Excluir este lead permanentemente?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lead excluído");
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  // Recarrega leads do Supabase e sincroniza estado local
  const refetchLeads = useCallback(async () => {
    if (!profile?.organizacao_id) return;
    const { data } = await (supabase as any)
      .from("leads")
      .select("*")
      .eq("organizacao_id", profile.organizacao_id)
      .order("created_at", { ascending: false });
    if (data) {
      // Atualiza estado otimisticamente sem normalização extra
      setLeads((prev) =>
        (data as any[]).map((d: any) => {
          const existing = prev.find((l) => l.id === d.id);
          return existing ? { ...existing, ...d } : d;
        })
      );
    }
  }, [profile?.organizacao_id, setLeads]);

  const handleSaveLead = async (formData: LeadFormData) => {
    setSubmitting(true);
    try {
      // Payload para a tabela leads (sem organizacao_id para evitar conflito de RLS em updates)
      const updatePayload: any = {
        nome: formData.nome,
        email: formData.email || null,
        celular: formData.celular,
        cidade: formData.cidade || null,
        tipo_consorcio: formData.tipo_consorcio,
        valor_credito: Number(formData.valor_credito) || 0,
        prazo_meses: Number(formData.prazo_meses) || 0,
        status: formData.status,
        lead_temperatura: formData.lead_temperatura || "morno",
        lead_score_valor: formData.lead_score_valor || "medio",
        administradora: formData.administradora === "none" ? null : (formData.administradora || null),
        indicador_nome: formData.indicador_nome || null,
        indicador_celular: formData.indicador_celular || null,
        grupo: formData.grupo || null,
        cota: formData.cota || null,
      };

      if (editingLead) {
        // ── Atualiza na tabela leads ──────────────────────────────────────
        const { error } = await supabase
          .from("leads")
          .update(updatePayload)
          .eq("id", editingLead.id);
        if (error) {
          console.error("Erro update lead:", error);
          throw new Error(error.message || "Erro ao atualizar lead");
        }

        // Atualiza estado local imediatamente (sem aguardar refetch)
        setLeads((prev) =>
          prev.map((l) => (l.id === editingLead.id ? { ...l, ...updatePayload } : l))
        );

        // ── Sincroniza com carteira em background (não bloqueia o save) ──
        (async () => {
          try {
            const { data: rows } = await (supabase as any)
              .from("carteira")
              .select("id")
              .eq("lead_id", editingLead.id)
              .limit(1);
            if (rows && rows.length > 0) {
              await (supabase as any).from("carteira").update({
                nome: updatePayload.nome,
                celular: updatePayload.celular,
                tipo_consorcio: updatePayload.tipo_consorcio,
                valor_credito: updatePayload.valor_credito,
                administradora: updatePayload.administradora,
                grupo: updatePayload.grupo,
                cota: updatePayload.cota,
              }).eq("lead_id", editingLead.id);
            }
          } catch (carteiraErr) {
            console.warn("[carteira sync] Aviso:", carteiraErr);
          }
        })();

        toast.success("Lead atualizado com sucesso!");
      } else {
        // ── Novo lead ────────────────────────────────────────────────────
        const insertPayload = { ...updatePayload, organizacao_id: profile?.organizacao_id };
        const { error } = await supabase.from("leads").insert([insertPayload]);
        if (error) {
          console.error("Erro insert lead:", error);
          throw new Error(error.message || "Erro ao criar lead");
        }
        toast.success("Lead criado com sucesso!");
        // Refresh completo só para novos leads
        await refetchLeads();
      }

      setIsDialogOpen(false);
      setEditingLead(null);
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Erro ao salvar lead";
      toast.error(msg);
      console.error("handleSaveLead error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = status || "novo";
    switch (s) {
      case 'venda_fechada': case 'fechado': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">✓ Vendido</span>;
      case 'negociacao': case 'em_negociacao': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-violet-50 text-violet-500 border border-violet-100">Negociando</span>;
      case 'perdido': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-red-50 text-red-400 border border-red-100">Perdido</span>;
      case 'simulacao_enviada': case 'proposta_enviada': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-sky-50 text-sky-500 border border-sky-100">Proposta</span>;
      case 'primeiro_contato': case 'contatado': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-500 border border-amber-100">Em contato</span>;
      case 'qualificacao': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-orange-50 text-orange-500 border border-orange-100">Qualif.</span>;
      case 'aguardando_pagamento': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-lime-50 text-lime-600 border border-lime-100">Ag. Pgto</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-100">{s.replace(/_/g, ' ')}</span>;
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando leads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900">Operação Leads</h1>
        <button
          onClick={() => { setEditingLead(null); setIsDialogOpen(true); }}
          className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          title="Novo Lead"
        >
          <UserRound className="h-3.5 w-3.5" />
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <AdminHeroCard
        title="Gerenciamento"
        subtitle="Oportunidades e Filtros"
        icon={Filter}
        bgIcon={Filter}
        accentColor="primary"
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="novo">Novos</option>
            <option value="contatado">Em Contato</option>
            <option value="em_negociacao">Negociação</option>
            <option value="venda_fechada">Vendidos</option>
            <option value="fechado">Fechados</option>
            <option value="perdido">Perdidos</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Grupo / Cota</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => {
                const isFechado = STATUS_FECHADOS.includes(l.status || "");
                const dataFechamento = isFechado && l.status_updated_at
                  ? format(parseISO(l.status_updated_at), "dd/MM/yyyy")
                  : null;

                return (
                  <tr
                    key={l.id}
                    className={`hover:bg-slate-50/50 transition-colors ${isFechado ? "bg-emerald-50/20" : ""}`}
                  >
                    {/* Lead: nome + celular + cidade */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-slate-900">{l.nome || "Lead Sem Nome"}</span>
                        <span className="text-[10px] text-slate-400">{l.celular || "Sem telefone"}</span>
                        {l.cidade && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <MapPin className="h-2.5 w-2.5" />
                            {l.cidade}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Segmento */}
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                      {l.tipo_consorcio || "Indefinido"}
                    </td>

                    {/* Status + data fechamento */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {getStatusBadge(l.status)}
                        {dataFechamento && (
                          <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold">
                            <CalendarCheck className="h-2.5 w-2.5" />
                            {dataFechamento}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Grupo / Cota — destaque para fechados */}
                    <td className="px-4 py-3">
                      {(l.grupo || l.cota) ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          isFechado ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}>
                          <Package className="h-2.5 w-2.5" />
                          G:{l.grupo || "—"} / C:{l.cota || "—"}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </td>

                    {/* Valor */}
                    <td className="px-4 py-3 font-black text-slate-700">
                      {formatLeadValue(Number(l.valor_credito || 0))}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-0.5">
                        <a
                          href={`https://wa.me/55${(l.celular || "").replace(/\D/g, "")}?text=Olá!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-500 transition-colors"
                          title="WhatsApp"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                        </a>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => { setEditingLead(l); setIsDialogOpen(true); }}
                            >
                               <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-500" onClick={() => handleDeleteLead(l.id)}>
                               <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminHeroCard>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingLead(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editingLead ? "Editar Lead" : "Novo Lead"}
            </DialogTitle>
          </DialogHeader>
          {/* key força re-montagem do formulário ao trocar de lead */}
          <LeadForm
            key={editingLead?.id || "new-lead"}
            isSubmitting={submitting}
            initialData={editingLead ? {
              nome: editingLead.nome || "",
              email: editingLead.email || "",
              celular: editingLead.celular || "",
              cidade: editingLead.cidade || "",
              tipo_consorcio: editingLead.tipo_consorcio || "imovel",
              valor_credito: String(editingLead.valor_credito || ""),
              prazo_meses: String(editingLead.prazo_meses || ""),
              status: editingLead.status || "novo_lead",
              lead_temperatura: editingLead.lead_temperatura || "morno",
              lead_score_valor: editingLead.lead_score_valor || "medio",
              administradora: editingLead.administradora || "none",
              indicador_nome: editingLead.indicador_nome || "",
              indicador_celular: editingLead.indicador_celular || "",
              grupo: editingLead.grupo || "",
              cota: editingLead.cota || "",
            } : {
              nome: "", email: "", celular: "", cidade: "",
              tipo_consorcio: "imovel", valor_credito: "", prazo_meses: "",
              status: "novo_lead", lead_temperatura: "morno", lead_score_valor: "medio",
              administradora: "none", grupo: "", cota: "",
            }}
            onSubmit={handleSaveLead}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
