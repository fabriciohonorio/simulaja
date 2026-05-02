import { CheckCircle2, ArrowRight, ClipboardCheck } from "lucide-react";
import heroBg from "@/assets/hero-premium-desk.jpg";

const Hero = () => {
  const services = [
    "Consórcio imobiliário",
    "Consórcio de veículos",
    "Consórcio de motos",
    "Consórcio agro",
    "Consórcio para investimento",
    "Consórcio para Náutica",
    "Cartas Contempladas",
  ];

  return (
    <section className="cin-parallax cin-vignette relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="cin-parallax-inner cin-hero-zoom absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: "center right" }}
      />
      {/* Premium gradient overlay - strong on the left, soft on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(213,70%,8%)]/95 via-[hsl(213,70%,10%)]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      <div className="relative container max-w-7xl mx-auto px-4 py-24 md:py-32">
        <div className="max-w-2xl space-y-7">
          <div>
            <h1 className="cin-reveal text-5xl sm:text-6xl md:text-[5rem] font-black leading-[0.9] tracking-tight text-white">
              OESPECIALISTA
            </h1>
            <h1 className="cin-reveal cin-delay-1 text-5xl sm:text-6xl md:text-[5rem] font-black leading-[0.9] tracking-tight text-[#C9A96A]">
              CONSÓRCIO
            </h1>
          </div>

          <p className="cin-reveal cin-delay-2 text-base md:text-lg text-white/75 max-w-md leading-relaxed">
            Imóveis, veículos e investimentos com planejamento financeiro e{" "}
            <strong className="text-white font-bold">sem juros</strong>.
          </p>

          {/* Services checklist */}
          <ul className="space-y-2.5">
            {services.map((service, i) => (
              <li key={i} className={`cin-reveal cin-delay-${Math.min(i + 1, 4)} flex items-center gap-3 text-white/80`}>
                <CheckCircle2 className="w-4 h-4 text-[#C9A96A] flex-shrink-0" />
                <span className="text-sm md:text-base">{service}</span>
              </li>
            ))}
          </ul>

          {/* Premium info block */}
          <div className="cin-reveal cin-delay-3 flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 max-w-md">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#C9A96A]/15 border border-[#C9A96A]/30 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-[#C9A96A]" />
            </div>
            <p className="text-sm md:text-[15px] text-white/85 leading-snug font-medium">
              Você está a um passo de iniciar seu planejamento
            </p>
          </div>

          {/* CTA Button */}
          <div className="cin-reveal cin-delay-4 pt-2">
            <a
              href="#simulator"
              className="inline-flex items-center gap-3 bg-[#FF6B1A] hover:bg-[#FF7A2E] text-white px-8 py-4 rounded-full text-base font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 hover:shadow-[#FF6B1A]/30 active:scale-95"
            >
              Quero Simular Agora
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
