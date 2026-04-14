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
  hasDetails?: boolean; // false se não tiver lista de leads vinculada
  isCurrency?: boolean;
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
  const agora = new Date();
  const hoje = format(agora, "yyyy-MM-dd");
  const isVendedor = tipoAcesso === "vendedor";

  // Calcular datas para Missão EP (2ª e 3ª parcelas)
  // 2ª parcela: quem comprou no mês anterior (M-1)
  // 3ª parcela: quem comprou há 2 meses (M-2)
  const primeiroDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const primeiroDiaDoisMesesAtras = new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
  const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);

  const inicioEP = format(primeiroDiaDoisMesesAtras, "yyyy-MM-dd");
  const fimEP = format(ultimoDiaMesAnterior, "yyyy-MM-dd");

  // Datas para Meta do Mês (Mês Atual)
  const inicioMesAtual = format(primeiroDiaMesAtual, "yyyy-MM-dd");

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

  // ── Missão 4: EP (Efetividade de Pagamento) ──────────────────────────
  // Pagamento das parcelas dos clientes com venda no mês anterior
  let epRealizado = 0;
  let epMeta = 0;

  const epQuery = supabase
    .from("carteira")
    .select("*", { count: "exact" })
    .eq("organizacao_id", orgId)
    .gte("data_adesao", inicioEP)
    .lte("data_adesao", fimEP);

  if (isVendedor) {
    // Nota: A carteira não tem responsavel_id diretamente em todos os casos, 
    // mas se o lead_id estiver presente, podemos filtrar pelos leads do vendedor.
    // Para simplificar agora, buscamos todos do mês anterior da org se for admin/manager,
    // ou tentamos filtrar se tivermos o lead_id.
    const { data: meusLeads } = await supabase.from("leads").select("id").eq("responsavel_id", userId);
    const meusIds = (meusLeads || []).map(l => l.id);
    if (meusIds.length > 0) {
      epQuery.in("lead_id", meusIds);
    } else {
      // Se não tem leads, o resultado será zero
      epQuery.eq("lead_id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: epData, count: epCount } = await epQuery;
  epMeta = epCount || 0;

  if (epData) {
    epRealizado = epData.filter((c: any) => c.status === "EP OK").length;
  }

  // ── Missão 5: Meta do Mês ──────────────────────────────────────────
  let realizadoMes = 0;
  let metaMes = 0;

  // 1. Buscar Meta (Anual / 12)
  if (isVendedor) {
    const { data: mSet } = await supabase
      .from("metas_vendedor")
      .select("meta_anual")
      .eq("vendedor_id", userId)
      .eq("ano", agora.getFullYear())
      .maybeSingle();
    metaMes = (mSet?.meta_anual || 0) / 12;
  } else {
    const { data: mSet } = await supabase
      .from("meta")
      .select("meta_anual")
      .eq("organizacao_id", orgId)
      .eq("ano", agora.getFullYear())
      .maybeSingle();
    metaMes = (mSet?.meta_anual || 0) / 12;
  }

  // 2. Buscar Realizado (Leads fechados no mês)
  const vendasQuery = supabase
    .from("leads")
    .select("valor_credito")
    .eq("organizacao_id", orgId)
    .eq("status", "fechado")
    .gte("status_updated_at", `${inicioMesAtual}T00:00:00`);

  if (isVendedor) {
    vendasQuery.eq("responsavel_id", userId);
  }

  const { data: vendas } = await vendasQuery;
  realizadoMes = (vendas || []).reduce((acc: number, l: any) => acc + (Number(l.valor_credito) || 0), 0);

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
    {
      id: "pagamentos_ep",
      label: "EP OK",
      atual: epRealizado,
      meta: epMeta,
      concluida: epMeta > 0 ? epRealizado >= epMeta : false,
      invertida: false,
    },
    {
      id: "meta_mes",
      label: "Meta do Mês",
      atual: realizadoMes,
      meta: metaMes,
      concluida: metaMes > 0 ? realizadoMes >= metaMes : false,
      invertida: false,
      isCurrency: true,
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

  if (missaoId === "pagamentos_ep") {
    const primeiroDiaDoisMesesAtras = new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
    const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);
    const inicioEP = format(primeiroDiaDoisMesesAtras, "yyyy-MM-dd");
    const fimEP = format(ultimoDiaMesAnterior, "yyyy-MM-dd");

    let q = (supabase as any)
      .from("carteira")
      .select("id, nome, status")
      .eq("organizacao_id", orgId)
      .gte("data_adesao", inicioEP)
      .lte("data_adesao", fimEP);

    if (isVendedor) {
      const { data: meusLeads } = await supabase.from("leads").select("id").eq("responsavel_id", userId);
      const meusIds = (meusLeads || []).map(l => l.id);
      if (meusIds.length > 0) {
        q = q.in("lead_id", meusIds);
      } else {
        return [];
      }
    }

    const { data } = await q;
    // Map status for consistency with MissaoLead if needed
    return (data || []).map((d: any) => ({
      id: d.id,
      nome: d.nome,
      celular: null, // carteira doesn't have phone, could join with leads but for now keep it simple
      status: d.status === "EP OK" ? "✅ Pago" : "⏳ Pendente"
    })) as MissaoLead[];
  }

  if (missaoId === "meta_mes") {
    const agora = new Date();
    const primeiroDiaMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioMesAtual = format(primeiroDiaMesAtual, "yyyy-MM-dd");

    let q = (supabase as any)
      .from("leads")
      .select("id, nome, status, valor_credito")
      .eq("organizacao_id", orgId)
      .eq("status", "fechado")
      .gte("status_updated_at", `${inicioMesAtual}T00:00:00`);

    if (isVendedor) q = q.eq("responsavel_id", userId);
    const { data } = await q;

    return (data || []).map((d: any) => ({
      id: d.id,
      nome: d.nome,
      celular: null,
      status: `R$ ${(Number(d.valor_credito) || 0).toLocaleString('pt-BR')}`
    })) as MissaoLead[];
  }

  return [];
};
