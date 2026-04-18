import { ShieldCheck } from "lucide-react";
import fabricioImg from "@/assets/fabricio-real.jpg";

const MeetSpecialist = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Photo */}
          <div className="order-2 md:order-1 flex justify-center md:justify-start">
            <div className="relative w-full max-w-[360px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img
                src={fabricioImg}
                alt="Fabrício — Especialista em Consórcio"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 md:order-2 space-y-5">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary">
              Conheça o Especialista
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Fabrício Honório
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Especialista em consórcio com anos de experiência ajudando famílias e
              investidores a conquistarem patrimônio com planejamento estratégico e
              sem juros.
            </p>
            <div className="flex items-start gap-3 pt-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-sm text-foreground/80 leading-snug pt-2">
                Atendimento consultivo, transparente e personalizado para o seu objetivo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetSpecialist;
