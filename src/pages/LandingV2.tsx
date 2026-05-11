
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Home, 
  Car, 
  Bike, 
  Ship, 
  Truck, 
  Leaf, 
  TrendingUp, 
  ArrowRight, 
  ChevronLeft,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const segments = [
  {
    id: "imoveis",
    title: "IMÓVEIS",
    subtitle: "Casa, Apartamento, Construção, Comercial",
    subcategories: ["Casa", "Apartamento", "Construção", "Comercial"],
    img: "/intro/luxury_house_facade_1778269450928.webp",
    color: "#d4703f"
  },
  {
    id: "carros",
    title: "CARROS",
    subtitle: "Sedãs, SUVs, Hatchbacks, Picapes",
    subcategories: ["Sedãs", "SUVs", "Hatchbacks", "Picapes"],
    img: "/intro/premium_car_garage_1778269468949.webp",
    color: "#d4703f"
  },
  {
    id: "motos",
    title: "MOTOS",
    subtitle: "Urbanas, Trail, Scooters, Esportivas",
    subcategories: ["Urbanas", "Trail", "Scooters", "Esportivas"],
    img: "/intro/urban_moto_night_1778269490027.webp",
    color: "#d4703f"
  },
  {
    id: "nautica",
    title: "NÁUTICA",
    subtitle: "Lanchas, Jet Skis, Barcos, Acessórios",
    subcategories: ["Lanchas", "Jet Skis", "Barcos", "Acessórios"],
    img: "/intro/speedboat_sunset_1778269579296.webp",
    color: "#d4703f"
  },
  {
    id: "frotas",
    title: "FROTAS",
    subtitle: "Caminhões, Tratores, Máquinas Agrícolas, Utilitários",
    subcategories: ["Caminhões", "Tratores", "Maq. Agrícolas", "Utilitários"],
    img: "/intro/modern_truck_highway_1778269632881.webp",
    color: "#d4703f"
  },
  {
    id: "agro",
    title: "AGRO",
    subtitle: "Terras, Maquinário, Pecuária, Infraestrutura",
    subcategories: ["Terras", "Maquinário", "Pecuária", "Infraestrutura"],
    img: "/intro/agro_harvest_sunset_1778269711978.webp",
    color: "#d4703f"
  },
  {
    id: "investimentos",
    title: "INVESTIMENTOS",
    subtitle: "Previdência, Imóvel, Renda Fixa, Futuro",
    subcategories: ["Previdência", "Imóvel", "Renda Fixa", "Ed. & Futuro"],
    img: "/segment-investimento.png",
    color: "#d4703f"
  }
];

export default function LandingV2() {
  const [phase, setPhase] = useState<"entry" | "grid">("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStart = () => {
    setPhase("grid");
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(null);
  };

  const handleSelectSub = (segment: string, sub: string) => {
    // Navigate to the simulator with parameters
    navigate(`/simulador?segmento=${segment}&sub=${sub}`);
  };

  return (
    <div className="landing-v2 min-h-screen relative flex items-center justify-center p-4 selection:bg-[#d4703f]/30">
      <div className="grain-overlay" />
      
      {/* Decorative Blur Balls */}
      <div className="blur-ball w-[500px] h-[500px] bg-[#d4703f] top-[-10%] right-[-10%] animate-float" />
      <div className="blur-ball w-[400px] h-[400px] bg-[#6b5dd6] bottom-[5%] left-[-5%] animate-float-reverse opacity-20" />
      <div className="blur-ball w-[300px] h-[300px] bg-white top-[40%] left-[20%] animate-breath opacity-10" />

      <AnimatePresence mode="wait">
        {phase === "entry" ? (
          <motion.div 
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5 } }}
            onClick={handleStart}
            className="text-center z-10 cursor-pointer group"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-8 flex justify-center"
            >
              <div className="animate-pulse-heart">
                <Heart className="w-16 h-16 text-[#d4703f] fill-[#d4703f]" strokeWidth={1} />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-7xl md:text-9xl font-black tracking-tighter mb-4"
            >
              Consórcio
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-xl md:text-2xl font-light text-slate-400 tracking-[0.2em] uppercase"
            >
              Explore suas possibilidades
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ delay: 2, duration: 3, repeat: Infinity }}
              className="mt-12 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500"
            >
              Clique para continuar
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl z-10 py-12"
          >
            {/* Header / Back Button */}
            <div className="h-20 flex items-center mb-8">
              {expandedId && (
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={handleBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start relative">
              {segments.map((s, idx) => {
                const isExpanded = expandedId === s.id;
                const anyExpanded = expandedId !== null;

                return (
                  <motion.div
                    key={s.id}
                    layoutId={s.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ 
                      y: 0, 
                      opacity: anyExpanded ? (isExpanded ? 1 : 0.15) : 1,
                      scale: isExpanded ? 1.05 : 1,
                      zIndex: isExpanded ? 50 : 1
                    }}
                    transition={{ 
                      delay: idx * 0.1, 
                      duration: 0.8,
                      layout: { duration: 1, ease: [0.22, 1, 0.36, 1] }
                    }}
                    onClick={() => !isExpanded && setExpandedId(s.id)}
                    className={`glass-card p-10 cursor-pointer relative group overflow-hidden ${
                      isExpanded ? 'md:col-span-2 min-h-[400px] cursor-default' : ''
                    }`}
                    style={{ 
                      display: anyExpanded && !isExpanded ? 'none' : 'block',
                      width: isExpanded ? '100%' : 'auto',
                      background: 'black'
                    }}
                  >
                    {/* Background Image */}
                    <img 
                      src={s.img} 
                      alt={s.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-1000 group-hover:scale-110"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <div className={`relative z-10 flex flex-col h-full ${isExpanded ? 'md:flex-row gap-12 items-center' : ''}`}>
                      <div className={`flex-1 ${isExpanded ? 'max-w-md' : ''}`}>
                        <motion.h3 layout="position" className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-white drop-shadow-2xl">
                          {s.title}
                        </motion.h3>
                        
                        <motion.p layout="position" className="text-sm md:text-lg text-white/70 font-medium leading-relaxed mb-8 drop-shadow-md">
                          {s.subtitle}
                        </motion.p>

                        {!isExpanded && (
                          <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            whileHover={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-2 text-[#d4703f] text-[10px] font-black uppercase tracking-widest"
                          >
                            Explorar <ArrowRight className="w-3 h-3" />
                          </motion.div>
                        )}
                      </div>

                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex-1 w-full"
                        >
                          <div className="grid grid-cols-2 gap-0 border border-white/5">
                            {s.subcategories.map((sub, i) => (
                              <button
                                key={sub}
                                onClick={() => handleSelectSub(s.id, sub)}
                                className="p-8 text-left border border-white/5 hover:bg-white/5 transition-all group/sub relative"
                              >
                                <span className="text-xs font-bold text-slate-400 group-hover/sub:text-[#d4703f] transition-colors">{sub}</span>
                                <div className="absolute right-4 bottom-4 opacity-0 group-hover/sub:opacity-100 transition-all translate-x-[-10px] group-hover/sub:translate-x-0">
                                   <ArrowRight className="w-4 h-4 text-[#d4703f]" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {isExpanded && (
                      <button 
                        onClick={handleBack}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
