export const COLUMNS = [
  { id: "novo_lead", label: "🆕 Novo Lead" },
  { id: "primeiro_contato", label: "📞 Primeiro Contato" },
  { id: "qualificacao", label: "🧠 Qualificação" },
  { id: "simulacao_enviada", label: "📊 Simulação Enviada" },
  { id: "negociacao", label: "🤝 Negociação" },
  { id: "aguardando_pagamento", label: "🧘 Aguardando Pagamento" },
  { id: "fechado", label: "🏆 Venda Fechada" },
  { id: "perdido", label: "❌ Perdido" },
  { id: "morto", label: "☠️ Lead Morto" },
];

export const COLUMN_COLORS: Record<string, string> = {
  novo_lead: "border-t-blue-500 bg-blue-50/10",
  primeiro_contato: "border-t-yellow-500 bg-yellow-50/10",
  qualificacao: "border-t-orange-500 bg-orange-50/10",
  simulacao_enviada: "border-t-purple-500 bg-purple-50/10",
  negociacao: "border-t-emerald-500 bg-emerald-50/10",
  aguardando_pagamento: "border-t-amber-500 bg-amber-50/10",
  fechado: "border-t-green-600 bg-green-50/10",
  perdido: "border-t-red-500 bg-red-50/10",
  morto: "border-t-slate-400 bg-slate-50/10",
};

export const COLUMN_DOT_COLORS: Record<string, string> = {
  novo_lead: "bg-blue-500",
  primeiro_contato: "bg-yellow-500",
  qualificacao: "bg-orange-500",
  simulacao_enviada: "bg-purple-500",
  negociacao: "bg-emerald-500",
  aguardando_pagamento: "bg-amber-500",
  fechado: "bg-green-600",
  perdido: "bg-red-500",
  morto: "bg-slate-400",
};

export const TEMP_COLORS: Record<string, string> = {
  quente: "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  morno: "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
  frio: "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  perdido: "border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.1)]",
  morto: "border-gray-400 bg-gray-50 opacity-75",
};

export const TEMP_EMOJIS: Record<string, string> = {
  quente: "🔥",
  morno: "🌤️",
  frio: "❄️",
  perdido: "💀",
  morto: "☠️",
};

export const TEMP_LABELS: Record<string, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
  perdido: "Perdido",
  morto: "Morto",
};

export const SCORE_LABELS: Record<string, string> = {
  premium: "🔥 Lead Premium",
  alto: "🚀 Lead Alto",
  medio: "⚡ Lead Médio",
  baixo: "🧊 Lead Baixo",
};

export const normalizeStatus = (status: string | null): string => {
  if (!status) return "novo_lead";
  const s = status.toLowerCase().trim();
  const map: Record<string, string> = {
    novo: "novo_lead",
    novo_lead: "novo_lead",
    contato: "primeiro_contato",
    contatado: "primeiro_contato",
    primeiro_contato: "primeiro_contato",
    qualificacao: "qualificacao",
    "qualificação": "qualificacao",
    proposta: "simulacao_enviada",
    proposta_enviada: "simulacao_enviada",
    simulacao_enviada: "simulacao_enviada",
    "simulação enviada": "simulacao_enviada",
    negociacao: "negociacao",
    "negociação": "negociacao",
    em_negociacao: "negociacao",
    "em negociação": "negociacao",
    aguardando_pagamento: "aguardando_pagamento",
    "aguardando pagamento": "aguardando_pagamento",
    fechado: "fechado",
    venda_fechada: "fechado",
    perdido: "perdido",
    desistiu: "perdido",
    morto: "morto",
    lead_morto: "morto",
  };
  return map[s] || "novo_lead";
};
