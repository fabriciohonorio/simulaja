import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bot, User, PowerOff, RefreshCw, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface LeadChatProps {
  leadId: string;
  leadName?: string;
  leadCelular?: string;
}

export const LeadChat: React.FC<LeadChatProps> = ({ leadId, leadName, leadCelular }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiActive, setIsAiActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChatData();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${leadId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `lead_id=eq.${leadId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
        scrollToBottom();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `id=eq.${leadId}`
      }, (payload) => {
        if (payload.new.atendimento_ia !== undefined) {
          setIsAiActive(payload.new.atendimento_ia);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const fetchChatData = async () => {
    setLoading(true);
    try {
      // 1. Fetch AI Status
      const { data: leadData } = await supabase
        .from('leads')
        .select('atendimento_ia')
        .eq('id', leadId)
        .single();
      
      if (leadData) {
        setIsAiActive(leadData.atendimento_ia ?? true);
      }

      // 2. Fetch Messages
      const { data: msgs, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(msgs || []);
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleToggleAi = async () => {
    setToggling(true);
    try {
      const novoStatus = !isAiActive;
      const { error } = await supabase
        .from('leads')
        .update({ atendimento_ia: novoStatus })
        .eq('id', leadId);

      if (error) throw error;
      
      setIsAiActive(novoStatus);
      toast({
        title: novoStatus ? "IA Ativada" : "IA Desativada",
        description: novoStatus ? "O robô voltou a responder o cliente." : "O robô parou de responder.",
        variant: novoStatus ? "default" : "destructive",
      });

      // Se desativou, abre o whatsapp
      if (!novoStatus && leadCelular) {
        const cleanPhone = leadCelular.replace(/\D/g, "");
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
      }

    } catch (error) {
      console.error("Erro ao alterar IA:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da IA.",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 border rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${isAiActive ? 'text-emerald-500' : 'text-slate-400'}`} />
          <div>
            <h3 className="font-bold text-sm text-slate-800">Agente IA (Jarvis)</h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              {isAiActive ? '🟢 Operando em tempo real' : '🔴 Pausado'}
            </p>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant={isAiActive ? "destructive" : "default"}
          className={`h-8 text-[10px] uppercase font-black tracking-widest rounded-lg ${!isAiActive && 'bg-emerald-600 hover:bg-emerald-700'}`}
          onClick={handleToggleAi}
          disabled={toggling}
        >
          {toggling ? <RefreshCw className="w-3 h-3 animate-spin" /> : isAiActive ? (
            <><PowerOff className="w-3 h-3 mr-1" /> Assumir Atendimento</>
          ) : (
            <><Bot className="w-3 h-3 mr-1" /> Reativar IA</>
          )}
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-xs uppercase font-bold tracking-widest">Carregando histórico...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-50 py-10">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p className="text-xs uppercase font-bold tracking-widest">Nenhuma mensagem ainda</p>
            <p className="text-[10px] text-center max-w-[200px]">Assim que a IA ou o cliente enviarem uma mensagem via Z-API, ela aparecerá aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${isAssistant ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                      isAssistant 
                        ? 'bg-white border border-slate-100 text-slate-800 rounded-bl-none' 
                        : 'bg-[#0f2044] text-white rounded-br-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-8 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Footer Info */}
      <div className="bg-slate-100 p-2 text-center border-t">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center justify-center gap-1">
          Histórico sincronizado com o WhatsApp <ExternalLink className="w-3 h-3" />
        </p>
      </div>
    </div>
  );
};
