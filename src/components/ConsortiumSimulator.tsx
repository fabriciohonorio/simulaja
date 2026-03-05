import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Car,
  Bike,
  TrendingUp,
  Tractor,
  Target,
  BarChart3,
  Shield,
  Clock,
  Mail,
} from "lucide-react";
import { WhatsAppIcon, InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon } from "./SocialIcons";

import fabricioPoltrona from "@/assets/fabricio-poltrona.jpg";
import cardImovel from "@/assets/card-imovel.jpg";
import cardVeiculo from "@/assets/card-veiculo.jpg";
import cardMoto from "@/assets/card-moto.jpg";
import cardAgro from "@/assets/card-agro.jpg";
import cardInvestimento from "@/assets/card-investimento.jpg";

const SIMULATOR_URL = "https://simulaja.lovable.app";
const WHATSAPP_LINK = "https://wa.me/5541997925357?text=Ol%C3%A1%20Fabr%C3%ADcio!%20Quero%20saber%20mais%20sobre%20cons%C3%B3rcio.";

const segments = [
  { id: "imovel", label: "Imóveis", icon: Home },
  { id: "veiculos", label: "Veículos", icon: Car },
  { id: "motos", label: "Motos", icon: Bike },
  { id: "agricolas", label: "Agrícolas", icon: Tractor },
  { id: "investimentos", label: "Investimentos", icon: TrendingUp },
];

const creditValues = [
  27000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000,
];

const consortiumCards = [
  { title: "Consórcio Imobiliário", desc: "Casa própria, apartamento ou terreno com planejamento inteligente.", img: cardImovel },
  { title: "Consórcio de Veículos", desc: "SUV, sedan ou utilitário — sem juros e com poder de compra à vista.", img: cardVeiculo },
  { title: "Consórcio de Motos", desc: "A moto dos seus sonhos com parcelas que cabem no bolso.", img: cardMoto },
  { title: "Consórcio Agro", desc: "Tratores, máquinas e implementos para alavancar sua produção.", img: cardAgro },
  { title: "Consórcio para Investimento", desc: "Construa patrimônio com estratégia e sem juros bancários.", img: cardInvestimento },
];

const ConsortiumSimulator = () => {
  const { toast } = useToast();
  const [creditIndex, setCreditIndex] = useState(6);
  const [formData, setFormData] = useState({ nome: "", celular: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [utmParams, setUtmParams] = useState({ origem: "", meio: "", campanha: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      origem: params.get("utm_source") || "",
      meio: params.get("utm_medium") || "",
      campanha: params.get("utm_campaign") || "",
    });
  }, []);

  const selectedCreditValue = creditValues[creditIndex];

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatPhone = (value: string) => {
    const n = value.replace(/\D/g, "");
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "celular") {
      setFormData((prev) => ({ ...prev, [field]: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.celular) {
      toast({ title: "Preencha seu nome e WhatsApp.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await supabase.from("leads").insert({
        nome: formData.nome,
        celular: formData.celular,
        tipo_consorcio: "Geral",
        valor_credito: selectedCreditValue,
        prazo_meses: 60,
        status: "novo",
      });
    } catch (err) {
      console.error(err);
    }

    try {
      const response = await fetch(
        "https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: formData.nome,
            celular: formData.celular,
            valor_credito: fmt(selectedCreditValue),
            tipo_consorcio: "Geral",
            pagina: window.location.href,
            origem: utmParams.origem || "Lovable",
            meio: utmParams.meio,
            campanha: utmParams.campanha,
          }),
        }
      );
      if (response.ok) {
        toast({ title: "✅ Simulação enviada! Entraremos em contato em breve." });
        setFormData({ nome: "", celular: "" });
        setCreditIndex(6);
      } else {
        throw new Error("Erro");
      }
    } catch {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(213 70% 14%) 0%, hsl(213 50% 30%) 100%)" }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="relative container max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left column */}
            <div className="text-white space-y-8 animate-fade-in-up">
              <div>
                <p className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-white/60 mb-3">
                  FABRICIO | Especialista em Consórcio
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                  CONSÓRCIO
                  <br />
                  <span className="text-secondary">INTELIGENTE</span>
                </h1>
                <p className="text-lg md:text-xl text-white/70 mt-5 max-w-lg leading-relaxed">
                  Imóveis, veículos e investimentos com planejamento financeiro e <strong className="text-white">sem juros</strong>.
                </p>
              </div>

              {/* Benefits list */}
              <ul className="space-y-3">
                {[
                  "Consórcio imobiliário",
                  "Consórcio de veículos",
                  "Consórcio de motos",
                  "Consórcio agro",
                  "Consórcio para investimento",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/90">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-base md:text-lg">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href={SIMULATOR_URL}
                className="inline-flex items-center gap-3 bg-secondary hover:bg-secondary/90 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group"
              >
                SIMULAR CONSÓRCIO AGORA
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Right column — Specialist image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 bg-secondary/20 rounded-3xl blur-2xl" />
                <img
                  src={fabricioPoltrona}
                  alt="Fabrício — Especialista em Consórcio"
                  className="relative w-full max-w-md lg:max-w-lg rounded-2xl shadow-2xl object-cover border-2 border-white/10"
                />
                {/* Floating mini cards */}
                <div className="absolute -left-6 top-1/4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl hidden md:flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground pr-1">Imóveis</span>
                </div>
                <div className="absolute -right-6 top-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl hidden md:flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground pr-1">Veículos</span>
                </div>
                <div className="absolute -left-4 bottom-12 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl hidden md:flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground pr-1">Investir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOBRE O ESPECIALISTA ===== */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3">Sobre</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Consultoria <span className="text-primary">Inteligente</span> em Consórcio
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ajudo pessoas a conquistarem imóveis, veículos e patrimônio utilizando o consórcio como estratégia financeira inteligente.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-4">
            Com planejamento correto é possível adquirir bens de alto valor <strong className="text-foreground">sem pagar juros</strong> e com segurança.
          </p>
        </div>
      </section>

      {/* ===== TIPOS DE CONSÓRCIO — Cards ===== */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, hsl(210 20% 96%) 0%, hsl(210 20% 98%) 100%)" }}>
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3 text-center">Segmentos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Tipos de Consórcio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {consortiumCards.map((card) => (
              <div
                key={card.title}
                className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">{card.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{card.desc}</p>
                  <a
                    href={SIMULATOR_URL}
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors group/link"
                  >
                    SIMULAR
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SIMULADOR RÁPIDO ===== */}
      <section id="simulator" className="py-20 bg-background">
        <div className="container max-w-3xl mx-auto px-4">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3 text-center">Simulador</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
            Simule seu Consórcio <span className="text-primary">em segundos</span>
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Descubra o valor da carta de crédito, parcelas aproximadas e prazo ideal para seu objetivo.
          </p>

          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              {/* Credit slider */}
              <div className="p-5 rounded-xl border border-border bg-muted/30">
                <Label className="text-sm font-medium text-foreground mb-1 block text-center">
                  Valor do crédito desejado
                </Label>
                <div className="text-center my-4">
                  <span className="text-3xl md:text-4xl font-extrabold text-primary">
                    {fmt(selectedCreditValue)}
                  </span>
                </div>
                <Slider
                  value={[creditIndex]}
                  onValueChange={(v) => setCreditIndex(v[0])}
                  max={creditValues.length - 1}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>R$ 27 mil</span>
                  <span>R$ 1 milhão</span>
                </div>
              </div>

              {/* Segment badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                {segments.map((seg) => {
                  const Icon = seg.icon;
                  return (
                    <span key={seg.id} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                      <Icon className="w-3.5 h-3.5" />
                      {seg.label}
                    </span>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Seu nome completo *"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className="h-13 text-base"
                  maxLength={100}
                />
                <div>
                  <Input
                    placeholder="Seu WhatsApp *"
                    value={formData.celular}
                    onChange={(e) => handleInputChange("celular", e.target.value)}
                    className="h-13 text-base"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    📱 Enviaremos a proposta completa em até 2 horas
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-base font-bold bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
                >
                  {isSubmitting ? "ENVIANDO..." : (
                    <span className="flex items-center gap-2">
                      SIMULAR AGORA
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao simular, você concorda com nossa{" "}
                  <a href="#" className="text-primary underline hover:no-underline font-medium">
                    Política de Privacidade
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DIFERENCIAL / CONSULTORIA ===== */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, hsl(210 20% 96%) 0%, hsl(210 20% 98%) 100%)" }}>
        <div className="container max-w-5xl mx-auto px-4">
          <p className="text-sm font-semibold tracking-[0.15em] uppercase text-secondary mb-3 text-center">Diferencial</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Consultoria <span className="text-primary">Inteligente</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Target, title: "Análise do melhor valor de carta", desc: "Encontramos a carta ideal para o seu objetivo e orçamento." },
              { icon: Clock, title: "Planejamento de prazo", desc: "Definimos o prazo perfeito para suas parcelas caberem no bolso." },
              { icon: BarChart3, title: "Estratégia de lance", desc: "Orientação para aumentar suas chances de contemplação." },
              { icon: Shield, title: "Planejamento patrimonial", desc: "Construa patrimônio de forma estratégica e segura." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(213 70% 14%) 0%, hsl(213 50% 25%) 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative container max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Seu próximo patrimônio pode começar <span className="text-secondary">hoje</span>.
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Não espere mais. Simule seu consórcio ou fale diretamente com o especialista.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={SIMULATOR_URL}
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group"
            >
              Simular Consórcio
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02]"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Falar com Especialista
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-4" style={{ background: "hsl(213 70% 10%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                FABRICIO <span className="text-white/40">|</span> <span className="text-secondary">Especialista em Consórcio</span>
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Planejamento financeiro inteligente para conquistar seus bens sem juros abusivos.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Links</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href={SIMULATOR_URL} className="hover:text-secondary transition-colors">Simular Consórcio</a></li>
                <li><a href="https://www.abac.org.br/para-voce" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">ABAC — Para Você</a></li>
                <li><a href="https://www.abac.org.br/perguntas-frequentes" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">ABAC — FAQ</a></li>
                <li><a href="#" className="hover:text-secondary transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Redes Sociais</h4>
              <div className="flex gap-3">
                {[
                  { icon: WhatsAppIcon, href: "https://wa.me/5541997925357", label: "WhatsApp", hoverBg: "hover:bg-[#25D366]" },
                  { icon: InstagramIcon, href: "https://instagram.com/fabricioespecialistaconsorcio", label: "Instagram", hoverBg: "hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]" },
                  { icon: TikTokIcon, href: "#", label: "TikTok", hoverBg: "hover:bg-white/20" },
                  { icon: FacebookIcon, href: "#", label: "Facebook", hoverBg: "hover:bg-[#1877F2]" },
                  { icon: LinkedInIcon, href: "#", label: "LinkedIn", hoverBg: "hover:bg-[#0A66C2]" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 ${social.hoverBg}`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-sm text-white/30">
            © {new Date().getFullYear()} Fabrício — Especialista em Consórcio Inteligente. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConsortiumSimulator;
