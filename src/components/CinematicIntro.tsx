import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  MousePointer2,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CinematicIntroProps {
  onClose: () => void;
}

const SEGMENTS = [
  {
    id: "imoveis",
    title: "IMÓVEIS",
    desc: "Casa, Apartamento, Construção, Comercial",
    subcategories: ["Casa", "Apartamento", "Construção", "Comercial"],
    img: "/intro/luxury_house_facade_1778269450928.webp",
    color: "#d4703f"
  },
  {
    id: "carros",
    title: "CARROS",
    desc: "Sedãs, SUVs, Hatchbacks, Picapes",
    subcategories: ["Sedãs", "SUVs", "Hatchbacks", "Picapes"],
    img: "/intro/premium_car_garage_1778269468949.webp",
    color: "#6b5dd6"
  },
  {
    id: "motos",
    title: "MOTOS",
    desc: "Urbanas, Trail, Scooters, Esportivas",
    subcategories: ["Urbanas", "Trail", "Scooters", "Esportivas"],
    img: "/intro/urban_moto_night_1778269490027.webp",
    color: "#d4703f"
  },
  {
    id: "nautica",
    title: "NÁUTICA",
    desc: "Lanchas, Jet Skis, Barcos, Acessórios",
    subcategories: ["Lanchas", "Jet Skis", "Barcos", "Acessórios"],
    img: "/intro/speedboat_sunset_1778269579296.webp",
    color: "#6b5dd6"
  },
  {
    id: "frotas",
    title: "FROTAS",
    desc: "Caminhões, Tratores, Máquinas Agrícolas, Utilitários",
    subcategories: ["Caminhões", "Tratores", "Maq. Agrícolas", "Utilitários"],
    img: "/intro/modern_truck_highway_1778269632881.webp",
    color: "#d4703f"
  },
  {
    id: "agro",
    title: "AGRO",
    desc: "Terras, Maquinário, Pecuária, Infraestrutura",
    subcategories: ["Terras", "Maquinário", "Pecuária", "Infraestrutura"],
    img: "/intro/agro_harvest_sunset_1778269711978.webp",
    color: "#6b5dd6"
  },
  {
    id: "investimentos",
    title: "INVESTIMENTOS",
    desc: "Previdência, Imóvel, Renda Fixa, Educação & Futuro",
    subcategories: ["Previdência", "Imóvel", "Renda Fixa", "Ed. & Futuro"],
    img: "/segment-investimento.png",
    color: "#d4703f"
  },
];

export default function CinematicIntro({ onClose }: CinematicIntroProps) {
  const [phase, setPhase] = useState<"entrance" | "grid">("entrance");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 1000);
  };

  const handleSelectSub = (segment: string, sub: string) => {
    navigate(`/simulador?segmento=${segment}&sub=${sub}`);
    handleClose();
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-white overflow-y-auto font-sans"
        >
          {/* Grain Overlay */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
            
            {/* Header / Nav */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-[1010]">
              <div className="flex items-center gap-4">
                {expandedId ? (
                  <button 
                    onClick={() => setExpandedId(null)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                ) : phase === "grid" && (
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

            <AnimatePresence mode="wait">
              {phase === "entrance" ? (
                <motion.div
                  key="entrance"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setPhase("grid")}
                  className="flex flex-col items-center cursor-pointer text-center"
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
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
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
                  className="w-full max-w-7xl"
                >
                  <div className={`grid grid-cols-1 ${expandedId ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
                    <AnimatePresence>
                      {SEGMENTS.map((segment, index) => {
                        const isExpanded = expandedId === segment.id;
                        if (expandedId && !isExpanded) return null;

                        return (
                          <motion.div
                            key={segment.id}
                            layoutId={segment.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0, height: isExpanded ? "auto" : "400px" }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`group relative rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-black ${isExpanded ? 'w-full' : 'cursor-pointer'}`}
                            onClick={() => !isExpanded && setExpandedId(segment.id)}
                          >
                            <motion.img 
                              src={segment.img} 
                              animate={{ scale: [1, 1.15] }}
                              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                            
                            <div className={`relative z-10 p-10 flex flex-col ${isExpanded ? 'md:flex-row gap-12 min-h-[500px] items-center' : 'justify-end h-full'}`}>
                              <div className="flex-1">
                                <h3 className={`${isExpanded ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'} font-black tracking-tight mb-3 text-white`}>
                                  {segment.title}
                                </h3>
                                <div className="w-12 h-1 bg-[#d4703f] mb-4 transition-all duration-500 group-hover:w-24" />
                                <p className="text-white/70 mb-8 max-w-xs">{segment.desc}</p>
                                {!isExpanded && (
                                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-all">
                                    <span>Ver Opções</span>
                                    <ChevronRight className="w-4 h-4 text-[#d4703f]" />
                                  </div>
                                )}
                              </div>

                              {isExpanded && (
                                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                                  {segment.subcategories.map((sub, i) => (
                                    <motion.button
                                      key={sub}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.2 + i * 0.1 }}
                                      onClick={(e) => { e.stopPropagation(); handleSelectSub(segment.id, sub); }}
                                      className="p-8 text-left bg-white/5 border border-white/10 rounded-2xl hover:bg-[#d4703f]/20 hover:border-[#d4703f]/50 transition-all group/sub relative overflow-hidden"
                                    >
                                      <span className="text-xs font-black uppercase tracking-widest text-white/40 block mb-1">Explorar</span>
                                      <span className="text-xl font-bold text-white block">{sub}</span>
                                      <ArrowRight className="absolute right-6 bottom-6 w-5 h-5 text-[#d4703f] opacity-0 group-hover/sub:opacity-100 transition-all" />
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
