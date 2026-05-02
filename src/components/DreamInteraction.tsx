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
        @keyframes flicker-holo {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.6; filter: brightness(1.2) contrast(1.5); }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.2; filter: brightness(3); }
        }
        @keyframes float-hologram {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          50% { transform: translateY(-30px) scale(1.05) rotate(2deg); }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .hologram-translucent {
          mix-blend-mode: lighten;
          mask-image: radial-gradient(circle at center, black 40%, transparent 85%);
          animation: flicker-holo 5s infinite, float-hologram 10s ease-in-out infinite;
          opacity: 0.7;
          filter: sepia(1) hue-rotate(160deg) brightness(1.5) contrast(1.3);
        }
        .hologram-lines {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.1) 3px,
            transparent 4px
          );
        }
        .projection-beam-translucent {
          background: linear-gradient(to top, rgba(0, 255, 255, 0.3), transparent);
          clip-path: polygon(30% 100%, 70% 100%, 100% 0, 0 0);
          filter: blur(15px);
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

      {/* Translucent Holographic Reveal */}
      {segments.map((seg) => (
        <div
          key={`hologram-${seg.id}`}
          className={`absolute transition-all duration-1000 ease-out flex flex-col items-center ${
            activeId === seg.id ? "opacity-100 translate-y-[-140px]" : "opacity-0 translate-y-0"
          }`}
          style={{ 
            top: "45%", 
            left: "75%", 
            width: "420px",
            transform: "translateX(-50%)"
          }}
        >
          {/* The Translucent Hologram Container */}
          <div className="relative w-full aspect-video flex items-center justify-center">
            <img
              src={seg.image}
              alt={seg.label}
              className="w-full h-full object-cover hologram-translucent"
            />
            {/* Holographic pattern overlay */}
            <div className="absolute inset-0 hologram-lines pointer-events-none rounded-full overflow-hidden" 
                 style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)' }} 
            />
            
            {/* Moving light sweep */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
              <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[sweep_4s_ease-in-out_infinite]" />
            </div>
          </div>

          {/* Soft Projection Beam */}
          <div className={`projection-beam-translucent w-56 h-96 mt-[-80px] transition-opacity duration-1000 ${activeId === seg.id ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Subtle Floating Label */}
          <div className={`mt-2 transition-all duration-1000 delay-100 ${activeId === seg.id ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-5xl font-black text-cyan-400/30 italic uppercase tracking-tighter text-center leading-none">
              {seg.label}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamInteraction;
