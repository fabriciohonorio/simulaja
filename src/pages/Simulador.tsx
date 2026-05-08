import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CRMDrawer } from "@/components/admin/CRMDrawer";
import { jsPDF } from "jspdf";
import { 
  Calculator, 
  ChevronRight, 
  TrendingDown, 
  CircleDollarSign,
  FileText,
  Share2,
  CheckCircle2
} from "lucide-react";

import { GRUPOS, CATEGORIAS, GrupoItem } from "@/components/ConsortiumSimulator";
import { createLead } from "@/services/leadService";

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
`;

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
  const initialSegment = searchParams.get("segmento") || "imovel";
  const isIndicacao = refCelular.length >= 10;
  const wppDestino = isIndicacao ? refCelular : "5541997925357";

  const [categoria, setCategoria] = useState(initialSegment);
  const [idx, setIdx] = useState(4);
  const [nome, setNome] = useState("");
  const [wpp, setWpp] = useState("");

  useEffect(() => {
    if (searchParams.get("segmento")) {
      setCategoria(searchParams.get("segmento")!);
    }
  }, [searchParams]);

  const [errNome, setErrNome] = useState(false);
  const [errWpp, setErrWpp] = useState(false);
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  
  const [lanceDinheiroPct, setLanceDinheiroPct] = useState(0);
  const [lanceEmbutidoPct, setLanceEmbutidoPct] = useState(0);
  const [incluirComp, setIncluirComp] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [simulationMode, setSimulationMode] = useState<"credit" | "installment">("credit");

  const resultRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);

  const lista = GRUPOS[categoria] || GRUPOS["imovel"];
  const g = lista[idx] || lista[0];

  useEffect(() => {
    setIdx(Math.min(4, lista.length - 1));
  }, [categoria, lista]);

  const mascaraWpp = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setWpp(v);
  };

  const pct = lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0;
  const isLinear = categoria === "servicos";

  const confirmar = async () => {
    const nomeOk = nome.trim().length > 0;
    const wppOk = wpp.replace(/\D/g, "").length >= 10;
    setErrNome(!nomeOk);
    setErrWpp(!wppOk);
    if (!nomeOk || !wppOk) return;
    
    if (consultas >= MAX_CONSULTAS) { 
      setBloqueado(true); 
      return; 
    }

    try {
      const { lead, score } = await createLead({
        nome: nome.trim(),
        celular: wpp,
        tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo})`,
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        categoria: categoria,
        origem: searchParams.get("utm_source") || (isIndicacao ? "indicacao" : "Página Simulador"),
        indicador_nome: isIndicacao ? refNome : undefined,
        indicador_celular: isIndicacao ? refCelular : undefined
      });

      const novaConsulta = consultas + 1;
      setConsultas(novaConsulta);
      setResultado(g);

      const item: HistItem = {
        credito: g.credito, 
        grupo: g.grupo, 
        prazo: g.prazo, 
        r50: g.r50,
        nome: nome.trim(),
        ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setHistorico(prev => [...prev, item]);

      toast({ 
        title: "✅ Simulação Realizada!", 
        description: `Score calculado: ${score.toUpperCase()}. Nosso especialista entrará em contato.` 
      });

      if (novaConsulta >= MAX_CONSULTAS) {
        setTimeout(() => setBloqueado(true), 700);
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (error: any) {
      toast({ 
        title: "Erro ao processar", 
        description: error.message || "Tente novamente em instantes.",
        variant: "destructive"
      });
    }
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
        tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo})`,
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
    const navy = [15, 30, 60];
    
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("O ESPECIALISTA CONSÓRCIO", 20, 25);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(16);
    doc.text("SIMULAÇÃO DE CONSÓRCIO", 20, 55);
    doc.setFontSize(12);
    doc.text(`Cliente: ${nome || 'Não informado'}`, 20, 65);
    
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
    addRow(isLinear ? "Parcela Linear:" : "Parcela 50%:", fmt(g.r50), true);
    
    doc.save(`simulacao_${nome.split(' ')[0] || 'cliente'}.pdf`);
    toast({ title: "PDF Gerado!" });
  };

  const handleShareWhatsApp = () => {
    if (!resultado) return;
    const text = `*📋 SIMULAÇÃO - O ESPECIALISTA*
*Crédito:* ${fmt(g.credito)}
*Parcela:* ${fmt(g.r50)}
*Prazo:* ${g.prazo} meses`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmt(h.credito)} — ${fmt(h.r50)}`).join("\n");
  const lockWppUrl = `https://wa.me/55${wppDestino}?text=${encodeURIComponent("Simulações:\n" + wppLockMsg)}`;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12" style={{ background: "#f0f2f5" }}>
      <style>{sliderThumbStyles}</style>
      
      <h1 className="text-3xl font-extrabold text-center mb-8" style={{ color: "#0f2044" }}>
        Simule seu Consórcio <span style={{ color: "#f47920" }}>em segundos</span>
      </h1>

      <div className="w-full max-w-[580px] bg-white rounded-[22px] p-8 shadow-xl">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Crédito Desejado</p>
          <p className="text-4xl font-black text-[#0f2044]">{fmt(g.credito)}</p>
        </div>

        <input
          type="range"
          min={0}
          max={lista.length - 1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="custom-slider w-full h-2 rounded-full appearance-none mb-8"
          style={{ background: `linear-gradient(to right, #0057a8 ${pct}%, #e2e8f0 ${pct}%)` }}
        />

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${categoria === cat.id ? 'bg-[#0f2044] text-white' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center mb-8">
          <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Parcela Estimada</p>
          <p className="text-4xl font-mono font-bold text-green-700">{fmt(g.r50)}</p>
        </div>

        <div className="space-y-4 mb-8">
          <Input placeholder="Nome Completo *" value={nome} onChange={e => setNome(e.target.value)} />
          <Input placeholder="WhatsApp *" value={wpp} onChange={e => mascaraWpp(e.target.value)} />
        </div>

        <Button onClick={confirmar} className="w-full h-14 bg-[#f47920] hover:bg-[#e66a10] text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-orange-200">
          Simular Agora <ChevronRight className="ml-2 w-5 h-5" />
        </Button>

        {resultado && (
          <div className="mt-8 p-6 border-2 border-[#0f2044] rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-[#0f2044] mb-4">Resultado da Simulação</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button onClick={handleExportPDF} variant="outline" className="border-[#0f2044] text-[#0f2044] font-bold">
                <FileText className="mr-2 w-4 h-4" /> PDF
              </Button>
              <Button onClick={handleShareWhatsApp} className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold">
                <Share2 className="mr-2 w-4 h-4" /> WHATSAPP
              </Button>
            </div>
          </div>
        )}

        {bloqueado && (
          <div className="mt-8 p-8 border-2 border-orange-500 rounded-2xl text-center bg-orange-50">
            <p className="text-2xl mb-2">🔐</p>
            <p className="font-bold text-[#0f2044] mb-4">Limite de Simulações Atingido</p>
            <Button asChild className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold w-full h-12">
              <a href={lockWppUrl} target="_blank" rel="noreferrer">Falar com Especialista</a>
            </Button>
          </div>
        )}
      </div>

      <CRMDrawer onLoadLead={handleLoadLead} onSaveSim={handleSaveSimToCRM} />
    </div>
  );
}
