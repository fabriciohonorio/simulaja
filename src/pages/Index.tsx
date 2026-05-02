import { useState, useEffect } from "react";
// Trigger deploy: 2026-04-20 15:26
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import AIChatbot from "@/components/AIChatbot";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import SegmentCards from "@/components/SegmentCards";
import Diferencial from "@/components/Diferencial";
import MeetSpecialist from "@/components/MeetSpecialist";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [utmParams, setUtmParams] = useState({ origem: "", meio: "", campanha: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      origem: params.get("utm_source") || "",
      meio: params.get("utm_medium") || "",
      campanha: params.get("utm_campaign") || "",
    });
  }, []);

  const handleSimulateSubmit = async (leadData: any) => {
    const { nome, celular, categoriaLabel, credito, prazo, r50, leadScoreValor } = leadData;
    
    const fmt = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

    try {
      console.log("Tentando salvar no CRM...", { nome, celular });
      const { error: dbError } = await supabase.from("leads").insert({
        nome: nome,
        celular: celular.replace(/\D/g, ""),
        tipo_consorcio: categoriaLabel,
        valor_credito: credito,
        prazo_meses: prazo,
        status: "novo_lead",
        lead_score_valor: leadScoreValor,
        lead_temperatura: "quente"
      });

      if (dbError) {
        console.error("❌ ERRO CRM:", dbError);
        toast({ 
          title: "Erro ao sincronizar CRM", 
          description: dbError.message || "Ocorreu um erro ao salvar o lead no banco de dados.",
          variant: "destructive"
        });
      } else {
        console.log("✅ Lead salvo no CRM!");
        toast({ title: "✅ Lead registrado no CRM com sucesso!" });
      }
    } catch (e: any) {
      console.error("🚨 CRITICAL EXCEPTION CRM:", e);
      toast({ title: "Erro Crítico", description: e.message, variant: "destructive" });
    }

    try {
      const response = await fetch("https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          celular,
          valor_credito: fmt(credito),
          tipo_consorcio: categoriaLabel,
          pagina: window.location.href,
          origem: utmParams.origem || "Simulador Web",
          score: leadScoreValor,
        }),
      });
      
      if (response.ok) {
        console.log("✅ Webhook enviado!");
        toast({ title: "✅ Notificação enviada ao especialista!" });
      }
    } catch (e) {
      console.error("Webhook Error:", e);
    }
  };

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20">
      <Header />
      
      <Hero />

      <div id="about" className="scroll-mt-20">
        <AboutSection />
      </div>

      <div id="segments" className="scroll-mt-20">
        <SegmentCards />
      </div>

      <MeetSpecialist />

      <Diferencial />

      <div id="simulator" className="scroll-mt-20">
        <section className="py-24 bg-gradient-to-b from-white to-blue-50/50">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="max-w-2xl mx-auto mb-12 bg-white border border-blue-100 rounded-3xl p-8 md:p-10 text-center shadow-xl shadow-blue-900/5">
              <p className="text-sm font-bold tracking-[0.25em] uppercase text-[#C9A96A] mb-4">
                Decisão Inteligente
              </p>
              <p className="text-foreground text-lg md:text-xl leading-relaxed font-medium">
                "Consórcio não é sobre esperar — <span className="text-primary font-bold">é sobre planejar o momento certo.</span>"
              </p>
              <div className="h-1 w-20 bg-[#C9A96A]/20 mx-auto mt-6 rounded-full" />
              <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
                A maioria das pessoas entra sem estratégia e paga essa decisão com tempo. <br className="hidden md:block" />
                <strong className="text-foreground">Grupos com melhores condições iniciando este mês.</strong>
              </p>
            </div>

            <div className="text-center mb-12">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-secondary mb-4">
                Simulador Dinâmico
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
                Simule sua estratégia em segundos
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Visualize agora quanto investir, em quanto tempo contemplar e qual estratégia se encaixa no seu objetivo real.
              </p>
            </div>
            <ConsortiumSimulator onSimulateSubmit={handleSimulateSubmit} />
          </div>
        </section>
      </div>

      <FinalCTA />
      
      <Footer />
      
      <AIChatbot />
    </main>
  );
};

export default Index;
