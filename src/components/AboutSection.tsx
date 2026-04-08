const AboutSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary mb-4">
          Sobre
        </p>
        <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
          Consultoria <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Inteligente</span> em Consórcio
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          Ajudo pessoas a conquistarem imóveis, veículos e patrimônio utilizando o consórcio como estratégia financeira inteligente.
        </p>
        <p className="text-muted-foreground text-base md:text-lg mt-4 leading-relaxed max-w-2xl mx-auto">
          Com planejamento correto é possível adquirir bens de alto valor <strong className="text-foreground">sem pagar juros</strong> e com segurança.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
