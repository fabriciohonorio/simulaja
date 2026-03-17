import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import AIChatbot from "@/components/AIChatbot";
import HeroCarousel from "@/components/HeroCarousel";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroCarousel />
      <ConsortiumSimulator />
      <AIChatbot />
    </main>
  );
};

export default Index;
