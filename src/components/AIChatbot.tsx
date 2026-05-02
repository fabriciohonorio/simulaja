import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import robotAvatar from "@/assets/ai-assistant-pro.png";

type Step = "welcome" | "prazo" | "contexto" | "entrada" | "parcela" | "objetivo_especifico" | "insight" | "whatsapp";

interface Message {
  role: "bot" | "user";
  content: string;
  options?: { label: string; value: string }[];
}

const WHATSAPP_NUMBER = "5541997925357";

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({
    objetivo: "",
    prazo: "",
    contexto: "",
    entrada: "",
    parcela: "",
    bem_ideal: "",
    origem: "Consultoria Inteligente",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (content: string, options?: { label: string; value: string }[], delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", content, options }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage("Olá! Tudo bem? 👋\nEu posso te ajudar a montar um plano estratégico pra você conquistar o que você quer, de forma mais inteligente.");
        setTimeout(() => {
          setStep("welcome");
          addBotMessage("Me conta uma coisa pra eu te ajudar melhor… 👇\nO que você quer conquistar agora?", [
            { label: "🚗 Carro", value: "Carro" },
            { label: "🏍️ Moto", value: "Moto" },
            { label: "🏡 Imóvel", value: "Imóvel" },
            { label: "🤔 Ainda estou avaliando", value: "Avaliando" },
          ]);
        }, 1000);
      }, 400);
    }
  };

  const handleOptionClick = (value: string, label: string) => {
    addUserMessage(label);

    switch (step) {
      case "welcome":
        setLeadData((prev) => ({ ...prev, objetivo: value }));
        setTimeout(() => {
          setStep("prazo");
          addBotMessage("Perfeito. Agora me diz:\nEssa etapa dando certo, em quanto tempo você gostaria de estar com o bem na mão?", [
            { label: "⚡ O quanto antes", value: "Imediato" },
            { label: "📅 Até 6 meses", value: "6 meses" },
            { label: "🗓️ Até 1 ano", value: "1 ano" },
            { label: "🧘 Posso planejar com calma", value: "Longo prazo" },
          ]);
        }, 800);
        break;

      case "prazo":
        setLeadData((prev) => ({ ...prev, prazo: value }));
        setTimeout(() => {
          setStep("contexto");
          addBotMessage("Você já chegou a ver financiamento ou ainda está analisando as melhores opções?", [
            { label: "🏦 Já vi financiamento", value: "Financiamento" },
            { label: "🔍 Ainda estou pesquisando", value: "Pesquisando" },
            { label: "💡 Quero entender melhor antes", value: "Entender" },
          ]);
        }, 800);
        break;

      case "contexto":
        setLeadData((prev) => ({ ...prev, contexto: value }));
        setTimeout(() => {
          setStep("entrada");
          addBotMessage("Pra montar algo mais assertivo pra você:\nVocê pretende dar algum valor de entrada ou começar do zero?", [
            { label: "💰 Tenho entrada", value: "Com entrada" },
            { label: "🚀 Começar sem entrada", value: "Sem entrada" },
            { label: "📊 Depende da estratégia", value: "Depende" },
          ]);
        }, 800);
        break;

      case "entrada":
        setLeadData((prev) => ({ ...prev, entrada: value }));
        setTimeout(() => {
          setStep("parcela");
          addBotMessage("E hoje, qual faixa de parcela seria tranquila pra você, sem apertar seu orçamento?", [
            { label: "💵 Até R$500", value: "Até 500" },
            { label: "💵 R$500 a R$1.000", value: "500-1000" },
            { label: "💵 R$1.000 a R$2.000", value: "1000-2000" },
            { label: "💵 Acima de R$2.000", value: "2000+" },
          ]);
        }, 800);
        break;

      case "parcela":
        setLeadData((prev) => ({ ...prev, parcela: value }));
        setTimeout(() => {
          setStep("objetivo_especifico");
          setShowInput(true);
          const obj = leadData.objetivo.toLowerCase() === "avaliando" ? "bem" : leadData.objetivo.toLowerCase();
          addBotMessage(`Agora me conta: qual seria o ${obj} ideal que você tem em mente?`);
        }, 800);
        break;

      case "whatsapp":
        if (value === "Sim" || value === "WhatsApp") {
          handleWhatsApp();
        } else {
          addBotMessage("Sem problemas! Quando estiver pronto, estarei por aqui. Tenha um ótimo dia! 👋");
          setTimeout(() => setIsOpen(false), 2000);
        }
        break;
    }
  };

  const handleSendValue = () => {
    if (!inputValue.trim()) return;
    addUserMessage(inputValue);
    const specificGoal = inputValue;
    setLeadData((prev) => ({ ...prev, bem_ideal: specificGoal }));
    setInputValue("");
    setShowInput(false);

    setTimeout(() => {
      setStep("insight");
      const obj = leadData.objetivo.toLowerCase() === "avaliando" ? "bem" : leadData.objetivo.toLowerCase();
      addBotMessage(
        `Pelo que você me falou, dá pra montar um plano bem estratégico pra você conquistar seu ${obj} dentro de um prazo próximo do que você quer, sem precisar entrar em financiamento com juros altos.\n\n` +
        `E dependendo da estratégia, existe a possibilidade de antecipar isso mais rápido do que a maioria das pessoas imagina.`
      );
      
      setTimeout(() => {
        setStep("whatsapp");
        addBotMessage(
          "Agora faz sentido eu te mostrar como isso funcionaria na prática, com números e possibilidades reais pro seu caso.\n\n" +
          "Posso te conectar com um especialista pra te explicar isso direto e sem compromisso?",
          [
            { label: "✅ Sim, quero entender", value: "Sim" },
            { label: "📲 Chamar no WhatsApp", value: "WhatsApp" },
            { label: "⏳ Prefiro ver depois", value: "Depois" },
          ]
        );
      }, 2000);
    }, 800);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá! Fiz a pré-consultoria inteligente e quero falar com um especialista.\n\n` +
      `🎯 Objetivo: ${leadData.objetivo}\n` +
      `⏱️ Prazo: ${leadData.prazo}\n` +
      `🏦 Contexto: ${leadData.contexto}\n` +
      `💰 Entrada: ${leadData.entrada}\n` +
      `💵 Parcela: ${leadData.parcela}\n` +
      `✨ Bem Ideal: ${leadData.bem_ideal}`
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

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-2xl px-4 py-2.5 text-sm rounded-bl-md flex gap-1">
                  <span className="dot w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="dot w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="dot w-1 h-1 bg-slate-400 rounded-full"></span>
                </div>
              </div>
            )}

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

            {/* WhatsApp Quick Action (Optional, but keeping for UX) */}
            {step === "whatsapp" && messages[messages.length - 1].role === "bot" && (
              <div className="pt-2">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-base shadow-lg shadow-green-900/20"
                >
                  💬 Falar com especialista agora
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input for open responses */}
          {showInput && (
            <div className="bg-background border-t border-border px-4 py-3 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendValue()}
                placeholder="Escreva aqui..."
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
