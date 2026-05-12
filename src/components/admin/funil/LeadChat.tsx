
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Send, Bot, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lead } from "@/types/funil";
import { toast } from "sonner";

interface Message {
  id: string;
  lead_id: string;
  sender: 'client' | 'ai' | 'agent';
  content: string;
  created_at: string;
}

export function LeadChat({ lead }: { lead: Lead }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(lead.atendimento_ia !== false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`chat-${lead.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [lead.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  };

  const handleToggleAi = async (enabled: boolean) => {
    setAiEnabled(enabled);
    const { error } = await supabase
      .from("leads")
      .update({ atendimento_ia: enabled })
      .eq("id", lead.id);

    if (error) {
      toast.error("Erro ao alterar status da IA");
      setAiEnabled(!enabled);
    } else {
      toast.success(enabled ? "IA ativada para este lead" : "Atendimento humano ativado");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      lead_id: lead.id,
      content: newMessage.trim(),
      sender: 'agent',
      organizacao_id: lead.organizacao_id
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
      {/* Header com Toggle IA */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">
            {aiEnabled ? "IA Ativa" : "Atendimento Humano"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="ai-toggle" className="text-[10px] font-bold uppercase text-slate-400">Automação IA</Label>
          <Switch 
            id="ai-toggle" 
            checked={aiEnabled} 
            onCheckedChange={handleToggleAi}
          />
        </div>
      </div>

      {/* Área de Mensagens */}
      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <MessageSquare className="h-12 w-12 opacity-10 mb-2" />
              <p className="text-xs font-medium">Nenhuma mensagem no histórico do WhatsApp.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'client' ? 'items-start' : 'items-end'}`}
              >
                <div className={`flex items-center gap-1.5 mb-1 ${msg.sender === 'client' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {msg.sender === 'ai' ? <Bot className="h-3 w-3 text-indigo-500" /> : <User className="h-3 w-3 text-slate-400" />}
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                    {msg.sender === 'client' ? 'Cliente' : msg.sender === 'ai' ? 'Jarvis AI' : 'Consultor'}
                  </span>
                  <span className="text-[8px] text-slate-300">
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.sender === 'client' 
                    ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                    : msg.sender === 'ai'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-emerald-600 text-white rounded-tr-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input de Mensagem */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <Input 
          placeholder={aiEnabled ? "IA está respondendo... Desative para assumir." : "Digite sua mensagem humana..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-full bg-slate-50 border-slate-100 focus:bg-white transition-all"
          disabled={aiEnabled && false} // Opcional: deixar habilitado mesmo com IA se quiser intervir
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-90"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
