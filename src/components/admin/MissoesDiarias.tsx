import { useEffect, useState } from "react";
import { calcularMissoes, type MissoesResult } from "@/lib/missoesService";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, Clock, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MissoesDiariasProps {
  userId: string;
  orgId: string;
  tipoAcesso: "admin" | "manager" | "vendedor";
}

const ICON_MAP: Record<string, any> = {
  contatos_hoje: Zap,
  followup_agendado: Target,
  leads_sem_toque: Clock,
};

const COLOR_MAP: Record<string, string> = {
  contatos_hoje: "text-amber-500 bg-amber-50",
  followup_agendado: "text-blue-500 bg-blue-50",
  leads_sem_toque: "text-rose-500 bg-rose-50",
};

export default function MissoesDiarias({
  userId,
  orgId,
  tipoAcesso,
}: MissoesDiariasProps) {
  const [resultado, setResultado] = useState<MissoesResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !orgId) return;
    calcularMissoes(userId, orgId, tipoAcesso).then((r) => {
      setResultado(r);
      setLoading(false);
    });
  }, [userId, orgId, tipoAcesso]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {resultado.missoes.map((missao) => {
          const Icon = ICON_MAP[missao.id] || Zap;
          const colors = COLOR_MAP[missao.id] || "text-slate-500 bg-slate-50";

          return (
            <div 
                key={missao.id} 
                className={`group flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 ${
                    missao.concluida 
                    ? "bg-slate-50/50 border-slate-100 opacity-60" 
                    : "bg-white border-slate-100 hover:border-primary/20 hover:shadow-sm"
                }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${missao.concluida ? "bg-emerald-100 text-emerald-600" : colors}`}>
                {missao.concluida ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 max-w-full">
                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${missao.concluida ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {missao.label}
                  </span>
                  
                  {!missao.invertida ? (
                    <span className="text-[9px] font-black text-slate-400 tabular-nums">
                        {missao.atual}/{missao.meta}
                    </span>
                  ) : (
                    <Badge variant="outline" className={`h-4 text-[8px] font-black ${missao.concluida ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                       {missao.concluida ? "ZERADO" : `${missao.atual} PEND.`}
                    </Badge>
                  )}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
