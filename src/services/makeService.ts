/**
 * Make.com Service
 * Centraliza todas as chamadas de webhook para o Make.com.
 */

const WEBHOOK_LEADS = "https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1"; // existente
const WEBHOOK_AGENDAMENTO = import.meta.env.VITE_MAKE_WEBHOOK_AGENDAMENTO;

export interface AgendamentoNotificacao {
  lead: {
    id: string;
    nome: string;
    celular: string;
    tipo_consorcio: string;
    valor_credito: number;
    status: string | null;
  };
  data: string;
  hora: string;
  nota?: string;
  responsavel_nome?: string;
}

export const makeService = {
  /**
   * Notifica o vendedor no Telegram quando ele agenda um lead.
   * Chama o webhook do Make que roteia a mensagem pro Telegram correto.
   */
  async notificarAgendamento(payload: AgendamentoNotificacao): Promise<void> {
    if (!WEBHOOK_AGENDAMENTO) {
      console.warn("[Make] VITE_MAKE_WEBHOOK_AGENDAMENTO não configurado. Pulando notificação.");
      return;
    }

    const dataFormatada = new Date(`${payload.data}T${payload.hora}`)
      .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

    try {
      await fetch(WEBHOOK_AGENDAMENTO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "agendamento_crm",
          lead_nome: payload.lead.nome,
          lead_celular: payload.lead.celular,
          lead_tipo: payload.lead.tipo_consorcio,
          lead_valor: payload.lead.valor_credito,
          lead_status: payload.lead.status,
          data_formatada: dataFormatada,
          hora: payload.hora,
          nota: payload.nota || "",
          responsavel: payload.responsavel_nome || "Vendedor",
          // O Make usa este campo para rotear para o Telegram correto do vendedor
          responsavel_telefone: payload.responsavel_nome,
        }),
      });
    } catch (e) {
      console.warn("[Make] Erro ao disparar webhook de agendamento:", e);
      // Erro silencioso — o agendamento já foi salvo, a notificação é secundária
    }
  },
};
