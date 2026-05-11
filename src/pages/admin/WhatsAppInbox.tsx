
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, Bot, User, Send, Loader2, Filter, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lead } from "@/types/funil";
import { LeadChat } from "@/components/admin/funil/LeadChat";

interface ChatLead extends Lead {
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export default function WhatsAppInbox() {
  const { profile } = useProfile();
  const [leads, setLeads] = useState<ChatLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<ChatLead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organizacao_id) {
      fetchLeads();
      
      // Listen for new messages to update the list
      const channel = supabase
        .channel('inbox-updates')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          () => {
            fetchLeads();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchLeads = async () => {
    if (!profile?.organizacao_id) return;

    // First get all leads with chat history
    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("lead_id, content, created_at")
      .order("created_at", { ascending: false });

    if (msgError) return;

    // Get unique lead IDs from messages
    const leadIds = Array.from(new Set(messages.map(m => m.lead_id)));

    if (leadIds.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch lead details
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .in("id", leadIds);

    if (leadError) return;

    // Combine data
    const leadsWithMessages = leadData.map(lead => {
      const leadMsgs = messages.filter(m => m.lead_id === lead.id);
      return {
        ...lead,
        last_message: leadMsgs[0]?.content,
        last_message_at: leadMsgs[0]?.created_at,
      } as ChatLead;
    }).sort((a, b) => 
      new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );

    setLeads(leadsWithMessages);
    setLoading(false);
  };

  const filteredLeads = leads.filter(l => 
    l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.celular?.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100">
      {/* Sidebar: Lista de Conversas */}
      <div className="w-full sm:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600 fill-indigo-600" /> WhatsApp
            </h2>
            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <span className="text-xs font-black text-indigo-600">{leads.length}</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar cliente..." 
              className="pl-10 h-11 rounded-2xl border-none bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 pb-6 space-y-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-10 px-6">
                <p className="text-sm text-slate-400 font-medium italic">Nenhuma conversa encontrada.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full p-4 rounded-3xl flex gap-3 transition-all text-left ${
                    selectedLead?.id === lead.id 
                      ? "bg-white shadow-lg ring-1 ring-slate-100" 
                      : "hover:bg-white/60"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm ${
                    selectedLead?.id === lead.id ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {lead.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="font-black text-sm text-slate-900 truncate">{lead.nome}</p>
                      {lead.last_message_at && (
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          {format(new Date(lead.last_message_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate leading-relaxed">
                      {lead.last_message || "Inicie uma conversa..."}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${lead.atendimento_ia !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {lead.atendimento_ia !== false ? "IA Ativa" : "Humano"}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main: Janela de Chat */}
      <div className="flex-1 flex flex-col bg-slate-50/20">
        {selectedLead ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                  {selectedLead.nome.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-900">{selectedLead.nome}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.celular}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">Ver Ficha</Button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-hidden">
               <LeadChat lead={selectedLead} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="h-24 w-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-indigo-600/20" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Selecione uma conversa</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-2">
              Escolha um cliente à esquerda para visualizar o histórico de mensagens e interagir em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
