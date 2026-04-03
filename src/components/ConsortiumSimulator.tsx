import { useState, useEffect, useRef } from "react";

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

import { supabase } from "@/integrations/supabase/client";
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
  Info
} from "lucide-react";
import { WhatsAppIcon, InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon } from "./SocialIcons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useProfile } from "@/hooks/useProfile";

import fabricioReal from "@/assets/fabricio-real.jpg";
import heroBg from "@/assets/hero-bg.png";

import cardImovel from "@/assets/card-imovel.jpg";
import cardVeiculo from "@/assets/card-veiculo.jpg";
import cardMoto from "@/assets/card-moto.jpg";
import cardAgro from "@/assets/card-agro.jpg";
import cardInvestimento from "@/assets/card-investimento.jpg";
import cardNautica from "@/assets/card-nautica.jpg";

const WHATSAPP_LINK = "https://wa.me/55?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20cons%C3%B3rcio.";

type Category = { id: string; label: string; icon: string };
type GrupoItem = { grupo: string; credito: number; r50: number; prazo: number; tx?: number; fr?: number; };

const GRUPOS: Record<string, GrupoItem[]> = {
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

const CATEGORIAS: Category[] = [
  { id: "imovel", label: "Imóvel / Investimento", icon: "🏠" },
  { id: "veiculo", label: "Moto / Veículos / Náutico", icon: "🚗" },
  { id: "pesados", label: "Pesados / Agrícola", icon: "🚛" },
];

const MAX_CONSULTAS = 5;

type HistItem = { credito: number; grupo: string; prazo: number; r50: number; nome: string; ts: string };

const consortiumCards = [
  { title: "Consórcio Imobiliário", desc: "Casa própria, apartamento ou terreno com planejamento inteligente.", img: cardImovel },
  { title: "Consórcio de Veículos", desc: "SUV, sedan ou utilitário — sem juros e com poder de compra à vista.", img: cardVeiculo },
  { title: "Consórcio de Motos", desc: "A moto dos seus sonhos com parcelas que cabem no bolso.", img: cardMoto },
  { title: "Consórcio Náutico", desc: "Jet ski, lancha ou barco — realize o sonho náutico com planejamento.", img: cardNautica },
  { title: "Consórcio Agro", desc: "Tratores, máquinas e implementos para alavancar sua produção.", img: cardAgro },
  { title: "Consórcio para Investimento", desc: "Construa patrimônio com estratégia e sem juros bancários.", img: cardInvestimento },
];

interface ConsortiumSimulatorProps {
  overrideConfig?: {
    categorias: Category[];
    grupos: Record<string, GrupoItem[]>;
  };
  isInternal?: boolean;
}

const ConsortiumSimulator = ({ overrideConfig, isInternal }: ConsortiumSimulatorProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();

  const [dynamicCategorias, setDynamicCategorias] = useState<Category[]>(CATEGORIAS);
  const [dynamicGrupos, setDynamicGrupos] = useState<Record<string, GrupoItem[]>>(GRUPOS);

  useEffect(() => {
    if (overrideConfig) {
      setDynamicCategorias(overrideConfig.categorias);
      setDynamicGrupos(overrideConfig.grupos);
      return;
    }

    const fetchConfig = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const publicOrgId = urlParams.get("org");
      const targetOrgId = publicOrgId || profile?.organizacao_id;

      if (!targetOrgId) {
         setDynamicCategorias(CATEGORIAS);
         setDynamicGrupos(GRUPOS);
         return;
      }

      try {
        const { data } = await (supabase as any)
          .from("simulador_config")
          .select("*")
          .eq("organizacao_id", targetOrgId)
          .maybeSingle();
        
        if (data) {
          if (data.categorias) setDynamicCategorias(data.categorias);
          if (data.grupos) setDynamicGrupos(data.grupos);
        } else {
          const { data: masterData } = await (supabase as any)
            .from("simulador_config")
            .select("*")
            .order('updated_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (masterData) {
            setDynamicCategorias(masterData.categorias);
            setDynamicGrupos(masterData.grupos);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar simulador_config:", err);
      }
    };

    fetchConfig();
  }, [profile?.organizacao_id, overrideConfig]);

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

    // 1. Save to Supabase (CRM)
    try {
      console.log("Tentando salvar no CRM...", { nome: simNome, celular: simWpp });
      const { error: dbError } = await supabase.from("leads").insert({
        nome: simNome.trim(),
        celular: simWpp.replace(/\D/g, ""),
        tipo_consorcio: dynamicCategorias.find(c => c.id === categoria)?.label || categoria,
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        status: "novo_lead",
        lead_score_valor: leadScoreValor,
        lead_temperatura: "quente"
      });

      if (dbError) {
        console.error("❌ ERRO CRM:", dbError);
        toast({ 
          title: "Erro ao sincronizar CRM", 
          description: dbError.message || "Ocorreu um erro ao salvar o lead no banco de dados.",
          variant: "destructive"
        });
      } else {
        console.log("✅ Lead salvo no CRM!");
        toast({ title: "✅ Lead registrado no CRM com sucesso!" });
      }
    } catch (e: any) {
      console.error("🚨 CRITICAL EXCEPTION CRM:", e);
      toast({ title: "Erro Crítico", description: e.message, variant: "destructive" });
    }

    // 2. Webhook Make (Telegram/Notificações)
    try {
      const response = await fetch("https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: simNome.trim(),
          celular: simWpp,
          valor_credito: fmt(g.credito),
          tipo_consorcio: dynamicCategorias.find(c => c.id === categoria)?.label || categoria,
          pagina: window.location.href,
          origem: utmParams.origem || "Simulador Web",
          score: leadScoreValor,
        }),
      });
      
      if (response.ok) {
        console.log("✅ Webhook enviado!");
        toast({ title: "✅ Notificação enviada ao especialista!" });
      }
    } catch (e) {
      console.error("Webhook Error:", e);
    }

    if (novaConsulta >= MAX_CONSULTAS) setTimeout(() => setBloqueado(true), 700);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmtFull(h.credito)} — ${fmtFull(h.r50)} / ${h.prazo}m`).join("\n");
  const lockWppUrl = `https://wa.me/5541997925357?text=${encodeURIComponent("Olá Fabricio! Fiz simulações:\n\n" + wppLockMsg + "\n\nQuero mais informações!")}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{sliderThumbStyles}</style>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(213 70% 14%) 0%, hsl(213 50% 30%) 100%)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.1 }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="relative container max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left column */}
            <div className="text-white space-y-8 animate-fade-in-up">
              <div>
                <p className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-white/60 mb-3">
                  FABRICIO | Especialista em Consórcio
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                  CONSÓRCIO
                  <br />
                  <span className="text-secondary">INTELIGENTE</span>
                </h1>
                <p className="text-lg md:text-xl text-white/70 mt-5 max-w-lg leading-relaxed">
                  Imóveis, veículos e investimentos com planejamento financeiro e <strong className="text-white">sem juros</strong>.
                </p>
              </div>

              {/* Benefits list */}
              <ul className="space-y-3">
                {[
                  "Consórcio imobiliário",
                  "Consórcio de veículos",
                  "Consórcio de motos",
                  "Consórcio agro",
                  "Consórcio para investimento",
                  "Consórcio para Náutica",
                  "Cartas Contempladas",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/90">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-base md:text-lg">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#simulator"
                className="inline-flex items-center gap-3 bg-secondary hover:bg-secondary/90 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group"
              >
                SIMULAR CONSÓRCIO AGORA
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Right column — Specialist image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 bg-secondary/20 rounded-3xl blur-2xl" />
                <img
                  src={fabricioReal}
                  alt="Fabrício — Especialista em Consórcio"
                  className="relative w-full max-w-md lg:max-w-lg rounded-2xl shadow-2xl object-cover border-2 border-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOBRE O ESPECIALISTA ===== */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3">Sobre</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Consultoria <span className="text-primary">Especializada</span> em Consórcio
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ajudo pessoas a conquistarem imóveis, veículos e patrimônio utilizando o consórcio como estratégia financeira inteligente.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-4">
            Com planejamento correto é possível adquirir bens de alto valor <strong className="text-foreground">sem pagar juros</strong> e com segurança.
          </p>
        </div>
      </section>

      {/* ===== TIPOS DE CONSÓRCIO — Cards ===== */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, hsl(210 20% 96%) 0%, hsl(210 20% 98%) 100%)" }}>
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3 text-center">Segmentos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Tipos de Consórcio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {consortiumCards.map((card) => (
              <div
                key={card.title}
                className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">{card.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{card.desc}</p>
                  <a
                    href="#simulator"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors group/link"
                  >
                    SIMULAR
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SIMULADOR COMPLETO (inline) ===== */}
      <section id="simulator" className="py-20 bg-background">
        <div className="container max-w-[620px] mx-auto px-4">
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-center mb-2" style={{ color: "#f47920" }}>Simulador</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-2 text-foreground">
            Simule seu Consórcio <span className="text-primary">em segundos</span>
          </h2>
          <p className="text-sm text-center text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Descubra agora o valor do seu crédito, parcelas e o prazo ideal para o seu planejamento.
          </p>

          {/* Simulator Card */}
          <div className="rounded-[22px] p-6 sm:p-8 bg-card border border-border shadow-xl">
            {/* Slider */}
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

            {/* Segmentos */}
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



            {/* Formulário */}
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
              Saiba o valor da sua parcela após a contemplação.
            </div>

            <button
              onClick={confirmarSimulacao}
              disabled={bloqueado}
              className="w-full py-4 rounded-[10px] text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/90 text-white shadow-lg"
            >
              Simular Agora
              <ArrowRight className="w-5 h-5" />
            </button>



            <p className="text-center text-xs text-muted-foreground mt-3.5">
              Ao simular, você concorda com nossa <a href="#" className="text-primary underline hover:no-underline font-medium">Política de Privacidade</a>
            </p>

            {/* Resultado */}
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
                  {/* Row 1: Parcela Destaque */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                    <p className="text-[0.65rem] uppercase tracking-wider mb-1 font-bold text-green-700">Parcela Reduzida (50%)</p>
                    <p className="text-3xl font-black text-[#16a34a]" style={{ fontFamily: "monospace" }}>{fmtFull(resultado.r50)}</p>
                    <p className="text-[0.6rem] text-green-600 mt-1 uppercase font-medium">Investimento inteligente até a contemplação</p>
                  </div>

                  {/* Grid: Crédito e Prazo */}
                  <div className={`grid gap-3 ${isInternal && (resultado.tx !== undefined || resultado.fr !== undefined) ? 'grid-cols-4' : 'grid-cols-2'}`}>
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



                  {/* Comparativo */}
                  {incluirComp && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-4 h-4 text-secondary" />
                        <span className="text-[0.7rem] font-bold text-foreground uppercase">Comparativo com Financiamento</span>
                      </div>
                      
                      {(() => {
                        const isIm = categoria === 'imovel';
                        const taxaM = isIm ? 0.00887 : 0.025;
                        const pmtF = g.credito * taxaM / (1 - Math.pow(1 + taxaM, -g.prazo));
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
                </div>
              </div>
            )}

            {/* Histórico */}
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

            {/* Bloqueio */}
            {bloqueado && (
              <div className="rounded-[14px] p-7 text-center mt-5 animate-fade-in bg-card border-2 border-secondary shadow-lg">
                <p className="text-3xl mb-2">🔐</p>
                <p className="text-lg font-extrabold text-foreground mb-1.5">Limite atingido</p>
                <div className="rounded-lg py-2 px-3.5 mb-3 text-sm font-semibold bg-secondary/10 border border-secondary/30 text-secondary">
                  ⏰ As melhores cotas são contempladas rapidamente!
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
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
        </div>
      </section>

      {/* ===== DIFERENCIAL / CONSULTORIA ===== */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, hsl(210 20% 96%) 0%, hsl(210 20% 98%) 100%)" }}>
        <div className="container max-w-5xl mx-auto px-4">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3 text-center">Diferencial</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Consultoria <span className="text-primary">Inteligente</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Target, title: "Análise do melhor valor de carta", desc: "Análise do melhor valor de sua carta após a contemplação. Lucratividade com a venda da carta contemplada." },
              { icon: Clock, title: "Acompanhamento e estratégia de lance", desc: "Garante a agilidade e eficiência na contemplação com a melhor estratégia de lance." },
              { icon: Shield, title: "Planejamento Patrimonial", desc: "Após reunião e conversa com o cliente, alinhamos o melhor projeto capaz de entregar o bem de acordo com suas necessidades." },
              { icon: BarChart3, title: "Atendimento Completo", desc: "Atendimento pessoal e online de norte a sul, com as melhores tecnologias." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(213 70% 14%) 0%, hsl(213 50% 25%) 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative container max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Seu próximo patrimônio pode começar <span className="text-secondary">hoje</span>.
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Não espere mais. Simule seu consórcio ou fale diretamente com o especialista.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#simulator"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group"
            >
              Simular Consórcio
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02]"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Falar com Especialista
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-4" style={{ background: "hsl(213 70% 10%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                FABRICIO <span className="text-white/40">|</span> <span className="text-secondary">Especialista em Consórcio</span>
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Planejamento financeiro inteligente para conquistar seus bens sem juros abusivos.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Links</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="#simulator" className="hover:text-secondary transition-colors">Simular Consórcio</a></li>
                <li><a href="https://www.abac.org.br" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">ABAC — Associação Brasileira de Administradores de Consórcio</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Redes Sociais</h4>
              <div className="flex gap-3">
                {[
                  { icon: WhatsAppIcon, href: "https://wa.me/5541997925357", label: "WhatsApp", hoverBg: "hover:bg-[#25D366]" },
                  { icon: InstagramIcon, href: "https://instagram.com/fabricioespecialistaconsorcio", label: "Instagram", hoverBg: "hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]" },
                  { icon: TikTokIcon, href: "#", label: "TikTok", hoverBg: "hover:bg-white/20" },
                  { icon: FacebookIcon, href: "#", label: "Facebook", hoverBg: "hover:bg-[#1877F2]" },
                  { icon: LinkedInIcon, href: "#", label: "LinkedIn", hoverBg: "hover:bg-[#0A66C2]" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 ${social.hoverBg}`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-sm text-white/30">
            © {new Date().getFullYear()} Fabrício — Especialista em Consórcio Inteligente. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div >
  );
};

export default ConsortiumSimulator;
