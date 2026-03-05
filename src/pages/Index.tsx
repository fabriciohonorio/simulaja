import { Link } from "react-router-dom";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import CarnavalPopup from "@/components/CarnavalPopup";
import AIChatbot from "@/components/AIChatbot";

const Index = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <CarnavalPopup />
        <ConsortiumSimulator />
      </div>
      
      <footer className="py-8 px-4 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Consórcio Magalu - Fabricio Especialista. Todos os direitos reservados.</p>
          <Link 
            to="/admin" 
            className="hover:text-primary transition-colors flex items-center gap-2"
          >
            <span>Acesso Administrativo</span>
          </Link>
        </div>
      </footer>
      
      <AIChatbot />
    </main>
  );
};

export default Index;
