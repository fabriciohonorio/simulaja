import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Users,
  CheckCircle2,
  Award,
  Zap,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Star,
  Home,
  Car,
  Bike,
  TrendingUp,
  Tractor,
  Truck,
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";

import gestorFabricio from "@/assets/gestor-fabricio.jpg";
import bannerImoveis from "@/assets/banner-imoveis.jpg";
import bannerVeiculos from "@/assets/banner-veiculos.jpg";
import bannerMotos from "@/assets/banner-motos.jpg";
import bannerPesados from "@/assets/banner-pesados.jpg";
import bannerAgricolas from "@/assets/banner-agricolas.jpg";
import bannerInvestimentos from "@/assets/banner-investimentos.jpg";

const segments = [
  { id: "imovel", label: "Imóveis", icon: Home },
  { id: "veiculos", label: "Veículos", icon: Car },
  { id: "motos", label: "Motos", icon: Bike },
  { id: "pesados", label: "Pesados", icon: Truck },
  { id: "agricolas", label: "Agrícolas", icon: Tractor },
  { id: "investimentos", label: "Investimentos", icon: TrendingUp },
];

const segmentBanners: Record<string, string> = {
  imovel: bannerImoveis,
  veiculos: bannerVeiculos,
  motos: bannerMotos,
  pesados: bannerPesados,
  agricolas: bannerAgricolas,
  investimentos: bannerInvestimentos,
};

const creditValues = [
  27000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000,
];

const WHATSAPP_NUMBER = "5541997925357";

const ConsortiumSimulator = () => {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState("veiculos");
  const [creditIndex, setCreditIndex] = useState(6);
  const [formData, setFormData] = useState({ nome: "", celular: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatingCount, setSimulatingCount] = useState(23);

  // UTM capture
  const [utmParams, setUtmParams] = useState({ origem: "", meio: "", campanha: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      origem: params.get("utm_source") || "",
      meio: params.get("utm_medium") || "",
      campanha: params.get("utm_campaign") || "",
    });
    // Simulating count fluctuation
    const interval = setInterval(() => {
      setSimulatingCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const selectedCreditValue = creditValues[creditIndex];

  const formatCurrencyDisplay = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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
      toast({ title: "Preencha seu nome e WhatsApp para continuar.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const tipoConsorcio = segments.find((s) => s.id === selectedSegment)?.label || selectedSegment;

    try {
      await supabase.from("leads").insert({
        nome: formData.nome,
        celular: formData.celular,
        tipo_consorcio: tipoConsorcio,
        valor_credito: selectedCreditValue,
        prazo_meses: 60,
        status: "novo",
      });
    } catch (err) {
      console.error(err);
    }

    const payload = {
      nome: formData.nome,
      celular: formData.celular,
      valor_credito: formatCurrencyDisplay(selectedCreditValue),
      tipo_consorcio: tipoConsorcio,
      pagina: window.location.href,
      origem: utmParams.origem || "Lovable",
      meio: utmParams.meio,
      campanha: utmParams.campanha,
    };

    try {
      const response = await fetch(
        "https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      if (response.ok) {
        toast({ title: "✅ Simulação enviada! Um especialista entrará em contato em breve." });
        setFormData({ nome: "", celular: "" });
        setCreditIndex(6);
        setSelectedSegment("veiculos");
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
    <div className="min-h-screen flex flex-col">
      {/* ===== SOCIAL PROOF BAR ===== */}
      <div className="bg-primary text-primary-foreground py-2.5 px-4 text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            {simulatingCount} pessoas simulando agora
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">🔥 1.247+ simulações realizadas</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">⚠️ Grupos fechando em breve</span>
        </div>
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${segmentBanners[selectedSegment]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />

        <div className="relative container max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Hero Content */}
            <div className="text-primary-foreground space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                  Consórcio
                  <br />
                  <span className="text-secondary">Inteligente</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/85 max-w-lg">
                  Imóveis, Carros, Motos e Investimentos — sem juros abusivos, com parcelas que cabem no seu bolso.
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-secondary" />
                  500+ Clientes Atendidos
                </div>
                <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  94% Taxa de Aprovação
                </div>
                <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm font-medium">
                  <Award className="w-4 h-4 text-secondary" />
                  Expert ABAC
                </div>
              </div>

              {/* Fabrício Card */}
              <div className="flex items-center gap-4 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 border border-primary-foreground/15 max-w-md">
                <img
                  src={gestorFabricio}
                  alt="Fabrício Rodrigues Honório - Especialista em Consórcios"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-secondary shadow-lg"
                />
                <div>
                  <p className="font-bold text-lg">Fabrício Rodrigues Honório</p>
                  <p className="text-secondary font-semibold text-sm">Especialista em Consórcios</p>
                  <p className="text-primary-foreground/70 text-xs mt-1">10+ anos ajudando famílias a realizar seus sonhos</p>
                </div>
              </div>
            </div>

            {/* Right - Form Card */}
            <div id="simulator" className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="bg-gradient-to-r from-secondary to-secondary/80 px-6 py-5 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-secondary-foreground">
                  Simule Gratuitamente
                </h2>
                <p className="text-secondary-foreground/80 text-sm mt-1">
                  Descubra sua parcela em segundos
                </p>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Segment badges */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {segments.map((seg) => {
                    const Icon = seg.icon;
                    const isActive = selectedSegment === seg.id;
                    return (
                      <button
                        key={seg.id}
                        onClick={() => setSelectedSegment(seg.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {seg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Credit slider */}
                <div className="p-5 bg-muted/50 rounded-xl border border-border">
                  <Label className="text-sm font-medium text-foreground mb-1 block text-center">
                    Valor do crédito desejado
                  </Label>
                  <div className="text-center my-4">
                    <span className="text-3xl md:text-4xl font-extrabold text-primary">
                      {formatCurrencyDisplay(selectedCreditValue)}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Seu nome completo *"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="h-13 text-base bg-background border-input"
                    maxLength={100}
                  />
                  <div>
                    <Input
                      placeholder="Seu WhatsApp *"
                      value={formData.celular}
                      onChange={(e) => handleInputChange("celular", e.target.value)}
                      className="h-13 text-base bg-background border-input"
                      maxLength={15}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      📱 Enviaremos a proposta completa em até 2 horas
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 text-base font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    {isSubmitting ? "ENVIANDO..." : (
                      <span className="flex items-center gap-2">
                        SIMULAR GRATUITAMENTE
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

                {/* 127 pessoas */}
                <p className="text-center text-sm text-muted-foreground font-medium">
                  🔥 127 pessoas simularam hoje
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="py-16 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
            Por que escolher o <span className="text-primary">Consórcio Inteligente</span>?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Resposta em 2 min", desc: "Atendimento ágil e personalizado" },
              { icon: DollarSign, title: "Sem juros abusivos", desc: "Economize até 30% comparado ao financiamento" },
              { icon: CheckCircle2, title: "Aprovação facilitada", desc: "94% de taxa de aprovação" },
              { icon: BarChart3, title: "Use seu FGTS", desc: "Para imóveis e veículos" },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== O QUE É CONSÓRCIO ===== */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
            O que é <span className="text-primary">Consórcio</span>?
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
            Uma forma inteligente e planejada de adquirir bens, sem pagar juros bancários.
            Grupos de pessoas se unem para formar uma poupança coletiva.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">Como funciona?</h3>
              <ul className="space-y-3">
                {[
                  "Você escolhe o valor do crédito e o prazo",
                  "Paga parcelas mensais acessíveis",
                  "Todo mês, participantes são contemplados",
                  "Pode dar lance para antecipar a contemplação",
                  "Recebe a carta de crédito para usar como quiser",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-bold text-lg text-foreground mb-4">Vantagens vs Financiamento</h3>
              <ul className="space-y-3">
                {[
                  "Sem juros — apenas taxa de administração",
                  "Parcelas até 50% menores",
                  "Poder de compra à vista",
                  "Pode usar FGTS",
                  "Flexibilidade para trocar o bem",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARAÇÃO ===== */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
            Consórcio vs <span className="text-destructive">Financiamento</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border-2 border-primary shadow-lg">
              <div className="text-center mb-4">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                  ✅ CONSÓRCIO
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "Taxa de administração de ~15% no total",
                  "Parcelas menores e acessíveis",
                  "Poder de compra à vista",
                  "Sem entrada obrigatória",
                  "Economia de até 30%",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border opacity-75">
              <div className="text-center mb-4">
                <span className="bg-destructive/10 text-destructive px-4 py-1 rounded-full text-sm font-bold">
                  ❌ FINANCIAMENTO
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "Juros de 8% a 15% ao ano",
                  "Parcelas mais altas",
                  "Entrada de 20% a 30%",
                  "Custo total muito maior",
                  "Burocracia elevada",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-4 h-4 text-destructive flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DEPOIMENTO ===== */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            O que nossos clientes dizem
          </h2>
          <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-secondary fill-secondary" />
              ))}
            </div>
            <blockquote className="text-lg text-foreground italic leading-relaxed mb-6">
              "Consegui meu apartamento! O Fabrício me ajudou a realizar o sonho da casa própria.
              Super recomendo!"
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                M
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Maria Silva</p>
                <p className="text-sm text-muted-foreground">Contemplada em Imóvel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABAC ===== */}
      <section className="py-12 bg-background">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-card rounded-2xl p-8 border border-border flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1">Regulamentado pela ABAC</h3>
              <p className="text-sm text-muted-foreground mb-3">
                O consórcio é regulamentado pelo Banco Central e fiscalizado pela ABAC — Associação Brasileira de Administradoras de Consórcios.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href="https://www.abac.org.br/para-voce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Saiba mais na ABAC →
                </a>
                <a
                  href="https://www.abac.org.br/perguntas-frequentes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Perguntas Frequentes →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FALE COMIGO ===== */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Fale Comigo</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Tire suas dúvidas diretamente com o especialista. Atendimento rápido e personalizado.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Fabrício! Vi seu site e quero saber mais sobre consórcio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
            <a
              href="mailto:fabricio@consorciointeligente.com"
              className="flex items-center gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 border border-primary-foreground/30 text-primary-foreground px-6 py-3 rounded-full font-bold transition-colors"
            >
              <Mail className="w-5 h-5" />
              E-mail
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 border border-primary-foreground/30 text-primary-foreground px-6 py-3 rounded-full font-bold transition-colors"
            >
              <Instagram className="w-5 h-5" />
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 px-4 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-3">Consórcio Inteligente</h3>
              <p className="text-sm text-background/60">
                Seu caminho inteligente para conquistar imóveis, veículos e investimentos — sem juros abusivos.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Links Úteis</h3>
              <ul className="space-y-2 text-sm text-background/60">
                <li>
                  <a href="https://www.abac.org.br/para-voce" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                    ABAC — Para Você
                  </a>
                </li>
                <li>
                  <a href="https://www.abac.org.br/perguntas-frequentes" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                    ABAC — FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-secondary transition-colors">Política de Privacidade</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Redes Sociais</h3>
              <div className="flex gap-3">
                <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-background/15 pt-6 text-center text-sm text-background/50">
            © {new Date().getFullYear()} Fabrício Rodrigues Honório — Especialista em Consórcio Inteligente. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConsortiumSimulator;
