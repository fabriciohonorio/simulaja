import { BarChart3, Target, Users, Headphones, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Análise de grupo antes da entrada",
    desc: "Avaliamos histórico de contemplação, taxa administrativa e perfil do grupo antes de você assinar qualquer adesão.",
  },
  {
    icon: Target,
    title: "Estratégia de lance personalizada",
    desc: "Definimos o melhor momento e formato de lance — embutido, fixo ou livre — para acelerar sua contemplação.",
  },
  {
    icon: Users,
    title: "Planejamento de contemplação",
    desc: "Alinhamos prazo, valor de crédito e estratégia ao seu objetivo real, e não apenas à venda de uma cota.",
  },
  {
    icon: Headphones,
    title: "Acompanhamento até a carta de crédito",
    desc: "Suporte consultivo do primeiro mês até o uso da carta — assembleias, lances, transferência e utilização.",
  },
];

const provas = [
  "Atendimento personalizado, um a um",
  "Foco em estratégia, não apenas em venda",
  "Experiência consolidada no segmento de consórcios",
  "Grupos com melhores condições iniciando este mês",
];

const Diferencial = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary mb-4">
            Diferencial
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Qual a diferença de fazer com um especialista?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Mais do que vender uma cota, construímos um plano de contemplação adequado ao seu objetivo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {features.map((feat, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-secondary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                <feat.icon className="w-7 h-7 text-secondary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-xl text-foreground mb-3">{feat.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary mb-4 text-center">
            Por que confiar
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {provas.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <span className="text-sm md:text-base leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Diferencial;
