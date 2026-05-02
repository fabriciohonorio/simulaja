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
        @keyframes flicker-giant {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.5; filter: brightness(1.2) contrast(1.5) drop-shadow(0 0 50px rgba(0, 255, 255, 0.4)); }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.15; filter: brightness(3); }
        }
        @keyframes float-giant {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          50% { transform: translateY(-40px) scale(1.03) rotate(1deg); }
        }
        @keyframes scanline-giant {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .hologram-giant {
          mix-blend-mode: lighten;
          mask-image: radial-gradient(circle at center, black 30%, transparent 90%);
          animation: flicker-giant 6s infinite, float-giant 12s ease-in-out infinite;
          filter: sepia(1) hue-rotate(160deg) brightness(1.4) contrast(1.4);
        }
        .projection-beam-giant {
          background: linear-gradient(to top, rgba(0, 255, 255, 0.25), rgba(0, 255, 255, 0.05), transparent);
          clip-path: polygon(40% 100%, 60% 100%, 100% 0, 0 0);
          filter: blur(25px);
        }
        .bg-dimmer {
          background: radial-gradient(circle at 75% 50%, rgba(13, 33, 79, 0.6), transparent 80%);
          transition: opacity 1s ease;
        }
      `}</style>

      {/* Dimmer overlay when active */}
      <div className={`absolute inset-0 bg-dimmer pointer-events-none z-0 ${activeId ? 'opacity-100' : 'opacity-0'}`} />

      {/* Interactive Zones over the paper checklist */}
      <div className="absolute inset-0 pointer-events-auto z-10">
        {segments.map((seg) => (
          <div
            key={seg.id}
            onMouseEnter={() => setActiveId(seg.id)}
            onMouseLeave={() => setActiveId(null)}
            onTouchStart={() => setActiveId(seg.id)}
            onTouchEnd={() => setActiveId(null)}
            className="absolute w-[250px] h-[40px] cursor-pointer"
            style={{ 
              top: seg.top, 
              left: seg.left, 
              transform: "perspective(1000px) rotateY(-20deg) rotateX(15deg) rotateZ(-12deg)",
            }}
          />
        ))}
      </div>

      {/* Giant Holographic Reveal */}
      {segments.map((seg) => (
        <div
          key={`hologram-${seg.id}`}
          className={`absolute transition-all duration-1000 ease-out flex flex-col items-center z-20 ${
            activeId === seg.id ? "opacity-100 translate-y-[-160px] scale-100" : "opacity-0 translate-y-0 scale-90"
          }`}
          style={{ 
            top: "40%", 
            left: "50%", 
            width: "90vw",
            maxWidth: "1000px",
            transform: "translateX(-50%)"
          }}
        >
          {/* The Giant Translucent Hologram Container */}
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
            <img
              src={seg.image}
              alt={seg.label}
              className="w-full h-full object-contain hologram-giant"
            />
            
            {/* Scanlines overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
               <div className="absolute inset-x-0 h-[3px] bg-cyan-300 animate-[scanline-giant_4s_linear_infinite]" />
            </div>
          </div>

          {/* Epic Projection Beam */}
          <div className={`projection-beam-giant w-full h-[600px] mt-[-100px] transition-opacity duration-1000 ${activeId === seg.id ? 'opacity-100' : 'opacity-0'}`} 
               style={{ maxWidth: '400px' }}
          />
          
          {/* Floating High-Tech Label */}
          <div className={`mt-[-150px] transition-all duration-1000 delay-200 ${activeId === seg.id ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex flex-col items-center">
                <div className="h-px w-24 bg-cyan-400/50 mb-4" />
                <h3 className="text-6xl md:text-9xl font-black text-white/20 italic uppercase tracking-[-0.05em] text-center leading-none">
                {seg.label}
                </h3>
                <span className="text-[12px] font-black tracking-[1em] uppercase text-cyan-400 mt-4 opacity-50">PROJEÇÃO DE SONHO</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamInteraction;
