import { BarChart3, Target, Users, Headphones } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Análise do melhor valor de carta",
    desc: "Análise do melhor valor de sua carta após a contemplação. Lucratividade com a venda da carta contemplada.",
  },
  {
    icon: Target,
    title: "Acompanhamento e estratégia de lance",
    desc: "Garante a agilidade e eficiência na contemplação com a melhor estratégia de lance.",
  },
  {
    icon: Users,
    title: "Planejamento Patrimonial",
    desc: "Após reunião e conversa com o cliente, alinhamos o melhor projeto capaz de entregar o bem de acordo com suas necessidades.",
  },
  {
    icon: Headphones,
    title: "Atendimento Completo",
    desc: "Atendimento pessoal e online de norte a sul, com as melhores tecnologias.",
  },
];

const Diferencial = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary mb-4">
            Diferencial
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            Consultoria Inteligente
          </h2>
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
      </div>
    </section>
  );
};

export default Diferencial;
