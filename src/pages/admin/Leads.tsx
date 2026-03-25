import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Mail, Phone, MapPin, Calendar, Clock, ChevronRight, User, DollarSign, MessageCircle, MoreHorizontal, UserCheck, UserPlus, ShieldCheck, HeartPulse, Zap, Download, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Lead {
  id: string;
  nome: string;
  email: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number;
  prazo_meses: number;
  status: string | null;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  responsavel_id?: string | null;
}

interface Membro {
  id: string;
  nome_completo: string;
}

const TEMP_EMOJIS: Record<string, string> = {
  quente: "🔥",
  morno: "🌤",
  frio: "❄️",
  morto: "☠️",
};

const SCORE_LABELS: Record<string, string> = {
  premium: "🔥 Lead Premium",
  alto: "🚀 Lead Alto",
  medio: "⚡ Lead Médio",
  baixo: "🧊 Lead Baixo",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "novo_lead", label: "Novo Lead" },
  { value: "novo", label: "Novo (Antigo)" },
  { value: "contatado", label: "Contatado" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "em_negociacao", label: "Em Negociação" },
  { value: "fechado", label: "Fechado" },
];

const TIPO_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "imovel", label: "Imóvel" },
  { value: "veiculo", label: "Veículo" },
  { value: "moto", label: "Moto" },
  { value: "pesados", label: "Pesados" },
  { value: "agricolas", label: "Agrícolas" },
  { value: "investimento", label: "Investimento" },
];

const TEMPERATURA_OPTIONS = [
  { value: "quente", label: "🔥 Quente" },
  { value: "morno", label: "🌤 Morno" },
  { value: "frio", label: "❄️ Frio" },
  { value: "morto", label: "☠️ Morto" },
];

const SCORE_OPTIONS = [
  { value: "premium", label: "🔥 Premium" },
  { value: "alto", label: "🚀 Alto" },
  { value: "medio", label: "⚡ Médio" },
  { value: "baixo", label: "🧊 Baixo" },
];

const openWhatsApp = (lead: Lead) => {
  const msg = encodeURIComponent(
    `Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de ${formatCurrency(Number(lead.valor_credito))}, gostaria de conversar com você.`
  );
  const phone = lead.celular.replace(/\D/g, "");
  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
};

const EMPTY_LEAD_FORM = {
  nome: "", email: "", celular: "", cidade: "", tipo_consorcio: "imovel",
  valor_credito: "", prazo_meses: "120", status: "novo_lead",
  lead_temperatura: "quente", lead_score_valor: "medio",
};

export default function Leads() {
  const { profile, isManager } = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [cidadeFilter, setCidadeFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Lead>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // New Lead dialog
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLead, setNewLead] = useState(EMPTY_LEAD_FORM);

  // Edit Lead dialog
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_LEAD_FORM);

  // Delete confirmation
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchLeads();
    if (isManager && profile.organizacao_id) {
      (supabase.from("perfis" as any) as any)
        .select("id, nome_completo")
        .eq("organizacao_id", profile.organizacao_id)
        .then(({ data }: any) => setMembros(data || []));
    }
  }, [profile]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  };

  const assignLead = async (leadId: string, responsavelId: string) => {
    const val = responsavelId === "none" ? null : responsavelId;
    await supabase.from("leads").update({ responsavel_id: val } as any).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, responsavel_id: val } : l));
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    const leadToInsert = {
      nome: newLead.nome,
      email: newLead.email || null,
      celular: newLead.celular,
      cidade: newLead.cidade,
      tipo_consorcio: newLead.tipo_consorcio,
      valor_credito: Number(newLead.valor_credito) || 0,
      prazo_meses: Number(newLead.prazo_meses) || 120,
      status: newLead.status,
      lead_temperatura: newLead.lead_temperatura,
      lead_score_valor: newLead.lead_score_valor,
      responsavel_id: profile.id,
      organizacao_id: profile.organizacao_id,
    };
    const { data, error } = await supabase.from("leads").insert([leadToInsert]).select();
    if (!error && data && data.length > 0) {
      setLeads(prev => [data[0] as Lead, ...prev]);
      setIsNewLeadOpen(false);
      setNewLead(EMPTY_LEAD_FORM);
    }
    setIsSubmitting(false);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      nome: lead.nome || "",
      email: lead.email || "",
      celular: lead.celular || "",
      cidade: lead.cidade || "",
      tipo_consorcio: lead.tipo_consorcio || "imovel",
      valor_credito: String(lead.valor_credito || ""),
      prazo_meses: String(lead.prazo_meses || "120"),
      status: lead.status || "novo_lead",
      lead_temperatura: lead.lead_temperatura || "quente",
      lead_score_valor: lead.lead_score_valor || "medio",
    });
    setIsEditOpen(true);
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setIsEditSubmitting(true);
    const updates = {
      nome: editForm.nome,
      email: editForm.email || null,
      celular: editForm.celular,
      cidade: editForm.cidade,
      tipo_consorcio: editForm.tipo_consorcio,
      valor_credito: Number(editForm.valor_credito) || 0,
      prazo_meses: Number(editForm.prazo_meses) || 120,
      status: editForm.status,
      lead_temperatura: editForm.lead_temperatura,
      lead_score_valor: editForm.lead_score_valor,
    };
    const { error } = await supabase.from("leads").update(updates as any).eq("id", editingLead.id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...updates } : l));
      setIsEditOpen(false);
      setEditingLead(null);
    }
    setIsEditSubmitting(false);
  };

  const openDelete = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    const { error } = await supabase.from("leads").delete().eq("id", deletingLead.id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== deletingLead.id));
      setIsDeleteOpen(false);
      setDeletingLead(null);
    }
    setIsDeleting(false);
  };

  const toggleSort = (key: keyof Lead) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...leads];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.nome.toLowerCase().includes(s) ||
          (l.email || "").toLowerCase().includes(s) ||
          l.celular.includes(s)
      );
    }
    if (statusFilter !== "all") result = result.filter((l) => {
      const s = l.status ?? "novo_lead";
      if (statusFilter === "novo_lead" || statusFilter === "novo") {
        return s === "novo_lead" || s === "novo";
      }
      return s === statusFilter;
    });
    if (tipoFilter !== "all") result = result.filter((l) => l.tipo_consorcio === tipoFilter);
    if (cidadeFilter) result = result.filter((l) => l.cidade?.toLowerCase().includes(cidadeFilter.toLowerCase()) ?? false);

    result.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, statusFilter, tipoFilter, cidadeFilter, sortKey, sortDir]);

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Celular", "Cidade", "Tipo", "Valor Crédito", "Prazo", "Status", "Score", "Temp", "Data"];
    const rows = filtered.map((l) => [
      l.nome, l.email, l.celular, l.cidade, l.tipo_consorcio,
      l.valor_credito, l.prazo_meses, l.status ?? "novo",
      l.lead_score_valor ?? "baixo", l.lead_temperatura ?? "quente",
      l.created_at?.slice(0, 10) ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  const SortHeader = ({ label, field }: { label: string; field: keyof Lead }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  );

  // Shared form fields for new/edit
  const LeadFormFields = ({
    form,
    setForm,
  }: {
    form: typeof EMPTY_LEAD_FORM;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_LEAD_FORM>>;
  }) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input id="nome" required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: João Silva" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="celular">Celular</Label>
          <Input id="celular" required value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} placeholder="Ex: (11) 99999-9999" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Ex: joao@email.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Ex: São Paulo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={form.tipo_consorcio} onValueChange={(val) => setForm(f => ({ ...f, tipo_consorcio: val }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPO_OPTIONS.filter(o => o.value !== 'all').map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor Crédito (R$)</Label>
          <Input id="valor" type="number" value={form.valor_credito} onChange={e => setForm(f => ({ ...f, valor_credito: e.target.value }))} placeholder="Ex: 150000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prazo">Prazo (meses)</Label>
          <Input id="prazo" type="number" value={form.prazo_meses} onChange={e => setForm(f => ({ ...f, prazo_meses: e.target.value }))} placeholder="Ex: 120" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(val) => setForm(f => ({ ...f, status: val }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Temperatura</Label>
          <Select value={form.lead_temperatura} onValueChange={(val) => setForm(f => ({ ...f, lead_temperatura: val }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEMPERATURA_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Score</Label>
          <Select value={form.lead_score_valor} onValueChange={(val) => setForm(f => ({ ...f, lead_score_valor: val }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCORE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leads</h1>
        <div className="flex items-center gap-2">

          {/* Novo Lead — icon only (tooltip on hover) */}
          <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="shrink-0 bg-primary hover:bg-primary/90 text-white h-9 w-9"
                title="Novo Lead"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLead}>
                <LeadFormFields form={newLead} setForm={setNewLead as any} />
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewLeadOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Lead"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Export CSV — icon only */}
          <Button onClick={exportCSV} variant="outline" size="icon" className="shrink-0 h-9 w-9" title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          placeholder="Buscar nome, email, telefone..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIPO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filtrar cidade..."
          value={cidadeFilter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCidadeFilter(e.target.value)}
        />
      </div>

      {/* Lead List */}
      <div className="rounded-lg border border-border bg-card">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <SortHeader label="Nome" field="nome" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Celular</th>
                <SortHeader label="Cidade" field="cidade" />
                <SortHeader label="Valor" field="valor_credito" />
                <SortHeader label="Score" field="lead_score_valor" />
                <SortHeader label="Temp" field="lead_temperatura" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Data" field="created_at" />
                {isManager && <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Responsável</th>}
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground">
                <td className="px-3 py-1">{filtered.length} leads</td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1">{formatCurrency(filtered.reduce((s, l) => s + Number(l.valor_credito || 0), 0))}</td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                {isManager && <td className="px-3 py-1"></td>}
                <td className="px-3 py-1"></td>
              </tr>
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{l.nome}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{l.celular}</td>
                  <td className="px-3 py-2">{l.cidade || "N/Inf"}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{formatCurrency(Number(l.valor_credito))}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-[10px] font-bold uppercase">{SCORE_LABELS[l.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-[10px] font-bold uppercase">{TEMP_EMOJIS[l.lead_temperatura || "quente"] || "🔥"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary capitalize">
                      {(l.status ?? "novo").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{l.created_at?.slice(0, 10)}</td>
                  {isManager && (
                    <td className="px-3 py-2">
                      <Select
                        value={l.responsavel_id || "none"}
                        onValueChange={(val) => assignLead(l.id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-36 rounded-lg">
                          <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem responsável</SelectItem>
                          {membros.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {/* WhatsApp */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="WhatsApp"
                        onClick={() => openWhatsApp(l)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {/* Editar */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Editar lead"
                        onClick={() => openEdit(l)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Excluir */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir lead"
                        onClick={() => openDelete(l)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {filtered.map((l) => (
            <div key={l.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{l.nome}</h3>
                  <p className="text-xs text-muted-foreground">{l.cidade}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize shrink-0">
                  {(l.status ?? "novo").replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Score / Temp</p>
                  <p className="font-bold text-[10px] mt-1">
                    {SCORE_LABELS[l.lead_score_valor || "baixo"] || "🧊 Lead Baixo"} <br />
                    {TEMP_EMOJIS[l.lead_temperatura || "quente"] || "🔥"} {l.lead_temperatura === 'quente' ? 'Quente' : l.lead_temperatura === 'morno' ? 'Morno' : l.lead_temperatura === 'frio' ? 'Frio' : 'Morto'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Valor</p>
                  <p className="font-bold text-primary">{formatCurrency(Number(l.valor_credito))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Celular</p>
                  <p className="font-medium">{l.celular}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Tipo / Prazo</p>
                  <p className="capitalize font-medium">{l.tipo_consorcio} · {l.prazo_meses}m</p>
                </div>
              </div>

              {isManager && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-black">Responsável</p>
                  <Select
                    value={l.responsavel_id || "none"}
                    onValueChange={(val) => assignLead(l.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full rounded-lg">
                      <SelectValue placeholder="Sem responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem responsável</SelectItem>
                      {membros.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mobile action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-green-600 border-green-200 hover:bg-green-50 gap-2"
                  onClick={() => openWhatsApp(l)}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-9 w-9"
                  title="Editar"
                  onClick={() => openEdit(l)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 h-9 w-9"
                  title="Excluir"
                  onClick={() => openDelete(l)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">Nenhum lead encontrado.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} leads encontrados</p>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditLead}>
            <LeadFormFields form={editForm} setForm={setEditForm as any} />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isEditSubmitting}>{isEditSubmitting ? "Salvando..." : "Salvar Alterações"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o lead <strong className="text-foreground">{deletingLead?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteLead}
            >
              {isDeleting ? "Excluindo..." : "Excluir Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
