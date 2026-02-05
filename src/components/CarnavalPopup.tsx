import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import carnavalImage from "@/assets/carnaval-promo.png";

const POPUP_STORAGE_KEY = "carnaval_popup_shown";

const CarnavalPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const wasShown = localStorage.getItem(POPUP_STORAGE_KEY);
    if (wasShown) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem(POPUP_STORAGE_KEY, "true");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleSimularClick = () => {
    setIsVisible(false);
    const simulator = document.getElementById("simulator");
    if (simulator) {
      simulator.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Floating Popup */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[90vw] sm:w-96 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-600 to-blue-800 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="relative w-full">
          <img
            src={carnavalImage}
            alt="Carnaval de Ofertas Consórcio Magalu"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-3 text-center">
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">
            Carnaval de Ofertas Consórcio Magalu
          </h2>
          
          <p className="text-white/90 text-sm mb-1">
            Planeje, conquiste e realize sem juros.
          </p>
          
          <p className="text-yellow-300 font-semibold text-xs mb-4">
            Imóvel • Veículo • Moto
          </p>

          <Button
            onClick={handleSimularClick}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-base py-5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Fazer Simulação
          </Button>
        </div>
      </div>
    </>
  );
};

export default CarnavalPopup;
