import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  Home, 
  Car, 
  Plus, 
  Trash2, 
  FileText, 
  ChevronRight, 
  Info,
  BadgeCheck,
  TrendingDown,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Share2,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Simulacao {
  id: number;
  nome: string;
  codigo: string;
  bem: number;
  entrada: number;
  pv: number;
  n: number;
  pmt: number;
  r: number;
  anual: number;
  custoReal: number;
  totalPago: number;
  tipo: string;
  tab: "imovel" | "veiculo";
}

// Helper: Parse currency input string to number
const parseCurrency = (str: string): number => {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

// Helper: Format number to currency style (but return string)
const fmtMoeda = (v: number) => {
  return formatCurrency(v).replace(",00", "");
};

// Newton-Raphson for Monthly Interest Rate
const calcTaxaMensal = (pv: number, pmt: number, n: number): number | null => {
  if (pv <= 0 || pmt <= 0 || n <= 0) return null;
  if (pmt * n <= pv) return null;
  let r = 0.01;
  for (let i = 0; i < 200; i++) {
    const f = pmt * (1 - Math.pow(1 + r, -n)) / r - pv;
    const df = pmt * (Math.pow(1 + r, -n) * n / r - (1 - Math.pow(1 + r, -n)) / (r * r));
    const rn = r - f / df;
    if (Math.abs(rn - r) < 1e-9) return rn;
    r = rn > 0 ? rn : 0.001;
  }
  return r;
};

export default function CartaAnalise() {
  const [activeTab, setActiveTab] = useState<"imovel" | "veiculo">("imovel");
  const [simulacoes, setSimulacoes] = useState<Record<string, Simulacao[]>>({
    imovel: [],
    veiculo: []
  });

  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    bem: "",
    entrada: "",
    n: "",
    pmt: ""
  });

  const [previewTaxa, setPreviewTaxa] = useState<{ anual: string; mensal: string; total: string; color: string } | null>(null);

  // Update preview on form change
  useEffect(() => {
    const bem = parseCurrency(formData.bem);
    const entrada = parseCurrency(formData.entrada);
    const n = parseInt(formData.n) || 0;
    const pmt = parseCurrency(formData.pmt);
    const pv = bem - entrada;

    const r = calcTaxaMensal(pv, pmt, n);
    if (r && r > 0) {
      const anual = (Math.pow(1 + r, 12) - 1) * 100;
      const totalPago = entrada + pmt * n;
      
      let color = "text-blue-600";
      if (anual > 20) color = "text-red-600";
      else if (anual > 15) color = "text-amber-600";

      setPreviewTaxa({
        anual: anual.toFixed(2) + "% a.a.",
        mensal: (r * 100).toFixed(4) + "% a.m.",
        total: "Total: " + fmtMoeda(totalPago),
        color
      });
    } else {
      setPreviewTaxa(null);
    }
  }, [formData]);

  const handleAddSimulacao = () => {
    const bem = parseCurrency(formData.bem);
    const entrada = parseCurrency(formData.entrada);
    const n = parseInt(formData.n) || 0;
    const pmt = parseCurrency(formData.pmt);

    if (!formData.nome || bem <= 0 || entrada <= 0 || n <= 0 || pmt <= 0) {
      toast.error("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    const pv = bem - entrada;
    const r = calcTaxaMensal(pv, pmt, n);
    
    if (!r || r <= 0) {
      toast.error("Erro no cálculo. Verifique se a parcela é suficiente para pagar o valor financiado.");
      return;
    }

    const anual = (Math.pow(1 + r, 12) - 1) * 100;
    const custoReal = anual + (activeTab === "imovel" ? 6.0 : 0);
    const totalPago = entrada + pmt * n;

    const newSim: Simulacao = {
      id: Date.now(),
      nome: formData.nome,
      codigo: formData.codigo,
      bem,
      entrada,
      pv,
      n,
      pmt,
      r,
      anual,
      custoReal,
      totalPago,
      tipo: activeTab === "imovel" ? "Imóvel" : "Veículo",
      tab: activeTab
    };

    setSimulacoes(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newSim]
    }));

    // Reset form
    setFormData({
      nome: "",
      codigo: "",
      bem: "",
      entrada: "",
      n: "",
      pmt: ""
    });
    toast.success("Simulação adicionada!");
  };

  const removeSimulacao = (id: number) => {
    setSimulacoes(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(s => s.id !== id)
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const COLORS = ['#e85d04', '#7c3aed', '#0891b2', '#be185d', '#15803d'];
  const BG_COLORS = ['bg-orange-50', 'bg-purple-50', 'bg-cyan-50', 'bg-pink-50', 'bg-emerald-50'];
  const BORDER_COLORS = ['border-orange-200', 'border-purple-200', 'border-cyan-200', 'border-pink-200', 'border-emerald-200'];

  const currentSims = simulacoes[activeTab];
  const isImovel = activeTab === "imovel";
  const taxaFin = isImovel ? 0.1269 : 0.1999;
  const labelFin = isImovel ? "Financiamento CEF" : "Financiamento Banco";
  const labelRef = isImovel ? "+ INCC ~6,0% a.a." : "sem correção";

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-screen bg-slate-50/50 p-4 md:p-6">
      {/* SIDEBAR FORM */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-4">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> NOVA SIMULAÇÃO
            </CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {isImovel ? "Imóvel" : "Veículo"} · Carta Contemplada
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Administradora / Nome</label>
              <Input 
                placeholder="Ex: União Catarinense" 
                value={formData.nome}
                onChange={e => handleInputChange("nome", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Código (opcional)</label>
              <Input 
                placeholder="Ex: 1200" 
                value={formData.codigo}
                onChange={e => handleInputChange("codigo", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Valor do Bem (R$)</label>
                <Input 
                  placeholder="524.000" 
                  value={formData.bem}
                  onChange={e => handleInputChange("bem", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Entrada (R$)</label>
                <Input 
                  placeholder="250.000" 
                  value={formData.entrada}
                  onChange={e => handleInputChange("entrada", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Parcelas</label>
                <Input 
                  type="number"
                  placeholder="148" 
                  value={formData.n}
                  onChange={e => handleInputChange("n", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Vl. Parcela (R$)</label>
                <Input 
                  placeholder="3.749" 
                  value={formData.pmt}
                  onChange={e => handleInputChange("pmt", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {previewTaxa && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Taxa Calculada</span>
                  <span className={cn("text-lg font-black tracking-tight", previewTaxa.color)}>{previewTaxa.anual}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>{previewTaxa.mensal}</span>
                  <span>{previewTaxa.total}</span>
                </div>
              </div>
            )}

            <Button onClick={handleAddSimulacao} className="w-full font-black uppercase text-xs h-10 gap-2">
              <Plus className="h-4 w-4" /> Adicionar Simulação
            </Button>
          </CardContent>
        </Card>

        {currentSims.length > 0 && (
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 p-3 border-b">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                {currentSims.length} ADICIONADA(S)
              </p>
            </CardHeader>
            <div className="p-2 space-y-1">
              {currentSims.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white border group transition-all hover:border-slate-300">
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{s.nome}</p>
                    <p className="text-[10px] font-bold text-slate-400">{s.anual.toFixed(2)}% a.a.</p>
                  </div>
                  <button 
                    onClick={() => removeSimulacao(s.id)}
                    className="p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-md transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Carta Contemplada — Análise</h1>
            <p className="text-sm font-medium text-slate-500">Análise comparativa entre Consórcio Contemplado e Financiamento Bancário</p>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
            <TabsList className="bg-white border p-1 rounded-xl shadow-sm">
              <TabsTrigger value="imovel" className="rounded-lg gap-2 font-bold px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Home className="h-4 w-4" /> Imóvel
              </TabsTrigger>
              <TabsTrigger value="veiculo" className="rounded-lg gap-2 font-bold px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Car className="h-4 w-4" /> Veículo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {currentSims.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Calculator className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Nenhuma simulação ainda</h2>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Use o painel lateral para adicionar propostas de cartas contempladas e visualizar a análise comparativa.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentSims.map((s, i) => {
                const color = COLORS[i % COLORS.length];
                const bgClass = BG_COLORS[i % BG_COLORS.length];
                const borderClass = BORDER_COLORS[i % BORDER_COLORS.length];

                return (
                  <Card key={s.id} className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                            {s.codigo ? `CÓD. ${s.codigo}` : "CÓD. —"}
                          </p>
                          <CardTitle className="text-base font-black truncate">{s.nome}</CardTitle>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Consórcio {s.tipo}</p>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[9px] gap-1 px-2 py-0.5 border-none">
                          <CheckCircle2 className="h-3 w-3" /> Contemplada
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Vl. do Bem</p>
                          <p className="text-xs font-black text-slate-900">{fmtMoeda(s.bem)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Entrada</p>
                          <p className="text-xs font-bold text-slate-700">{fmtMoeda(s.entrada)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-blue-400 uppercase">Financiado</p>
                          <p className="text-xs font-black text-blue-600">{fmtMoeda(s.pv)}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Fluxo de Pagamento</p>
                        <p className="text-sm font-black text-slate-900">{s.n} × {formatCurrency(s.pmt)}</p>
                      </div>

                      <div className={cn("p-4 rounded-2xl border flex items-center justify-between", bgClass, borderClass)}>
                        <div>
                          <p className="text-[9px] font-bold opacity-60 uppercase mb-0.5">Taxa Efetiva Anual</p>
                          <p className="text-2xl font-black tracking-tighter" style={{ color }}>{s.anual.toFixed(2)}% <span className="text-xs opacity-60">a.a.</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-black" style={{ color }}>{(s.r * 100).toFixed(4)}% <span className="text-[9px] opacity-60">a.m.</span></p>
                          <div className="mt-1.5 flex items-center gap-1 bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-rose-500/20">
                            <AlertCircle className="h-2.5 w-2.5" /> ⚠ {labelRef}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-dashed flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Custo Efetivo Real (Anual)</p>
                          <p className="text-lg font-black text-rose-600 tracking-tight">~{s.custoReal.toFixed(1)}% <span className="text-[10px] opacity-60">a.a.</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Pago</p>
                          <p className="text-xs font-black text-slate-700">{fmtMoeda(s.totalPago)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* COMPARISON TABLES */}
            <div className="relative flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Comparativo com {labelFin}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-6">
              {currentSims.map((s, i) => {
                const color = COLORS[i % COLORS.length];
                const bgClass = BG_COLORS[i % BG_COLORS.length];
                const borderClass = BORDER_COLORS[i % BORDER_COLORS.length];
                const taxaMensalFin = Math.pow(1 + taxaFin, 1/12) - 1;
                const pmtFin0 = s.pv * taxaMensalFin / (1 - Math.pow(1 + taxaMensalFin, -s.n));
                const totalFin0 = s.entrada + pmtFin0 * s.n;
                const economiaFin0 = s.totalPago - totalFin0;

                const altPrazos = isImovel ? [240, 360] : [60, 84];

                return (
                  <div key={s.id} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden overflow-x-auto">
                    <div className="bg-slate-900 p-4 flex items-center justify-between gap-4">
                       <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                         <Calculator className="h-4 w-4 text-primary" /> {s.nome} — Bem {fmtMoeda(s.bem)}
                       </h3>
                       <Badge variant="outline" className="text-white/60 border-white/20 text-[9px] uppercase font-black">
                         Financiado: {fmtMoeda(s.pv)}
                       </Badge>
                    </div>
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Operação</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Prazo</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Parcela</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Total Pago</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Custo Extra</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Avaliação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CONSORCIO ROW */}
                        <tr className="border-b transition-colors hover:bg-slate-50/50" style={{ backgroundColor: `${color}05` }}>
                          <td className="p-4">
                            <Badge className="bg-transparent border shadow-none font-black text-[9px] uppercase" style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                              Consórcio
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-black">{s.n} meses</p>
                            <p className="text-[10px] font-bold text-slate-400">{(s.n/12).toFixed(1)} anos</p>
                          </td>
                          <td className="p-4 font-black text-xs text-slate-900">{formatCurrency(s.pmt)}</td>
                          <td className="p-4 font-black text-xs" style={{ color }}>{fmtMoeda(s.totalPago)}</td>
                          <td className="p-4 font-black text-xs text-slate-400">{fmtMoeda(s.totalPago - s.bem)}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-black uppercase">+ indexador</Badge>
                          </td>
                        </tr>

                        {/* SAME TERM FINANCE ROW */}
                        <tr className="border-b transition-colors hover:bg-slate-50/50 bg-blue-50/30">
                          <td className="p-4">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 border shadow-none font-black text-[9px] uppercase">
                              {labelFin}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-black">{s.n} meses</p>
                            <p className="text-[10px] font-bold text-slate-400">{(s.n/12).toFixed(1)} anos</p>
                          </td>
                          <td className="p-4 font-black text-xs text-slate-900">{formatCurrency(pmtFin0)}</td>
                          <td className="p-4 font-black text-xs text-emerald-600">{fmtMoeda(totalFin0)}</td>
                          <td className="p-4 font-black text-xs text-emerald-500">{fmtMoeda(totalFin0 - s.bem)}</td>
                          <td className="p-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border shadow-none font-black text-[9px] uppercase">
                              {economiaFin0 > 0 ? `${fmtMoeda(economiaFin0)} mais barato` : "Similar"}
                            </Badge>
                          </td>
                        </tr>

                        {/* ALT TERMS */}
                        {altPrazos.map(np => {
                          const pmtFin = s.pv * taxaMensalFin / (1 - Math.pow(1 + taxaMensalFin, -np));
                          const totalFin = s.entrada + pmtFin * np;
                          const isMoreExp = totalFin > s.totalPago;

                          return (
                            <tr key={np} className="border-b transition-colors hover:bg-slate-50/50">
                              <td className="p-4">
                                <Badge className="bg-slate-100 text-slate-500 border-slate-200 border shadow-none font-black text-[9px] uppercase">
                                  {labelFin}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <p className="text-xs font-black">{np} meses</p>
                                <p className="text-[10px] font-bold text-slate-400">{(np/12)} anos</p>
                              </td>
                              <td className="p-4 font-black text-xs text-slate-900">{formatCurrency(pmtFin)}</td>
                              <td className={cn("p-4 font-black text-xs", isMoreExp ? "text-rose-600" : "text-amber-600")}>
                                {fmtMoeda(totalFin)}
                              </td>
                              <td className={cn("p-4 font-black text-xs opacity-60", isMoreExp ? "text-rose-500" : "text-amber-500")}>
                                {fmtMoeda(totalFin - s.bem)}
                              </td>
                              <td className="p-4">
                                <Badge className={cn("border shadow-none font-black text-[9px] uppercase", isMoreExp ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                                  {isMoreExp ? "Mais caro" : "Parcela menor"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* FINAL ANALYSIS */}
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-blue-700" />
                <h2 className="text-xl font-black text-blue-900 uppercase tracking-wide">Análise Final Comparativa</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSims.map((s, i) => {
                  const color = COLORS[i % COLORS.length];
                  const taxaMensalFin = Math.pow(1 + taxaFin, 1/12) - 1;
                  const pmtFin0 = s.pv * taxaMensalFin / (1 - Math.pow(1 + taxaMensalFin, -s.n));
                  const totalFin0 = s.entrada + pmtFin0 * s.n;
                  const economia = s.totalPago - totalFin0;
                  const masCaro = economia > 0;

                  return (
                    <div key={s.id} className="bg-white/70 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 space-y-2">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                         <span className="text-[11px] font-black uppercase tracking-wider" style={{ color }}>{s.nome} {s.codigo ? `· ${s.codigo}` : ""}</span>
                       </div>
                       <p className="text-xs leading-relaxed text-slate-700">
                         Taxa de <strong className="text-slate-900">{s.anual.toFixed(2)}% a.a.</strong> com custo real estimado de <strong className="text-rose-600">~{s.custoReal.toFixed(1)}% a.a.</strong> incluindo o indexador médio de 6,0% a.a.
                       </p>
                       <p className="text-xs leading-relaxed text-slate-700">
                         {masCaro
                           ? <span>O {labelFin} no mesmo prazo de <strong>{(s.n/12).toFixed(1)} anos</strong> economiza <strong>{fmtMoeda(economia)}</strong> em valor nominal — diferença que cresce com a correção do consórcio.</span>
                           : <span>O consórcio contemplado é altamente competitivo frente ao {labelFin} neste cenário de prazo.</span>}
                       </p>
                    </div>
                  );
                })}

                <div className="bg-white/70 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 space-y-2">
                   <div className="flex items-center gap-2 mb-2">
                     <TrendingUp className="h-4 w-4 text-emerald-600" />
                     <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Quando o consórcio vale</span>
                   </div>
                   <p className="text-xs leading-relaxed text-slate-700 font-medium">
                     O consórcio contemplado torna-se extremamente vantajoso frente a financiamentos de <strong>{isImovel ? "20 a 30" : "5 a 7"} anos</strong>, onde o custo total do banco explode. É ideal para quem busca fugir dos juros compostos de longo prazo.
                   </p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 space-y-2">
                   <div className="flex items-center gap-2 mb-2">
                     <BadgeCheck className="h-4 w-4 text-blue-700" />
                     <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Recomendação Técnica</span>
                   </div>
                   <p className="text-xs leading-relaxed text-slate-700 font-medium">
                     Sempre compare o <strong>CET (Custo Efetivo Total)</strong> do financiamento. O consórcio não possui juros, apenas taxa de administração (já contemplada no valor pago pela carta). {isImovel ? "Considere também o uso do FGTS para amortização." : ""}
                   </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-blue-200">
                 <Button className="bg-[#25d366] hover:bg-[#1ebe5c] font-black uppercase text-xs gap-2 rounded-xl">
                   <Share2 className="h-4 w-4" /> Enviar via WhatsApp
                 </Button>
                 <Button variant="outline" className="bg-white hover:bg-slate-50 border-blue-200 text-blue-700 font-black uppercase text-xs gap-2 rounded-xl" onClick={() => window.print()}>
                   <Download className="h-4 w-4" /> Gerar PDF / Imprimir
                 </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          aside, .lg\\:hidden, .TabsList, .sidebar, button, .action-btns { display: none !important; }
          .flex-1 { width: 100% !important; padding: 0 !important; }
          body { background: white !important; }
          .Card, .bg-white { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
