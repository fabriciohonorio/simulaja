import { Star, ShieldCheck } from "lucide-react";

const SocialProof = () => {
  return (
    <div className="bg-muted/30">
      {/* ===== TESTIMONIAL ===== */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-12">
            O que nossos <span className="text-primary">clientes</span> dizem
          </h2>
          
          <div className="bg-card rounded-3xl p-10 md:p-12 border border-border shadow-xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 bg-background px-4 py-2 rounded-full border border-border shadow-sm">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-secondary fill-secondary" />
              ))}
            </div>
            
            <blockquote className="text-xl md:text-2xl text-foreground italic leading-relaxed mb-8">
              "Consegui meu apartamento! O Fabrício me ajudou a realizar o sonho da casa própria com um planejamento impecável. Super recomendo a consultoria!"
            </blockquote>
            
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg border-2 border-background">
                M
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-foreground">Maria Silva</p>
                <p className="text-sm text-secondary font-semibold uppercase tracking-wider">Contemplada em Imóvel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABAC INFO ===== */}
      <section className="pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-card rounded-2xl p-8 border border-border flex flex-col md:flex-row items-center gap-8 shadow-sm group hover:border-primary/20 transition-colors">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">Segurança: Regulamentado pela ABAC</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                O consórcio é uma modalidade financeira regulamentada pelo Banco Central do Brasil e fiscalizada pela ABAC — Associação Brasileira de Administradoras de Consórcios.
              </p>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <a
                  href="https://www.abac.org.br/para-voce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary font-bold hover:underline flex items-center gap-1.5"
                >
                  Saiba mais na ABAC <span>&rarr;</span>
                </a>
                <a
                  href="https://www.abac.org.br/perguntas-frequentes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary font-bold hover:underline flex items-center gap-1.5"
                >
                  Perguntas Frequentes <span>&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SocialProof;
