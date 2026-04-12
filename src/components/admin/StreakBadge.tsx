import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  userId: string;
  variant?: "full" | "compact"; // full = Dashboard, compact = Sidebar
}

export default function StreakBadge({ userId, variant = "full" }: StreakBadgeProps) {
  const [streak, setStreak] = useState(0);
  const [record, setRecord] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (supabase as any)
      .from("perfis")
      .select("streak_atual, streak_record")
      .eq("id", userId)
      .single()
      .then(({ data, error }: any) => {
        if (!error && data) {
          setStreak(data.streak_atual || 0);
          setRecord(data.streak_record || 0);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Erro ao buscar streak:", err);
        setLoading(false);
      });
  }, [userId]);

  if (loading || streak === 0) return null;

  // Versão compacta para a Sidebar
  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
        <Flame className="h-3 w-3 text-orange-500" />
        <span className="text-[11px] font-medium text-orange-600">{streak} dias</span>
      </div>
    );
  }

  // Versão completa para o Dashboard
  return (
    <div className="flex items-center gap-3 bg-white border border-border shadow-sm rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
        <div>
          <span className="text-xl font-black text-orange-500">{streak}</span>
          <span className="text-sm font-bold text-slate-500 ml-1">DIAS SEGUIDOS</span>
        </div>
      </div>
      {record > streak && (
        <div className="text-xs text-slate-400 border-l border-border pl-3 font-medium">
          🏆 Récord: <span className="font-bold text-slate-600">{record} dias</span>
        </div>
      )}
    </div>
  );
}
