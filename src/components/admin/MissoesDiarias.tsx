import { useEffect, useState } from "react";
import { calcularMissoes, type MissoesResult } from "@/lib/missoesService";
import { Progress } from "@/components/ui/progress";

interface MissoesDiariasProps {
  userId: string;
  orgId: string;
  tipoAcesso: "admin" | "manager" | "vendedor";
}

const ICONE_MISSAO: Record<string, string> = {
  concluida: "✅",
  em_progresso: "🔄",
  nao_iniciada: "⭕",
  invertida_ok: "✅",
  invertida_fail: "❌",
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
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          ⚡ MISSÕES DE HOJE
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 bg-muted animate-pulse rounded"
            style={{ width: `${60 + i * 10}%` }}
          />
        ))}
      </div>
    );
  }

  if (!resultado) return null;

  const getIcone = (missao: MissoesResult["missoes"][0]) => {
    if (missao.invertida) {
      return missao.concluida
        ? ICONE_MISSAO.invertida_ok
        : ICONE_MISSAO.invertida_fail;
    }
    if (missao.concluida) return ICONE_MISSAO.concluida;
    if (missao.atual > 0) return ICONE_MISSAO.em_progresso;
    return ICONE_MISSAO.nao_iniciada;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
          ⚡ MISSÕES DE HOJE
        </span>
        <span className="text-[10px] font-bold text-primary">
          {resultado.totalConcluidas}/3 COMPLETAS
        </span>
      </div>

      <div className="space-y-1.5">
        {resultado.missoes.map((missao) => (
          <div key={missao.id} className="flex items-center gap-2">
            <span className="text-xs w-4 shrink-0">{getIcone(missao)}</span>

            <span className="text-[10px] font-bold text-slate-600 flex-1 truncate">
              {missao.label}
            </span>

            {/* Barra de progresso para missões normais */}
            {!missao.invertida && (
              <div className="flex items-center gap-2 shrink-0">
                <Progress
                  value={(missao.atual / missao.meta) * 100}
                  className="w-12 h-1.5"
                />
                <span className="text-[9px] font-black text-slate-400 w-5 text-right">
                  {missao.atual}/{missao.meta}
                </span>
              </div>
            )}

            {/* Contador para missão invertida (leads sem toque) */}
            {missao.invertida && (
              <span
                className={`text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded uppercase ${
                  missao.concluida ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                }`}
              >
                {missao.concluida ? "ZERADO ✓" : `${missao.atual} PENDENTES`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
