import { useState } from "react";
import cardImovel from "@/assets/card-imovel.jpg";
import cardVeiculo from "@/assets/card-veiculo.jpg";
import cardMoto from "@/assets/card-moto.jpg";
import cardAgro from "@/assets/card-agro.jpg";
import cardNautica from "@/assets/card-nautica.jpg";
import cardInvest from "@/assets/card-investment-chalets.jpg";

const segments = [
  { id: "imovel", label: "Imóvel", image: cardImovel, top: "48%", left: "64%" },
  { id: "veiculo", label: "Veículo", image: cardVeiculo, top: "54%", left: "64%" },
  { id: "moto", label: "Moto", image: cardMoto, top: "60%", left: "64%" },
  { id: "caminhão", label: "Caminhão", image: cardAgro, top: "66%", left: "64%" },
  { id: "nautica", label: "Náutica", image: cardNautica, top: "72%", left: "64%" },
  { id: "investimento", label: "Investimento", image: cardInvest, top: "78%", left: "64%" },
];

interface DreamInteractionProps {
  activeId: string | null;
}

const DreamInteraction = ({ activeId }: DreamInteractionProps) => {
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
      `}</style>

      {/* No more internal trigger zones - they are now in Hero.tsx */}

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
          
          {/* Elegant Floating Label */}
          <div className="absolute bottom-[18%] flex flex-col items-center pointer-events-none">
            <h3 className="text-4xl md:text-8xl font-light text-white/40 italic uppercase tracking-[0.2em] leading-none mb-4">
              {seg.label}
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-cyan-400/30" />
              <span className="text-[10px] font-black tracking-[1.2em] uppercase text-cyan-400/60">PROJEÇÃO ESTRATÉGICA</span>
              <div className="h-[1px] w-12 bg-cyan-400/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamInteraction;
