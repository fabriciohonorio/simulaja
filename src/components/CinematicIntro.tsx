import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Heart, 
  ChevronRight, 
  MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CinematicIntroProps {
  onClose: () => void;
}

const SEGMENTS = [
  {
    id: "imoveis",
    title: "IMÓVEIS",
    desc: "Casa, Apartamento, Construção, Comercial",
    img: "/intro/luxury_house_facade_1778269450928.webp",
    color: "#d4703f"
  },
  {
    id: "carros",
    title: "CARROS",
    desc: "Sedãs, SUVs, Hatchbacks, Picapes",
    img: "/intro/premium_car_garage_1778269468949.webp",
    color: "#6b5dd6"
  },
  {
    id: "motos",
    title: "MOTOS",
    desc: "Urbanas, Trail, Scooters, Esportivas",
    img: "/intro/urban_moto_night_1778269490027.webp",
    color: "#d4703f"
  },
  {
    id: "nautica",
    title: "NÁUTICA",
    desc: "Lanchas, Jet Skis, Barcos, Acessórios",
    img: "/intro/speedboat_sunset_1778269579296.webp",
    color: "#6b5dd6"
  },
  {
    id: "frotas",
    title: "FROTAS",
    desc: "Caminhões, Tratores, Máquinas Agrícolas, Utilitários",
    img: "/intro/modern_truck_highway_1778269632881.webp",
    color: "#d4703f"
  },
  {
    id: "agro",
    title: "AGRO",
    desc: "Terras, Maquinário, Pecuária, Infraestrutura",
    img: "/intro/agro_harvest_sunset_1778269711978.webp",
    color: "#6b5dd6"
  },
  {
    id: "investimentos",
    title: "INVESTIMENTOS",
    desc: "Previdência, Imóvel, Renda Fixa, Educação & Futuro",
    img: "/segment-investimento.png",
    color: "#d4703f"
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

                <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 uppercase leading-[0.9]">
                  O Especialista<br />
                  <span className="text-[#d4703f]">Consórcio</span>
                </h1>
                <p className="text-sm md:text-lg font-light tracking-[0.4em] text-white/40 uppercase mb-12">
                  Gestão & Inteligência Financeira
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
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                ) : (
                  <h2 className="text-xs font-black tracking-[0.5em] text-[#d4703f] uppercase">
                    Explore os Segmentos
                  </h2>
                )}
              </div>
              <button 
                onClick={handleClose}
                className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all group"
              >
                <X className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>
            </div>

            {/* Cinematic Grid */}
            <div className={`grid grid-cols-1 ${expandedId ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8 relative z-10`}>
              <AnimatePresence>
                {SEGMENTS.map((segment, index) => {
                  const isExpanded = expandedId === segment.id;
                  const anyExpanded = expandedId !== null;

                  if (anyExpanded && !isExpanded) return null;

                  return (
                    <motion.div
                      key={segment.id}
                      layoutId={segment.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        height: isExpanded ? "auto" : "400px"
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: isExpanded ? 0 : 0.1 + index * 0.1, duration: 0.8 }}
                      whileHover={!isExpanded ? { y: -5 } : {}}
                      className={`group relative rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black ${
                        isExpanded ? 'w-full max-w-5xl mx-auto' : 'cursor-pointer'
                      }`}
                      onClick={() => !isExpanded && setExpandedId(segment.id)}
                    >
                      {/* Background Image with Ken Burns */}
                      <motion.img 
                        src={segment.img} 
                        alt={segment.title}
                        decoding="async"
                        animate={{ scale: [1, 1.15] }}
                        transition={{ 
                          duration: 20, 
                          repeat: Infinity, 
                          repeatType: "reverse", 
                          ease: "linear" 
                        }}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000"
                      />
                      
                      {/* Cinematic Overlays */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent ${isExpanded ? 'opacity-95' : 'opacity-90 group-hover:opacity-60'}`} />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem]" />
                      
                      {/* Content */}
                      <div className={`relative z-10 p-10 flex flex-col ${isExpanded ? 'md:flex-row gap-12 min-h-[500px] items-center' : 'justify-end h-full'}`}>
                        <div className={`flex-1 ${isExpanded ? 'max-w-md' : ''}`}>
                          <motion.h3 
                            layout="position"
                            className={`${isExpanded ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'} font-black tracking-tight mb-3 text-white drop-shadow-2xl`}
                          >
                            {segment.title}
                          </motion.h3>
                          <motion.div layout="position" className="w-12 h-1 bg-[#d4703f] mb-4 transition-all duration-500 group-hover:w-24" />
                          <motion.p layout="position" className={`${isExpanded ? 'text-lg' : 'text-sm md:text-base'} text-white/70 mb-8 max-w-xs font-medium leading-relaxed drop-shadow-md`}>
                            {segment.desc}
                          </motion.p>
                          
                          {!isExpanded && (
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-all">
                              <span className="border-b border-white/20 group-hover:border-white transition-colors pb-1">Ver Opções</span>
                              <ChevronRight className="w-4 h-4 text-[#d4703f]" />
                            </div>
                          )}
                        </div>

                        {/* Subcategories Grid (2x2) */}
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex-1 w-full"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              {segment.subcategories.map((sub, i) => (
                                <motion.button
                                  key={sub}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.5 + i * 0.1 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectSub(segment.id, sub);
                                  }}
                                  className="p-8 text-left bg-white/5 border border-white/10 rounded-2xl hover:bg-[#d4703f]/20 hover:border-[#d4703f]/50 transition-all group/sub relative overflow-hidden"
                                >
                                  <div className="relative z-10">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover/sub:text-[#d4703f] transition-colors block mb-1">Explorar</span>
                                    <span className="text-xl font-bold text-white group-hover/sub:scale-110 transition-transform block">{sub}</span>
                                  </div>
                                  <ArrowRight className="absolute right-6 bottom-6 w-5 h-5 text-[#d4703f] opacity-0 group-hover/sub:opacity-100 transition-all -translate-x-4 group-hover/sub:translate-x-0" />
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Top Lighting Effect */}
                      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Background Decorative Element */}
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#d4703f]/5 blur-[150px] pointer-events-none -z-10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicIntro;
