const AboutSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <p className="cin-reveal text-sm font-bold tracking-[0.2em] uppercase text-secondary mb-4">
          Sobre
        </p>
        <h2 className="cin-reveal cin-delay-1 text-2xl md:text-4xl font-extrabold text-foreground mb-6">
          Entrar no consórcio é fácil. <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Difícil</span> é ser contemplado rápido.
        </h2>
        <p className="cin-reveal cin-delay-2 text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          A maioria das pessoas entra em um grupo sem estratégia — e paga essa decisão com tempo.
        </p>
        <p className="cin-reveal cin-delay-3 text-muted-foreground text-sm md:text-base mt-4 leading-relaxed max-w-2xl mx-auto">
          Aqui o trabalho começa antes da adesão: <strong className="text-foreground">análise do grupo certo</strong>, planejamento de lance e acompanhamento até a carta de crédito.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
