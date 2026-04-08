import { Users, CheckCircle2, Award } from "lucide-react";
import { useEffect, useState } from "react";

interface HeroProps {
  children?: React.ReactNode;
}

const Hero = ({ children }: HeroProps) => {
  const [simulatingCount, setSimulatingCount] = useState(23);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatingCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* ===== SOCIAL PROOF BAR ===== */}
      <div className="bg-primary text-primary-foreground py-2.5 px-4 text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            {simulatingCount} pessoas simulando agora
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">🔥 1.247+ simulações realizadas</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">⚠️ Grupos fechando em breve</span>
        </div>
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden pt-10 md:pt-16 pb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />
        
        <div className="relative container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Hero Content */}
            <div className="text-primary-foreground space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                  Consórcio
                  <br />
                  <span className="text-secondary">Inteligente</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/85 max-w-lg">
                  Imóveis, Carros, Motos e Investimentos — sem juros abusivos, com parcelas que cabem no seu bolso.
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-primary-foreground/20">
                  <Users className="w-4 h-4 text-secondary" />
                  500+ Clientes Atendidos
                </div>
                <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-primary-foreground/20">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  94% Taxa de Aprovação
                </div>
                <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-primary-foreground/20">
                  <Award className="w-4 h-4 text-secondary" />
                  Expert ABAC
                </div>
              </div>

              {/* Fabrício Card */}
              <div className="flex items-center gap-4 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-5 border border-primary-foreground/15 max-w-md shadow-xl">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-secondary shadow-lg flex-shrink-0 bg-muted">
                  <img
                    src="/og-image.png"
                    alt="Fabrício Rodrigues Honório"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fabricio';
                    }}
                  />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">Fabrício Rodrigues Honório</p>
                  <p className="text-secondary font-semibold text-sm">Especialista em Consórcios</p>
                  <p className="text-primary-foreground/70 text-xs mt-1.5 leading-relaxed">
                    10+ anos ajudando famílias a realizar projetos de vida com inteligência financeira.
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Simulator Component Container */}
            <div className="animate-in fade-in slide-in-from-right duration-700">
              {children}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
