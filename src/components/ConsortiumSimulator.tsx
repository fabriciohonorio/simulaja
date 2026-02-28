import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronRight } from "lucide-react";

// Import assets
import logoMagalu from "@/assets/logo-consorcio-magalu.png";
import gestorFabricio from "@/assets/gestor-fabricio.jpg";
import bannerImoveis from "@/assets/banner-imoveis.jpg";
import bannerVeiculos from "@/assets/banner-veiculos.jpg";
import bannerMotos from "@/assets/banner-motos.jpg";
import bannerPesados from "@/assets/banner-pesados.jpg";
import bannerAgricolas from "@/assets/banner-agricolas.jpg";
import bannerInvestimentos from "@/assets/banner-investimentos.jpg";

const segments = [
  { id: "imovel", label: "Imóveis" },
  { id: "veiculos", label: "Veículos" },
  { id: "motos", label: "Motos" },
  { id: "pesados", label: "Pesados" },
  { id: "agricolas", label: "Agrícolas" },
  { id: "investimentos", label: "Investimentos" },
];

const segmentBanners: Record<string, { image: string; title: string; subtitle: string; cta: string }> = {
  imovel: {
    image: bannerImoveis,
    title: "Quer sair do aluguel?",
    subtitle: "Realize o sonho da casa própria!",
    cta: "Simule para Imóveis",
  },
  veiculos: {
    image: bannerVeiculos,
    title: "Sonha com um carro novo?",
    subtitle: "Conquiste seu veículo zero!",
    cta: "Simule para Veículos",
  },
  motos: {
    image: bannerMotos,
    title: "Quer sua moto nova?",
    subtitle: "Liberdade sobre duas rodas!",
    cta: "Simule para Motos",
  },
  pesados: {
    image: bannerPesados,
    title: "Precisa de um veículo pesado?",
    subtitle: "Invista no seu negócio!",
    cta: "Simule para Pesados",
  },
  agricolas: {
    image: bannerAgricolas,
    title: "Quer investir na sua fazenda?",
    subtitle: "Máquinas para o agronegócio!",
    cta: "Simule para Agronegócio",
  },
  investimentos: {
    image: bannerInvestimentos,
    title: "Quer ampliar seus investimentos?",
    subtitle: "Construa seu patrimônio!",
    cta: "Simule para Investimentos",
  },
};

const creditValues = [
  27000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000
];

const ConsortiumSimulator = () => {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState("veiculos");
  const [creditIndex, setCreditIndex] = useState(6);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    cidade: "",
    valorCredito: "",
  });
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSegmentData = segments.find(s => s.id === selectedSegment);
  const selectedCreditValue = creditValues[creditIndex];

  const formatCurrencyDisplay = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "celular") {
      setFormData(prev => ({ ...prev, [field]: formatPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email || !formData.celular || !formData.cidade) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const creditValueNum = selectedCreditValue;
    const tipoConsorcio = selectedSegmentData?.label || selectedSegment;

    // 1. Salvar no Supabase
    try {
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert({
          nome: formData.nome,
          email: formData.email,
          celular: formData.celular,
          cidade: formData.cidade,
          tipo_consorcio: tipoConsorcio,
          valor_credito: creditValueNum,
          prazo_meses: 60,
          status: "novo",
          origem: "Simulador - Site",
        })
        .select()
        .single();

      if (leadError) {
        console.error("[Supabase] Erro ao salvar lead:", leadError);
      } else {
        console.log("[Supabase] Lead salvo com sucesso:", leadData);
      }
    } catch (supaError) {
      console.error("[Supabase] Exceção ao salvar lead:", supaError);
    }

    // 2. Enviar para webhook do Make
    const payload = {
      nome: formData.nome,
      email: formData.email,
      celular: formData.celular,
      cidade: formData.cidade,
      valor_credito: formatCurrencyDisplay(selectedCreditValue),
      tipo_consorcio: tipoConsorcio,
      pagina: window.location.href,
      origem: "Lovable",
    };

    try {
      const response = await fetch("https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Você será atendido por um Especialista.",
        });

        setFormData({
          nome: "",
          email: "",
          celular: "",
          cidade: "",
          valorCredito: "",
        });
        setCreditIndex(6);
        setSelectedSegment("veiculos");
        setAcceptMarketing(false);
      } else {
        throw new Error("Erro ao enviar simulação");
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="simulator" className="bg-gradient-to-b from-primary/5 to-background py-8 md:py-16">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left Column - Simulator */}
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden lg:sticky lg:top-8">
            {/* Header with Logo */}
            <div className="bg-primary px-6 py-6 text-center">
              <img
                src={logoMagalu}
                alt="Consórcio Magalu"
                className="h-10 md:h-12 mx-auto mb-4 object-contain"
              />
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground">
                Simule seu Consórcio
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Você está perto de realizar seu projeto de vida.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Segment Selection - Dropdown */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Tipo de consórcio
                </Label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="h-12 text-base bg-background border-input">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {segments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Credit Value Selection */}
              <div className="mb-8 p-6 bg-muted/50 rounded-xl border border-border">
                <Label className="text-sm font-medium text-foreground mb-2 block text-center">
                  Escolha o valor aproximado do crédito desejado
                </Label>

                <div className="text-center my-6">
                  <span className="text-3xl md:text-4xl font-bold text-primary">
                    {formatCurrencyDisplay(selectedCreditValue)}
                  </span>
                </div>

                <div className="px-2">
                  <Slider
                    value={[creditIndex]}
                    onValueChange={(value) => setCreditIndex(value[0])}
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
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Nome *"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="h-12 text-base bg-background border-input focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="email"
                    placeholder="E-mail *"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-12 text-base bg-background border-input focus:border-primary"
                  />
                  <Input
                    placeholder="Cidade *"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    className="h-12 text-base bg-background border-input focus:border-primary"
                  />
                </div>

                <div>
                  <Input
                    placeholder="Celular *"
                    value={formData.celular}
                    onChange={(e) => handleInputChange("celular", e.target.value)}
                    className="h-12 text-base bg-background border-input focus:border-primary"
                  />
                </div>

                {/* Marketing Checkbox */}
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="marketing"
                    checked={acceptMarketing}
                    onCheckedChange={(checked) => setAcceptMarketing(checked as boolean)}
                    className="mt-0.5 border-input data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                  />
                  <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    Aceito receber comunicações de e-mail marketing com vantagens especiais.
                  </Label>
                </div>

                {/* Privacy Policy */}
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Ao informar meus dados, eu concordo com a{" "}
                  <a href="#" className="text-primary underline hover:no-underline font-medium">
                    Política de Privacidade
                  </a>{" "}
                  e receber contato de um especialista de consórcio.
                </p>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-base font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? "ENVIANDO..." : "SIMULAR CONSÓRCIO"}
                </Button>

                {/* Post-button message */}
                <p className="text-sm text-center text-muted-foreground pt-2">
                  Após simular, um <strong className="text-foreground">especialista</strong> entrará em contato com você.
                </p>
              </form>

              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                <img
                  src={gestorFabricio}
                  alt="Fabrício Rodrigues Honório"
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <p className="text-sm text-muted-foreground">Gestor de Negócios do Consórcio Magalu.</p>
                  <p className="font-semibold text-foreground">Fabrício Rodrigues Honório</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Dynamic Images */}
          <div className="space-y-4 lg:pt-0">
            {segments.map((segment) => {
              const banner = segmentBanners[segment.id];
              const isSelected = selectedSegment === segment.id;

              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() => setSelectedSegment(segment.id)}
                  className={`
                    relative w-full overflow-hidden rounded-xl transition-all duration-300 group
                    ${isSelected
                      ? 'ring-4 ring-secondary shadow-xl scale-[1.02]'
                      : 'ring-1 ring-border hover:ring-2 hover:ring-primary/50 hover:shadow-lg'
                    }
                  `}
                >
                  <div className="aspect-[16/7] relative">
                    <img
                      src={banner.image}
                      alt={segment.label}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-center">
                      <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-md">
                        {banner.title}
                      </h3>
                      <p className="text-sm text-white/90 drop-shadow-sm mt-1">
                        {banner.subtitle}
                      </p>
                      <div className={`
                        mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold w-fit
                        transition-all duration-300
                        ${isSelected
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-primary text-primary-foreground group-hover:bg-secondary group-hover:text-secondary-foreground'
                        }
                      `}>
                        {banner.cta}
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsortiumSimulator;
