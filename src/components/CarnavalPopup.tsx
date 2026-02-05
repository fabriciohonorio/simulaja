import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import carnavalImage from "@/assets/carnaval-promo.png";

const POPUP_STORAGE_KEY = "carnaval_popup_shown";

const CarnavalPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if popup was already shown
    const wasShown = localStorage.getItem(POPUP_STORAGE_KEY);
    if (wasShown) return;

    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem(POPUP_STORAGE_KEY, "true");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleSimularClick = () => {
    setIsOpen(false);
    // Scroll to simulator section
    const simulator = document.getElementById("simulator");
    if (simulator) {
      simulator.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogOverlay 
        className="bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <DialogContent 
        className="max-w-md w-[95vw] p-0 border-0 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-600 to-blue-800 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
        onPointerDownOutside={handleClose}
      >
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
        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Carnaval de Ofertas Consórcio Magalu
          </h2>
          
          <p className="text-white/90 text-base mb-2">
            Planeje, conquiste e realize sem juros.
          </p>
          
          <p className="text-yellow-300 font-semibold text-sm mb-5">
            Imóvel • Veículo • Moto
          </p>

          <Button
            onClick={handleSimularClick}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Fazer Simulação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarnavalPopup;
