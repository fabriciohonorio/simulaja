import { useState } from "react";
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

const segments = [
  { id: "imovel", label: "Imóveis" },
  { id: "veiculos", label: "Veículos" },
  { id: "motos", label: "Motos" },
  { id: "pesados", label: "Pesados" },
  { id: "agricolas", label: "Agrícolas" },
  { id: "investimentos", label: "Investimentos" },
];

const creditValues = [
  27000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000
];

const ConsortiumSimulator = () => {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState("veiculos");
  const [creditIndex, setCreditIndex] = useState(6); // Default: R$ 200.000
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

    const payload = {
      "Valor do Crédito": formatCurrencyDisplay(selectedCreditValue),
      "Nome": formData.nome,
      "Email": formData.email,
      "Celular": formData.celular,
      "Cidade": formData.cidade,
      "tipo_consorcio": selectedSegmentData?.label || selectedSegment,
    };

    try {
      const response = await fetch("https://hook.us2.make.com/r4od6xlua59ej2din9yol6tc34c4vgxb", {
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

        // Reset form
        setFormData({
          nome: "",
          email: "",
          celular: "",
          cidade: "",
          valorCredito: "",
        });
        setCreditIndex(4);
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
    <section id="simulator" className="bg-muted py-12 md:py-16">
      <div className="container max-w-xl mx-auto px-4">
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-6 py-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-primary-foreground">
              Simule seu Consórcio
            </h2>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Planejamento financeiro inteligente
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

            {/* Credit Value Selection - Central Element */}
            <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border">
              <Label className="text-sm font-medium text-foreground mb-2 block text-center">
                Escolha o valor aproximado do crédito desejado
              </Label>
              
              {/* Display Selected Value */}
              <div className="text-center my-6">
                <span className="text-3xl md:text-4xl font-bold text-secondary">
                  {formatCurrencyDisplay(selectedCreditValue)}
                </span>
              </div>

              {/* Slider */}
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
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 text-base bg-background border-input focus:border-primary"
                />
                <Input
                  placeholder="Celular *"
                  value={formData.celular}
                  onChange={(e) => handleInputChange("celular", e.target.value)}
                  className="h-12 text-base bg-background border-input focus:border-primary"
                />
              </div>

              <div>
                <Input
                  placeholder="Cidade *"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
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
                className="w-full h-14 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? "ENVIANDO..." : "SIMULAR CONSÓRCIO"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsortiumSimulator;
