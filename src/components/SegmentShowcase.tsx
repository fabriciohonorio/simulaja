const WHATSAPP_NUMBER = "5541997925357";

const segments = [
  {
    id: "imovel",
    label: "Consórcio Imobiliário",
    desc: "Casa própria, apartamento ou terreno com planejamento inteligente.",
    image: "/segment-imovel.png",
  },
  {
    id: "veiculo",
    label: "Consórcio de Veículos",
    desc: "SUV, sedan ou utilitário — sem juros e com poder de compra à vista.",
    image: "/segment-veiculo.png",
  },
  {
    id: "moto",
    label: "Consórcio de Motos",
    desc: "A moto dos seus sonhos com parcelas que cabem no seu bolso.",
    image: "/segment-moto.png",
  },
  {
    id: "nautico",
    label: "Consórcio Náutico",
    desc: "Jet ski, lancha ou barco — realize o sonho náutico com planejamento.",
    image: "/segment-nautico.png",
  },
  {
    id: "agro",
    label: "Consórcio Agro",
    desc: "Tratores, máquinas e implementos para alavancar sua produção.",
    image: "/segment-agro.png",
  },
  {
    id: "investimento",
    label: "Consórcio para Investimento",
    desc: "Construa patrimônio com estratégia e sem juros bancários.",
    image: "/segment-investimento.png",
  },
];

const SegmentShowcase = () => {
  const buildWaLink = (segLabel: string) => {
    const msg = encodeURIComponent(
      `Olá Fabrício! Quero simular um ${segLabel} pelo consórcio inteligente.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  return (
    <section className="py-20 bg-background" id="segmentos">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-bold tracking-widest uppercase text-sm mb-3">
            Segmentos
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            Tipos de <span className="text-primary">Consórcio</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Escolha o segmento ideal para o seu projeto de vida e simule agora sem compromisso.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((seg) => (
            <a
              key={seg.id}
              href={buildWaLink(seg.label)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
            >
              {/* Photo */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={seg.image}
                  alt={seg.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                {/* Title on image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-lg leading-tight">{seg.label}</h3>
                </div>
              </div>

              {/* Description + CTA */}
              <div className="bg-card border border-border border-t-0 rounded-b-2xl p-5">
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{seg.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                  SIMULAR
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SegmentShowcase;
