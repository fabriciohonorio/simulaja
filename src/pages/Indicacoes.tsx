import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";

const BASE_URL = "https://simulaja.lovable.app";

export default function Indicacoes() {
  const [nome, setNome] = useState("");
  const [wpp, setWpp] = useState("");
  const [errNome, setErrNome] = useState(false);
  const [errWpp, setErrWpp] = useState(false);
  const [link, setLink] = useState("");
  const [copiado, setCopiado] = useState(false);

  const mascaraWpp = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setWpp(v);
  };

  const gerar = () => {
    const nomeOk = nome.trim().length > 0;
    const wppOk = wpp.replace(/\D/g, "").length >= 10;
    setErrNome(!nomeOk);
    setErrWpp(!wppOk);
    if (!nomeOk || !wppOk) return;

    const celular = wpp.replace(/\D/g, "");
    const nomeParam = encodeURIComponent(nome.trim());
    setLink(`${BASE_URL}/parceiro?ref=${celular}&nome=${nomeParam}`);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartilharWpp = () => {
    const msg = encodeURIComponent(
      `Olá! Faça uma simulação de consórcio sem compromisso pelo meu link:\n\n${link}\n\nÉ rápido e gratuito!`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16"
      style={{ background: "#f0f2f5", fontFamily: "'Inter', sans-serif" }}
    >
      <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: "#f47920" }}>
        Programa de Indicação
      </p>
      <h1
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mt-2 mb-2"
        style={{ color: "#0f2044", lineHeight: 1.18 }}
      >
        Indique e <em className="not-italic" style={{ color: "#f47920" }}>Ganhe</em>
      </h1>
      <p className="text-sm text-center max-w-md mb-8" style={{ color: "#6b7a99", lineHeight: 1.65 }}>
        Gere seu link exclusivo, compartilhe com amigos e acompanhe suas indicações.
      </p>

      <div
        className="w-full max-w-[520px] rounded-[22px] p-6 sm:p-8"
        style={{ background: "#fff", boxShadow: "0 4px 40px rgba(15,32,68,.10)" }}
      >
        <p className="text-sm font-bold mb-4" style={{ color: "#0f2044" }}>
          Preencha seus dados para gerar o link
        </p>

        <input
          type="text"
          placeholder="Seu nome completo *"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setErrNome(false); }}
          className="w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all"
          style={{ border: `1.5px solid ${errNome ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
        />
        {errNome && <p className="text-[0.7rem] mb-2 ml-0.5" style={{ color: "#dc2626" }}>Informe seu nome.</p>}
        {!errNome && <div className="mb-2.5" />}

        <input
          type="tel"
          placeholder="Seu WhatsApp *"
          value={wpp}
          onChange={(e) => { mascaraWpp(e.target.value); setErrWpp(false); }}
          className="w-full px-4 py-[15px] rounded-[10px] text-sm outline-none mb-1 transition-all"
          style={{ border: `1.5px solid ${errWpp ? "#dc2626" : "#e4e9f2"}`, color: "#0f2044" }}
        />
        {errWpp && <p className="text-[0.7rem] mb-2 ml-0.5" style={{ color: "#dc2626" }}>Informe um WhatsApp válido.</p>}
        {!errWpp && <div className="mb-2.5" />}

        <button
          onClick={gerar}
          className="w-full py-4 rounded-[10px] text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all"
          style={{ background: "#0f2044", color: "#fff", boxShadow: "0 4px 20px rgba(15,32,68,.25)" }}
        >
          <Share2 className="w-4 h-4" />
          Gerar Meu Link
        </button>

        {link && (
          <div className="mt-6 animate-fade-in">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#16a34a" }}>
              ✅ Seu link está pronto!
            </p>

            <div
              className="flex items-center gap-2 p-3 rounded-[10px] mb-4"
              style={{ background: "#f8fafd", border: "1.5px solid #e4e9f2" }}
            >
              <p className="flex-1 text-xs break-all font-mono" style={{ color: "#0f2044" }}>
                {link}
              </p>
              <button
                onClick={copiar}
                className="shrink-0 p-2 rounded-lg transition-all"
                style={{ background: copiado ? "#dcfce7" : "#e4e9f2" }}
              >
                {copiado ? <Check className="w-4 h-4" style={{ color: "#16a34a" }} /> : <Copy className="w-4 h-4" style={{ color: "#6b7a99" }} />}
              </button>
            </div>

            <button
              onClick={compartilharWpp}
              className="w-full py-3.5 rounded-full text-sm font-extrabold tracking-wider text-white flex items-center justify-center gap-2"
              style={{ background: "#25D366" }}
            >
              <WhatsAppIcon className="w-4 h-4" />
              Compartilhar no WhatsApp
            </button>

            <div
              className="mt-4 p-4 rounded-[10px] text-center"
              style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "#c2410c" }}>
                💡 Como funciona?
              </p>
              <p className="text-xs" style={{ color: "#6b7a99", lineHeight: 1.6 }}>
                Quando alguém simular pelo seu link, o lead será atribuído a você automaticamente.
                O botão de WhatsApp na página direcionará para o <strong>seu número</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
