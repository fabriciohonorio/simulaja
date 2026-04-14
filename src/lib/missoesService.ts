import { supabase } from "@/integrations/supabase/client";

export interface MissaoLead {
  id: string;
  nome: string;
  celular: string | null;
  status: string | null;
  lead_id?: string | null;
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
  faltando?: number;
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

  const primeiroDiaMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
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

    // Base: Leads fechados ou avançados em M-1 e M-2
    let epRealizado = 0;
    let epMeta = 0;
    const now = new Date();

    const inicioEP = format(subMonths(now, 2), "yyyy-MM-01");
    const fimEP = format(lastDayOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

    const leadsQueryEP = supabase
      .from("leads")
      .select("id, nome, status, status_updated_at, created_at")
      .eq("organizacao_id", orgId)
      .in("status", ["fechado", "venda_fechada", "negociacao", "proposta", "simulacao_enviada"])
      .gte("created_at", `${inicioEP}T00:00:00`);

    if (isVendedor) leadsQueryEP.eq("responsavel_id", userId);

    const { data: leadsEP } = await leadsQueryEP;
    
    // Filtragem secundária por data de fechamento ou criação
    const filteredEP = (leadsEP || []).filter(l => {
        const dateToUse = l.status_updated_at || l.created_at;
        return dateToUse >= `${inicioEP}T00:00:00` && dateToUse <= `${fimEP}T23:59:59`;
    });
    
    epMeta = filteredEP.length;

    if (filteredEP && filteredEP.length > 0) {
      const leadIds = filteredEP.map(l => l.id);
      const leadNames = filteredEP.map(l => l.nome);

    // 1. Verificar quem já está com EP OK na carteira
    const { data: carteiraEP } = await supabase
      .from("carteira")
      .select("lead_id, status")
      .in("lead_id", leadIds)
      .eq("status", "EP OK");

    const idsPagos = new Set((carteiraEP || []).map(c => c.lead_id));

    // 2. Verificar quem está inadimplente (bloqueia EP OK automático)
    const { data: inadEP } = await (supabase as any)
      .from("inadimplentes")
      .select("nome")
      .eq("organizacao_id", orgId)
      .neq("status", "regularizado")
      .in("nome", leadNames);

    const namesInad = new Set((inadEP || []).map((i: any) => i.nome));

    epRealizado = leadsEP.filter(l => idsPagos.has(l.id) && !namesInad.has(l.nome)).length;
  }

  // ── Missão 5: Meta do Mês ──────────────────────────────────────────
  let realizadoMes = 0;
  let metaMes = 0;

  // 1. Buscar Meta (Anual / 12)
  if (isVendedor) {
    const { data: mSet } = await supabase
      .from("metas_vendedor")
      .select("meta_anual, meta_outros")
      .eq("vendedor_id", userId)
      .eq("ano", agora.getFullYear())
      .maybeSingle();
    
    metaMes = (mSet?.meta_outros && mSet.meta_outros > 0) 
      ? mSet.meta_outros 
      : (mSet?.meta_anual || 0) / 12;
  } else {
    const { data: mSet } = await supabase
      .from("meta")
      .select("meta_anual, meta_outros")
      .eq("organizacao_id", orgId)
      .eq("ano", agora.getFullYear())
      .maybeSingle();
    
    metaMes = (mSet?.meta_outros && mSet.meta_outros > 0) 
      ? mSet.meta_outros 
      : (mSet?.meta_anual || 0) / 12;
  }

  const vendasQuery = supabase
    .from("leads")
    .select("valor_credito, status_updated_at, created_at")
    .eq("organizacao_id", orgId)
    .in("status", ["fechado", "venda_fechada"])
    .or(`status_updated_at.gte.${inicioMesAtual}T00:00:00,and(status_updated_at.is.null,created_at.gte.${inicioMesAtual}T00:00:00)`);

  if (isVendedor) {
    vendasQuery.eq("responsavel_id", userId);
  }

  const { data: vendas } = await vendasQuery;
  realizadoMes = (vendas || []).reduce((acc: number, l: any) => acc + (Number(l.valor_credito) || 0), 0);

  // ── Missão 6: Inadimplência ──────────────────────────────────────────
  const { count: inadCount } = await (supabase as any)
    .from("inadimplentes")
    .select("id", { count: "exact" })
    .eq("organizacao_id", orgId)
    .neq("status", "regularizado");

  const totalInad = inadCount || 0;

  // ── Missão 7: Postagem Redes Sociais ────────────────────────────────
  const { data: concluidas } = await (supabase as any)
    .from("missoes_concluidas")
    .select("subref_id")
    .eq("user_id", userId)
    .eq("missao_id", "postagem_redes")
    .eq("data", format(agora, "yyyy-MM-dd"));

  const nConcluidas = (concluidas || []).length;
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
      label: "Meta",
      atual: realizadoMes,
      meta: metaMes,
      concluida: metaMes > 0 ? realizadoMes >= metaMes : false,
      invertida: false,
      isCurrency: true,
      faltando: Math.max(0, metaMes - realizadoMes),
    },
    {
      id: "inadimplencia",
      label: "Inadimplência",
      atual: totalInad,
      meta: 0,
      concluida: totalInad === 0,
      invertida: true,
    },
    {
      id: "postagem_redes",
      label: "Postar Redes Sociais",
      atual: nConcluidas,
      meta: 2,
      concluida: nConcluidas >= 2,
      invertida: false,
    },
  ];

  return {
    missoes,
    totalConcluidas: missoes.filter((m) => m.concluida).length,
  };
};

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
    const now = new Date();
    const inicioEP = format(subMonths(now, 2), "yyyy-MM-01");
    const fimEP = format(lastDayOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

    const { data: allLeads } = await supabase
      .from("leads")
      .select("id, nome, celular, status, grupo, cota, created_at, status_updated_at")
      .eq("organizacao_id", orgId)
      .in("status", ["fechado", "venda_fechada", "negociacao", "proposta", "simulacao_enviada"])
      .gte("created_at", `${inicioEP}T00:00:00`);

    const leads = (allLeads || []).filter(l => {
        const dateToUse = l.status_updated_at || l.created_at;
        return dateToUse >= `${inicioEP}T00:00:00` && dateToUse <= `${fimEP}T23:59:59`;
    });

    if (!leads || leads.length === 0) return [];

    const leadIds = leads.map(l => l.id);
    const leadNames = leads.map(l => l.nome);

    // 2. Pegar status na Carteira
    const { data: carteira } = await supabase
      .from("carteira")
      .select("id, lead_id, status")
      .in("lead_id", leadIds);

    // 3. Pegar Inadimplentes (por nome, integração total)
    const { data: inad } = await (supabase as any)
      .from("inadimplentes")
      .select("nome, status")
      .eq("organizacao_id", orgId)
      .neq("status", "regularizado")
      .in("nome", leadNames);

    const carteiraMap = new Map((carteira || []).map(c => [c.lead_id, c]));
    const inadSet = new Set((inad || []).map((i: any) => i.nome));

    return leads.map(l => {
      const c = carteiraMap.get(l.id);
      const isPaid = c?.status === "EP OK";
      const isInad = inadSet.has(l.nome);

      let statusLabel = l.status === "negociacao" ? "📈 Negociação" : 
                       l.status === "proposta" ? "📝 Proposta" : 
                       l.status === "simulacao_enviada" ? "📊 Simulação" : "⏳ Pendente";
                       
      if (isPaid) statusLabel = "✅ Pago";
      if (isInad) statusLabel = "⚠️ Inadimplente";

      return {
        id: c?.id || `new-${l.id}`,
        nome: `${l.nome} - ${l.grupo || '??'}/${l.cota || '??'}`,
        celular: l.celular,
        status: statusLabel,
        lead_id: l.id
      };
    }) as MissaoLead[];
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

  if (missaoId === "inadimplencia") {
    const { data } = await (supabase as any)
      .from("inadimplentes")
      .select("id, nome, status, grupo, cota, celular")
      .eq("organizacao_id", orgId)
      .neq("status", "regularizado");

    return (data || []).map((d: any) => ({
      id: d.id,
      nome: d.nome,
      celular: d.celular,
      status: `G:${d.grupo} C:${d.cota} - ${d.status.replace(/_/g, ' ')}`
    })) as MissaoLead[];
  }

  if (missaoId === "postagem_redes") {
    const { data: done } = await (supabase as any)
      .from("missoes_concluidas")
      .select("subref_id")
      .eq("user_id", userId)
      .eq("missao_id", "postagem_redes")
      .eq("data", format(new Date(), "yyyy-MM-dd"));

    const doneIds = new Set((done || []).map((d: any) => d.subref_id));

    return [
      { id: "veiculos", nome: "Veículos", status: doneIds.has("veiculos") ? "✅ Postado" : "⏳ Pendente" },
      { id: "imoveis", nome: "Imóveis", status: doneIds.has("imoveis") ? "✅ Postado" : "⏳ Pendente" },
    ] as MissaoLead[];
  }

  return [];
};
