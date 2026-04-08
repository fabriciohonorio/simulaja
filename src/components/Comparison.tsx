import { CheckCircle2, XCircle } from "lucide-react";

const Comparison = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Consórcio vs <span className="text-destructive">Financiamento</span>
          </h2>
          <p className="text-muted-foreground">Compare e veja por que o consórcio é a escolha mais inteligente para o seu bolso.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-card rounded-2xl p-8 border-2 border-primary shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-widest">
              Recomendado
            </div>
            <div className="text-center mb-6">
              <span className="text-2xl font-bold text-primary">Consórcio</span>
            </div>
            <ul className="space-y-4">
              {[
                "Taxa de administração baixa (~15% total)",
                "Parcelas mensais reduzidas",
                "Poder de negociação à vista",
                "Sem necessidade de entrada",
                "Economia média de 30% a 40%",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-muted/40 rounded-2xl p-8 border border-border opacity-70 flex flex-col">
            <div className="text-center mb-6">
              <span className="text-2xl font-bold text-muted-foreground">Financiamento</span>
            </div>
            <ul className="space-y-4 flex-1">
              {[
                "Juros bancários abusivos (8% a 15% ao ano)",
                "Parcelas pesadas no orçamento",
                "Exige entrada de 20% a 30%",
                "Custo total chega a 2x ou 3x o valor do bem",
                "Extrema burocracia para aprovação",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <XCircle className="w-5 h-5 text-destructive/60 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
