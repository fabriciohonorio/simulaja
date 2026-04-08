import { CheckCircle2, ArrowRight } from "lucide-react";
import fabricioImg from "@/assets/fabricio-real.jpg";
import heroBg from "@/assets/hero-bg-ref.png";

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
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Dark navy overlay */}
      <div className="absolute inset-0 bg-[hsl(213,70%,14%)]/85" />

      <div className="relative container max-w-7xl mx-auto px-4 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-7">
            <p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase text-white/50">
              FABRICIO | Especialista em Consórcio
            </p>

            <div>
              <h1 className="text-5xl sm:text-6xl md:text-[5rem] font-black leading-[0.9] tracking-tight text-white">
                CONSÓRCIO
              </h1>
              <h1 className="text-5xl sm:text-6xl md:text-[5rem] font-black leading-[0.9] tracking-tight text-secondary">
                INTELIGENTE
              </h1>
            </div>

            <p className="text-base md:text-lg text-white/60 max-w-md leading-relaxed">
              Imóveis, veículos e investimentos com planejamento financeiro e{" "}
              <strong className="text-white font-bold">sem juros</strong>.
            </p>

            {/* Services checklist */}
            <ul className="space-y-2.5">
              {services.map((service, i) => (
                <li key={i} className="flex items-center gap-3 text-white/75">
                  <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span className="text-sm md:text-base">{service}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <div className="pt-2">
              <a
                href="#simulator"
                className="inline-flex items-center gap-3 bg-secondary hover:bg-secondary/90 text-white px-8 py-4 rounded-full text-base font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 hover:shadow-secondary/25 active:scale-95"
              >
                Simular Consórcio Agora
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right - Fabrício Photo */}
          <div className="hidden lg:flex justify-end items-center">
            <div className="w-[400px] h-[450px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={fabricioImg}
                alt="Fabrício — Especialista em Consórcio"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
