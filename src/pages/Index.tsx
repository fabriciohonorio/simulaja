import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import CarnavalPopup from "@/components/CarnavalPopup";
import AIChatbot from "@/components/AIChatbot";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <CarnavalPopup />
      <ConsortiumSimulator />
      <AIChatbot />
    </main>
  );
};

export default Index;
