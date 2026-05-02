import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5541997925357";

const FinalCTA = () => {
  return (
    <section className="py-24 bg-[hsl(var(--navy))] text-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
          Sua próxima conquista começa com a estratégia certa.
        </h2>
        <p className="text-white/70 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Veja sua simulação ou fale diretamente com o especialista para montar seu plano de contemplação.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#simulator"
            className="inline-flex items-center gap-2 bg-[#FF7A00] hover:bg-[#FF8B1F] text-white px-8 py-4 rounded-full font-black text-lg uppercase tracking-wider shadow-xl transition-all hover:scale-[1.03] hover:shadow-[#FF7A00]/40"
          >
            Ver minha simulação
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Fabrício! Quero entender minha estratégia de contemplação.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-full font-black text-lg transition-all shadow-xl hover:scale-105 hover:shadow-2xl"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com o Especialista
          </a>
        </div>
        <p className="text-xs text-white/50 mt-6">Sem compromisso. Não enviamos spam.</p>
      </div>
    </section>
  );
};

export default FinalCTA;
