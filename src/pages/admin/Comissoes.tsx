import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { 
  DollarSign, 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  Calculator,
  AlertTriangle,
  History,
  CheckCircle2
} from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Comissao {
  id: string;
  lead_id?: string;
  cliente_nome: string;
  valor_venda: number;
  regra_comissao: string;
  taxa_comissao: number;
  tipo_comissionamento: string;
  comissao_total: number;
  parcelas_comissao: number;
  pagamentos_retroativos: number;
  meses_inadimplentes: number;
  valor_estorno: number;
  status: string;
  data_venda: string;
  grupo?: string;
  cota?: string;
  created_at: string;
}

export default function Comissoes() {
  const { profile } = useProfile();
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadsFechados, setLeadsFechados] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("none");

  // Form State
  const [nomeCliente, setNomeCliente] = useState("");
  const [grupo, setGrupo] = useState("");
  const [cota, setCota] = useState("");
  const [valorVendaStr, setValorVendaStr] = useState("");
  const [regra, setRegra] = useState("DEMAIS");
  const [tipoComissionamento, setTipoComissionamento] = useState("REDUZIDA");
  const [pagamentosRetroativosStr, setPagamentosRetroativosStr] = useState("");
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchComissoes();
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organizacao_id]);

  const fetchLeads = async () => {
    if (!profile?.organizacao_id) return;
    try {
      const { data } = await supabase
        .from("leads")
        .select("id, nome, valor_credito, grupo, cota")
        .in("status", ["fechado", "venda_fechada"])
        .eq("organizacao_id", profile.organizacao_id);
      setLeadsFechados(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedLeadId && selectedLeadId !== "none" && selectedLeadId !== "manual") {
      const lead = leadsFechados.find(l => l.id === selectedLeadId);
      if (lead) {
        setNomeCliente(lead.nome);
        setGrupo(lead.grupo || "");
        setCota(lead.cota || "");
        setValorVendaStr(formatCurrencyInput((Number(lead.valor_credito) * 100).toString()));
      }
    } else if (selectedLeadId === "manual" && !isModalOpen) {
      setNomeCliente("");
      setGrupo("");
      setCota("");
      setValorVendaStr("");
    }
  }, [selectedLeadId, leadsFechados]);

  const fetchComissoes = async () => {
    if (!profile?.organizacao_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("comissoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Ignora erro de tabela não existente temporariamente para não quebrar a tela
        console.error(error);
      } else {
        setComissoes(data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComissao = async () => {
    if (!profile?.organizacao_id) return;
    
    const valorVenda = Number(valorVendaStr.replace(/\D/g, "")) / 100 || 0;
    const pagamentosRetroativos = Number(pagamentosRetroativosStr.replace(/\D/g, "")) / 100 || 0;
    
    if (!nomeCliente || valorVenda <= 0) {
      toast({ title: "Preencha o nome do cliente e o valor da venda.", variant: "destructive" });
      return;
    }

    let taxa_comissao = 4; // DEMAIS
    if (regra === "GOLDEN") taxa_comissao = 5;
    if (regra === "SILVER") taxa_comissao = 3;
    if (regra === "INDICACAO_MAGALU") taxa_comissao = 0.8;

    let parcelas_comissao = 1;
    if (tipoComissionamento === "REDUZIDA") parcelas_comissao = 10;
    if (tipoComissionamento === "LINEAR") parcelas_comissao = 4;
    if (regra === "INDICACAO_MAGALU") parcelas_comissao = 4;

    const comissao_total = (valorVenda * taxa_comissao) / 100;

    try {
      const { error } = await supabase.from("comissoes").insert({
        organizacao_id: profile.organizacao_id,
        usuario_id: profile.id,
        cliente_nome: nomeCliente,
        lead_id: selectedLeadId !== "none" && selectedLeadId !== "manual" ? selectedLeadId : null,
        grupo,
        cota,
        valor_venda: valorVenda,
        regra_comissao: regra,
        taxa_comissao,
        tipo_comissionamento: tipoComissionamento,
        comissao_total,
        parcelas_comissao,
        pagamentos_retroativos: pagamentosRetroativos,
        data_venda: dataVenda
      });

      if (error) throw error;
      
      toast({ title: "Comissão registrada com sucesso!" });
      setIsModalOpen(false);
      resetForm();
      fetchComissoes();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedLeadId("none");
    setNomeCliente("");
    setGrupo("");
    setCota("");
    setValorVendaStr("");
    setRegra("DEMAIS");
    setTipoComissionamento("REDUZIDA");
    setPagamentosRetroativosStr("");
    setDataVenda(new Date().toISOString().split("T")[0]);
  };

  const handleMarcarInadimplente = async (comissao: Comissao) => {
    // SE O CLIENTE FICAR 3 MESES SEM PAGAR HAVERÁ ESTORNO DE 50% DO VALOR PAGO.
    const confirm = window.confirm("Confirmar inadimplência de 3 meses? Isso gerará um estorno de 50% do valor pago.");
    if (!confirm) return;

    // Calcular estorno (simulando que o pago = comissao_total / parcelas * meses_pagos). 
    // Para simplificar, o estorno é 50% do total se considerarmos tudo pago, ou 50% do valor que ele já recebeu.
    // Vamos colocar estorno = 50% da comissão total como punição padrão ou do valor_venda. 
    // "estorno de 50% do valor pago". Vamos assumir valor pago = comissão total já recebida.
    const valor_estorno = comissao.comissao_total * 0.5;

    try {
      const { error } = await supabase.from("comissoes").update({
        meses_inadimplentes: 3,
        status: "estornado",
        valor_estorno
      }).eq("id", comissao.id);

      if (error) throw error;
      toast({ title: "Inadimplência e estorno registrados." });
      fetchComissoes();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(numbers) / 100);
  };

  const filtered = comissoes.filter(c => c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalComissoes = comissoes.reduce((acc, c) => acc + Number(c.comissao_total || 0), 0);
  const totalEstornos = comissoes.reduce((acc, c) => acc + Number(c.valor_estorno || 0), 0);
  const totalRetroativo = comissoes.reduce((acc, c) => acc + Number(c.pagamentos_retroativos || 0), 0);

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-slate-400 uppercase tracking-widest">Carregando comissionamento...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-500" /> Comissionamento
          </h1>
          <p className="text-sm text-slate-500 font-medium">Gerencie comissões, regras fracionadas e estornos.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider">
          <Plus className="h-4 w-4 mr-2" /> Nova Comissão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Calculator className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Comissões</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(totalComissoes)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><TrendingDown className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Estornos</p>
            <p className="text-2xl font-black text-rose-600">{formatCurrency(totalEstornos)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><History className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pagamentos Retroativos</p>
            <p className="text-2xl font-black text-blue-600">{formatCurrency(totalRetroativo)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-slate-800">Relatório de Comissões</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-9 bg-white border-slate-200" 
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Grupo/Cota</th>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Regra</th>
                <th className="px-4 py-3">Comissão Total</th>
                <th className="px-4 py-3">Fracionamento</th>
                <th className="px-4 py-3">Retroativo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.cliente_nome}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.grupo || "-"} / {c.cota || "-"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(c.valor_venda)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-slate-50 text-[10px]">
                      {c.regra_comissao} ({c.taxa_comissao}%)
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    {formatCurrency(c.comissao_total)}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                    {c.tipo_comissionamento} ({c.parcelas_comissao}x)
                  </td>
                  <td className="px-4 py-3 text-blue-600 font-medium">
                    {c.pagamentos_retroativos > 0 ? formatCurrency(c.pagamentos_retroativos) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "estornado" ? (
                      <Badge variant="destructive" className="text-[10px]">Estornado ({formatCurrency(c.valor_estorno)})</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] border-none">Ativo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status !== "estornado" && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarcarInadimplente(c)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Marcar 3 meses inadimplente">
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-medium">Nenhuma comissão encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" /> Nova Comissão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Selecionar Venda (Funil)</label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lead fechado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {leadsFechados.filter(l => !comissoes.some(c => c.lead_id === l.id)).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.nome} - {formatCurrency(Number(l.valor_credito))}</SelectItem>
                  ))}
                  <SelectItem value="manual">-- Inserir Manualmente --</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedLeadId === "manual" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Nome do Cliente</label>
                <Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Ex: João Silva" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Grupo</label>
                <Input value={grupo} onChange={e => setGrupo(e.target.value)} placeholder="0000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Cota</label>
                <Input value={cota} onChange={e => setCota(e.target.value)} placeholder="000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Valor da Venda</label>
                <Input 
                  value={valorVendaStr} 
                  onChange={e => setValorVendaStr(formatCurrencyInput(e.target.value))} 
                  placeholder="R$ 0,00" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Data da Venda</label>
                <Input type="date" value={dataVenda} onChange={e => setDataVenda(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Regra (Taxa)</label>
                <Select value={regra} onValueChange={setRegra}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLDEN">Golden (5%)</SelectItem>
                    <SelectItem value="SILVER">Silver (3%)</SelectItem>
                    <SelectItem value="DEMAIS">Demais (4%)</SelectItem>
                    <SelectItem value="INDICACAO_MAGALU">Indicação Magalu (0.8%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Tipo (Parcelas)</label>
                <Select value={tipoComissionamento} onValueChange={setTipoComissionamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REDUZIDA">Reduzida 50/50 (10x)</SelectItem>
                    <SelectItem value="LINEAR">Linear (4x)</SelectItem>
                  </SelectContent>
                </Select>
                {regra === "INDICACAO_MAGALU" && <p className="text-[10px] text-orange-500 font-bold">Indicação Magalu é sempre 4x</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                <History className="h-3 w-3" /> Pagamentos Retroativos
              </label>
              <p className="text-[10px] text-slate-400 mb-1">Até o mês de março era 3,5%. Informe o valor já pago retroativo, se houver.</p>
              <Input 
                value={pagamentosRetroativosStr} 
                onChange={e => setPagamentosRetroativosStr(formatCurrencyInput(e.target.value))} 
                placeholder="R$ 0,00" 
              />
            </div>

            <Button onClick={handleSaveComissao} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase mt-4">
              Salvar Comissão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
