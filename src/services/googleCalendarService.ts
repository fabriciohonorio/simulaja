/**
 * Google Calendar Service
 * Cria eventos de follow-up na agenda do vendedor ao agendar um lead.
 * Usa a API do Google Calendar via OAuth do usuário logado no Supabase.
 */

export interface AgendamentoPayload {
  leadNome: string;
  leadCelular: string;
  valorCredito: number;
  tipoConsorcio: string;
  data: string;       // formato "yyyy-MM-dd"
  hora: string;       // formato "HH:mm"
  nota?: string;
}

export interface GCalEvent {
  eventId: string;
  htmlLink: string;
}

export const googleCalendarService = {
  async criarEvento(payload: AgendamentoPayload): Promise<GCalEvent | null> {
    try {
      const startDateTime = `${payload.data}T${payload.hora}:00`;
      const endDate = new Date(`${payload.data}T${payload.hora}:00`);
      endDate.setMinutes(endDate.getMinutes() + 30);
      const endDateTime = endDate.toISOString().slice(0, 16) + ":00";

      const event = {
        summary: `🔔 Follow-up: ${payload.leadNome}`,
        description: [
          `Lead: ${payload.leadNome}`,
          `Telefone: ${payload.leadCelular}`,
          `Consórcio: ${payload.tipoConsorcio}`,
          `Valor: R$ ${payload.valorCredito.toLocaleString("pt-BR")}`,
          payload.nota ? `\nNota: ${payload.nota}` : "",
        ].filter(Boolean).join("\n"),
        start: {
          dateTime: new Date(startDateTime).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: new Date(endDateTime).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "email", minutes: 60 },
          ],
        },
      };

      // Chama a Google Calendar API via token OAuth do usuário
      const { data: { session } } = await import("@/integrations/supabase/client")
        .then(m => m.supabase.auth.getSession());

      if (!session?.provider_token) {
        console.warn("[GCal] Usuário não autenticado com Google OAuth. Pulando criação de evento.");
        return null;
      }

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        console.error("[GCal] Erro ao criar evento:", err);
        return null;
      }

      const created = await response.json();
      return { eventId: created.id, htmlLink: created.htmlLink };
    } catch (error) {
      console.error("[GCal] Exceção ao criar evento:", error);
      return null;
    }
  },
};
