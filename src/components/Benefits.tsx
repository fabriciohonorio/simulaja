import { Zap, DollarSign, CheckCircle2, BarChart3 } from "lucide-react";

const Benefits = () => {
  const benefits = [
    { 
      icon: Zap, 
      title: "Resposta em 2 min", 
      desc: "Atendimento ágil e personalizado via WhatsApp." 
    },
    { 
      icon: DollarSign, 
      title: "Sem juros abusivos", 
      desc: "Economize até 30% comparado ao financiamento bancário." 
    },
    { 
      icon: CheckCircle2, 
      title: "Aprovação facilitada", 
      desc: "94% de taxa de aprovação para diversos perfis." 
    },
    { 
      icon: BarChart3, 
      title: "Use seu FGTS", 
      desc: "Utilize seu saldo para imóveis e veículos pesados." 
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-wider uppercase text-sm mb-3">Vantagens Exclusivas</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            Por que escolher o <span className="text-primary">Consórcio Inteligente</span>?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
            <div 
              key={i} 
              className="group flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <benefit.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-foreground mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
