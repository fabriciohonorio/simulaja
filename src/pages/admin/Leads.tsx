import { useState, useEffect } from "react";
import { useFunil } from "@/hooks/useFunil";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { 
  Filter, 
  Search, 
  MoreHorizontal, 
  MessageCircle, 
  UserPlus, 
  Trash2,
  Pencil,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadForm, LeadFormData } from "@/components/admin/LeadForm";
import { useProfile } from "@/hooks/useProfile";

export default function Leads() {
  const { leads, loading, refetch } = useFunil();
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
      refetch();
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  const handleSaveLead = async (formData: LeadFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        valor_credito: Number(formData.valor_credito),
        prazo_meses: Number(formData.prazo_meses),
        organizacao_id: profile?.organizacao_id,
      };

      if (editingLead) {
        const { error } = await supabase.from("leads").update(payload).eq("id", editingLead.id);
        if (error) throw error;
        toast.success("Lead atualizado");
      } else {
        const { error } = await supabase.from("leads").insert([payload]);
        if (error) throw error;
        toast.success("Lead criado com sucesso!");
      }
      setIsDialogOpen(false);
      setEditingLead(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = status || "novo";
    switch(s) {
      case 'venda_fechada': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Venda Fechada</Badge>;
      case 'negociacao': case 'em_negociacao': return <Badge className="bg-purple-500">Em Negociação</Badge>;
      case 'perdido': return <Badge variant="destructive">Perdido</Badge>;
      case 'proposta_enviada': return <Badge className="bg-blue-400">Proposta</Badge>;
      case 'contatado': return <Badge className="bg-amber-500">Contatado</Badge>;
      default: return <Badge variant="outline">{s.replace('_', ' ')}</Badge>;
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando leads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900">Operação Leads</h1>
        <Button 
          onClick={() => { setEditingLead(null); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Lead
        </Button>
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
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">{l.nome || "Lead Sem Nome"}</span>
                      <span className="text-[10px] text-slate-400">{l.celular || "Sem telefone"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                    {l.tipo_consorcio || "Indefinido"}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(l.status)}</td>
                  <td className="px-4 py-3 font-black text-slate-700">
                    {formatLeadValue(Number(l.valor_credito || 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
              ))}
            </tbody>
          </table>
        </div>
      </AdminHeroCard>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editingLead ? "Editar Lead" : "Novo Lead"}
            </DialogTitle>
          </DialogHeader>
          <LeadForm 
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
            } : {
              nome: "", email: "", celular: "", cidade: "",
              tipo_consorcio: "imovel", valor_credito: "", prazo_meses: "",
              status: "novo_lead", lead_temperatura: "morno", lead_score_valor: "medio",
              administradora: "none"
            }}
            onSubmit={handleSaveLead}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
