import { useState } from "react";
import cardImovel from "@/assets/card-imovel.jpg";
import cardVeiculo from "@/assets/card-veiculo.jpg";
import cardMoto from "@/assets/card-moto.jpg";
import cardAgro from "@/assets/card-agro.jpg";
import cardNautica from "@/assets/card-nautica.jpg";
import cardInvest from "@/assets/card-investimento.jpg";

const segments = [
  { id: "imovel", label: "Imóvel", image: cardImovel, top: "48%", left: "64%" },
  { id: "veiculo", label: "Veículo", image: cardVeiculo, top: "54%", left: "64%" },
  { id: "moto", label: "Moto", image: cardMoto, top: "60%", left: "64%" },
  { id: "caminhão", label: "Caminhão", image: cardAgro, top: "66%", left: "64%" },
  { id: "nautica", label: "Náutica", image: cardNautica, top: "72%", left: "64%" },
  { id: "investimento", label: "Investimento", image: cardInvest, top: "78%", left: "64%" },
];

const DreamInteraction = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <style>{`
        @keyframes flicker-fullscreen {
          0%, 100% { opacity: 0.6; filter: brightness(1.1) contrast(1.3) drop-shadow(0 0 80px rgba(0, 255, 255, 0.4)); }
          50% { opacity: 0.3; filter: brightness(2); }
        }
        @keyframes float-fullscreen {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.02); }
        }
        .hologram-fullscreen {
          mix-blend-mode: lighten;
          mask-image: radial-gradient(circle at center, black 20%, transparent 95%);
          animation: flicker-fullscreen 8s infinite, float-fullscreen 12s ease-in-out infinite;
          filter: sepia(1) hue-rotate(160deg) brightness(1.3) contrast(1.3);
          width: 100%;
          height: 100%;
          object-cover: cover;
        }
        .bg-dimmer-dark {
          background: rgba(13, 33, 79, 0.85);
          transition: opacity 0.8s ease;
        }
      `}</style>

      {/* Dimmer overlay when active */}
      <div className={`absolute inset-0 bg-dimmer-dark pointer-events-none z-0 ${activeId ? 'opacity-100' : 'opacity-0'}`} />

      {/* Interactive Zones over the paper checklist - ONLY ZONES ARE INTERACTIVE */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {segments.map((seg) => (
          <div
            key={seg.id}
            onMouseEnter={() => setActiveId(seg.id)}
            onMouseLeave={() => setActiveId(null)}
            onTouchStart={() => setActiveId(seg.id)}
            onTouchEnd={() => setActiveId(null)}
            className="absolute w-[250px] h-[40px] cursor-pointer pointer-events-auto"
            style={{ 
              top: seg.top, 
              left: seg.left, 
              transform: "perspective(1000px) rotateY(-20deg) rotateX(15deg) rotateZ(-12deg)",
            }}
          />
        ))}
      </div>

      {/* Fullscreen Holographic Reveal */}
      {segments.map((seg) => (
        <div
          key={`hologram-${seg.id}`}
          className={`absolute inset-0 transition-all duration-1000 ease-out flex items-center justify-center z-20 ${
            activeId === seg.id ? "opacity-100 scale-100" : "opacity-0 scale-110"
          }`}
        >
          <img
            src={seg.image}
            alt={seg.label}
            className="hologram-fullscreen"
          />
          
          {/* Huge Label */}
          <div className="absolute bottom-[15%] flex flex-col items-center pointer-events-none">
            <h3 className="text-8xl md:text-[15rem] font-black text-white/10 italic uppercase tracking-tighter leading-none">
              {seg.label}
            </h3>
            <span className="text-xs font-black tracking-[1.5em] uppercase text-cyan-400 mt-[-20px] opacity-40">PROJEÇÃO DO SEU SONHO</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamInteraction;
