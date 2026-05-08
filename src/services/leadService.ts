import { supabase } from "@/integrations/supabase/client";

export type LeadData = {
  nome: string;
  celular: string;
  tipo_consorcio: string;
  valor_credito: number;
  prazo_meses: number;
  categoria: string;
  origem?: string;
  indicador_nome?: string;
  indicador_celular?: string;
};

export const calculateLeadScore = (credito: number, categoria: string): "baixo" | "medio" | "alto" | "premium" => {
  // Higher weights for specific categories like Agro and Imóvel
  const categoryWeight = {
    imovel: 1.2,
    agro: 1.5,
    frotas: 1.3,
    veiculo: 1.0,
    moto: 0.8,
    nautica: 1.4,
    investimento: 1.3
  };

  const weight = categoryWeight[categoria as keyof typeof categoryWeight] || 1.0;
  const weightedCredit = credito * weight;

  if (weightedCredit >= 1000000) return "premium";
  if (weightedCredit >= 400000) return "alto";
  if (weightedCredit >= 150000) return "medio";
  return "baixo";
};

export const createLead = async (data: LeadData) => {
  const score = calculateLeadScore(data.valor_credito, data.categoria);
  
  // 1. Save to Supabase
  const { data: lead, error: dbError } = await supabase.from("leads").insert({
    nome: data.nome.trim(),
    celular: data.celular.replace(/\D/g, ""),
    tipo_consorcio: data.tipo_consorcio,
    valor_credito: data.valor_credito,
    prazo_meses: data.prazo_meses,
    status: "novo_lead",
    lead_score_valor: score,
    lead_temperatura: "quente",
    organizacao_id: "8b1a2dcc-83cd-4985-a828-f3870dcbc2a4", // Fixed org for now
    indicador_nome: data.indicador_nome,
    indicador_celular: data.indicador_celular,
    origem: data.origem || "Simulador Web"
  }).select().single();

  if (dbError) {
    console.error("❌ Error saving lead to CRM:", dbError);
    throw new Error(`Erro no CRM: ${dbError.message}`);
  }

  // 2. Send to Webhook (Make)
  const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_LEADS;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          score,
          lead_id: lead.id,
          timestamp: new Date().toISOString()
        }),
      });
      if (!response.ok) throw new Error("Webhook response was not ok");
    } catch (webhookError) {
      console.warn("⚠️ Webhook failed (non-critical):", webhookError);
      // We don't throw here to not break the user flow if only the webhook fails
    }
  }

  return { lead, score };
};
