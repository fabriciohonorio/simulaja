import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SegmentCard from "./SegmentCard";
import { Home, Car, Bike, Truck, Tractor, TrendingUp } from "lucide-react";

const segments = [
  { id: "imovel", label: "Imóvel", Icon: Home, description: "Realize o sonho da casa própria" },
  { id: "veiculos", label: "Veículos", Icon: Car, description: "Adquira um carro 0km ou seminovo" },
  { id: "motos", label: "Motos", Icon: Bike, description: "Compre uma moto sem comprometer seu orçamento" },
  { id: "pesados", label: "Pesados", Icon: Truck, description: "Caminhões e veículos de carga" },
  { id: "agricolas", label: "Agrícolas", Icon: Tractor, description: "Máquinas e equipamentos agrícolas" },
  { id: "investimentos", label: "Investimentos", Icon: TrendingUp, description: "Faça seu dinheiro render mais" },
];

const ConsortiumSimulator = () => {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState("veiculos");
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

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "valorCredito") {
      setFormData(prev => ({ ...prev, [field]: formatCurrency(value) }));
    } else if (field === "celular") {
      setFormData(prev => ({ ...prev, [field]: formatPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.celular || !formData.cidade || !formData.valorCredito) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      "Valor do Crédito": formData.valorCredito,
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
          title: "Simulação enviada!",
          description: "Em breve um especialista entrará em contato.",
        });

        // Reset form
        setFormData({
          nome: "",
          email: "",
          celular: "",
          cidade: "",
          valorCredito: "",
        });
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
      <div className="container max-w-2xl mx-auto px-4">
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-6 py-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              Simule seu Consórcio
            </h2>
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Escolha o segmento e preencha os dados para receber uma proposta personalizada
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Segment Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                Selecione o tipo de consórcio
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {segments.map((segment) => (
                  <SegmentCard
                    key={segment.id}
                    Icon={segment.Icon}
                    label={segment.label}
                    isSelected={selectedSegment === segment.id}
                    onClick={() => setSelectedSegment(segment.id)}
                  />
                ))}
              </div>
            </div>

            {/* Selected Segment Info */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {selectedSegmentData?.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedSegmentData?.description}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Credit Value */}
              <div>
                <Input
                  placeholder="Valor do Crédito *"
                  value={formData.valorCredito}
                  onChange={(e) => handleInputChange("valorCredito", e.target.value)}
                  className="h-12 text-base bg-background border-input focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Nome *"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className="h-12 text-base bg-background border-input focus:border-primary"
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 text-base bg-background border-input focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Celular *"
                  value={formData.celular}
                  onChange={(e) => handleInputChange("celular", e.target.value)}
                  className="h-12 text-base bg-background border-input focus:border-primary"
                />
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
                {isSubmitting ? "ENVIANDO..." : "QUERO SIMULAR MEU CONSÓRCIO"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsortiumSimulator;
