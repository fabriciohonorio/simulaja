import { supabase } from "@/integrations/supabase/client";

export interface MissaoLead {
  id: string;
  nome: string;
  celular: string | null;
  status: string | null;
}
import { format } from "date-fns";

export interface Missao {
  id: string;
  label: string;
  atual: number;
  meta: number;
  concluida: boolean;
  invertida: boolean; // true = meta é chegar em 0
}

export interface MissoesResult {
  missoes: Missao[];
  totalConcluidas: number;
}

export const calcularMissoes = async (
  userId: string,
  orgId: string,
  tipoAcesso: "admin" | "manager" | "vendedor"
): Promise<MissoesResult> => {
  const hoje = format(new Date(), "yyyy-MM-dd");
  const isVendedor = tipoAcesso === "vendedor";

  // ── Missão 1: Contatos hoje ──────────────────────────────────────────
  // Conta tratativas criadas hoje
  let contatosHoje = 0;

  if (isVendedor) {
    // Busca IDs dos leads do vendedor primeiro na organizacao
    const { data: leadsDoVendedor } = await supabase
      .from("leads")
      .select("id")
      .eq("responsavel_id", userId)
      .eq("organizacao_id", orgId);

    const leadIds = (leadsDoVendedor || []).map((l: any) => l.id);

    if (leadIds.length > 0) {
      const { count } = await supabase
        .from("historico_contatos")
        .select("*", { count: "exact", head: true })
        .in("lead_id", leadIds)
        .gte("created_at", `${hoje}T00:00:00`);
      contatosHoje = count || 0;
    }
  } else {
    // Admin/Manager: conta toda a org
    const { count } = await supabase
      .from("historico_contatos")
      .select("*", { count: "exact", head: true })
      .eq("organizacao_id", orgId)
      .gte("created_at", `${hoje}T00:00:00`);
    contatosHoje = count || 0;
  }

  // ── Missão 2: Follow-up agendado hoje ───────────────────────────────
  // Leads que tiveram data_vencimento definida ou atualizada hoje
  let agendadosHoje = 0;

  const agendaQuery = supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organizacao_id", orgId)
    .not("data_vencimento", "is", null)
    .gte("updated_at", `${hoje}T00:00:00`);

  if (isVendedor) {
    agendaQuery.eq("responsavel_id", userId);
  }

  const { count: agendados } = await agendaQuery;
  agendadosHoje = agendados || 0;

  // ── Missão 3: Leads sem contato há mais de 5 dias ───────────────────
  const cincoAntras = new Date();
  cincoAntras.setDate(cincoAntras.getDate() - 5);

  const semContatoQuery = supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organizacao_id", orgId)
    .lt("last_interaction_at", cincoAntras.toISOString())
    .not("status", "in", '("fechado","perdido","morto")');

  if (isVendedor) {
    semContatoQuery.eq("responsavel_id", userId);
  }

  const { count: semContato } = await semContatoQuery;
  const totalSemContato = semContato || 0;

  // ── Montar resultado ─────────────────────────────────────────────────
  const missoes: Missao[] = [
    {
      id: "contatos_hoje",
      label: "3 contatos hoje",
      atual: Math.min(contatosHoje, 3),
      meta: 3,
      concluida: contatosHoje >= 3,
      invertida: false,
    },
    {
      id: "followup_agendado",
      label: "1 follow-up agendado",
      atual: Math.min(agendadosHoje, 1),
      meta: 1,
      concluida: agendadosHoje >= 1,
      invertida: false,
    },
    {
      id: "leads_sem_toque",
      label: "0 leads +5d sem toque",
      atual: totalSemContato,
      meta: 0,
      concluida: totalSemContato === 0,
      invertida: true,
    },
  ];

  return {
    missoes,
    totalConcluidas: missoes.filter((m) => m.concluida).length,
  };
};

// ── Busca os leads que compõem cada missão ───────────────────────────────────
export const getLeadsForMissao = async (
  missaoId: string,
  orgId: string,
  tipoAcesso: "admin" | "manager" | "vendedor",
  userId: string
): Promise<MissaoLead[]> => {
  const hoje = format(new Date(), "yyyy-MM-dd");
  const isVendedor = tipoAcesso === "vendedor";
  const cincoAntras = new Date();
  cincoAntras.setDate(cincoAntras.getDate() - 5);

  if (missaoId === "contatos_hoje") {
    const { data: contatos } = await (supabase as any)
      .from("historico_contatos")
      .select("lead_id")
      .eq("organizacao_id", orgId)
      .gte("created_at", `${hoje}T00:00:00`);

    const leadIds = [...new Set(((contatos as any[]) || []).map((c) => c.lead_id).filter(Boolean))];
    if (leadIds.length === 0) return [];

    let q = (supabase as any).from("leads").select("id, nome, celular, status").in("id", leadIds);
    if (isVendedor) q = q.eq("responsavel_id", userId);
    const { data } = await q;
    return (data as MissaoLead[]) || [];
  }

  if (missaoId === "followup_agendado") {
    let q = (supabase as any)
      .from("leads")
      .select("id, nome, celular, status")
      .eq("organizacao_id", orgId)
      .not("data_vencimento", "is", null)
      .gte("updated_at", `${hoje}T00:00:00`);
    if (isVendedor) q = q.eq("responsavel_id", userId);
    const { data } = await q;
    return (data as MissaoLead[]) || [];
  }

  if (missaoId === "leads_sem_toque") {
    let q = (supabase as any)
      .from("leads")
      .select("id, nome, celular, status")
      .eq("organizacao_id", orgId)
      .lt("last_interaction_at", cincoAntras.toISOString())
      .not("status", "in", '("fechado","perdido","morto")');
    if (isVendedor) q = q.eq("responsavel_id", userId);
    const { data } = await q;
    return (data as MissaoLead[]) || [];
  }

  return [];
};
