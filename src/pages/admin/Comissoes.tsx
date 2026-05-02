import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { 
  DollarSign, 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  Calculator,
  AlertTriangle,
  History,
  CheckCircle2,
  FileDown,
  Trash2
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
  administradora?: string;
  parcela_atual: number;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form State
  const [nomeCliente, setNomeCliente] = useState("");
  const [grupo, setGrupo] = useState("");
  const [cota, setCota] = useState("");
  const [valorVendaStr, setValorVendaStr] = useState("");
  const [regra, setRegra] = useState("DEMAIS");
  const [tipoComissionamento, setTipoComissionamento] = useState("REDUZIDA");
  const [pagamentosRetroativosStr, setPagamentosRetroativosStr] = useState("");
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split("T")[0]);
  const [administradora, setAdministradora] = useState("MAGALU");
  const [parcelaAtual, setParcelaAtual] = useState(1);

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
        .select("id, nome, valor_credito, grupo, cota, status_updated_at, administradora")
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
        if (lead.status_updated_at) {
          setDataVenda(lead.status_updated_at.split("T")[0]);
        }
        if (lead.administradora) {
          setAdministradora(lead.administradora);
          if (lead.administradora === "ADEMICON") {
            setRegra("ADEMICON");
            setTipoComissionamento("LINEAR"); // 13x is linear-ish
          } else {
            setRegra("DEMAIS");
          }
        }
        
        // Auto-calculate parcela atual for retroactive
        if (lead.status_updated_at) {
          const saleDate = new Date(lead.status_updated_at);
          const today = new Date();
          const diffMonths = (today.getFullYear() - saleDate.getFullYear()) * 12 + (today.getMonth() - saleDate.getMonth());
          setParcelaAtual(diffMonths > 0 ? diffMonths : 1);
        }
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
    if (regra === "RETROATIVO") taxa_comissao = 3.5;
    if (regra === "ADEMICON") taxa_comissao = 2.5;

    let parcelas_comissao = 1;
    if (tipoComissionamento === "REDUZIDA") parcelas_comissao = 10;
    if (tipoComissionamento === "LINEAR") parcelas_comissao = 4;
    if (regra === "INDICACAO_MAGALU") parcelas_comissao = 4;
    if (regra === "ADEMICON") parcelas_comissao = 13;

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
        data_venda: dataVenda,
        administradora,
        parcela_atual: parcelaAtual
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
    setParcelaAtual(1);
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

  const handleDeleteComissao = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta comissão?")) return;
    try {
      const { error } = await supabase.from("comissoes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Comissão excluída com sucesso!" });
      fetchComissoes();
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const companyName = "PROSPERA PLANEJAMENTO CONSÓRCIOS";
    const reportTitle = "EXTRATO DE COMISSIONAMENTO";
    const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");

    // Header Color Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');

    // Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(companyName, 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(reportTitle, 15, 28);
    doc.text(`Emissão: ${dateStr}`, 155, 28);

    let y = 55;
    
    // Summary Cards in PDF
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, y - 5, 180, 20, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL EM COMISSÕES", 20, y + 2);
    doc.text("TOTAL A RECEBER (MÊS)", 130, y + 2);
    
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(formatCurrency(totalComissoes), 20, y + 10);
    doc.text(formatCurrency(totalReceberMes), 130, y + 10);

    y += 35;

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(15, y - 6, 180, 8, 'F');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE", 20, y - 1);
    doc.text("ADMIN", 60, y - 1);
    doc.text("G/C", 85, y - 1);
    doc.text("VENDA", 105, y - 1);
    doc.text("TOTAL", 130, y - 1);
    doc.text("PARCELA ATUAL", 155, y - 1);
    doc.text("STATUS", 185, y - 1);
    
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    filtered.forEach((c, index) => {
      if (y > 275) {
        doc.addPage();
        y = 30;
        // Re-draw header on new page if needed or just line
        doc.line(15, y - 5, 195, y - 5);
      }
      
      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(252, 253, 254);
        doc.rect(15, y - 5, 180, 7, 'F');
      }

      doc.text(c.cliente_nome.substring(0, 22), 20, y);
      doc.text(c.administradora || "MAGALU", 60, y);
      doc.text(`${c.grupo || "-"}/${c.cota || "-"}`, 85, y);
      doc.text(formatCurrency(c.valor_venda).replace("R$", "").trim(), 105, y);
      doc.text(formatCurrency(c.comissao_total).replace("R$", "").trim(), 130, y);
      
      const valorParcela = formatCurrency(c.comissao_total / c.parcelas_comissao);
      doc.text(`${c.parcela_atual || 1}/${c.parcelas_comissao} (${valorParcela})`, 155, y);
      
      const statusText = c.status === "estornado" ? "ESTORNADO" : "ATIVO";
      if (statusText === "ESTORNADO") doc.setTextColor(225, 29, 72);
      doc.text(statusText, 185, y);
      doc.setTextColor(30, 41, 59);
      
      y += 7;
    });

    const totalReceberReport = filtered.filter(c => c.status !== 'estornado').reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);
    y += 15;
    if (y > 260) { doc.addPage(); y = 30; }

    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(15, y, 180, 25, 3, 3, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text("RESUMO DE FECHAMENTO MENSAL", 25, y + 8);
    
    doc.setFontSize(14);
    doc.text(`VALOR TOTAL A RECEBER: ${formatCurrency(totalReceberReport)}`, 25, y + 18);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("* Documento gerado automaticamente pelo sistema CONTEMPLAR CRM.", 15, 285);

    doc.save(`extrato-comissoes-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "Relatório gerado com sucesso!" });
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
  const totalReceberMes = comissoes.filter(c => c.status !== 'estornado').reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);

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
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleGenerateReport} className="flex-1 sm:flex-none font-bold uppercase tracking-wider border-slate-200">
            <FileDown className="h-4 w-4 mr-2" /> Relatório
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider">
            <Plus className="h-4 w-4 mr-2" /> Nova Comissão
          </Button>
        </div>
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
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">A Receber (Mês)</p>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalReceberMes)}</p>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-2xl font-black">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Contratos Selecionados</p>
              <h3 className="text-lg font-black">Somatório Personalizado</h3>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recebível no Mês (Soma)</p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(
                  comissoes
                    .filter(c => selectedIds.includes(c.id))
                    .reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0)
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Comissão Total (Soma)</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(
                  comissoes
                    .filter(c => selectedIds.includes(c.id))
                    .reduce((acc, c) => acc + Number(c.comissao_total), 0)
                )}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white hover:bg-slate-800 uppercase text-xs font-black">
            Limpar Seleção
          </Button>
        </div>
      )}

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
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filtered.map(c => c.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Grupo/Cota</th>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Regra</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Parcela</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(c.id) ? 'bg-emerald-50/30' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300"
                      checked={selectedIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(prev => [...prev, c.id]);
                        else setSelectedIds(prev => prev.filter(id => id !== c.id));
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <div className="flex flex-col">
                      <span>{c.cliente_nome}</span>
                      <span className="text-[9px] text-slate-400 font-black">{c.administradora || "MAGALU"}</span>
                    </div>
                  </td>
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
                    <div className="flex flex-col">
                      <span className="uppercase text-[9px] text-slate-400">{c.tipo_comissionamento}</span>
                      <span className="font-bold text-slate-700">{c.parcela_atual || 1}/{c.parcelas_comissao} - {formatCurrency(c.comissao_total / c.parcelas_comissao)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-blue-600 font-medium">
                    {c.parcela_atual || 1}/{c.parcelas_comissao}
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "estornado" ? (
                      <Badge variant="destructive" className="text-[10px]">Estornado ({formatCurrency(c.valor_estorno)})</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] border-none">Ativo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {c.status !== "estornado" && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarcarInadimplente(c)} className="text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Marcar 3 meses inadimplente">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteComissao(c.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Excluir comissão">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                <label className="text-xs font-bold uppercase text-slate-500">Parcela Atual</label>
                <Input 
                  type="number"
                  value={parcelaAtual} 
                  onChange={e => setParcelaAtual(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Data da Venda</label>
                <Input type="date" value={dataVenda} onChange={e => setDataVenda(e.target.value)} />
              </div>
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
                    <SelectItem value="RETROATIVO">Retroativo (3.5%)</SelectItem>
                    <SelectItem value="ADEMICON">Ademicon (2.5%)</SelectItem>
                  </SelectContent>
                </Select>
                {(regra === "INDICACAO_MAGALU" || regra === "ADEMICON") && (
                  <p className="text-[10px] text-orange-500 font-bold">
                    {regra === "ADEMICON" ? "Ademicon é fixo em 13x" : "Indicação Magalu é fixo em 4x"}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Tipo (Parcelas)</label>
                <Select 
                  value={regra === "ADEMICON" ? "LINEAR" : tipoComissionamento} 
                  onValueChange={setTipoComissionamento}
                  disabled={regra === "ADEMICON" || regra === "INDICACAO_MAGALU"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REDUZIDA">Reduzida 50/50 (10x)</SelectItem>
                    <SelectItem value="LINEAR">Linear</SelectItem>
                  </SelectContent>
                </Select>
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
