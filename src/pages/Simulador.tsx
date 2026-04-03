import { useState, useRef, useEffect, useMemo } from "react";

const sliderThumbStyles = `
  input[type=range].custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    background: #ffffff;
    border: 4px solid #0057a8;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 0 4px rgba(0,0,0,0.1);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  input[type=range].custom-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2), inset 0 0 4px rgba(0,0,0,0.1);
  }
  input[type=range].custom-slider:active::-webkit-slider-thumb {
    transform: scale(0.95);
    background: #0057a8;
    border-color: #ffffff;
  }
  input[type=range].custom-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    background: #ffffff;
    border: 4px solid #0057a8;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 0 4px rgba(0,0,0,0.1);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  input[type=range].custom-slider::-moz-range-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2), inset 0 0 4px rgba(0,0,0,0.1);
  }
  input[type=range].custom-slider:active::-moz-range-thumb {
    transform: scale(0.95);
  }
`;

import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CRMDrawer } from "@/components/admin/CRMDrawer";
import { jsPDF } from "jspdf";
import { 
  Calculator, 
  ChevronRight, 
  TrendingDown, 
  CircleDollarSign,
  FileText,
  Share2,
  Calendar,
  CheckCircle2,
  Info
} from "lucide-react";

import { GRUPOS, CATEGORIAS, GrupoItem } from "@/components/ConsortiumSimulator";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MAX_CONSULTAS = 5;

type HistItem = {
  credito: number;
  grupo: string;
  prazo: number;
  r50: number;
  nome: string;
  ts: string;
};

export default function Simulador() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const refCelular = searchParams.get("ref") || "";
  const refNome = searchParams.get("nome") ? decodeURIComponent(searchParams.get("nome")!) : "";
  const isIndicacao = refCelular.length >= 10;
  const wppDestino = isIndicacao ? refCelular : "5541997925357";

  const [categoria, setCategoria] = useState("imovel");
  const [idx, setIdx] = useState(4);
  const [nome, setNome] = useState("");
  const [wpp, setWpp] = useState("");
  const [errNome, setErrNome] = useState(false);
  const [errWpp, setErrWpp] = useState(false);
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  
  // Novos Estados (Melhorias Fabricio)
  const [lanceDinheiroPct, setLanceDinheiroPct] = useState(0);
  const [lanceEmbutidoPct, setLanceEmbutidoPct] = useState(0);
  const [incluirComp, setIncluirComp] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);

  const lista = GRUPOS[categoria];
  const g = lista[idx];

  useEffect(() => {
    setIdx(Math.min(4, lista.length - 1));
  }, [categoria]);

  const mascaraWpp = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setWpp(v);
  };

  const pct = lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0;

  const confirmar = async () => {
    const nomeOk = nome.trim().length > 0;
    const wppOk = wpp.replace(/\D/g, "").length >= 10;
    setErrNome(!nomeOk);
    setErrWpp(!wppOk);
    if (!nomeOk || !wppOk) return;
    if (consultas >= MAX_CONSULTAS) { setBloqueado(true); return; }

    const novaConsulta = consultas + 1;
    setConsultas(novaConsulta);
    setResultado(g);

    const item: HistItem = {
      credito: g.credito, grupo: g.grupo, prazo: g.prazo, r50: g.r50,
      nome: nome.trim(),
      ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    setHistorico(prev => [...prev, item]);

    // Lead Score Logic
    let leadScoreValor = "baixo";
    if (g.credito >= 500000) leadScoreValor = "premium";
    else if (g.credito >= 200000) leadScoreValor = "alto";
    else if (g.credito >= 80000) leadScoreValor = "medio";

    // 1. Save to Supabase (CRM)
    try {
      console.log("Simplificador: Salvando lead no CRM...");
      const { error: dbError } = await supabase.from("leads").insert({
        nome: nome.trim(),
        celular: wpp.replace(/\D/g, ""),
        tipo_consorcio: CATEGORIAS.find(c => c.id === categoria)?.label || categoria,
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        status: "novo_lead",
        lead_score_valor: leadScoreValor,
        lead_temperatura: "quente",
        ...(isIndicacao ? { indicador_nome: refNome, indicador_celular: refCelular } : {}),
      });

      if (dbError) {
        console.error("❌ ERRO CRM (Simulador):", dbError);
        toast({ 
          title: "Erro ao sincronizar CRM", 
          description: dbError.message || "Ocorreu um erro ao salvar o lead no banco de dados.",
          variant: "destructive"
        });
      } else {
        console.log("✅ Lead salvo no CRM (Simulador)!");
        toast({ title: "✅ Lead registrado no CRM com sucesso!" });
      }
    } catch (e) {
      console.error("🚨 Exception CRM:", e);
    }

    // 2. Notificação desabilitada para o CRM (Telegram/Make) conforme solicitado
    console.log("Notificação externa (Telegram/Make) ignorada para o simulador interno.");

    if (novaConsulta >= MAX_CONSULTAS) {
      setTimeout(() => setBloqueado(true), 700);
    }

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const handleLoadLead = (lead: any) => {
    setNome(lead.nome || "");
    setWpp(lead.celular || "");
    if (lead.tipo_consorcio) {
      if (lead.tipo_consorcio.toLowerCase().includes("imóvel")) setCategoria("imovel");
      else if (lead.tipo_consorcio.toLowerCase().includes("veículo")) setCategoria("veiculo");
      else if (lead.tipo_consorcio.toLowerCase().includes("pesados")) setCategoria("pesados");
    }
    toast({ title: `Lead ${lead.nome} carregado!` });
  };

  const handleSaveSimToCRM = async (leadId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("leads").update({
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        tipo_consorcio: CATEGORIAS.find(c => c.id === categoria)?.label || categoria,
        updated_at: new Date().toISOString()
      }).eq("id", leadId);

      if (error) throw error;
      toast({ title: "Sincronizado!", description: "Dados salvos no lead selecionado." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const isIm = categoria === 'imovel';
    const blue = [30, 80, 160];
    const navy = [15, 30, 60];
    const orange = [244, 121, 32];
    
    // Header
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("FABRICIO | Especialista Consórcio", 20, 25);
    doc.setFontSize(10);
    doc.text("app.contemplarcrm.com.br", 20, 32);
    
    // Content
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(16);
    doc.text("SIMULAÇÃO DE CONSÓRCIO", 20, 55);
    doc.setFontSize(12);
    doc.text(`Cliente: ${nome || 'Não informado'}`, 20, 65);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 65);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 70, 190, 70);
    
    // Results
    let y = 80;
    const addRow = (label: string, value: string, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(label, 20, y);
      doc.text(value, 120, y);
      y += 10;
    };
    
    addRow("Tipo de Bem:", CATEGORIAS.find(c => c.id === categoria)?.label  || "");
    addRow("Crédito:", fmt(g.credito), true);
    addRow("Prazo:", `${g.prazo} meses`);
    addRow("Grupo:", g.grupo);
    addRow("Parcela 50% (Até Contemplação):", fmt(g.r50), true);
    
    if (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("ESTRATÉGIA DE LANCE", 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      if (lanceDinheiroPct > 0) addRow(`Lance em Dinheiro (${lanceDinheiroPct}%):`, fmt(g.credito * lanceDinheiroPct / 100));
      if (lanceEmbutidoPct > 0) addRow(`Lance Embutido (${lanceEmbutidoPct}%):`, fmt(g.credito * lanceEmbutidoPct / 100));
      addRow("Total do Lance:", fmt(g.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100), true);
    }
    
    if (incluirComp) {
      y += 10;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y-5, 170, 45, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.text("COMPARATIVO FINANCEIRO", 25, y+5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const taxaM = isIm ? 0.00887 : 0.025;
      const pmtF = g.credito * taxaM / (1 - Math.pow(1 + taxaM, -g.prazo));
      
      y += 15;
      doc.text("Parcela Financiamento (Banco - Estimado):", 25, y);
      doc.text(fmt(pmtF), 125, y);
      y += 8;
      doc.text("Parcela Consórcio (Especialista):", 25, y);
      doc.text(fmt(g.r50), 125, y);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("Economia Estimada por Parcela:", 25, y);
      doc.text(fmt(pmtF - g.r50), 125, y);
    }
    
    // Footer
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("FABRICIO - ESPECIALISTA EM CONSÓRCIO | ATENDIMENTO EM TODO O BRASIL", 105, 290, { align: 'center' });
    
    doc.save(`simulacao_fabricio_${nome.split(' ')[0] || 'cliente'}.pdf`);
    toast({ title: "PDF Gerado!", description: "A simulação foi salva em seu dispositivo." });
  };

  const handleShareWhatsApp = () => {
    if (!resultado) {
      toast({ title: "Simule primeiro", description: "Preencha os campos e clique em Simule Já." });
      return;
    }

    const lanceTotalPct = lanceDinheiroPct + lanceEmbutidoPct;
    const lanceTotalRS = g.credito * lanceTotalPct / 100;
    
    const isIm = categoria === 'imovel';
    const taxaM = isIm ? 0.00887 : 0.025;
    const pmtF = g.credito * taxaM / (1 - Math.pow(1 + taxaM, -g.prazo));

    const text = `*📋 SIMULAÇÃO DE CONSÓRCIO - FABRICIO*

*Cliente:* ${nome || 'Não informado'}
*Bem:* ${CATEGORIAS.find(c => c.id === categoria)?.label || categoria}
*Crédito:* ${fmt(g.credito)}
*Prazo:* ${g.prazo} meses
*Grupo:* ${g.grupo}

*💰 INVESTIMENTO*
*Parcela 50%:* ${fmt(g.r50)} (até contemplação)

${lanceTotalPct > 0 ? `*🏹 ESTRATÉGIA DE LANCE*
• Dinheiro: ${lanceDinheiroPct}%
• Embutido: ${lanceEmbutidoPct}%
• Total: *${fmt(lanceTotalRS)}* (${lanceTotalPct}%)
` : ''}
${incluirComp ? `*🏦 COMPARATIVO FINANCIAMENTO*
• Parcela Banco: ~${fmt(pmtF)}
• Parcela Consórcio: *${fmt(g.r50)}*
• Economia mensal: *${fmt(pmtF - g.r50)}*
` : ''}
_Contemplar CRM - Inteligência em Consórcios_
_app.contemplarcrm.com.br_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmt(h.credito)} — ${fmt(h.r50)} / ${h.prazo}m`).join("\n");
  const lockWppUrl = `https://wa.me/55${wppDestino}?text=${encodeURIComponent("Olá! Fiz simulações:\n\n" + wppLockMsg + "\n\nQuero mais informações!")}`;

  const nomeIndicador = refNome || "um parceiro";

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16" style={{ background: "#f0f2f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{sliderThumbStyles}</style>
      {/* Banner indicação */}
      {isIndicacao && (
        <div className="w-full max-w-[580px] rounded-full px-5 py-2.5 mb-4 flex items-center justify-center gap-2 text-xs font-semibold"
          style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", color: "#c2410c" }}>
          🤝 Indicação de <strong>{nomeIndicador}</strong>
        </div>
      )}
      {/* Hero */}
      <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: "#f47920" }}>Simulador</p>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mt-2 mb-2" style={{ color: "#0f2044", lineHeight: 1.18 }}>
        Simule seu Consórcio <em className="not-italic" style={{ color: "#f47920" }}>em segundos</em>
      </h1>
      <p className="text-sm text-center max-w-md mb-8" style={{ color: "#6b7a99", lineHeight: 1.65 }}>
        Descubra agora o valor do seu crédito, parcelas e o prazo ideal para o seu planejamento.
      </p>

      {/* Card principal */}
      <div className="w-full max-w-[580px] rounded-[22px] p-6 sm:p-8" style={{ background: "#fff", boxShadow: "0 4px 40px rgba(15,32,68,.10)" }}>
        {/* Slider */}
        <p className="text-xs font-semibold text-center mb-2" style={{ color: "#6b7a99" }}>Valor do crédito desejado</p>
        <div className="text-center mb-5">
          <span className="text-sm font-bold mr-1" style={{ color: "#6b7a99" }}>R$</span>
          <span className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#0f2044", letterSpacing: "-0.03em" }}>
            {g.credito.toLocaleString("pt-BR")}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={lista.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="custom-slider w-full h-3 rounded-full cursor-pointer appearance-none mb-2"
          style={{
            background: `linear-gradient(to right, #0057a8 0%, #0057a8 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
          }}
        />
        <div className="flex justify-between text-xs mb-6" style={{ color: "#6b7a99" }}>
          <span>R$ {lista[0].credito.toLocaleString("pt-BR")}</span>
          <span>R$ {lista[lista.length - 1].credito.toLocaleString("pt-BR")}</span>
        </div>

        {/* Segmentos */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: categoria === cat.id ? "#0f2044" : "#f8fafd",
                color: categoria === cat.id ? "#fff" : "#6b7a99",
                border: `1.5px solid ${categoria === cat.id ? "#0f2044" : "#e4e9f2"}`,
                boxShadow: categoria === cat.id ? "0 4px 14px rgba(15,32,68,.18)" : "none",
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Parcela verde */}
        <div className="rounded-[14px] p-5 text-center mb-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
          <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-1" style={{ color: "#15803d" }}>
            Parcela reduzida 50% <span style={{ color: "#4ade80", fontWeight: 400 }}>· até a contemplação</span>
          </p>
          <p className="text-3xl sm:text-4xl font-medium" style={{ fontFamily: "'DM Mono', monospace", color: "#16a34a" }}>
            {fmt(g.r50)}
          </p>
          <div className="flex gap-2 mt-3.5">
            {[
              { label: "Crédito", value: fmt(g.credito) },
              { label: "Prazo", value: `${g.prazo} meses` },
              { label: "Grupo", value: g.grupo },
            ].map((m) => (
              <div key={m.label} className="flex-1 bg-white rounded-lg py-2 px-2.5 text-center" style={{ border: "1px solid #d1fae5" }}>
                <p className="text-[0.58rem] uppercase tracking-wider mb-0.5" style={{ color: "#6b7a99" }}>{m.label}</p>
                <p className="text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace", color: "#0f2044" }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px mb-5" style={{ background: "#e4e9f2" }} />

        {/* Formulário */}
        <input
          type="text"
          placeholder="Seu nome completo *"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setErrNome(false); }}
          className="w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all"
          style={{ border: `1.5px solid ${errNome ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
        />
        {errNome && <p className="text-[0.7rem] mb-2 ml-0.5" style={{ color: "#dc2626" }}>Por favor, informe seu nome.</p>}
        {!errNome && <div className="mb-2.5" />}

        <input
          type="tel"
          placeholder="Seu WhatsApp *"
          value={wpp}
          onChange={(e) => { mascaraWpp(e.target.value); setErrWpp(false); }}
          className="w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all"
          style={{ border: `1.5px solid ${errWpp ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
        />
        {errWpp && <p className="text-[0.7rem] mb-2 ml-0.5" style={{ color: "#dc2626" }}>Por favor, informe um WhatsApp válido.</p>}
        {!errWpp && <div className="mb-2.5" />}

        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#6b7a99" }}>
          <span style={{ color: "#0057a8", opacity: 0.75 }}>🕐</span>
          Saiba o valor da sua parcela após a contemplação.
        </div>

        <button
          onClick={confirmar}
          disabled={bloqueado}
          className="w-full py-4 rounded-[10px] text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#f47920]/90 active:scale-[0.98]"
          style={{
            background: "#f47920",
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 20px rgba(244,121,32,.35)",
          }}
        >
          Simular Agora
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Estratégia de Lance (Opcional) */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <CircleDollarSign className="w-5 h-5 text-[#f47920]" />
            <h3 className="font-bold text-[#0f2044]">Estratégia de Lance (Opcional)</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Lance Dinheiro (%)</label>
              <Input 
                type="number" 
                value={lanceDinheiroPct || ""} 
                onChange={(e) => setLanceDinheiroPct(Number(e.target.value))}
                placeholder="Ex: 20"
                className="rounded-lg bg-gray-50 border-gray-100 text-sm font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Lance Embutido (%)</label>
              <Input 
                type="number" 
                value={lanceEmbutidoPct || ""} 
                onChange={(e) => setLanceEmbutidoPct(Number(e.target.value))}
                placeholder="Ex: 10"
                className="rounded-lg bg-gray-50 border-gray-100 text-sm font-mono"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic">
            * O lance embutido utiliza parte do próprio crédito para contemplação.
          </p>
        </div>

        <p className="text-center text-xs mt-3.5" style={{ color: "#6b7a99" }}>
          Ao simular, você concorda com nossa <a href="#" className="underline" style={{ color: "#0057a8" }}>Política de Privacidade</a>
        </p>

        {/* Resultado */}
        {resultado && (
          <div ref={resultRef} className="rounded-[18px] p-0 mt-8 animate-fade-in overflow-hidden border-2 border-[#0f2044] bg-white shadow-xl">
            <div className="bg-[#0f2044] p-4 text-white">
              <div className="text-[0.6rem] uppercase tracking-[0.15em] mb-1 font-bold flex items-center justify-between opacity-80">
                <span>PROPOSTA GERADA POR FABRICIO</span>
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              </div>
              <h3 className="text-lg font-bold">Simulação Detalhada</h3>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Row 1: Parcela Destaque */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                <p className="text-[0.65rem] uppercase tracking-wider mb-1 font-bold text-green-700">Parcela Reduzida (50%)</p>
                <p className="text-3xl font-black text-[#16a34a]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(resultado.r50)}</p>
                <p className="text-[0.6rem] text-green-600 mt-1 uppercase font-medium">Investimento inteligente até a contemplação</p>
              </div>

              {/* Grid: Crédito e Prazo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[0.6rem] uppercase font-bold text-gray-400 mb-1">Crédito</p>
                  <p className="text-lg font-bold text-[#0f2044]">{fmt(resultado.credito)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[0.6rem] uppercase font-bold text-gray-400 mb-1">Prazo</p>
                  <p className="text-lg font-bold text-[#0f2044]">{resultado.prazo} meses</p>
                </div>
              </div>

              {/* Estratégia de Lance (Se existir) */}
              {(lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-blue-600" />
                    <span className="text-[0.7rem] font-bold text-blue-800 uppercase">Estratégia de Lance</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-blue-900">
                    <span>Total do Lance ({lanceDinheiroPct + lanceEmbutidoPct}%)</span>
                    <span>{fmt(g.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100)}</span>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  onClick={handleExportPDF}
                  className="bg-white hover:bg-gray-50 text-[#0f2044] border-2 border-[#0f2044] font-bold text-xs h-11"
                >
                  <FileText className="w-4 h-4 mr-2" /> PDF PARA CLIENTE
                </Button>
                <Button 
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold text-xs h-11 border-none shadow-md shadow-green-100"
                >
                  <Share2 className="w-4 h-4 mr-2" /> WHATSAPP
                </Button>
              </div>

              {/* Comparativo (Toggle opcional no futuro, fixo por agora) */}
              {incluirComp && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-orange-500" />
                    <span className="text-[0.7rem] font-bold text-[#0f2044] uppercase">Comparativo com Financiamento</span>
                  </div>
                  
                  {(() => {
                    const isIm = categoria === 'imovel';
                    const taxaM = isIm ? 0.00887 : 0.025;
                    const pmtF = g.credito * taxaM / (1 - Math.pow(1 + taxaM, -g.prazo));
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Parcela Banco (Price)</span>
                          <span className="font-mono strike-through opacity-70">~ {fmt(pmtF)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-[#16a34a] bg-green-50 p-2 rounded-lg">
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sua Parcela Aqui</span>
                          <span className="font-mono">{fmt(resultado.r50)}</span>
                        </div>
                        <div className="flex justify-between text-[12px] font-black text-blue-900 border-t border-dashed pt-2">
                          <span>Economia Mensal:</span>
                          <span className="text-lg">+{fmt(pmtF - resultado.r50)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="mt-4">
            <p className="text-[0.64rem] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: "#6b7a99" }}>Suas simulações</p>
            {historico.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-[10px] mb-1.5 flex-wrap gap-2" style={{ background: "#fff", border: "1.5px solid #e4e9f2", borderLeft: "3px solid #f47920" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#0f2044" }}>{fmt(h.credito)}</p>
                  <p className="text-[0.67rem]" style={{ color: "#6b7a99" }}>Grupo {h.grupo} · {h.prazo} meses · {h.ts}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ fontFamily: "'DM Mono', monospace", color: "#16a34a" }}>{fmt(h.r50)}</p>
                  <p className="text-[0.67rem]" style={{ color: "#6b7a99" }}>Reduzida 50%</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bloqueio */}
        {bloqueado && (
          <div ref={lockRef} className="rounded-[14px] p-7 text-center mt-5 animate-fade-in" style={{ background: "#fff", border: "2px solid #f47920", boxShadow: "0 4px 24px rgba(244,121,32,.1)" }}>
            <p className="text-3xl mb-2">🔐</p>
            <p className="text-lg font-extrabold mb-1.5" style={{ color: "#0f2044" }}>Limite atingido</p>
            <div className="rounded-lg py-2 px-3.5 mb-3 text-sm font-semibold" style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c" }}>
              ⏰ As melhores cotas são contempladas rapidamente!
            </div>
            <p className="text-sm mb-4" style={{ color: "#6b7a99", lineHeight: 1.6 }}>
              Você utilizou suas 5 simulações gratuitas.<br />Fale agora com o especialista e garanta sua cota!
            </p>
            <a
              href={lockWppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-3.5 px-7 rounded-full text-sm font-extrabold tracking-wider text-white"
              style={{ background: "#25D366" }}
            >
              <WhatsAppIcon className="w-4 h-4" />
              🔥 Falar com Fabricio Agora
            </a>
          </div>
        )}
      </div>

      {/* WhatsApp flutuante */}
      <a
        href={`https://wa.me/55${wppDestino}?text=${encodeURIComponent(isIndicacao ? `Olá! Vi o simulador pela indicação de ${nomeIndicador} e gostaria de saber mais sobre consórcio.` : "Ola Fabricio! Gostaria de saber mais sobre consorcio.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed left-5 bottom-5 z-50 w-14 h-14 rounded-full flex items-center justify-center animate-pulse"
        style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,.5)" }}
        title={isIndicacao ? `Falar com ${nomeIndicador}` : "Falar com Fabricio"}
      >
        <WhatsAppIcon className="w-6 h-6 text-white" />
      </a>

      {/* CRM Drawer (Fabricio Enhancements) */}
      <CRMDrawer 
        onLoadLead={handleLoadLead} 
        onSaveSim={handleSaveSimToCRM} 
      />
    </div>
  );
}
