import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SegmentCard from "./SegmentCard";

import houseImg from "@/assets/segment-house.png";
import carImg from "@/assets/segment-car.png";
import motorcycleImg from "@/assets/segment-motorcycle.png";
import truckImg from "@/assets/segment-truck.png";
import tractorImg from "@/assets/segment-tractor.png";
import investmentImg from "@/assets/segment-investment.png";

const segments = [
  { id: "imovel", label: "Imóvel", image: houseImg, description: "Realize o sonho da casa própria" },
  { id: "veiculos", label: "Veículos", image: carImg, description: "Adquira um carro 0km ou seminovo" },
  { id: "motos", label: "Motos", image: motorcycleImg, description: "Compre uma moto sem comprometer seu orçamento" },
  { id: "pesados", label: "Pesados", image: truckImg, description: "Caminhões e veículos de carga" },
  { id: "agricolas", label: "Agrícolas", image: tractorImg, description: "Máquinas e equipamentos agrícolas" },
  { id: "investimentos", label: "Investimentos", image: investmentImg, description: "Faça seu dinheiro render mais" },
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

    const message = `🏦 *SIMULAÇÃO DE CONSÓRCIO*

📋 *Segmento:* ${selectedSegmentData?.label}
💰 *Valor do Crédito:* ${formData.valorCredito}

👤 *Dados do Cliente:*
• Nome: ${formData.nome}
• Email: ${formData.email}
• Celular: ${formData.celular}
• Cidade: ${formData.cidade}

📧 Aceita Marketing: ${acceptMarketing ? "Sim" : "Não"}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = "5541997925357";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");

    toast({
      title: "Simulação enviada!",
      description: "Você será redirecionado para o WhatsApp.",
    });

    setIsSubmitting(false);
  };

  return (
    <div id="simulator" className="bg-background flex items-center justify-center p-4 py-12 md:py-16">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              OPÇÕES DE CONSÓRCIOS
            </h1>
            <p className="text-primary-foreground/90 text-sm md:text-base">
              Escolha um consórcio abaixo para ver as opções de crédito disponíveis!
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Segment Title */}
            <h2 className="text-xl font-bold text-secondary text-center mb-4">
              {selectedSegmentData?.label}
            </h2>

            {/* Segment Selection */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {segments.map((segment) => (
                <SegmentCard
                  key={segment.id}
                  icon={
                    <img 
                      src={segment.image} 
                      alt={segment.label}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg"
                    />
                  }
                  label={segment.label}
                  isSelected={selectedSegment === segment.id}
                  onClick={() => setSelectedSegment(segment.id)}
                />
              ))}
            </div>

            {/* Description */}
            <p className="text-foreground text-center mb-6">
              {selectedSegmentData?.description}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Credit Value */}
              <div>
                <Input
                  placeholder="Valor do Crédito *"
                  value={formData.valorCredito}
                  onChange={(e) => handleInputChange("valorCredito", e.target.value)}
                  className="h-12 text-base bg-muted border-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome *"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className="h-12 text-base bg-muted border-input"
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 text-base bg-muted border-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Celular *"
                  value={formData.celular}
                  onChange={(e) => handleInputChange("celular", e.target.value)}
                  className="h-12 text-base bg-muted border-input"
                />
                <Input
                  placeholder="Cidade *"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  className="h-12 text-base bg-muted border-input"
                />
              </div>

              {/* Marketing Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={acceptMarketing}
                  onCheckedChange={(checked) => setAcceptMarketing(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  Aceito receber comunicações de e-mail marketing com vantagens especiais.
                </Label>
              </div>

              {/* Privacy Policy */}
              <p className="text-xs text-muted-foreground text-center">
                Ao informar meus dados, eu concordo com a{" "}
                <a href="#" className="text-primary underline hover:no-underline">
                  Política de Privacidade
                </a>{" "}
                e receber contato de um especialista de consórcio.
              </p>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? "ENVIANDO..." : "QUERO SIMULAR MEU CONSÓRCIO"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsortiumSimulator;
