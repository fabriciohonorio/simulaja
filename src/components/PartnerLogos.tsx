const partners = [
  { name: "Porto Seguro", abbr: "PS", color: "bg-blue-700" },
  { name: "HS Consórcios", abbr: "HS", color: "bg-emerald-700" },
  { name: "Embracon", abbr: "EM", color: "bg-indigo-700" },
  { name: "Sompo", abbr: "SO", color: "bg-red-700" },
  { name: "Caixa Consórcios", abbr: "CX", color: "bg-orange-600" },
  { name: "Bradesco", abbr: "BR", color: "bg-red-800" },
];

const PartnerLogos = () => {
  return (
    <section className="py-14 bg-muted/20 border-y border-border">
      <div className="container max-w-6xl mx-auto px-4">
        <p className="text-center text-xs font-bold tracking-widest uppercase text-muted-foreground mb-10">
          Administradoras Parceiras
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {partners.map((p) => (
            <div
              key={p.name}
              title={p.name}
              className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 group cursor-default"
            >
              <div
                className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm`}
              >
                {p.abbr}
              </div>
              <span className="text-foreground font-semibold text-sm hidden sm:block group-hover:text-primary transition-colors">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerLogos;
