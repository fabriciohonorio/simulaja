import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  BarChart3,
  Shield,
  Clock,
  Anchor,
  Award,
  CircleDollarSign,
  TrendingDown,
  Calculator,
  Info,
  Send,
  FileText
} from "lucide-react";
import { WhatsAppIcon } from './SocialIcons';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { useProfile } from "@/hooks/useProfile";

const sliderThumbStyles = `
  input[type=range].custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    background: #ffffff;
    border: 4px solid hsl(var(--secondary));
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
    background: hsl(var(--secondary));
    border-color: #ffffff;
  }
  input[type=range].custom-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    background: #ffffff;
    border: 4px solid hsl(var(--secondary));
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

export type GrupoItem = { grupo: string; credito: number; r50: number; prazo: number; tx?: number; fr?: number; };
export type Category = { id: string; label: string; icon: string; };

export const GRUPOS: Record<string, GrupoItem[]> = {
  imovel: [
    { grupo: "6040", credito: 110000, r50: 440.55, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 120000, r50: 480.60, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 130000, r50: 520.66, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 140000, r50: 560.71, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 150000, r50: 600.76, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 160000, r50: 640.81, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 170000, r50: 680.86, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 180000, r50: 720.91, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 190000, r50: 760.96, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 200000, r50: 801.01, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 210000, r50: 841.06, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6040", credito: 220000, r50: 881.11, prazo: 209, tx: 26, fr: 1 },
    { grupo: "6030", credito: 250000, r50: 1039.13, prazo: 198, tx: 25, fr: 1 },
    { grupo: "6030", credito: 260000, r50: 1080.70, prazo: 198, tx: 25, fr: 1 },
    { grupo: "6030", credito: 270000, r50: 1122.26, prazo: 198, tx: 25, fr: 1 },
    { grupo: "6030", credito: 280000, r50: 1163.83, prazo: 198, tx: 25, fr: 1 },
    { grupo: "6030", credito: 300000, r50: 1246.96, prazo: 198, tx: 25, fr: 1 },
    { grupo: "6035", credito: 320000, r50: 1197.94, prazo: 228, tx: 27, fr: 1 },
    { grupo: "6042", credito: 350000, r50: 1234.46, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 400000, r50: 1410.82, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 420000, r50: 1481.36, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 430000, r50: 1516.63, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 450000, r50: 1587.17, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 500000, r50: 1763.52, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 600000, r50: 2116.22, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 700000, r50: 2468.93, prazo: 240, tx: 26, fr: 1 },
    { grupo: "6042", credito: 1000000, r50: 3527.04, prazo: 240, tx: 26, fr: 1 },
  ],
  veiculo: [
    { grupo: "5294", credito: 37000, r50: 276.62, prazo: 99, tx: 20, fr: 1 },
    { grupo: "5294", credito: 40000, r50: 299.04, prazo: 99, tx: 20, fr: 1 },
    { grupo: "5294", credito: 50000, r50: 373.80, prazo: 99, tx: 20, fr: 1 },
    { grupo: "5294", credito: 60000, r50: 448.56, prazo: 99, tx: 20, fr: 1 },
    { grupo: "5294", credito: 70000, r50: 523.31, prazo: 99, tx: 20, fr: 1 },
    { grupo: "5295", credito: 80000, r50: 575.99, prazo: 100, tx: 18, fr: 1 },
    { grupo: "5295", credito: 90000, r50: 647.99, prazo: 100, tx: 18, fr: 1 },
    { grupo: "5295", credito: 100000, r50: 719.99, prazo: 100, tx: 18, fr: 1 },
    { grupo: "5295", credito: 110000, r50: 791.99, prazo: 100, tx: 18, fr: 1 },
    { grupo: "5295", credito: 120000, r50: 863.99, prazo: 100, tx: 18, fr: 1 },
    { grupo: "5295", credito: 130000, r50: 935.98, prazo: 100, tx: 18, fr: 1 },
    { grupo: "5286", credito: 140000, r50: 1259.99, prazo: 84, tx: 22, fr: 1 },
    { grupo: "5286", credito: 150000, r50: 1349.99, prazo: 84, tx: 22, fr: 1 },
    { grupo: "5286", credito: 160000, r50: 1439.99, prazo: 84, tx: 22, fr: 1 },
  ],
  pesados: [
    { grupo: "5998", credito: 180000, r50: 1309.29, prazo: 96, tx: 16, fr: 1 },
    { grupo: "5998", credito: 200000, r50: 1454.77, prazo: 96, tx: 16, fr: 1 },
    { grupo: "5998", credito: 220000, r50: 1600.24, prazo: 96, tx: 16, fr: 1 },
    { grupo: "5998", credito: 250000, r50: 1818.46, prazo: 96, tx: 16, fr: 1 },
    { grupo: "5998", credito: 280000, r50: 2036.68, prazo: 96, tx: 16, fr: 1 },
    { grupo: "5998", credito: 300000, r50: 2182.15, prazo: 96, tx: 16, fr: 1 },
    { grupo: "5998", credito: 350000, r50: 2545.84, prazo: 96, tx: 16, fr: 1 },
  ],
};

export const CATEGORIAS: Category[] = [
  { id: "imovel", label: "Imóvel / Investimento", icon: "🏠" },
  { id: "veiculo", label: "Moto / Veículos / Náutico", icon: "🚗" },
  { id: "pesados", label: "Pesados / Agrícola", icon: "🚛" },
];

const MAX_CONSULTAS = 5;

type HistItem = { credito: number; grupo: string; prazo: number; r50: number; nome: string; ts: string };


interface ConsortiumSimulatorProps {
  overrideConfig?: {
    categorias: Category[];
    grupos: Record<string, GrupoItem[]>;
  };
  isInternal?: boolean;
  onSimulateSubmit?: (leadData: {
    nome: string;
    celular: string;
    categoriaId: string;
    categoriaLabel: string;
    credito: number;
    prazo: number;
    r50: number;
    leadScoreValor: string;
  }) => void;
}

const ConsortiumSimulator = ({ overrideConfig, isInternal, onSimulateSubmit }: ConsortiumSimulatorProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();

  const dynamicCategorias = overrideConfig?.categorias || CATEGORIAS;
  const dynamicGrupos = overrideConfig?.grupos || GRUPOS;

  const [categoria, setCategoria] = useState("imovel");
  const [idx, setIdx] = useState(4);
  const [simNome, setSimNome] = useState("");
  const [simWpp, setSimWpp] = useState("");
  const [errNome, setErrNome] = useState(false);
  const [errWpp, setErrWpp] = useState(false);
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  
  const [lanceDinheiroPct, setLanceDinheiroPct] = useState(0);
  const [lanceEmbutidoPct, setLanceEmbutidoPct] = useState(0);
  const [incluirComp, setIncluirComp] = useState(true);

  const resultRef = useRef<HTMLDivElement>(null);

  const [utmParams, setUtmParams] = useState({ origem: "", meio: "", campanha: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      origem: params.get("utm_source") || "",
      meio: params.get("utm_medium") || "",
      campanha: params.get("utm_campaign") || "",
    });
  }, []);

  const lista = dynamicGrupos[categoria] || [];
  const safeIdx = Math.min(idx, lista.length > 0 ? lista.length - 1 : 0);
  const g = lista[safeIdx] || { grupo: "—", credito: 0, r50: 0, prazo: 0 };

  useEffect(() => {
    if (lista.length > 0) {
      setIdx(Math.min(4, lista.length - 1));
    }
  }, [categoria, lista.length]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const fmtFull = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const mascaraWpp = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setSimWpp(v);
  };

  const pct = lista.length > 1 ? (safeIdx / (lista.length - 1)) * 100 : 0;

  const handleExportPDF = () => {
    if (!resultado) return;
    
    const doc = new jsPDF();
    const primaryColor = "#0D214F";
    const accentColor = "#f47920";
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PROPOSTA DE CONSÓRCIO", 105, 25, { align: "center" });
    
    // Client Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Cliente: ${simNome || "Não informado"}`, 20, 55);
    doc.text(`WhatsApp: ${simWpp || "Não informado"}`, 20, 62);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 150, 55);
    
    // Simulation Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 75, 180, 100, 3, 3);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes da Simulação", 25, 87);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Crédito:", 25, 100);
    doc.setFont("helvetica", "bold");
    doc.text(fmtFull(resultado.credito), 80, 100);
    
    doc.setFont("helvetica", "normal");
    doc.text("Prazo:", 25, 110);
    doc.setFont("helvetica", "bold");
    doc.text(`${resultado.prazo} meses`, 80, 110);
    
    doc.setFont("helvetica", "normal");
    doc.text("Parcela Reduzida (50%):", 25, 120);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#16a34a");
    doc.text(fmtFull(resultado.r50), 80, 120);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    if (resultado.tx) {
        doc.text("Taxa Administrativa:", 25, 130);
        doc.text(`${resultado.tx}%`, 80, 130);
    }
    
    if (resultado.fr) {
        doc.text("Fundo de Reserva:", 25, 140);
        doc.text(`${resultado.fr}%`, 80, 140);
    }
    
    if (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Estratégia de Lance:", 25, 155);
        doc.setFont("helvetica", "normal");
        const lanceTotal = resultado.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100;
        doc.text(`Total: ${fmtFull(lanceTotal)} (${lanceDinheiroPct + lanceEmbutidoPct}%)`, 80, 155);
    }
    
    // Footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("www.oespecialistaconsorcio.com.br", 105, 288, { align: "center" });
    
    doc.save(`simulacao_consorcio_${simNome.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    
    toast({
        title: "PDF Gerado!",
        description: "A proposta foi baixada com sucesso.",
    });
  };

  const confirmarSimulacao = async () => {
    const nomeOk = simNome.trim().length > 0;
    const wppOk = simWpp.replace(/\D/g, "").length >= 10;
    setErrNome(!nomeOk);
    setErrWpp(!wppOk);
    if (!nomeOk || !wppOk) return;
    if (consultas >= MAX_CONSULTAS) { setBloqueado(true); return; }

    const novaConsulta = consultas + 1;
    setConsultas(novaConsulta);
    setResultado(g);

    const item: HistItem = {
      credito: g.credito, grupo: g.grupo, prazo: g.prazo, r50: g.r50,
      nome: simNome.trim(),
      ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    setHistorico(prev => [...prev, item]);

    // Lead Score Logic
    let leadScoreValor = "baixo";
    if (g.credito >= 500000) leadScoreValor = "premium";
    else if (g.credito >= 200000) leadScoreValor = "alto";
    else if (g.credito >= 80000) leadScoreValor = "medio";

    if (onSimulateSubmit && !isInternal) {
      onSimulateSubmit({
        nome: simNome.trim(),
        celular: simWpp,
        categoriaId: categoria,
        categoriaLabel: dynamicCategorias.find(c => c.id === categoria)?.label || categoria,
        credito: g.credito,
        prazo: g.prazo,
        r50: g.r50,
        leadScoreValor
      });
    }

    if (novaConsulta >= MAX_CONSULTAS) setTimeout(() => setBloqueado(true), 700);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmtFull(h.credito)} — ${fmtFull(h.r50)} / ${h.prazo}m`).join("\n");
  const lockWppUrl = `https://wa.me/5541997925357?text=${encodeURIComponent("Olá Fabricio! Fiz simulações:\n\n" + wppLockMsg + "\n\nQuero mais informações!")}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{sliderThumbStyles}</style>
      <section id="simulator" className="py-20 bg-background">
        <div className="container max-w-[620px] mx-auto px-4">
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-center mb-2" style={{ color: "#f47920" }}>Simulador</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-2 text-foreground">
            Simule seu Consórcio <span className="text-primary">em segundos</span>
          </h2>
          <p className="text-sm text-center text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Descubra agora o valor do seu crédito, parcelas e o prazo ideal para o seu planejamento.
          </p>

          <div className="rounded-[22px] p-6 sm:p-8 bg-card border border-border shadow-xl">
            <p className="text-xs font-semibold text-center mb-2 text-muted-foreground">Valor do crédito desejado</p>
            <div className="text-center mb-5">
              <span className="text-sm font-bold mr-1 text-muted-foreground">R$</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground" style={{ letterSpacing: "-0.03em" }}>
                {g.credito.toLocaleString("pt-BR")}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={lista.length - 1}
              step={1}
              value={safeIdx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="custom-slider w-full h-3 rounded-full cursor-pointer appearance-none mb-2"
              style={{
                background: `linear-gradient(to right, hsl(var(--secondary)) 0%, hsl(var(--secondary)) ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground mb-6">
              <span>R$ {lista[0].credito.toLocaleString("pt-BR")}</span>
              <span>R$ {lista[lista.length - 1].credito.toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {dynamicCategorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoria(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all border ${categoria === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary hover:text-primary"
                    }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {isInternal && (
              <>
                <div className="rounded-[14px] p-5 text-center mb-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-1" style={{ color: "#15803d" }}>
                    Parcela reduzida 50% <span style={{ color: "#4ade80", fontWeight: 400 }}>· até a contemplação</span>
                  </p>
                  <p className="text-3xl sm:text-4xl font-medium" style={{ fontFamily: "monospace", color: "#16a34a" }}>
                    {fmtFull(g.r50)}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:gap-2 mt-3.5 gap-2">
                    {[
                      { label: "Crédito", value: fmt(g.credito) },
                      { label: "Prazo", value: `${g.prazo} meses` },
                      { label: "Grupo", value: g.grupo },
                      ...(isInternal && g.tx !== undefined ? [{ label: "Tx Adm", value: `${g.tx}%` }] : []),
                      ...(isInternal && g.fr !== undefined ? [{ label: "F. Reserva", value: `${g.fr}%` }] : [])
                    ].map((m) => (
                      <div key={m.label} className="bg-white rounded-lg py-2 px-2.5 text-center border border-green-100 shadow-sm">
                        <p className="text-[0.58rem] uppercase tracking-wider mb-0.5 text-muted-foreground whitespace-nowrap">{m.label}</p>
                        <p className="text-sm font-bold text-foreground" style={{ fontFamily: "monospace" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-border mb-5" />
              </>
            )}

            <input
              type="text"
              placeholder="Seu nome completo *"
              value={simNome}
              onChange={(e) => { setSimNome(e.target.value); setErrNome(false); }}
              className={`w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all bg-background text-foreground border ${errNome ? "border-destructive" : "border-border"} focus:border-primary focus:ring-1 focus:ring-primary/20`}
            />
            {errNome && <p className="text-xs text-destructive mb-2 ml-0.5">Por favor, informe seu nome.</p>}
            {!errNome && <div className="mb-2.5" />}

            <input
              type="tel"
              placeholder="Seu WhatsApp *"
              value={simWpp}
              onChange={(e) => { mascaraWpp(e.target.value); setErrWpp(false); }}
              className={`w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all bg-background text-foreground border ${errWpp ? "border-destructive" : "border-border"} focus:border-primary focus:ring-1 focus:ring-primary/20`}
            />
            {errWpp && <p className="text-xs text-destructive mb-2 ml-0.5">Por favor, informe um WhatsApp válido.</p>}
            {!errWpp && <div className="mb-2.5" />}

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Clock className="w-3.5 h-3.5 text-primary opacity-75" />
              Após clicar em SIMULAR AGORA, você terá o valor da sua simulação.
            </div>

            <button
              onClick={confirmarSimulacao}
              disabled={bloqueado}
              className="w-full py-4 rounded-[10px] text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/90 text-white shadow-lg"
            >
              Simular Agora
              <ArrowRight className="w-5 h-5" />
            </button>

            {isInternal && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <CircleDollarSign className="w-5 h-5 text-secondary" />
                  <h3 className="font-bold text-foreground">Estratégia de Lance (Opcional)</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Lance Dinheiro (%)</label>
                    <Input 
                      type="number" 
                      value={lanceDinheiroPct || ""} 
                      onChange={(e) => setLanceDinheiroPct(Number(e.target.value))}
                      placeholder="Ex: 20"
                      className="rounded-lg bg-muted/50 border-border text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Lance Embutido (%)</label>
                    <Input 
                      type="number" 
                      value={lanceEmbutidoPct || ""} 
                      onChange={(e) => setLanceEmbutidoPct(Number(e.target.value))}
                      placeholder="Ex: 10"
                      className="rounded-lg bg-muted/50 border-border text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {resultado && (
              <div ref={resultRef} className="rounded-[18px] p-0 mt-8 animate-fade-in overflow-hidden border-2 border-primary bg-card shadow-xl">
                <div className="bg-primary p-4 text-white">
                  <div className="text-[0.6rem] uppercase tracking-[0.15em] mb-1 font-bold flex items-center justify-between opacity-80">
                    <span>PROPOSTA GERADA PELO CONSULTOR</span>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold">Simulação Detalhada</h3>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                    <p className="text-[0.65rem] uppercase tracking-wider mb-1 font-bold text-green-700">Parcela Reduzida (50%)</p>
                    <p className="text-3xl font-black text-[#16a34a]" style={{ fontFamily: "monospace" }}>{fmtFull(resultado.r50)}</p>
                    <p className="text-[0.6rem] text-green-600 mt-1 uppercase font-medium">Investimento inteligente até a contemplação</p>
                  </div>

                  <div className={`grid gap-3 ${isInternal && (resultado.tx !== undefined || resultado.fr !== undefined) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                    <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                      <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1">Crédito</p>
                      <p className="text-lg font-bold text-foreground">{fmtFull(resultado.credito)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                      <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1">Prazo</p>
                      <p className="text-lg font-bold text-foreground">{resultado.prazo} meses</p>
                    </div>
                    {isInternal && resultado.tx !== undefined && (
                      <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                        <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1 whitespace-nowrap">Taxa Adm</p>
                        <p className="text-lg font-bold text-foreground">{resultado.tx}%</p>
                      </div>
                    )}
                    {isInternal && resultado.fr !== undefined && (
                      <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                        <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1 whitespace-nowrap">F. Reserva</p>
                        <p className="text-lg font-bold text-foreground">{resultado.fr}%</p>
                      </div>
                    )}
                  </div>

                  {(lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        <span className="text-[0.7rem] font-bold text-blue-800 uppercase">Estratégia de Lance</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-blue-900">
                        <span>Total do Lance ({lanceDinheiroPct + lanceEmbutidoPct}%)</span>
                        <span>{fmtFull(resultado.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100)}</span>
                      </div>
                    </div>
                  )}

                  {incluirComp && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-4 h-4 text-secondary" />
                        <span className="text-[0.7rem] font-bold text-foreground uppercase">Comparativo com Financiamento</span>
                      </div>
                      
                      {(() => {
                        const isIm = categoria === 'imovel';
                        const taxaM = isIm ? 0.00887 : 0.025;
                        const pmtF = resultado.credito * taxaM / (1 - Math.pow(1 + taxaM, -resultado.prazo));
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                              <span>Parcela Banco (Price)</span>
                              <span className="font-mono line-through opacity-70">~ {fmtFull(pmtF)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-[#16a34a] bg-green-50 p-2 rounded-lg">
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sua Parcela Aqui</span>
                              <span className="font-mono">{fmtFull(resultado.r50)}</span>
                            </div>
                            <div className="flex justify-between text-[12px] font-black text-blue-900 border-t border-dashed border-border pt-2">
                              <span>Economia Mensal:</span>
                              <span className="text-lg">+{fmtFull(pmtF - resultado.r50)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="pt-2 text-center text-[0.7rem] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    Para condições especiais e lances personalizados <strong className="text-secondary">fale com o especialista ✉️</strong>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-4">
                    <button
                      onClick={() => {
                        let msg = `*Simulação de Consórcio*\n\n`;
                        msg += `*Crédito:* ${fmtFull(resultado.credito)}\n`;
                        msg += `*Prazo:* ${resultado.prazo} meses\n`;
                        msg += `*Parcela Reduzida (50%):* ${fmtFull(resultado.r50)}\n\n`;
                        if (resultado.tx !== undefined) msg += `*Taxa Adm:* ${resultado.tx}%\n`;
                        if (resultado.fr !== undefined) msg += `*Fundo Reserva:* ${resultado.fr}%\n`;
                        if (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) {
                            msg += `*Estratégia de Lance:* ${lanceDinheiroPct + lanceEmbutidoPct}%\n`;
                        }
                        msg += `\n_Para mais detalhes, visite: www.oespecialistaconsorcio.com.br_`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="flex-1 py-3.5 rounded-[10px] text-sm font-extrabold flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg transition-all"
                    >
                      <WhatsAppIcon className="w-5 h-5 shrink-0" />
                      <span className="inline-block">Enviar</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex-1 py-3.5 rounded-[10px] text-sm font-extrabold flex items-center justify-center gap-2.5 bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all"
                    >
                      <FileText className="w-5 h-5 shrink-0" />
                      <span>Baixar PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {historico.length > 0 && (
              <div className="mt-4">
                <p className="text-[0.64rem] font-bold tracking-[0.1em] uppercase mb-2 text-muted-foreground">Suas simulações</p>
                {historico.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-[10px] mb-1.5 flex-wrap gap-2 bg-card border border-border" style={{ borderLeft: "3px solid hsl(var(--secondary))" }}>
                    <div>
                      <p className="font-bold text-sm text-foreground">{fmt(h.credito)}</p>
                      <p className="text-[0.67rem] text-muted-foreground">Grupo {h.grupo} · {h.prazo} meses · {h.ts}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ fontFamily: "monospace", color: "#16a34a" }}>{fmtFull(h.r50)}</p>
                      <p className="text-[0.67rem] text-muted-foreground">Reduzida 50%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bloqueado && (
              <div className="rounded-[14px] p-7 text-center mt-5 animate-fade-in bg-card border-2 border-secondary shadow-lg">
                <p className="text-3xl mb-2">🔐</p>
                <p className="text-lg font-extrabold text-foreground mb-1.5">Limite atingido</p>
                <div className="rounded-lg py-2 px-3.5 mb-3 text-sm font-semibold bg-secondary/10 border border-secondary/30 text-secondary">
                  ⏰ As melhores cotas são contempladas rapidamente!
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Você utilizou suas {MAX_CONSULTAS} simulações gratuitas.<br />Fale agora com o especialista e garanta sua cota!
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
        </div>
      </section>
    </div>
  );
};

export default ConsortiumSimulator;
