import { useState, useEffect, useMemo } from "react";
import { Lead } from "@/types";
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
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Coins,
  BarChart3
} from "lucide-react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, BarChart } from "recharts";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  const [inadimplentes, setInadimplentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadsFechados, setLeadsFechados] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("none");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingComissao, setEditingComissao] = useState<Comissao | null>(null);
  const [showValues, setShowValues] = useState(false);
  const [fechamentos, setFechamentos] = useState<any[]>([]);
  const [isSavingPagamento, setIsSavingPagamento] = useState(false);

  const maskValue = (value: number) => showValues ? formatCurrency(value) : "R$ ••••••";

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

  const fetchFechamentos = async () => {
    if (!profile?.organizacao_id) return;
    const { data } = await supabase
      .from("fechamentos_mensais")
      .select("*")
      .eq("organizacao_id", profile.organizacao_id)
      .order("ano", { ascending: false })
      .order("mes", { ascending: false });
    setFechamentos(data || []);
  };

  useEffect(() => {
    fetchFechamentos();
  }, [profile?.organizacao_id]);

  const fetchInadimplentes = async () => {
    const { data } = await supabase.from("inadimplentes").select("lead_id, status");
    setInadimplentes(data || []);
  };

  useEffect(() => {
    fetchInadimplentes();
  }, []);

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
    const payload = {
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
    };

    try {
      let error;
      if (editingComissao) {
        const { error: err } = await supabase.from("comissoes").update(payload).eq("id", editingComissao.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("comissoes").insert(payload);
        error = err;
      }

      if (error) throw error;
      
      toast({ title: editingComissao ? "Comissão atualizada!" : "Comissão registrada!" });
      setIsModalOpen(false);
      resetForm();
      fetchComissoes();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingComissao(null);
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
    setAdministradora("MAGALU");
  };

  const handleEditComissao = (c: Comissao) => {
    setEditingComissao(c);
    setSelectedLeadId(c.lead_id || "manual");
    setNomeCliente(c.cliente_nome);
    setGrupo(c.grupo || "");
    setCota(c.cota || "");
    setValorVendaStr(formatCurrencyInput((Number(c.valor_venda) * 100).toString()));
    setRegra(c.regra_comissao);
    setTipoComissionamento(c.tipo_comissionamento);
    setPagamentosRetroativosStr(formatCurrencyInput((Number(c.pagamentos_retroativos) * 100).toString()));
    setDataVenda(c.data_venda);
    setParcelaAtual(c.parcela_atual || 1);
    setAdministradora(c.administradora || "MAGALU");
    setIsModalOpen(true);
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
    } catch (e) {
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
    } catch (e) {
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
    doc.setFont("helvetica", "bold");
    doc.text("REFERENCIA MAIO/2026", 15, 34);
    doc.text(`Emissão: ${dateStr}`, 155, 28);

    let y = 55;
    
    const listToPrint = selectedIds.length > 0 
      ? comissoes.filter(c => selectedIds.includes(c.id)) 
      : filtered;

    const pdfTotalComissoes = listToPrint.reduce((acc, c) => acc + Number(c.comissao_total || 0), 0);
    const pdfTotalReceberMes = listToPrint.filter(c => c.status !== 'estornado').reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);

    // Summary Cards in PDF
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, y - 5, 180, 20, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL EM COMISSÕES", 20, y + 2);
    doc.text("TOTAL A RECEBER", 130, y + 2);
    
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(formatCurrency(pdfTotalComissoes), 20, y + 10);
    doc.text(formatCurrency(pdfTotalReceberMes), 130, y + 10);

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

    listToPrint.forEach((c, index) => {
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

    const totalReceberReport = listToPrint.filter(c => c.status !== 'estornado').reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);
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

  const filtered = useMemo(() => {
    return comissoes.filter(c => c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [comissoes, searchTerm]);

  const groupedComissoes = useMemo(() => {
    const groups: Record<string, Comissao[]> = {};
    filtered.forEach(c => {
      const admin = c.administradora || "MAGALU";
      if (!groups[admin]) groups[admin] = [];
      groups[admin].push(c);
    });
    return groups;
  }, [filtered]);

  const totalComissoes = comissoes.reduce((acc, c) => acc + Number(c.comissao_total || 0), 0);
  const totalEstornos = comissoes.reduce((acc, c) => acc + Number(c.valor_estorno || 0), 0);
  const totalRetroativo = comissoes.reduce((acc, c) => acc + Number(c.pagamentos_retroativos || 0), 0);
  const totalReceberMes = comissoes.filter(c => c.status !== 'estornado').reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);

  const handleRegistrarPagamentos = async () => {
    if (selectedIds.length === 0 || !profile?.organizacao_id) return;
    
    setIsSavingPagamento(true);
    
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    try {
      // Buscar fechamento do mês para verificar duplicidade
      const { data: existing } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .eq("mes", mes)
        .eq("ano", ano)
        .maybeSingle();

      const idsJaPagos = existing?.comissoes_ids || [];
      
      const selectedComissoes = comissoes.filter(c => selectedIds.includes(c.id));
      const comissoesParaPagar = selectedComissoes.filter(c => !idsJaPagos.includes(c.id));

      if (comissoesParaPagar.length === 0) {
        toast({ title: "Atenção", description: "Todos os contratos selecionados já foram registrados neste mês.", variant: "destructive" });
        setIsSavingPagamento(false);
        return;
      }

      if (comissoesParaPagar.length < selectedComissoes.length) {
        toast({ title: "Aviso", description: "Alguns contratos já haviam sido recebidos este mês e foram ignorados." });
      }

      const valorTotalPago = comissoesParaPagar.reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);
      const idsParaPagar = comissoesParaPagar.map(c => c.id);

      // 1. Incrementar parcela_atual de cada comissão válida
      for (const c of comissoesParaPagar) {
        const novaParcela = Math.min((c.parcela_atual || 1) + 1, c.parcelas_comissao);
        await supabase.from("comissoes").update({ parcela_atual: novaParcela }).eq("id", c.id);
      }

      // 2. Registrar no fechamento mensal
      if (existing) {
        await supabase.from("fechamentos_mensais").update({
          valor_total: Number(existing.valor_total) + valorTotalPago,
          contagem_vendas: Number(existing.contagem_vendas) + comissoesParaPagar.length,
          comissoes_ids: [...idsJaPagos, ...idsParaPagar]
        }).eq("id", existing.id);
      } else {
        await supabase.from("fechamentos_mensais").insert({
          organizacao_id: profile.organizacao_id,
          usuario_id: profile.id,
          mes,
          ano,
          valor_total: valorTotalPago,
          contagem_vendas: comissoesParaPagar.length,
          comissoes_ids: idsParaPagar
        });
      }

      toast({ title: "Pagamentos registrados!", description: `${formatCurrency(valorTotalPago)} consolidado no fechamento de ${mes}/${ano}.` });
      setSelectedIds([]);
      fetchComissoes();
      fetchFechamentos();
    } catch (e) {
      toast({ title: "Erro ao registrar", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingPagamento(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-slate-400 uppercase tracking-widest">Carregando comissionamento...</div>;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentFechamento = fechamentos.find(f => f.mes === currentMonth && f.ano === currentYear);
  const idsPagosNesteMes = currentFechamento?.comissoes_ids || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-500" /> Comissionamento
            <button
              onClick={() => setShowValues(v => !v)}
              title={showValues ? "Ocultar valores" : "Revelar valores"}
              className={`ml-2 p-1.5 rounded-lg border transition-all ${
                showValues
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600"
              }`}
            >
              {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Comissões */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center gap-1.5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-50/50 text-emerald-600 rounded-md"><Calculator className="h-3.5 w-3.5" /></div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Comissões</p>
          </div>
          <p className="text-lg font-black text-slate-800 pl-1">{maskValue(totalComissoes)}</p>
        </div>
        
        {/* Total Estornos */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center gap-1.5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-rose-50/50 text-rose-600 rounded-md"><TrendingDown className="h-3.5 w-3.5" /></div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Estornos</p>
          </div>
          <p className="text-lg font-black text-rose-600 pl-1">{maskValue(totalEstornos)}</p>
        </div>

        {/* A Receber (Mês) */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center gap-1.5 transition-all hover:shadow-md border-l-2 border-l-emerald-500">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md"><CheckCircle2 className="h-3.5 w-3.5" /></div>
            <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">A Receber (Mês)</p>
          </div>
          <p className="text-lg font-black text-emerald-600 pl-1">{maskValue(totalReceberMes)}</p>
        </div>

        {/* Acumulado Anual */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center gap-1.5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-50/50 text-blue-600 rounded-md"><Coins className="h-3.5 w-3.5" /></div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Acumulado Anual</p>
          </div>
          <p className="text-lg font-black text-slate-800 pl-1">
            {maskValue(fechamentos.reduce((acc, f) => acc + Number(f.valor_total), 0))}
          </p>
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
                {maskValue(
                  comissoes
                    .filter(c => selectedIds.includes(c.id))
                    .reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0)
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Comissão Total (Soma)</p>
              <p className="text-2xl font-black text-white">
                {maskValue(
                  comissoes
                    .filter(c => selectedIds.includes(c.id))
                    .reduce((acc, c) => acc + Number(c.comissao_total), 0)
                )}
              </p>
            </div>
          </div>
          
            <Button 
              variant="ghost" 
              onClick={() => setSelectedIds([])} 
              className="text-slate-400 hover:text-white hover:bg-slate-800 uppercase text-xs font-black"
              disabled={isSavingPagamento}
            >
              Limpar Seleção
            </Button>

            <Button 
              onClick={handleRegistrarPagamentos} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs px-6 py-6 rounded-xl shadow-lg shadow-emerald-500/20"
              disabled={isSavingPagamento}
            >
              {isSavingPagamento ? "Processando..." : "Confirmar Recebimento do Mês"}
            </Button>
          </div>
      )}

      {fechamentos.length > 0 && (
        <div className="space-y-4">
          <Card className="border-none shadow-sm bg-white p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" /> Evolução de Ganhos Reais
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-bold px-2 py-0.5 text-[10px]">
                  Maior Mês: {formatCurrency(Math.max(...fechamentos.map(f => Number(f.valor_total)), 0))}
                </Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-2 py-0.5 text-[10px]">
                  Retenção: 100%
                </Badge>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fechamentos.map(f => ({
                  name: new Date(f.ano, f.mes - 1).toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                  valor: Number(f.valor_total)
                })).slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={(val) => `R$ ${val / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                    formatter={(value: any) => [formatCurrency(value), "Recebido"]}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={30}>
                    {fechamentos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === fechamentos.length - 1 ? '#10b981' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <History className="h-3.5 w-3.5" /> Histórico Detalhado
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {fechamentos.map((f) => (
                <div key={f.id} className="min-w-[160px] bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(f.ano, f.mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-lg font-black text-emerald-600">{formatCurrency(f.valor_total)}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{f.contagem_vendas} pagamentos</p>
                </div>
              ))}
            </div>
          </Card>
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
                <th className="px-4 py-2 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filtered.filter(c => !idsPagosNesteMes.includes(c.id)).map(c => c.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Grupo/Cota</th>
                <th className="px-4 py-2">Venda</th>
                <th className="px-4 py-2">Regra</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Parcela</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedComissoes).map(([admin, items]) => {
                const subtotalTotal = items.reduce((acc, c) => acc + Number(c.comissao_total), 0);
                const subtotalMes = items.filter(c => !idsPagosNesteMes.includes(c.id) && c.status !== 'estornado').reduce((acc, c) => acc + (Number(c.comissao_total) / Number(c.parcelas_comissao)), 0);
                
                return (
                  <React.Fragment key={admin}>
                    <tr className="bg-slate-50/80">
                      <td colSpan={9} className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <BarChart3 className="h-3 w-3 text-primary" /> {admin}
                          </span>
                          <div className="flex gap-4">
                            <span className="text-[10px] font-bold text-slate-400">SUBTOTAL {admin}: <span className="text-slate-700">{formatCurrency(subtotalTotal)}</span></span>
                            <span className="text-[10px] font-bold text-emerald-600">A RECEBER (MÊS): {formatCurrency(subtotalMes)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {items.map(c => {
                      const isPago = idsPagosNesteMes.includes(c.id);
                      return (
                        <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(c.id) ? 'bg-emerald-50/30' : ''} ${isPago ? 'opacity-60 bg-slate-50' : ''}`}>
                          <td className="px-4 py-1.5 text-center">
                            {isPago ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-300"
                                checked={selectedIds.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedIds(prev => [...prev, c.id]);
                                  else setSelectedIds(prev => prev.filter(id => id !== c.id));
                                }}
                              />
                            )}
                          </td>
                          <td className="px-4 py-1.5 font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span>{c.cliente_nome}</span>
                              <span className="text-[9px] text-slate-400 font-black">{c.administradora || "MAGALU"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-1.5 text-xs text-slate-500">
                            {c.grupo || "-"} / {c.cota || "-"}
                          </td>
                          <td className="px-4 py-1.5">{maskValue(c.valor_venda)}</td>
                          <td className="px-4 py-1.5">
                            <Badge variant="outline" className="bg-slate-50 text-[10px]">
                              {c.regra_comissao} ({c.taxa_comissao}%)
                            </Badge>
                          </td>
                          <td className="px-4 py-1.5 font-bold text-emerald-600">
                            {maskValue(c.comissao_total)}
                          </td>
                          <td className="px-4 py-1.5 text-[11px] font-medium text-slate-500">
                            <div className="flex flex-col">
                              <span className="uppercase text-[9px] text-slate-400">{c.tipo_comissionamento}</span>
                              <span className="font-bold text-slate-700">{c.parcela_atual || 1}/{c.parcelas_comissao} - {maskValue(c.comissao_total / c.parcelas_comissao)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-1.5 text-blue-600 font-medium">
                            {c.parcela_atual || 1}/{c.parcelas_comissao}
                          </td>
                          <td className="px-4 py-1.5">
                            {(() => {
                              const isInadimplente = inadimplentes.some(i => i.lead_id === c.lead_id && i.status !== "regularizado");
                              if (c.status === "estornado") {
                                return <Badge variant="destructive" className="text-[10px]">Estornado ({formatCurrency(c.valor_estorno)})</Badge>;
                              }
                              if (isInadimplente) {
                                return (
                                  <div className="flex flex-col gap-1">
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] border-none">Ativo</Badge>
                                    <Badge variant="destructive" className="text-[9px] animate-pulse">Inadimplente</Badge>
                                  </div>
                                );
                              }
                              return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] border-none">Ativo</Badge>;
                            })()}
                          </td>
                          <td className="px-4 py-1.5 text-right">
                            <div className="flex justify-end gap-1">
                              {c.status !== "estornado" && (
                                <Button variant="ghost" size="sm" onClick={() => handleMarcarInadimplente(c)} className="text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Marcar 3 meses inadimplente">
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleEditComissao(c)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50" title="Editar comissão">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteComissao(c.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Excluir comissão">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {filtered.length > 0 && (
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan={5} className="px-4 py-4 text-right uppercase text-xs tracking-widest">Valor Total Geral de Comissionamento:</td>
                  <td className="px-4 py-4 text-emerald-400">{maskValue(totalComissoes)}</td>
                  <td colSpan={2} className="px-4 py-4 text-right uppercase text-xs tracking-widest">A Receber Total (Mês):</td>
                  <td className="px-4 py-4 text-emerald-400">{maskValue(totalReceberMes)}</td>
                </tr>
              )}

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
              {editingComissao ? <Edit2 className="h-5 w-5 text-blue-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
              {editingComissao ? "Editar Comissão" : "Nova Comissão"}
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
                  {leadsFechados.filter(l => !comissoes.some(c => c.lead_id === l.id)).map((l) => (
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
                <label className="text-xs font-bold uppercase text-slate-500">Administradora</label>
                <Select value={administradora} onValueChange={setAdministradora}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAGALU">Magalu</SelectItem>
                    <SelectItem value="ADEMICON">Ademicon</SelectItem>
                    <SelectItem value="SERVOPA">Servopa</SelectItem>
                    <SelectItem value="HS">HS Consórcios</SelectItem>
                    <SelectItem value="OUTRA">Outra</SelectItem>
                  </SelectContent>
                </Select>
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

            <Button onClick={handleSaveComissao} className={`w-full ${editingComissao ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black uppercase mt-4`}>
              {editingComissao ? "Salvar Alterações" : "Salvar Comissão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
