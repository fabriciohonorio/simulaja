import { CheckCircle2 } from "lucide-react";

const AboutConsortium = () => {
  return (
    <section className="py-20 bg-blue-50/20">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 uppercase tracking-tight">
            Consórcio não é <span className="text-primary">sorte</span>, é estratégia.
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Muitas pessoas acreditam que o consórcio depende da sorte. Na verdade, é uma das ferramentas mais poderosas de <span className="text-foreground font-semibold">alavancagem patrimonial</span> quando utilizada com a estratégia correta.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              Como funciona?
            </h3>
            <ul className="space-y-4">
              {[
                "Você escolhe o valor do crédito e o prazo ideal",
                "Paga parcelas mensais sem juros",
                "Participa de sorteios mensais para contemplação",
                "Pode ofertar lances para antecipar a sua carta",
                "Recebe a carta de crédito para comprar à vista",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm">2</span>
              Principais Vantagens
            </h3>
            <ul className="space-y-4">
              {[
                "Custo zero de juros (apenas taxa adm)",
                "Parcelas até 50% menores que financiamento",
                "Poder de negociação de compra à vista",
                "Liberdade para escolher qualquer marca ou modelo",
                "Possibilidade de usar o FGTS como lance",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutConsortium;
