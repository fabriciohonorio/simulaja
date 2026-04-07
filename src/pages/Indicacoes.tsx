import { useState, useRef, useEffect } from "react";

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

import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";

type GrupoItem = { grupo: string; credito: number; r50: number; prazo: number };

const GRUPOS: Record<string, GrupoItem[]> = {
  imovel: [
    { grupo: "6041", credito: 110000, r50: 405.9, prazo: 216 },
    { grupo: "6041", credito: 120000, r50: 442.8, prazo: 216 },
    { grupo: "6041", credito: 130000, r50: 479.69, prazo: 216 },
    { grupo: "6041", credito: 140000, r50: 516.59, prazo: 216 },
    { grupo: "6041", credito: 150000, r50: 553.49, prazo: 216 },
    { grupo: "6041", credito: 160000, r50: 590.39, prazo: 216 },
    { grupo: "6041", credito: 170000, r50: 627.29, prazo: 216 },
    { grupo: "6041", credito: 180000, r50: 664.19, prazo: 216 },
    { grupo: "6041", credito: 190000, r50: 701.09, prazo: 216 },
    { grupo: "6041", credito: 200000, r50: 737.99, prazo: 216 },
    { grupo: "6030", credito: 250000, r50: 941.72, prazo: 199 },
    { grupo: "6030", credito: 300000, r50: 1130.06, prazo: 199 },
    { grupo: "6035", credito: 350000, r50: 1286.42, prazo: 220 },
    { grupo: "6039", credito: 500000, r50: 1672.7, prazo: 230 },
    { grupo: "6039", credito: 700000, r50: 2341.78, prazo: 230 },
    { grupo: "6039", credito: 1000000, r50: 3043.0, prazo: 230 },
  ],
  veiculo: [
    { grupo: "5294", credito: 37000, r50: 276.62, prazo: 100 },
    { grupo: "5294", credito: 40000, r50: 299.04, prazo: 100 },
    { grupo: "5294", credito: 50000, r50: 373.80, prazo: 100 },
    { grupo: "5294", credito: 60000, r50: 448.56, prazo: 100 },
    { grupo: "5294", credito: 70000, r50: 523.31, prazo: 100 },
    { grupo: "5295", credito: 80000, r50: 575.99, prazo: 100 },
    { grupo: "5295", credito: 90000, r50: 647.99, prazo: 100 },
    { grupo: "5295", credito: 100000, r50: 719.99, prazo: 100 },
    { grupo: "5295", credito: 110000, r50: 791.99, prazo: 100 },
    { grupo: "5295", credito: 120000, r50: 863.99, prazo: 100 },
    { grupo: "5295", credito: 130000, r50: 935.98, prazo: 100 },
    { grupo: "5286", credito: 140000, r50: 1259.99, prazo: 100 },
    { grupo: "5286", credito: 150000, r50: 1349.99, prazo: 100 },
    { grupo: "5286", credito: 160000, r50: 1439.99, prazo: 100 },
  ],
  pesados: [
    { grupo: "5996", credito: 180000, r50: 932.64, prazo: 135 },
    { grupo: "5996", credito: 200000, r50: 1036.26, prazo: 135 },
    { grupo: "5996", credito: 250000, r50: 1295.33, prazo: 135 },
    { grupo: "5996", credito: 280000, r50: 1450.77, prazo: 135 },
    { grupo: "5996", credito: 300000, r50: 1554.4, prazo: 135 },
    { grupo: "5996", credito: 400000, r50: 2072.52, prazo: 135 },
    { grupo: "5996", credito: 500000, r50: 2590.66, prazo: 135 },
  ],
};

const CATEGORIAS = [
  { id: "imovel", label: "Imóvel / Investimento", icon: "🏠" },
  { id: "veiculo", label: "Moto / Veículos / Náutico", icon: "🚗" },
  { id: "pesados", label: "Pesados / Agrícola", icon: "🚛" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MAX_CONSULTAS = 5;

type HistItem = {
  credito: number; grupo: string; prazo: number; r50: number;
  nomeCliente: string; ts: string;
};

export default function Indicacoes() {
  // Partner
  const [pNome, setPNome] = useState("");
  const [pWpp, setPWpp] = useState("");
  const [errPNome, setErrPNome] = useState(false);
  const [errPWpp, setErrPWpp] = useState(false);

  // Simulator
  const [categoria, setCategoria] = useState("imovel");
  const [idx, setIdx] = useState(4);
  const [nomeCliente, setNomeCliente] = useState("");
  const [wppCliente, setWppCliente] = useState("");
  const [errNomeC, setErrNomeC] = useState(false);
  const [errWppC, setErrWppC] = useState(false);
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const lista = GRUPOS[categoria];
  const g = lista[idx];

  useEffect(() => { setIdx(Math.min(4, lista.length - 1)); }, [categoria]);

  const mascaraWpp = (value: string, setter: (v: string) => void) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setter(v);
  };

  const pct = lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0;

  const simular = async () => {
    // Validate partner
    const pNomeOk = pNome.trim().length > 0;
    const pWppOk = pWpp.replace(/\D/g, "").length >= 10;
    setErrPNome(!pNomeOk);
    setErrPWpp(!pWppOk);

    // Validate client
    const nomeOk = nomeCliente.trim().length > 0;
    const wppOk = wppCliente.replace(/\D/g, "").length >= 10;
    setErrNomeC(!nomeOk);
    setErrWppC(!wppOk);

    if (!pNomeOk || !pWppOk || !nomeOk || !wppOk) return;
    if (consultas >= MAX_CONSULTAS) { setBloqueado(true); return; }

    const novaConsulta = consultas + 1;
    setConsultas(novaConsulta);
    setResultado(g);

    setHistorico(prev => [...prev, {
      credito: g.credito, grupo: g.grupo, prazo: g.prazo, r50: g.r50,
      nomeCliente: nomeCliente.trim(),
      ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }]);

    let leadScoreValor = "baixo";
    if (g.credito >= 500000) leadScoreValor = "premium";
    else if (g.credito >= 200000) leadScoreValor = "alto";
    else if (g.credito >= 80000) leadScoreValor = "medio";

    try {
      await (supabase.from("leads") as any).insert({
        nome: nomeCliente.trim(),
        celular: wppCliente.replace(/\D/g, ""),
        tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo})`,
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        status: "novo",
        lead_score_valor: leadScoreValor,
        lead_temperatura: "quente",
        organizacao_id: "8b1a2dcc-83cd-4985-a828-f3870dcbc2a4",
        indicador_nome: pNome.trim(),
        indicador_celular: pWpp.replace(/\D/g, ""),
      });
    } catch (e) { console.warn("Supabase:", e); }

    try {
      await fetch("https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeCliente.trim(),
          celular: wppCliente,
          valor_credito: fmt(g.credito),
          tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo})`,
          pagina: window.location.href,
          origem: "indicacao",
          score: leadScoreValor,
          indicador_celular: pWpp.replace(/\D/g, ""),
          indicador_nome: pNome.trim(),
        }),
      });
    } catch (e) { console.warn("Webhook:", e); }

    toast.success("Em breve o especialista entrará em contato.", { duration: 5000 });

    if (novaConsulta >= MAX_CONSULTAS) setTimeout(() => setBloqueado(true), 700);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmt(h.credito)} — ${fmt(h.r50)} / ${h.prazo}m (${h.nomeCliente})`).join("\n");
  const lockWppUrl = `https://wa.me/55${pWpp.replace(/\D/g, "") || "5541997925357"}?text=${encodeURIComponent("Olá! Simulei para clientes:\n\n" + wppLockMsg + "\n\nQuero dar andamento!")}`;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16" style={{ background: "#f0f2f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{sliderThumbStyles}</style>
      {/* Hero */}
      <p className="text-xs font-bold tracking-[0.16em]" style={{ color: "#f47920" }}>Área do Parceiro</p>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mt-2 mb-2" style={{ color: "#0f2044", lineHeight: 1.18 }}>
        Simule para seu <em className="not-italic" style={{ color: "#f47920" }}>Cliente</em>
      </h1>
      <p className="text-sm text-center max-w-md mb-8" style={{ color: "#6b7a99", lineHeight: 1.65 }}>
        Identifique-se, preencha os dados do cliente e simule. O lead será atribuído ao seu nome automaticamente.
      </p>

      {/* Partner identification — compact */}
      <div className="w-full max-w-[580px] rounded-[22px] p-5 sm:p-6 mb-5" style={{ background: "#fff", boxShadow: "0 4px 40px rgba(15,32,68,.10)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff7ed" }}>
            <UserCheck className="w-4 h-4" style={{ color: "#f47920" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#0f2044" }}>Seus dados (indicador)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <input
              type="text"
              placeholder="Seu nome completo *"
              value={pNome}
              onChange={(e) => { setPNome(e.target.value); setErrPNome(false); }}
              className="w-full px-4 py-[13px] rounded-[10px] text-sm outline-none transition-all"
              style={{ border: `1.5px solid ${errPNome ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
            />
            {errPNome && <p className="text-[0.7rem] mt-1 ml-0.5" style={{ color: "#dc2626" }}>Informe seu nome.</p>}
          </div>
          <div>
            <input
              type="tel"
              placeholder="Seu WhatsApp *"
              value={pWpp}
              onChange={(e) => { mascaraWpp(e.target.value, setPWpp); setErrPWpp(false); }}
              className="w-full px-4 py-[13px] rounded-[10px] text-sm outline-none transition-all"
              style={{ border: `1.5px solid ${errPWpp ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
            />
            {errPWpp && <p className="text-[0.7rem] mt-1 ml-0.5" style={{ color: "#dc2626" }}>WhatsApp inválido.</p>}
          </div>
        </div>
      </div>

      {/* ─── Simulator Card (same as main page) ─── */}
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
          type="range" min={0} max={lista.length - 1} step={1} value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="custom-slider w-full h-3 rounded-full cursor-pointer appearance-none mb-2"
          style={{ background: `linear-gradient(to right, #0057a8 0%, #0057a8 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)` }}
        />
        <div className="flex justify-between text-xs mb-6" style={{ color: "#6b7a99" }}>
          <span>R$ {lista[0].credito.toLocaleString("pt-BR")}</span>
          <span>R$ {lista[lista.length - 1].credito.toLocaleString("pt-BR")}</span>
        </div>

        {/* Segments */}
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

        {/* Green installment card */}
        <div className="rounded-[14px] p-5 text-center mb-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
          <p className="text-[0.65rem] font-bold tracking-wider mb-1" style={{ color: "#15803d" }}>
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
                <p className="text-[0.58rem] tracking-wider mb-0.5" style={{ color: "#6b7a99" }}>{m.label}</p>
                <p className="text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace", color: "#0f2044" }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px mb-5" style={{ background: "#e4e9f2" }} />

        {/* Client form */}
        <p className="text-xs font-bold tracking-wider mb-3" style={{ color: "#0f2044" }}>📋 Dados do Cliente</p>

        <input
          type="text" placeholder="Nome do cliente *"
          value={nomeCliente}
          onChange={(e) => { setNomeCliente(e.target.value); setErrNomeC(false); }}
          className="w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all"
          style={{ border: `1.5px solid ${errNomeC ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
        />
        {errNomeC && <p className="text-[0.7rem] mb-2 ml-0.5" style={{ color: "#dc2626" }}>Informe o nome do cliente.</p>}
        {!errNomeC && <div className="mb-2.5" />}

        <input
          type="tel" placeholder="WhatsApp do cliente *"
          value={wppCliente}
          onChange={(e) => { mascaraWpp(e.target.value, setWppCliente); setErrWppC(false); }}
          className="w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all"
          style={{ border: `1.5px solid ${errWppC ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
        />
        {errWppC && <p className="text-[0.7rem] mb-2 ml-0.5" style={{ color: "#dc2626" }}>WhatsApp do cliente inválido.</p>}
        {!errWppC && <div className="mb-2.5" />}

        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#6b7a99" }}>
          <span style={{ color: "#0057a8", opacity: 0.75 }}>🕐</span>
          Saiba o valor da sua parcela após a contemplação.
        </div>

        <button
          onClick={simular}
          disabled={bloqueado}
          className="w-full py-4 rounded-[10px] text-base font-extrabold tracking-wider flex items-center justify-center gap-2.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed"
          style={{ background: "#f47920", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(244,121,32,.35)" }}
        >
          Simule Já
          <span>→</span>
        </button>

        <p className="text-center text-xs mt-3.5" style={{ color: "#6b7a99" }}>
          {pNome.trim() ? (
            <>Lead atribuído a <strong style={{ color: "#f47920" }}>{pNome.trim()}</strong></>
          ) : (
            <>Ao simular, você concorda com nossa <a href="#" className="underline" style={{ color: "#0057a8" }}>Política de Privacidade</a></>
          )}
        </p>

        {/* Result */}
        {resultado && (
          <div ref={resultRef} className="rounded-[14px] p-5 mt-5 animate-fade-in" style={{ background: "#0f2044" }}>
            <div className="text-[0.58rem] tracking-[0.12em] mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.38)" }}>
              ✅ Proposta confirmada
              <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>
            <div className="grid grid-cols-1 gap-2 rounded-[10px] overflow-hidden">
              <div className="py-3 px-3 text-center rounded-lg" style={{ background: "rgba(74,222,128,0.12)" }}>
                <p className="text-[0.65rem] tracking-wider mb-1 font-semibold" style={{ color: "#fff" }}>Parcela 50%</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "'DM Mono', monospace", color: "#4ade80" }}>{fmt(resultado.r50)}</p>
                <p className="text-[0.6rem] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>até contemplação</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="py-3 px-3 text-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[0.65rem] tracking-wider mb-1 font-semibold" style={{ color: "#fff" }}>Crédito</p>
                  <p className="text-base font-bold" style={{ fontFamily: "'DM Mono', monospace", color: "#fff" }}>{fmt(resultado.credito)}</p>
                </div>
                <div className="py-3 px-3 text-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[0.65rem] tracking-wider mb-1 font-semibold" style={{ color: "#fff" }}>Prazo</p>
                  <p className="text-base font-bold" style={{ fontFamily: "'DM Mono', monospace", color: "#fff" }}>{resultado.prazo} meses</p>
                </div>
              </div>
            </div>
            <div className="mt-3 py-2.5 px-3 rounded-lg text-center text-xs font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
              👨‍💼 Você será atendido pelo Especialista
            </div>
            <div className="mt-1.5 py-2 px-3 rounded-lg text-center text-[0.7rem]" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
              Lead atribuído a <strong style={{ color: "#ffa040" }}>{pNome.trim()}</strong> ✅
            </div>
          </div>
        )}

        {/* History */}
        {historico.length > 0 && (
          <div className="mt-4">
            <p className="text-[0.64rem] font-bold tracking-[0.1em] mb-2" style={{ color: "#6b7a99" }}>Suas simulações</p>
            {historico.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-[10px] mb-1.5 flex-wrap gap-2" style={{ background: "#fff", border: "1.5px solid #e4e9f2", borderLeft: "3px solid #f47920" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#0f2044" }}>{fmt(h.credito)}</p>
                  <p className="text-[0.67rem]" style={{ color: "#6b7a99" }}>Grupo {h.grupo} · {h.prazo} meses · {h.nomeCliente}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ fontFamily: "'DM Mono', monospace", color: "#16a34a" }}>{fmt(h.r50)}</p>
                  <p className="text-[0.67rem]" style={{ color: "#6b7a99" }}>Reduzida 50%</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lock */}
        {bloqueado && (
          <div className="rounded-[14px] p-7 text-center mt-5 animate-fade-in" style={{ background: "#fff", border: "2px solid #f47920", boxShadow: "0 4px 24px rgba(244,121,32,.1)" }}>
            <p className="text-3xl mb-2">🔐</p>
            <p className="text-lg font-extrabold mb-1.5" style={{ color: "#0f2044" }}>Limite atingido</p>
            <div className="rounded-lg py-2 px-3.5 mb-3 text-sm font-semibold" style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c" }}>
              ⏰ As melhores cotas são contempladas rapidamente!
            </div>
            <p className="text-sm mb-4" style={{ color: "#6b7a99", lineHeight: 1.6 }}>
              Você utilizou suas 5 simulações gratuitas.<br />Fale agora com o especialista!
            </p>
            <a
              href={lockWppUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-3.5 px-7 rounded-full text-sm font-extrabold tracking-wider text-white"
              style={{ background: "#25D366" }}
            >
              <WhatsAppIcon className="w-4 h-4" />
              🔥 Falar no WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
