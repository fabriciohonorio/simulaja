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
  NotebookPen,
  ClipboardList,
  RefreshCw
} from "lucide-react";
import { formatToUpper, formatToFourDigits } from "@/lib/formatters";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { LeadForm, LeadFormData } from "@/components/admin/LeadForm";
import { useProfile } from "@/hooks/useProfile";
import { format, parseISO } from "date-fns";
import { HistoricoModal } from "@/components/admin/funil/HistoricoModal";
import { Lead } from "@/types/funil";

const STATUS_FECHADOS = ["venda_fechada", "fechado"];

export default function Leads() {
  const { leads, loading, setLeads } = useFunil();
  const { profile } = useProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [viewingFichaLead, setViewingFichaLead] = useState<any>(null);

  const filtered = leads.filter(l => {
    const nomeSearch = (l.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusMatch = statusFilter === "todos";
    if (!statusMatch) {
      if (statusFilter === "novo") {
        statusMatch = ["novo", "novo_lead"].includes(l.status || "");
      } else if (statusFilter === "venda_fechada") {
        statusMatch = ["venda_fechada", "fechado"].includes(l.status || "");
      } else if (statusFilter === "contatado") {
        statusMatch = ["contatado", "primeiro_contato"].includes(l.status || "");
      } else {
        statusMatch = l.status === statusFilter;
      }
    }
    
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

  const refetchLeads = useCallback(async () => {
    if (!profile?.organizacao_id) return;
    const { data } = await (supabase as any)
      .from("leads")
      .select("*")
      .eq("organizacao_id", profile.organizacao_id)
      .order("created_at", { ascending: false });
    if (data) {
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
      const isClosedStatus = ["venda_fechada", "fechado"].includes(formData.status);
      
      const updatePayload: any = {
        nome: formData.nome,
        email: formData.email || null,
        celular: formData.celular,
        cidade: formData.cidade || null,
        tipo_consorcio: formData.tipo_consorcio,
        valor_credito: Number(formData.valor_credito) || 0,
        prazo_meses: Number(formData.prazo_meses) || 0,
        status: formData.status,
        status_updated_at: formData.status_updated_at 
          ? (formData.status_updated_at.includes('T') ? formData.status_updated_at : `${formData.status_updated_at}T12:00:00Z`) 
          : (isClosedStatus ? (editingLead?.status_updated_at || new Date().toISOString()) : null),
        lead_temperatura: formData.lead_temperatura || "morno",
        lead_score_valor: formData.lead_score_valor || "medio",
        administradora: formData.administradora === "none" ? null : (formData.administradora || null),
        indicador_nome: formatToUpper(formData.indicador_nome),
        indicador_celular: formData.indicador_celular || null,
        grupo: formatToFourDigits(formData.grupo),
        cota: formatToFourDigits(formData.cota),
        dados_cadastro: formData.dados_cadastro || null,
      };
      
      updatePayload.nome = formatToUpper(updatePayload.nome);

      if (editingLead) {
        if (isClosedStatus && !["venda_fechada", "fechado"].includes(editingLead.status)) {
          updatePayload.status_updated_at = new Date().toISOString();
        }
        const { error } = await supabase
          .from("leads")
          .update(updatePayload)
          .eq("id", editingLead.id);
        if (error) throw new Error(error.message || "Erro ao atualizar lead");

        setLeads((prev) =>
          prev.map((l) => (l.id === editingLead.id ? { ...l, ...updatePayload } : l))
        );

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
                administradora: formatToUpper(updatePayload.administradora),
                grupo: formatToFourDigits(updatePayload.grupo),
                cota: formatToFourDigits(updatePayload.cota),
              }).eq("lead_id", editingLead.id);
            } else if (isClosedStatus) {
              await (supabase as any).from("carteira").insert([{
                lead_id: editingLead.id,
                nome: updatePayload.nome,
                celular: updatePayload.celular,
                tipo_consorcio: updatePayload.tipo_consorcio,
                valor_credito: updatePayload.valor_credito,
                administradora: formatToUpper(updatePayload.administradora),
                grupo: formatToFourDigits(updatePayload.grupo),
                cota: formatToFourDigits(updatePayload.cota),
                status: "aguardando",
                data_adesao: updatePayload.status_updated_at ? updatePayload.status_updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
                organizacao_id: editingLead.organizacao_id || profile?.organizacao_id,
              }]);
            }
          } catch (carteiraErr) {
            console.warn("[carteira sync] Aviso:", carteiraErr);
          }
        })();

        toast.success("Lead atualizado com sucesso!");
      } else {
        const insertPayload = { ...updatePayload, organizacao_id: profile?.organizacao_id };
        const { data: newLeads, error } = await supabase.from("leads").insert([insertPayload]).select();
        if (error) throw new Error(error.message || "Erro ao criar lead");

        if (isClosedStatus && newLeads && newLeads.length > 0) {
          const nl = newLeads[0];
          await (supabase as any).from("carteira").insert([{
            lead_id: nl.id,
            nome: nl.nome,
            celular: nl.celular,
            tipo_consorcio: nl.tipo_consorcio,
            valor_credito: nl.valor_credito,
            administradora: formatToUpper(nl.administradora),
            grupo: formatToFourDigits(nl.grupo),
            cota: formatToFourDigits(nl.cota),
            status: "aguardando",
            data_adesao: nl.status_updated_at ? nl.status_updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            organizacao_id: nl.organizacao_id || profile?.organizacao_id,
          }]);
        }

        toast.success("Lead criado com sucesso!");
        await refetchLeads();
      }

      setIsDialogOpen(false);
      setEditingLead(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar lead");
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
                    <td className="px-4 py-3">
                      <div 
                        className="flex flex-col gap-0.5 cursor-pointer group/name"
                        onClick={() => { setEditingLead(l); setIsDialogOpen(true); }}
                      >
                        <span className="font-black text-slate-900 group-hover/name:text-primary transition-colors underline-offset-4 group-hover/name:underline decoration-primary/30">{l.nome || "Lead Sem Nome"}</span>
                        <span className="text-[10px] text-slate-400">{l.celular || "Sem telefone"}</span>
                        {l.cidade && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <MapPin className="h-2.5 w-2.5" />
                            {l.cidade}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                      {l.tipo_consorcio || "Indefinido"}
                    </td>

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

                    <td className="px-4 py-3 font-black text-slate-700">
                      {formatLeadValue(Number(l.valor_credito || 0))}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingFichaLead(l); }}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${l.dados_cadastro ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-50 text-slate-300 hover:bg-slate-100"}`}
                          title="Ver Ficha Magalu"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                        </button>
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
                        <button
                          onClick={() => setHistoryLead(l as Lead)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                          title="Tratativas / Histórico"
                        >
                          <NotebookPen className="h-3.5 w-3.5" />
                        </button>
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

      <HistoricoModal 
        lead={historyLead}
        onClose={() => setHistoryLead(null)}
        allLeads={leads as Lead[]}
      />

      <Dialog open={!!viewingFichaLead} onOpenChange={(open) => !open && setViewingFichaLead(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-0">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <ClipboardList className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">{viewingFichaLead?.nome}</DialogTitle>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Ficha de Cadastro Completa</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID do Lead</p>
                  <p className="text-xs font-mono text-slate-300">#{viewingFichaLead?.id?.substring(0, 8)}</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-8">
            {!viewingFichaLead?.dados_cadastro ? (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <RefreshCw className="h-10 w-10 text-slate-200 animate-spin-slow" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Aguardando Dados</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Este lead ainda não preencheu os campos adicionais da ficha de cadastro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">💰 Consórcio</h4>
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Crédito Estimado</p>
                        <p className="text-lg font-black text-slate-900">{formatLeadValue(Number(viewingFichaLead.valor_credito || (viewingFichaLead.dados_cadastro as any).VALOR || (viewingFichaLead.dados_cadastro as any).VALOR_CREDITO) || 0)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Prazo Meses</p>
                          <p className="text-sm font-bold">{viewingFichaLead.prazo_meses || (viewingFichaLead.dados_cadastro as any).PRAZO || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Segmento</p>
                          <p className="text-sm font-bold uppercase">{viewingFichaLead.tipo_consorcio || (viewingFichaLead.dados_cadastro as any).SEGMENTO || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">👤 Dados Pessoais</h4>
                    <div className="space-y-3">
                       {[
                        { label: "CPF/CNPJ", keys: ["CPF", "CNPJ", "CPFCNPJ", "DOCUMENTO_PRINCIPAL"] },
                        { label: "Documento", keys: ["RG", "CNH", "DOCUMENTO_NUMERO", "NUMERO_DOCUMENTO"] },
                        { label: "Tipo Doc", keys: ["TIPO_DOCUMENTO", "DOC_TIPO", "TIPO_DOC"] },
                        { label: "Emissão", keys: ["DATA_EMISSAO", "EMISSAO", "DATAEMISSAO"] },
                        { label: "Órgão/UF", keys: ["ORGAO_EMISSOR", "ORGAO_UF", "EMISSOR", "ORGAO_EMISSOR_UF"] },
                        { label: "Nascimento", keys: ["NASCIMENTO", "DATANASCIMENTO", "DATA_NASCIMENTO"] },
                        { label: "Sexo", keys: ["SEXO"] },
                        { label: "Est. Civil", keys: ["ESTADO_CIVIL", "ESTADOCIVIL", "ESTADO_CIVIL_"] },
                        { label: "Nacionalidade", keys: ["NACIONALIDADE"] },
                        { label: "Naturalidade", keys: ["NATURALIDADE", "CIDADE_NATAL", "NATURALIDADE_UF"] },
                        { label: "Profissão", keys: ["PROFISSAO", "CARGO", "OCUPACAO"] },
                        { label: "Renda Mensal", keys: ["RENDA", "RENDA_MENSAL"] },
                      ].map((f) => (
                        <div key={f.label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</span>
                          <span className="text-xs font-black text-slate-900">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">👨‍👩‍👦 Filiação & Resp.</h4>
                    <div className="space-y-3">
                       {[
                        { label: "Nome da Mãe", keys: ["NOMEMAE", "MAE_NOME", "NOME_MAE"] },
                        { label: "Nome do Pai", keys: ["NOMEPAI", "PAI_NOME", "NOME_PAI"] },
                        { label: "Resp. Nome", keys: ["MAE_PAI_NOME", "CPFCONJUGE"] },
                        { label: "Resp. CPF", keys: ["MAE_PAI_CPF"] },
                        { label: "Resp. RG", keys: ["MAE_PAI_DOCUMENTO", "DOCUMENTO"] },
                      ].map((f) => (
                        <div key={f.label} className="flex flex-col py-1.5 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">🏢 Profissional & Residência</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Empresa", keys: ["EMPRESA", "LOCAL_TRABALHO"] },
                        { label: "Admissão", keys: ["ADMISSAO", "DATA_ADMISSAO"] },
                        { label: "Tipo Residência", keys: ["TIPO_RESIDENCIA", "TIPORESIDENCIA"] },
                        { label: "Tempo Res.", keys: ["TEMPO_RESIDENCIA", "TEMPORESIDENCIA"] },
                      ].map((f) => (
                        <div key={f.label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</span>
                          <span className="text-xs font-black text-slate-900">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">📱 Contato</h4>
                    <div className="space-y-4">
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-2">WhatsApp / Celular</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-emerald-800">{viewingFichaLead.celular || "—"}</p>
                          <WhatsAppIcon className="h-6 w-6 text-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">E-mail</span>
                          <span className="text-xs font-black text-slate-900 truncate">{viewingFichaLead.email || (viewingFichaLead.dados_cadastro as any).EMAIL || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">📍 Localização</h4>
                    <div className="space-y-3">
                      {[
                        { label: "CEP", keys: ["CEP"] },
                        { label: "Endereço", keys: ["LOGRADOURO", "RUA", "ENDERECO", "LOGRADOURO_", "LOCALIDADE"] },
                        { label: "Complemento", keys: ["COMPLEMENTO", "CPL", "LOGRADOURO_COMPLEMENTO"] },
                        { label: "Bairro", keys: ["BAIRRO"] },
                        { label: "Cidade", keys: ["CIDADE", "MUNICIPIO", "NOME_CIDADE"] },
                        { label: "Estado", keys: ["UF", "ESTADO"] },
                      ].map((f) => (
                        <div key={f.label} className="flex flex-col py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{f.label}</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || (f.label === "Cidade" ? viewingFichaLead.cidade : "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => { const l = viewingFichaLead; setViewingFichaLead(null); setEditingLead(l); setIsDialogOpen(true); }} className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest border-primary text-primary hover:bg-primary/5">Editar Ficha</Button>
            <Button onClick={() => setViewingFichaLead(null)} className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Fechar Ficha</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingLead(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl mb-6">
              {editingLead ? "Editar Lead" : "Novo Lead"}
            </DialogTitle>
          </DialogHeader>
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
              status_updated_at: editingLead.status_updated_at || "",
              dados_cadastro: editingLead.dados_cadastro || null,
            } : {
              nome: "", email: "", celular: "", cidade: "",
              tipo_consorcio: "imovel", valor_credito: "", prazo_meses: "",
              status: "novo_lead", lead_temperatura: "morno", lead_score_valor: "medio",
              administradora: "none", grupo: "", cota: "",
              status_updated_at: "",
            }}
            onSubmit={handleSaveLead}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
