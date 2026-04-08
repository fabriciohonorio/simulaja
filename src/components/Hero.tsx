import { CheckCircle2, ArrowRight } from "lucide-react";
import fabricioImg from "@/assets/fabricio-poltrona.jpg";

interface HeroProps {
  children?: React.ReactNode;
}

const Hero = ({ children }: HeroProps) => {
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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[hsl(var(--navy))]">
      {/* Background overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--navy))]/95 via-[hsl(var(--navy))]/85 to-[hsl(var(--navy))]/60" />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative container max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8">
            <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-white/60">
              FABRICIO | Especialista em Consórcio
            </p>

            <div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight text-white">
                CONSÓRCIO
              </h1>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight text-secondary">
                INTELIGENTE
              </h1>
            </div>

            <p className="text-lg md:text-xl text-white/70 max-w-lg leading-relaxed">
              Imóveis, veículos e investimentos com planejamento financeiro e{" "}
              <strong className="text-white">sem juros</strong>.
            </p>

            {/* Services checklist */}
            <ul className="space-y-3">
              {services.map((service, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-base">{service}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <a
              href="#simulator"
              className="inline-flex items-center gap-3 bg-secondary hover:bg-secondary/90 text-white px-8 py-4 rounded-full text-lg font-black uppercase tracking-wider shadow-2xl transition-all hover:scale-105 hover:shadow-secondary/30 active:scale-95"
            >
              Simular Consórcio Agora
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Right - Fabrício Photo */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px] rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
                <img
                  src={fabricioImg}
                  alt="Fabrício — Especialista em Consórcio"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-secondary/20 rounded-2xl -z-10" />
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/30 rounded-xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
