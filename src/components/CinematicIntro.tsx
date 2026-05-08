import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ChevronRight, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CinematicIntroProps {
  onClose: () => void;
}

const SEGMENTS = [
  {
    id: "imoveis",
    title: "IMÓVEIS",
    desc: "Casa, Apartamento, Construção, Comercial",
    img: "/intro/luxury_house_facade_1778269450928.png",
  },
  {
    id: "carros",
    title: "CARROS",
    desc: "Sedãs, SUVs, Hatchbacks, Picapes",
    img: "/intro/premium_car_garage_1778269468949.png",
  },
  {
    id: "motos",
    title: "MOTOS",
    desc: "Urbanas, Trail, Scooters, Esportivas",
    img: "/intro/urban_moto_night_1778269490027.png",
  },
  {
    id: "nautica",
    title: "NÁUTICA",
    desc: "Lanchas, Jet Skis, Barcos, Acessórios",
    img: "/intro/speedboat_sunset_1778269579296.png",
  },
  {
    id: "frotas",
    title: "FROTAS",
    desc: "Caminhões, Tratores, Máquinas Agrícolas, Utilitários",
    img: "/intro/modern_truck_highway_1778269632881.png",
  },
  {
    id: "agro",
    title: "AGRO",
    desc: "Terras, Maquinário, Pecuária, Infraestrutura",
    img: "/intro/agro_harvest_sunset_1778269711978.png",
  },
  {
    id: "investimentos",
    title: "INVESTIMENTOS",
    desc: "Previdência, Imóvel, Renda Fixa, Educação & Futuro",
    img: "/segment-investimento.png",
  },
];

export default function CinematicIntro({ onClose }: CinematicIntroProps) {
  const [phase, setPhase] = useState<"entrance" | "grid">("entrance");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Auto-close after 60s of inactivity
    const timer = setTimeout(() => handleClose(), 60000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleEntranceClick = () => {
    setPhase("grid");
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-white overflow-hidden flex flex-col items-center justify-center font-sans"
        >
          {/* Grain Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          {/* Floating Blur Balls */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                x: [0, 100, 0], 
                y: [0, 50, 0],
                scale: [1, 1.2, 1] 
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-[#6b5dd6]/20 rounded-full blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                x: [0, -80, 0], 
                y: [0, 100, 0],
                scale: [1, 1.1, 1] 
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#d4703f]/20 rounded-full blur-[100px]" 
            />
          </div>

          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-8 right-8 z-[1010] p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:rotate-90"
          >
            <X className="w-6 h-6 text-white/60" />
          </button>

          <AnimatePresence mode="wait">
            {phase === "entrance" ? (
              <motion.div
                key="entrance"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={handleEntranceClick}
                className="relative z-10 flex flex-col items-center cursor-pointer text-center px-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8 p-6 rounded-full bg-gradient-to-br from-[#d4703f] to-[#6b5dd6] shadow-[0_0_50px_rgba(212,112,63,0.3)]"
                >
                  <Heart className="w-12 h-12 text-white fill-white" />
                </motion.div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                  Consórcio
                </h1>
                <p className="text-lg md:text-xl font-light tracking-[0.2em] text-white/60 uppercase mb-12">
                  Explore suas possibilidades
                </p>

                <div className="flex flex-col items-center gap-2 text-white/30">
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <MousePointer2 className="w-5 h-5" />
                  </motion.div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Clique para continuar</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full h-full overflow-y-auto pt-24 pb-12 px-6 md:px-12"
              >
                <div className="max-w-6xl mx-auto">
                  <div className="mb-12 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">O que você deseja conquistar?</h2>
                    <p className="text-white/40 font-medium">Selecione uma categoria para iniciar sua jornada imersiva</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SEGMENTS.map((segment, index) => (
                      <motion.div
                        key={segment.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1, duration: 0.8 }}
                        whileHover={{ y: -5 }}
                        className="group relative h-[300px] md:h-[350px] rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                        onClick={handleClose}
                      >
                        {/* Background Image */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                          style={{ backgroundImage: `url(${segment.img})` }}
                        />
                        
                        {/* Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-70" />
                        <div className="absolute inset-0 bg-[#0a0a0a]/20 group-hover:bg-[#d4703f]/10 transition-colors" />

                        {/* Content */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-[#d4703f] transition-colors">{segment.title}</h3>
                            <p className="text-sm text-white/60 mb-6 line-clamp-2 font-medium leading-relaxed">{segment.desc}</p>
                            
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#d4703f] group-hover:translate-x-2 transition-transform">
                              <span>Saber mais</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Border Glow */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#d4703f]/30 rounded-3xl transition-all" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
