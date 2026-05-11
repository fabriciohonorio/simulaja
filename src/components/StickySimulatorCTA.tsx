import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Sticky header with CTA for the simulator.
 * Appears after 800px of scroll to encourage conversion.
 */
export const StickySimulatorCTA = () => {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky after 800px of scroll
      setShowSticky(window.scrollY > 800);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showSticky) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-0 left-0 right-0 z-[60] bg-[#0f172a]/95 backdrop-blur border-b border-white/5"
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60 hidden sm:block">Pronto para simular?</p>
          <p className="text-white font-semibold text-sm sm:text-base">Clique abaixo e descubra seu consórcio ideal</p>
        </div>
        <button 
          onClick={() => {
            window.location.href = "/simulador";
          }}
          className="px-4 py-2 sm:px-6 sm:py-2 bg-[#d4703f] text-white rounded-lg font-semibold hover:bg-[#ff7a00] transition-colors whitespace-nowrap text-xs sm:text-sm"
        >
          Simular Agora
        </button>
      </div>
    </motion.div>
  );
};
