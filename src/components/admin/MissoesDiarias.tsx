import { useEffect, useState } from "react";
import { calcularMissoes, getLeadsForMissao, marcarMissaoRedesSociais, type MissoesResult, type MissaoLead } from "@/lib/missoesService";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Phone, AlertTriangle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatToUpper } from "@/lib/formatters";

interface MissoesDiariasProps {
  userId: string;
  orgId: string;
  tipoAcesso: "admin" | "manager" | "vendedor";
}

const ICON_MAP: Record<string, any> = {
  contatos_hoje: Zap,
  followup_agendado: Target,
  leads_sem_toque: Clock,
  pagamentos_ep: CheckCircle2,
  meta_mes: Target,
  inadimplencia: AlertTriangle,
  postagem_redes: Share2,
};

const COLOR_MAP: Record<string, string> = {
  contatos_hoje: "text-amber-500 bg-amber-50",
  followup_agendado: "text-blue-500 bg-blue-50",
  leads_sem_toque: "text-rose-500 bg-rose-50",
  pagamentos_ep: "text-emerald-500 bg-emerald-50",
  meta_mes: "text-red-500 bg-red-50",
  inadimplencia: "text-amber-500 bg-amber-50",
  postagem_redes: "text-sky-500 bg-sky-50",
};

const LABEL_MAP: Record<string, string> = {
  contatos_hoje: "Contatos de hoje",
  followup_agendado: "Follow-ups agendados",
  leads_sem_toque: "Leads sem toque (+5d)",
  pagamentos_ep: "Pagamentos EP (Mês Ant.)",
  meta_mes: "Meta",
  inadimplencia: "Inadimplência",
  postagem_redes: "Redes Sociais",
};

export default function MissoesDiarias({
  userId,
  orgId,
  tipoAcesso,
}: MissoesDiariasProps) {
  const [resultado, setResultado] = useState<MissoesResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado para o painel de leads expandido
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [missionLeadsMap, setMissionLeadsMap] = useState<Record<string, MissaoLead[]>>({});
  const [loadingMission, setLoadingMission] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !orgId) return;
    refreshMissions();
  }, [userId, orgId, tipoAcesso]);

  const refreshMissions = async () => {
    const r = await calcularMissoes(userId, orgId, tipoAcesso);
    setResultado(r);
    setLoading(false);
  };

  const handleMissionClick = async (missaoId: string) => {
    if (expandedMission === missaoId) {
      setExpandedMission(null);
      return;
    }
    setExpandedMission(missaoId);
    
    // Para missão de redes sociais, não precisamos carregar leads via getLeadsForMissao
    if (missaoId === "postagem_redes") return;

    if (!missionLeadsMap[missaoId]) {
      setLoadingMission(missaoId);
      try {
        const leads = await getLeadsForMissao(missaoId, orgId, tipoAcesso, userId);
        setMissionLeadsMap((prev) => ({ ...prev, [missaoId]: leads }));
      } catch (err) {
        console.error("Erro ao carregar missão:", err);
      } finally {
        setLoadingMission(null);
      }
    }
  };

  const handleCompleteSocialMission = async (categoria: "Veículos" | "Imóveis") => {
    if (!orgId) return;
    setLoadingMission("postagem_redes");
    try {
      const ok = await marcarMissaoRedesSociais(orgId, categoria);
      if (ok) {
        toast.success(`Postagem em ${categoria} confirmada!`);
        await refreshMissions();
      }
    } catch (e: any) {
      toast.error("Erro ao confirmar postagem: " + e.message);
    } finally {
      setLoadingMission(null);
    }
  };

  const handleMarkPaid = async (targetId: string, leadId?: string | null) => {
    try {
      if (targetId.startsWith("new-") && leadId) {
        // Buscar dados do lead para criar na carteira
        const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
        if (lead) {
          const { error: insErr } = await supabase.from("carteira").insert({
            lead_id: leadId,
            nome: lead.nome,
            celular: lead.celular,
            tipo_consorcio: lead.tipo_consorcio,
            valor_credito: lead.valor_credito,
            administradora: lead.administradora,
            grupo: lead.grupo,
            cota: lead.cota,
            status: "EP OK",
            organizacao_id: orgId
          });
          if (insErr) throw insErr;
        }
      } else {
        const { error } = await supabase
          .from("carteira")
          .update({ status: "EP OK" })
          .eq("id", targetId);
        if (error) throw error;
      }

      // Adiciona tratativa
      if (leadId) {
        await supabase.from("historico_contatos").insert({
          lead_id: leadId,
          tipo: "sistema",
          observacao: "Pagamento Confirmado (Missão EP)",
          resultado: "positivo",
          organizacao_id: orgId
        });
      }

      toast.success("Pagamento confirmado!");
      
      // Atualiza estado local
      setMissionLeadsMap(prev => ({
        ...prev,
        pagamentos_ep: (prev.pagamentos_ep || []).map(l => 
          l.id === targetId ? { ...l, status: "✅ Pago" } : l
        )
      }));

      // Recalcula missões
      await refreshMissions();
    } catch (e: any) {
      toast.error("Erro ao confirmar pagamento: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-slate-100 animate-pulse rounded w-32" />
        <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!resultado) return null;

  const totalMissions = resultado.missoes.length;
  const completedMissions = resultado.totalConcluidas;
  const globalProgress = (completedMissions / totalMissions) * 100;

  const expandedLeads = expandedMission ? (missionLeadsMap[expandedMission] ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-primary/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
           </div>
           <div>
              <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Missões Diárias</h3>
              <p className="text-[10px] text-slate-400 font-medium lowercase">complete para ganhar bônus</p>
           </div>
        </div>
        <div className="text-right">
           <span className="text-[14px] font-black text-primary tabular-nums">{completedMissions}/{totalMissions}</span>
           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">concluídas</p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100/50">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]"
            style={{ width: `${globalProgress}%` }}
          />
        </div>
      </div>

      {/* Grid de Missões */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {resultado.missoes.map((missao) => {
          const Icon = ICON_MAP[missao.id] || Target;
          const colorClass = COLOR_MAP[missao.id] || "text-slate-400 bg-slate-50";

          return (
            <div
              key={missao.id}
              onClick={() => handleMissionClick(missao.id)}
              className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                missao.concluida
                  ? "bg-emerald-50/30 border-emerald-100 shadow-sm shadow-emerald-500/5"
                  : expandedMission === missao.id
                  ? "bg-white border-primary shadow-md shadow-primary/5 scale-[1.02]"
                  : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${missao.concluida ? "bg-emerald-100 text-emerald-600" : colorClass}`}>
                <Icon className={`h-4 w-4 ${missao.concluida ? "" : "group-hover:scale-110 transition-transform"}`} />
              </div>

              <div className="flex-1 w-full flex flex-col items-center gap-1">
                <span className={`text-[9px] font-black uppercase tracking-widest leading-none text-center ${missao.concluida ? "text-emerald-600" : "text-slate-800"}`}>
                  {missao.label}
                </span>
                
                <div className="flex items-center justify-center gap-1.5 h-4">
                  {!missao.invertida ? (
                    <span className="text-[11px] font-black text-slate-800 tabular-nums">
                        {missao.isCurrency ? `${(missao.atual/1000).toFixed(0)}k/${(missao.meta/1000).toFixed(0)}k` : `${missao.atual}/${missao.meta}`}
                    </span>
                  ) : (
                    <Badge variant="outline" className={`h-4 text-[7px] font-black border-none ${missao.concluida ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                       {missao.concluida ? "CONCLUÍDO" : `${missao.atual} PEND.`}
                    </Badge>
                  )}
                </div>

                {!missao.invertida && !missao.concluida && (
                  <div className="w-full mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${missao.concluida ? "bg-emerald-500" : "bg-primary shadow-[0_0_8px] shadow-primary/50"}`}
                      style={{ width: `${Math.min(100, (missao.atual / (missao.meta || 1)) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {expandedMission === missao.id && (
                <div className="absolute top-1 right-1">
                  <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Painel Expandido */}
      {expandedMission && (
        <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3 px-1">
             <div className="flex items-center gap-2">
                <div className={`h-1 w-4 rounded-full ${COLOR_MAP[expandedMission]?.split(' ')[0].replace('text-', 'bg-')}`} />
                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Detalhes da Missão</h4>
             </div>
             <button onClick={() => setExpandedMission(null)} className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase">Fechar</button>
          </div>

          {loadingMission === expandedMission ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-7 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : expandedMission === "postagem_redes" ? (
            <div className="py-5 px-4 text-center bg-white rounded-xl border border-dashed border-sky-100 flex flex-col items-center gap-3">
               <div className="p-2.5 bg-sky-50 rounded-full">
                  <Zap className="h-5 w-5 text-sky-500" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Postagens diárias</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Poste nas redes sociais para completar as metas!</p>
               </div>
               <div className="flex gap-2 w-full mt-1">
                 <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteSocialMission("Veículos")}
                    className="flex-1 h-8 text-[9px] font-black uppercase border-sky-100 hover:bg-sky-50 hover:text-sky-600 transition-all text-sky-500"
                 >
                    Veículos 🚗
                 </Button>
                 <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteSocialMission("Imóveis")}
                    className="flex-1 h-8 text-[9px] font-black uppercase border-sky-100 hover:bg-sky-50 hover:text-sky-600 transition-all text-sky-500"
                 >
                    Imóveis 🏠
                 </Button>
               </div>
            </div>
          ) : (expandedLeads || []).length === 0 ? (
            <div className="py-4 text-center bg-white rounded-xl border border-dashed border-slate-200">
               <p className="text-[10px] text-slate-400 italic font-medium">
                  {expandedMission === "leads_sem_toque"
                    ? "✅ Nenhum lead esquecido. Missão concluída!"
                    : "Nenhum item encontrado nesta categoria."}
               </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {(expandedLeads || []).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:border-primary/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-slate-800 truncate leading-tight">{formatToUpper(l.nome)}</p>
                    {l.status && (
                      <p className={`text-[9px] font-bold uppercase tracking-tighter mt-0.5 ${
                        l.status.includes('⏳') || l.status.includes('Pendente') ? 'text-amber-500' : 
                        l.status.includes('✅') ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        {l.status.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                      {/* Ações Específicas */}
                      {expandedMission === "pagamentos_ep" && (l.status?.includes("Pendente") || l.status?.includes("Funil")) && (
                        <Button 
                            size="sm" 
                            className="h-7 px-2.5 text-[9px] font-black uppercase bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10 gap-1"
                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(l.id, l.lead_id); }}
                        >
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmar EP
                        </Button>
                      )}

                      {l.celular && (
                        <button
                          onClick={(e) => { 
                             e.stopPropagation();
                             window.open(`https://wa.me/55${l.celular?.replace(/\D/g, "")}`, "_blank");
                          }}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100/50"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
