import { ShieldCheck } from "lucide-react";
import fabricioImg from "@/assets/fabricio-real.jpg";

const MeetSpecialist = () => {
  return (
    <section className="py-24 bg-[hsl(213,70%,8%)]">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Photo */}
          <div className="order-2 md:order-1 flex justify-center md:justify-start">
            <div className="cin-zoom cin-tilt relative w-full max-w-[360px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10" data-cin-tilt="5">
              <img
                src={fabricioImg}
                alt="O ESPECIALISTA CONSÓRCIO"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 md:order-2 space-y-5">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-[#C9A96A]">
              Conheça o Especialista
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              O ESPECIALISTA CONSÓRCIO
            </h2>
            <p className="text-white/75 text-base md:text-lg leading-relaxed">
              Mais de 30 anos de experiência no Setor Financeiro, com
              especialidade em Consórcio. Milhares de atendimentos realizados e
              clientes contemplados em todos os segmentos.
            </p>
            <p className="text-white/90 text-base md:text-lg italic leading-relaxed border-l-2 border-[#C9A96A] pl-4">
              "Minha maior realização é fazer parte da sua conquista."
            </p>
            <div className="flex items-start gap-3 pt-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C9A96A]/15 border border-[#C9A96A]/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#C9A96A]" />
              </div>
              <p className="text-sm text-white/80 leading-snug pt-2">
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
