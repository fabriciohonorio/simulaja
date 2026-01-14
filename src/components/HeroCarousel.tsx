import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

// Placeholder videos - replace with actual consortium/real estate/vehicle videos
const videos = [
  {
    id: 1,
    src: "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4",
    headline: "Realize seus sonhos"
  },
  {
    id: 2,
    src: "https://videos.pexels.com/video-files/3201692/3201692-uhd_2560_1440_30fps.mp4",
    headline: "Seu carro novo"
  },
  {
    id: 3,
    src: "https://videos.pexels.com/video-files/3773486/3773486-uhd_2560_1440_30fps.mp4",
    headline: "A casa perfeita"
  },
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
        setIsTransitioning(false);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const scrollToSimulator = () => {
    const simulator = document.getElementById("simulator");
    if (simulator) {
      simulator.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full h-[90vh] md:h-[70vh] overflow-hidden">
      {/* Video Container */}
      <div className="absolute inset-0">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentIndex && !isTransitioning
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={video.src}
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        {/* Headline with animation */}
        <h1
          className={`text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center drop-shadow-lg transition-all duration-500 ${
            isTransitioning
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          {videos[currentIndex].headline}
        </h1>

        {/* Subtle subheadline */}
        <p
          className={`mt-4 text-lg md:text-xl text-white/90 text-center max-w-xl transition-all duration-500 delay-100 ${
            isTransitioning
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          O consórcio que transforma sua vida
        </p>
      </div>

      {/* Video Indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
        {videos.map((_, index) => (
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

      {/* Scroll Indicator */}
      <button
        onClick={scrollToSimulator}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll to simulator"
      >
        <span className="text-sm font-medium">Simule agora</span>
        <ChevronDown className="w-6 h-6" />
      </button>
    </section>
  );
};

export default HeroCarousel;
