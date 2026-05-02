import { useState } from "react";
import segHouse from "@/assets/segment-house.png";
import segCar from "@/assets/segment-car.png";
import segMoto from "@/assets/segment-motorcycle.png";
import segTractor from "@/assets/segment-tractor.png";
import segNautica from "@/assets/slide-jetski.jpeg";
import segInvest from "@/assets/segment-investment.png";

const segments = [
  { id: "imovel", label: "Imóvel", image: segHouse, top: "52%", left: "68%" },
  { id: "veiculo", label: "Veículo", image: segCar, top: "58%", left: "68%" },
  { id: "moto", label: "Moto", image: segMoto, top: "64%", left: "68%" },
  { id: "caminhao", label: "Caminhão", image: segTractor, top: "70%", left: "68%" },
  { id: "nautica", label: "Náutica", image: segNautica, top: "76%", left: "68%" },
  { id: "investimento", label: "Investimento", image: segInvest, top: "82%", left: "68%" },
];

const DreamInteraction = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <style>{`
        @keyframes flicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.99; filter: brightness(1); }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; filter: brightness(2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .hologram-effect {
          filter: drop-shadow(0 0 15px cyan) brightness(1.3) contrast(1.2) saturate(0.2) opacity(0.7);
          mix-blend-mode: screen;
          animation: flicker 4s infinite, float 6s ease-in-out infinite;
        }
        .projection-beam {
          background: linear-gradient(to top, rgba(0, 255, 255, 0.3), transparent);
          clip-path: polygon(20% 100%, 80% 100%, 100% 0, 0 0);
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
            className="absolute w-[180px] h-[32px] cursor-pointer"
            style={{ 
              top: seg.top, 
              left: seg.left, 
              transform: "perspective(1000px) rotateY(-20deg) rotateX(15deg) rotateZ(-12deg)",
            }}
          />
        ))}
      </div>

      {/* Holographic Reveal */}
      {segments.map((seg) => (
        <div
          key={`hologram-${seg.id}`}
          className={`absolute transition-all duration-700 ease-out flex flex-col items-center ${
            activeId === seg.id ? "opacity-100 translate-y-[-100px]" : "opacity-0 translate-y-0"
          }`}
          style={{ 
            top: "50%", 
            left: "75%", 
            width: "300px",
            transform: "translateX(-50%)"
          }}
        >
          {/* The Hologram Image */}
          <div className="relative group">
            <img
              src={seg.image}
              alt={seg.label}
              className="w-full max-h-[250px] object-contain hologram-effect"
            />
            {/* Scanlines overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
               <div className="absolute inset-x-0 h-px bg-cyan-400 animate-[scanline_2s_linear_infinite]" />
               <div className="absolute inset-x-0 h-px bg-cyan-400 animate-[scanline_2.5s_linear_infinite_reverse]" style={{ top: '50%' }} />
            </div>
          </div>

          {/* Projection Beam from the paper */}
          <div className={`projection-beam w-32 h-64 mt-[-50px] transition-opacity duration-500 ${activeId === seg.id ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Coadjuvante Text Label */}
          <div className={`mt-4 transition-all duration-500 ${activeId === seg.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-cyan-400 block text-center mb-1 drop-shadow-[0_0_5px_cyan]">Simulação de Sonho</span>
            <h3 className="text-4xl font-black text-white/40 italic uppercase tracking-tighter text-center">
              {seg.label}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamInteraction;
