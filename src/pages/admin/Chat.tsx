import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Loader2 } from "lucide-react";

interface Membro {
  id: string;
  nome_completo: string | null;
  tipo_acesso: string;
}

interface Mensagem {
  id: string;
  mensagem: string;
  remetente_id: string;
  destinatario_id: string | null;
  created_at: string;
  remetente?: { nome_completo: string };
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  manager: "bg-purple-100 text-purple-700",
  vendedor: "bg-blue-100 text-blue-700",
};

export default function Chat() {
  const { profile, loading: profileLoading } = useProfile();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null); // null = broadcast (todos)
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Buscar membros
  useEffect(() => {
    if (!profile?.organizacao_id) return;
    (supabase.from("perfis" as any) as any)
      .select("id, nome_completo, tipo_acesso")
      .eq("organizacao_id", profile.organizacao_id)
      .neq("id", profile.id)
      .then(({ data }: any) => setMembros(data || []));
  }, [profile]);

  // Buscar mensagens e assinar Realtime
  useEffect(() => {
    if (!profile?.organizacao_id) return;
    fetchMensagens();

    const channel = supabase
      .channel("chat-" + profile.organizacao_id)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `organizacao_id=eq.${profile.organizacao_id}`,
        },
        (payload: any) => {
          const msg = payload.new as Mensagem;
          const isRelevant =
            msg.destinatario_id === null ||
            msg.destinatario_id === profile.id ||
            msg.remetente_id === profile.id;
          if (isRelevant) {
            setMensagens((prev) => [...prev, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, selectedId]);

  const fetchMensagens = async () => {
    if (!profile) return;
    setLoadingMsgs(true);
    const query = (supabase.from("mensagens" as any) as any)
      .select("*, remetente:perfis!mensagens_remetente_id_fkey(nome_completo)")
      .eq("organizacao_id", profile.organizacao_id)
      .order("created_at", { ascending: true })
      .limit(100);

    const { data } = await query;
    // Filter for the current conversation
    const filtered = (data || []).filter((m: Mensagem) => {
      if (selectedId === null) return m.destinatario_id === null;
      return (
        (m.remetente_id === profile.id && m.destinatario_id === selectedId) ||
        (m.remetente_id === selectedId && m.destinatario_id === profile.id)
      );
    });
    setMensagens(filtered);
    setLoadingMsgs(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = async () => {
    if (!texto.trim() || !profile?.organizacao_id) return;
    setSending(true);
    await (supabase.from("mensagens" as any) as any).insert({
      mensagem: texto.trim(),
      organizacao_id: profile.organizacao_id,
      remetente_id: profile.id,
      destinatario_id: selectedId,
    });
    setTexto("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectConversa = (id: string | null) => {
    setSelectedId(id);
    setMensagens([]);
  };

  useEffect(() => {
    fetchMensagens();
  }, [selectedId]);

  const selectedName =
    selectedId === null
      ? "Todos da Equipe"
      : membros.find((m) => m.id === selectedId)?.nome_completo ?? "Membro";

  if (profileLoading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col sm:flex-row gap-0 overflow-hidden rounded-2xl shadow-xl border border-slate-100 bg-white">
      {/* Sidebar: Lista de conversas */}
      <aside className="w-full sm:w-64 lg:w-72 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900 text-base">Chat da Equipe</h2>
          <p className="text-xs text-slate-500">Mensagens em tempo real</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Broadcast para a equipe */}
          <button
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
              selectedId === null ? "bg-primary text-primary-foreground" : "hover:bg-slate-100"
            }`}
            onClick={() => selectConversa(null)}
          >
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${selectedId === null ? "bg-white/20" : "bg-primary/10"}`}>
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className={`font-bold text-sm truncate ${selectedId === null ? "text-white" : "text-slate-900"}`}>
                📢 Toda a Equipe
              </p>
              <p className={`text-xs truncate ${selectedId === null ? "text-white/70" : "text-slate-400"}`}>
                Broadcast para todos
              </p>
            </div>
          </button>

          {/* Conversas individuais */}
          {membros.map((m) => (
            <button
              key={m.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                selectedId === m.id ? "bg-primary text-primary-foreground" : "hover:bg-slate-100"
              }`}
              onClick={() => selectConversa(m.id)}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${selectedId === m.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                {(m.nome_completo || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm truncate ${selectedId === m.id ? "text-white" : "text-slate-900"}`}>
                  {m.nome_completo || "Sem nome"}
                </p>
                <span className={`text-[10px] font-black uppercase px-1.5 rounded-full ${
                  selectedId === m.id
                    ? "text-white/80"
                    : ROLE_COLORS[m.tipo_acesso] ?? "bg-slate-100 text-slate-500"
                }`}>
                  {m.tipo_acesso}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Area de mensagens */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <p className="font-black text-slate-900">{selectedName}</p>
          <p className="text-xs text-slate-400">
            {selectedId === null ? "Todos veem estas mensagens" : "Conversa privada"}
          </p>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/30">
          {loadingMsgs && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin h-6 w-6 text-slate-300" />
            </div>
          )}
          {!loadingMsgs && mensagens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center mt-16 gap-3 text-slate-400">
              <MessageCircle className="h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">Nenhuma mensagem ainda.<br />Diga olá! 👋</p>
            </div>
          )}
          {mensagens.map((m) => {
            const isMine = m.remetente_id === profile?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] sm:max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!isMine && (
                    <span className="text-[10px] font-bold text-slate-500 px-1">
                      {(m.remetente as any)?.nome_completo || "Membro"}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                  }`}>
                    {m.mensagem}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mensagem para ${selectedName}...`}
              className="flex-1 rounded-xl h-11 text-sm border-slate-200 focus:border-primary"
              maxLength={2000}
            />
            <Button
              onClick={handleSend}
              disabled={!texto.trim() || sending}
              className="h-11 w-11 rounded-xl p-0 shrink-0"
            >
              {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right">{texto.length}/2000 · Enter para enviar</p>
        </div>
      </div>
    </div>
  );
}
