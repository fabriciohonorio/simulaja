import cardImovel from "@/assets/card-imovel.jpg";
import cardVeiculo from "@/assets/card-veiculo.jpg";
import cardMoto from "@/assets/card-moto.jpg";
import cardNautica from "@/assets/card-nautica.jpg";
import cardAgro from "@/assets/card-agro.jpg";
import cardInvestimento from "@/assets/card-investimento.jpg";

const segments = [
  {
    title: "Consórcio Imobiliário",
    desc: "Casa própria, apartamento ou terreno com planejamento inteligente.",
    image: cardImovel,
  },
  {
    title: "Consórcio de Veículos",
    desc: "SUV, sedan ou utilitário — sem juros e com poder de compra à vista.",
    image: cardVeiculo,
  },
  {
    title: "Consórcio de Motos",
    desc: "A moto dos seus sonhos com parcelas que cabem no bolso.",
    image: cardMoto,
  },
  {
    title: "Consórcio Náutico",
    desc: "Jet ski, lancha ou barco — realize o sonho náutico com planejamento.",
    image: cardNautica,
  },
  {
    title: "Consórcio Agro",
    desc: "Tratores, máquinas e implementos para alavancar sua produção.",
    image: cardAgro,
  },
  {
    title: "Consórcio para Investimento",
    desc: "Construa patrimônio com estratégia e sem juros bancários.",
    image: cardInvestimento,
  },
];

const SegmentCards = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary mb-4">
            Segmentos
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            Tipos de Consórcio
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={seg.image}
                  alt={seg.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-foreground mb-2">{seg.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{seg.desc}</p>
                <a
                  href="#simulator"
                  className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-wider transition-all hover:scale-105"
                >
                  Simular
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SegmentCards;
