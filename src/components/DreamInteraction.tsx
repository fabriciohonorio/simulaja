import { useState } from "react";
import dreamHouse from "@/assets/dream/house.png";
import dreamCar from "@/assets/dream/car.png";
import dreamMoto from "@/assets/dream/moto.png";
import dreamAgro from "@/assets/dream/agro.png";
import dreamNautica from "@/assets/dream/nautica.png";
import dreamInvest from "@/assets/dream/invest.png";

const segments = [
  { id: "imovel", label: "Imóvel", image: dreamHouse, top: "52%", left: "68%" },
  { id: "veiculo", label: "Veículo", image: dreamCar, top: "58%", left: "68%" },
  { id: "moto", label: "Moto", image: dreamMoto, top: "64%", left: "68%" },
  { id: "caminhao", label: "Caminhão", image: dreamAgro, top: "70%", left: "68%" },
  { id: "nautica", label: "Náutica", image: dreamNautica, top: "76%", left: "68%" },
  { id: "investimento", label: "Investimento", image: dreamInvest, top: "82%", left: "68%" },
];

const DreamInteraction = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Interactive Zones over the paper */}
      <div className="absolute inset-0 pointer-events-auto">
        {segments.map((seg) => (
          <div
            key={seg.id}
            onMouseEnter={() => setActiveId(seg.id)}
            onMouseLeave={() => setActiveId(null)}
            onTouchStart={() => setActiveId(seg.id)}
            onTouchEnd={() => setActiveId(null)}
            className="absolute w-[200px] h-[35px] cursor-pointer"
            style={{ 
              top: seg.top, 
              left: seg.left, 
              transform: "perspective(1000px) rotateY(-20deg) rotateX(15deg) rotateZ(-12deg)",
            }}
          />
        ))}
      </div>

      {/* Dream Image Reveal Overlay */}
      {segments.map((seg) => (
        <div
          key={`img-${seg.id}`}
          className={`absolute inset-0 transition-all duration-1000 ease-out flex items-center justify-center ${
            activeId === seg.id ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-110 rotate-3"
          }`}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[70vh]">
            <img
              src={seg.image}
              alt={seg.label}
              className={`w-full h-full object-contain filter brightness-110 contrast-110 drop-shadow-[0_0_50px_rgba(201,169,106,0.5)] ${
                activeId === seg.id ? "animate-pulse-slow" : ""
              }`}
            />
            {/* Dreamy Glows */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D214F]/40 via-transparent to-transparent mix-blend-overlay" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,106,0.2),transparent_70%)]" />
          </div>
        </div>
      ))}

      {/* Futuristic Text Label (Coadjuvante) */}
      <div className="absolute top-[45%] right-[10%] pointer-events-none">
        {segments.map((seg) => (
          <div
            key={`label-${seg.id}`}
            className={`transition-all duration-500 transform ${
              activeId === seg.id 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-20"
            }`}
          >
             <div className="flex flex-col items-end">
                <span className="text-xs font-black tracking-[0.4em] uppercase text-[#C9A96A] mb-1">Desejo de</span>
                <h3 className="text-6xl md:text-8xl font-black text-white/20 italic uppercase leading-none tracking-tighter">
                  {seg.label}
                </h3>
             </div>
          </div>
        ))}
      </div>

      {/* Ambient particles/mist for dreamy effect */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${activeId ? 'opacity-40' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-scrolling" />
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); filter: brightness(1.1); }
          50% { transform: scale(1.02); filter: brightness(1.3); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes scrolling {
          from { background-position: 0 0; }
          to { background-position: 100% 100%; }
        }
        .animate-scrolling {
          animation: scrolling 100s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DreamInteraction;
