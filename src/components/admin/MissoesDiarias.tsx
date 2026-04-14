import { useEffect, useState } from "react";
import { calcularMissoes, getLeadsForMissao, type MissoesResult, type MissaoLead } from "@/lib/missoesService";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Phone, AlertTriangle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  postagem_redes: "Postar Redes Sociais",
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
    calcularMissoes(userId, orgId, tipoAcesso).then((r) => {
      setResultado(r);
      setLoading(false);
    });
  }, [userId, orgId, tipoAcesso]);

  const handleMissionClick = async (missaoId: string) => {
    if (expandedMission === missaoId) {
      setExpandedMission(null);
      return;
    }
    setExpandedMission(missaoId);
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

  const handleMarkPaid = async (targetId: string, leadId?: string | null) => {
    try {
      if (expandedMission === "postagem_redes") {
        const { error: insErr } = await (supabase as any)
          .from("missoes_concluidas")
          .insert({
            user_id: userId,
            missao_id: "postagem_redes",
            subref_id: targetId,
            organizacao_id: orgId
          });
        if (insErr) throw insErr;
      } else if (targetId.startsWith("new-") && leadId) {
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
      const r = await calcularMissoes(userId, orgId, tipoAcesso);
      setResultado(r);
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Missões Ativas</p>
              <h4 className="text-xs font-black text-slate-900 leading-none">Desafios Galáticos</h4>
           </div>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Nível de Foco</p>
            <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 text-primary border-primary/20 text-[9px] font-black">
                {completedMissions}/{totalMissions} COMPLETAS
            </Badge>
        </div>
      </div>

      {/* Mini Progress */}
      <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
             <span>Progresso Diário</span>
             <span>{Math.round(globalProgress)}%</span>
          </div>
          <Progress value={globalProgress} className="h-1 bg-slate-100" />
      </div>

      {/* Mission Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 w-full">
        {resultado.missoes.map((missao) => {
          const Icon = ICON_MAP[missao.id] || Zap;
          const colors = COLOR_MAP[missao.id] || "text-slate-500 bg-slate-50";
          const isExpanded = expandedMission === missao.id;

          return (
            <div key={missao.id} className="w-full">
              <button
                onClick={() => handleMissionClick(missao.id)}
                className={`group w-full flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 text-center relative overflow-hidden ${
                  missao.concluida
                  ? "bg-slate-50 border-slate-100 ring-4 ring-emerald-500/10"
                  : isExpanded
                  ? "bg-white border-primary shadow-lg ring-4 ring-primary/10 -translate-y-1"
                  : "bg-white border-slate-100 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Background Decor */}
                <div className={`absolute -right-2 -top-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0 ${colors.split(' ')[0]}`}>
                    <Icon className="h-12 w-12" />
                </div>

                <div className={`p-3 rounded-xl shadow-sm ${missao.concluida ? "bg-emerald-500 text-white" : colors}`}>
                  {missao.concluida ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>

                <div className="flex-1 w-full flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${missao.concluida ? "text-emerald-600" : "text-slate-800"}`}>
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

                  {missao.isCurrency && missao.faltando !== undefined && !missao.concluida && (
                    <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter mt-1 bg-rose-50 px-1 rounded">
                      Faltam R$ {(missao.faltando/1000).toFixed(0)}k
                    </span>
                  )}
                </div>
                
                <div className={`mt-1 flex items-center gap-0.5 text-[8px] font-bold ${isExpanded ? "text-primary" : "text-slate-300"}`}>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    DETALHES
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Painel de leads da missão expandida */}
      {expandedMission && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {LABEL_MAP[expandedMission]}
          </p>

          {loadingMission === expandedMission ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-7 bg-slate-100 animate-pulse rounded-lg" />
              ))}
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
                    <p className="text-[11px] font-black text-slate-800 truncate leading-tight">{l.nome}</p>
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

                      {expandedMission === "postagem_redes" && !l.status?.includes("✅") && (
                        <Button 
                            size="sm" 
                            className="h-7 px-2.5 text-[9px] font-black uppercase bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/10 gap-1"
                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(l.id); }}
                        >
                            <Zap className="h-3 w-3" />
                            Marcar Postado
                        </Button>
                      )}

                      {l.celular && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation();
                            const phone = l.celular?.replace(/\D/g, "");
                            window.open(`https://wa.me/55${phone}`, "_blank");
                          }}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="WhatsApp"
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
