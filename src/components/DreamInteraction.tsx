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
        @keyframes flicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.99; filter: brightness(1.2) contrast(1.1); }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; filter: brightness(2); }
        }
        @keyframes float-dream {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          50% { transform: translateY(-25px) scale(1.08) rotate(1deg); }
        }
        @keyframes scanline-dream {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .hologram-premium {
          filter: drop-shadow(0 0 30px rgba(0, 255, 255, 0.6)) brightness(1.1) contrast(1.2);
          mix-blend-mode: screen;
          animation: flicker 5s infinite, float-dream 8s ease-in-out infinite;
          border-radius: 20px;
          mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }
        .projection-beam-premium {
          background: linear-gradient(to top, rgba(0, 255, 255, 0.4), rgba(0, 255, 255, 0.1), transparent);
          clip-path: polygon(25% 100%, 75% 100%, 100% 0, 0 0);
          filter: blur(8px);
        }
        .dream-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle at center, rgba(0, 255, 255, 0.2), transparent 70%);
          pointer-events: none;
        }
      `}</style>

      {/* Interactive Zones over the paper checklist */}
      <div className="absolute inset-0 pointer-events-auto">
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

      {/* High-Quality Holographic Reveal */}
      {segments.map((seg) => (
        <div
          key={`hologram-${seg.id}`}
          className={`absolute transition-all duration-1000 ease-out flex flex-col items-center ${
            activeId === seg.id ? "opacity-100 translate-y-[-120px]" : "opacity-0 translate-y-0"
          }`}
          style={{ 
            top: "45%", 
            left: "75%", 
            width: "380px",
            transform: "translateX(-50%)"
          }}
        >
          {/* The Hologram Image Container */}
          <div className="relative w-full aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.3)]">
            <div className="dream-glow" />
            <img
              src={seg.image}
              alt={seg.label}
              className="w-full h-full object-cover hologram-premium"
            />
            {/* Scanlines overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
               <div className="absolute inset-x-0 h-[2px] bg-cyan-300/50 animate-[scanline-dream_3s_linear_infinite]" />
               <div className="absolute inset-x-0 h-[2px] bg-cyan-300/50 animate-[scanline-dream_4s_linear_infinite_reverse]" style={{ top: '50%' }} />
            </div>
          </div>

          {/* Projection Beam from the paper */}
          <div className={`projection-beam-premium w-48 h-80 mt-[-60px] transition-opacity duration-700 ${activeId === seg.id ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Coadjuvante Text Label */}
          <div className={`mt-2 transition-all duration-700 ${activeId === seg.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="text-[11px] font-black tracking-[0.4em] uppercase text-cyan-400 block text-center mb-1 drop-shadow-[0_0_8px_cyan] opacity-80">
              Sonho em Construção
            </span>
            <h3 className="text-5xl font-black text-white/50 italic uppercase tracking-tighter text-center leading-none">
              {seg.label}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamInteraction;
