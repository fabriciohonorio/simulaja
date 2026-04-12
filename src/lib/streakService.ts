import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Chamado toda vez que uma tratativa é salva com sucesso.
 * Atualiza o streak do usuário logado.
 */
export const atualizarStreak = async (userId: string): Promise<number> => {
  const hoje = new Date().toISOString().split("T")[0]; // "yyyy-MM-dd"

  const { data: perfil } = await (supabase as any)
    .from("perfis")
    .select("streak_atual, streak_record, ultimo_dia_tratativa")
    .eq("id", userId)
    .single();

  if (!perfil) return 0;

  // Já registrou hoje — não faz nada
  if (perfil.ultimo_dia_tratativa === hoje) return perfil.streak_atual;

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().split("T")[0];

  // Continuou sequência ou começou do zero
  const novoStreak =
    perfil.ultimo_dia_tratativa === ontemStr
      ? perfil.streak_atual + 1
      : 1;

  const novoRecord = Math.max(novoStreak, perfil.streak_record || 0);

  await (supabase as any)
    .from("perfis")
    .update({
      streak_atual: novoStreak,
      streak_record: novoRecord,
      ultimo_dia_tratativa: hoje,
    })
    .eq("id", userId);

  // Toast de marco ao atingir dias especiais
  if ([7, 14, 21, 30].includes(novoStreak)) {
    toast.success(`🔥 ${novoStreak} dias seguidos! Incrível sequência!`, {
      duration: 6000,
    });
  }

  return novoStreak;
};
