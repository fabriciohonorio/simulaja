import { useEffect, useState } from "react";
import { calcularMissoes, getLeadsForMissao, type MissoesResult, type MissaoLead } from "@/lib/missoesService";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Phone } from "lucide-react";
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
};

const COLOR_MAP: Record<string, string> = {
  contatos_hoje: "text-amber-500 bg-amber-50",
  followup_agendado: "text-blue-500 bg-blue-50",
  leads_sem_toque: "text-rose-500 bg-rose-50",
  pagamentos_ep: "text-emerald-500 bg-emerald-50",
  meta_mes: "text-indigo-500 bg-indigo-50",
};

const LABEL_MAP: Record<string, string> = {
  contatos_hoje: "Contatos de hoje",
  followup_agendado: "Follow-ups agendados",
  leads_sem_toque: "Leads sem toque (+5d)",
  pagamentos_ep: "Pagamentos EP (Mês Ant.)",
  meta_mes: "Alcançar Meta",
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
      const leads = await getLeadsForMissao(missaoId, orgId, tipoAcesso, userId);
      setMissionLeadsMap((prev) => ({ ...prev, [missaoId]: leads }));
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 w-full">
        {resultado.missoes.map((missao) => {
          const Icon = ICON_MAP[missao.id] || Zap;
          const colors = COLOR_MAP[missao.id] || "text-slate-500 bg-slate-50";
          const isExpanded = expandedMission === missao.id;

          return (
            <div key={missao.id} className="w-full">
              <button
                onClick={() => handleMissionClick(missao.id)}
                className={`group w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 text-left ${
                  missao.concluida
                  ? "bg-slate-50/50 border-slate-100 opacity-60"
                  : isExpanded
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "bg-white border-slate-100 hover:border-primary/20 hover:shadow-sm"
                }`}
                title={`Clique para ver ${LABEL_MAP[missao.id]}`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${missao.concluida ? "bg-emerald-100 text-emerald-600" : colors}`}>
                  {missao.concluida ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 max-w-full">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-tight truncate ${missao.concluida ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {missao.label}
                      </span>
                      {missao.isCurrency && missao.faltando !== undefined && !missao.concluida && (
                        <div className="flex flex-col">
                           <span className="text-[7px] font-bold text-slate-400 uppercase">
                            Realizado: R$ {(missao.atual/1000).toFixed(0)}k
                          </span>
                          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">
                            Faltam R$ {(missao.faltando/1000).toFixed(0)}k
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!missao.invertida ? (
                        <span className="text-[9px] font-black text-slate-400 tabular-nums">
                            {missao.isCurrency ? `${(missao.atual/1000).toFixed(0)}k/${(missao.meta/1000).toFixed(0)}k` : `${missao.atual}/${missao.meta}`}
                        </span>
                      ) : (
                        <Badge variant="outline" className={`h-4 text-[8px] font-black ${missao.concluida ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                           {missao.concluida ? "ZERADO" : `${missao.atual} PEND.`}
                        </Badge>
                      )}
                      {isExpanded
                        ? <ChevronUp className="h-3 w-3 text-primary shrink-0" />
                        : <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                      }
                    </div>
                  </div>

                  {!missao.invertida && !missao.concluida && (
                    <div className="mt-1.5 h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${missao.concluida ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${(missao.atual / missao.meta) * 100}%` }}
                      />
                    </div>
                  )}
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
          ) : expandedLeads !== null && expandedLeads.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1 text-center">
              {expandedMission === "leads_sem_toque"
                ? "✅ Nenhum lead esquecido. Missão concluída!"
                : "Nenhum lead encontrado para esta missão."}
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {(expandedLeads || []).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 bg-white rounded-lg border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-800 truncate">{l.nome}</p>
                    {l.status && (
                      <p className="text-[9px] text-slate-400 uppercase font-bold">{l.status.replace(/_/g, " ")}</p>
                    )}
                  </div>
                  {l.celular && (
                    <a
                      href={`https://wa.me/55${l.celular.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 p-1.5 rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors"
                      title="WhatsApp"
                    >
                      <WhatsAppIcon className="h-3 w-3" />
                    </a>
                  )}
                  {expandedMission === "pagamentos_ep" && l.status === "⏳ Pendente" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkPaid(l.id, l.lead_id); }}
                      className="shrink-0 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100"
                      title="Confirmar Pagamento"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
