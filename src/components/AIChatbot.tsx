import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import robotAvatar from "@/assets/ai-assistant-pro.png";

type Step = "welcome" | "objetivo" | "valor" | "conhecimento" | "simulacao" | "whatsapp";

interface Message {
  role: "bot" | "user";
  content: string;
  options?: { label: string; value: string }[];
}

const WHATSAPP_NUMBER = "5541997925357";

const SIMULATION_TABLE = [
  { credito: 110000, parcela: 404.14 },
  { credito: 120000, parcela: 440.88 },
  { credito: 130000, parcela: 477.61 },
  { credito: 140000, parcela: 514.35 },
  { credito: 150000, parcela: 551.09 },
  { credito: 170000, parcela: 624.57 },
  { credito: 190000, parcela: 698.05 },
  { credito: 200000, parcela: 734.79 },
];

const parseValue = (input: string): number => {
  const cleaned = input.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

const formatBRL = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const findClosestPlan = (value: number) => {
  if (value <= 0) return null;
  return SIMULATION_TABLE.reduce((prev, curr) =>
    Math.abs(curr.credito - value) < Math.abs(prev.credito - value) ? curr : prev
  );
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [leadData, setLeadData] = useState({
    objetivo: "",
    valor_credito: "",
    conhecimento_consorcio: "",
    interesse_simulacao: "",
    origem: "Jarvis AI",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (content: string, options?: { label: string; value: string }[]) => {
    setMessages((prev) => [...prev, { role: "bot", content, options }]);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage("Olá 👋 Sou o Assistente Inteligente do Consórcio Inteligente. Vou te ajudar rápido.");
        setTimeout(() => {
          setStep("objetivo");
          addBotMessage("Qual seu objetivo hoje?", [
            { label: "🚗 Veículo", value: "Veículo" },
            { label: "🏍️ Moto", value: "Moto" },
            { label: "🏡 Imóvel", value: "Imóvel" },
            { label: "💰 Investimento", value: "Investimento" },
          ]);
        }, 800);
      }, 400);
    }
  };

  const handleOptionClick = (value: string, label: string) => {
    addUserMessage(label);

    switch (step) {
      case "objetivo":
        setLeadData((prev) => ({ ...prev, objetivo: value }));
        setTimeout(() => {
          setStep("valor");
          setShowInput(true);
          addBotMessage("Qual valor de crédito você deseja? (ex: R$ 50.000)");
        }, 600);
        break;

      case "conhecimento":
        setLeadData((prev) => ({ ...prev, conhecimento_consorcio: value }));
        if (value === "Quero entender melhor") {
          setTimeout(() => {
            addBotMessage("Consórcio é uma forma de compra, planejada, sem juros, parcelas acessíveis. Pode ser usada também como investimento.");
            setTimeout(() => {
              setStep("simulacao");
              addBotMessage("Quer que eu simule uma parcela pra você?", [
                { label: "✅ Sim", value: "Sim" },
                { label: "⏳ Depois", value: "Depois" },
              ]);
            }, 1000);
          }, 600);
        } else {
          setTimeout(() => {
            setStep("simulacao");
            addBotMessage("Quer que eu simule uma parcela pra você?", [
              { label: "✅ Sim", value: "Sim" },
              { label: "⏳ Depois", value: "Depois" },
            ]);
          }, 600);
        }
        break;

      case "simulacao":
        setLeadData((prev) => ({ ...prev, interesse_simulacao: value }));
        if (value === "Sim") {
          setTimeout(() => {
            const valorNum = parseValue(leadData.valor_credito);
            const plan = findClosestPlan(valorNum);

            if (plan && leadData.objetivo === "Imóvel") {
              addBotMessage(
                `📊 Simulação aproximada — Consórcio Imobiliário Casa Própria\n\n` +
                `💰 Crédito: ${formatBRL(plan.credito)}\n` +
                `📅 Parcela reduzida até contemplação: ~${formatBRL(plan.parcela)}/mês\n` +
                `📆 Plano: 217 meses | Modalidade 50/50\n\n` +
                `⚠️ Valores aproximados, sujeitos a atualização.`
              );
              setTimeout(() => {
                addBotMessage("Posso calcular sua simulação completa e sua chance de contemplação. Quer ver como acelerar sua casa própria? 🏡");
                setTimeout(() => {
                  setStep("whatsapp");
                  addBotMessage("Se preferir, posso te conectar direto com o especialista no WhatsApp. 📲");
                }, 1200);
              }, 1500);
            } else {
              addBotMessage("Para uma simulação personalizada do seu perfil, nosso especialista pode te ajudar com os melhores planos disponíveis! 🚀");
              setTimeout(() => {
                setStep("whatsapp");
                addBotMessage("Se preferir, posso te conectar direto com o especialista no WhatsApp. 📲");
              }, 1000);
            }
          }, 600);
        } else {
          setTimeout(() => {
            setStep("whatsapp");
            addBotMessage("Se preferir, posso te conectar direto com o especialista no WhatsApp. 📲");
          }, 600);
        }
        break;
    }
  };

  const handleSendValue = () => {
    if (!inputValue.trim()) return;
    addUserMessage(inputValue);
    setLeadData((prev) => ({ ...prev, valor_credito: inputValue }));
    setInputValue("");
    setShowInput(false);

    setTimeout(() => {
      setStep("conhecimento");
      addBotMessage("Você já conhece como funciona o consórcio?", [
        { label: "👍 Sim", value: "Sim" },
        { label: "👎 Não", value: "Não" },
        { label: "🤔 Quero entender melhor", value: "Quero entender melhor" },
      ]);
    }, 600);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá, vim pelo atendimento inteligente do simulador e quero falar com o especialista.\n\nObjetivo: ${leadData.objetivo}\nValor: ${leadData.valor_credito}\nConhecimento: ${leadData.conhecimento_consorcio}\nSimulação: ${leadData.interesse_simulacao}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <button
            onClick={handleOpen}
            className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 animate-scale-in overflow-hidden"
            aria-label="Atendimento Inteligente"
          >
            <img src={robotAvatar} alt="Assistente" className="w-full h-full object-cover" />
            <span className="absolute inset-0 rounded-full bg-violet-500/40 animate-ping" />
          </button>
          <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            Atendimento Inteligente
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-96 h-[520px] max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-scale-in border border-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={robotAvatar} alt="Assistente" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Assistente Inteligente</p>
              <p className="text-white/70 text-xs">Online agora</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-background p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content.split("\n").map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Options */}
            {messages.length > 0 && messages[messages.length - 1].options && (
              <div className="flex flex-wrap gap-2 pl-1">
                {messages[messages.length - 1].options!.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionClick(opt.value, opt.label)}
                    className="px-4 py-2 rounded-full border border-violet-300 text-violet-700 dark:text-violet-300 dark:border-violet-500 text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* WhatsApp CTA */}
            {step === "whatsapp" && (
              <div className="pt-2">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-base"
                >
                  💬 Falar com especialista agora
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input for valor */}
          {showInput && (
            <div className="bg-background border-t border-border px-4 py-3 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendValue()}
                placeholder="Digite o valor desejado..."
                className="flex-1 bg-muted text-foreground rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 border-0"
                autoFocus
              />
              <button
                onClick={handleSendValue}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatbot;
