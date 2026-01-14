import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

import slideImovel from "@/assets/slide-imovel.png";
import slideMoto from "@/assets/slide-moto.jpeg";
import slideJetski from "@/assets/slide-jetski.jpeg";

const slides = [
  {
    id: 1,
    src: slideImovel,
    alt: "Crédito para imóveis - R$110 mil"
  },
  {
    id: 2,
    src: slideMoto,
    alt: "Crédito para motos - R$37 mil"
  },
  {
    id: 3,
    src: slideJetski,
    alt: "Crédito para jetski - R$120 mil"
  },
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSimulator = () => {
    const simulator = document.getElementById("simulator");
    if (simulator) {
      simulator.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full h-[90vh] md:h-[70vh] overflow-hidden">
      {/* Image Container */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentIndex && !isTransitioning
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

      {/* Slide Indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
              }, 300);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-white"
                : "w-4 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator with CTA */}
      <button
        onClick={scrollToSimulator}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white hover:scale-105 transition-transform animate-bounce"
        aria-label="Scroll to simulator"
      >
        <span className="text-lg md:text-xl font-bold bg-primary/90 hover:bg-primary px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
          Faça sua SIMULAÇÃO JÁ
        </span>
        <ChevronDown className="w-6 h-6" />
      </button>
    </section>
  );
};

export default HeroCarousel;
