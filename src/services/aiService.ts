/**
 * AI Service Integration (Claude / Gemini)
 * Handles lead analysis and sales script generation.
 */

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "gemini"; // "claude" or "gemini"
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

export interface LeadContext {
    nome: string;
    tipo_consorcio: string;
    valor_credito: number;
    cidade: string;
}

export const aiService = {
    /**
     * Generates a personalized sales script for a lead.
     */
    async generateSalesScript(lead: LeadContext) {
        if (!AI_API_KEY) {
            console.warn("AI API Key not configured. Please add VITE_AI_API_KEY to .env");
            return { script: "Olá, bom dia! Gostaria de falar sobre o seu consórcio.", error: "AI Key missing" };
        }

        const prompt = `Você é o Jarvis, um consultor de elite em consórcios. 
        O lead ${lead.nome} de ${lead.cidade} acabou de fazer uma simulação de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString('pt-BR')}.
        Crie uma primeira mensagem de WhatsApp curta, persuasiva e humana. 
        Não use emojis em excesso. Chame-o pelo nome. 
        Foque em como essa carta de crédito pode transformar o patrimônio dele ou gerar rentabilidade.
        Responda apenas com o texto da mensagem.`;

        try {
            if (AI_PROVIDER === "claude") {
                return await this.callClaude(prompt);
            } else {
                return await this.callGemini(prompt);
            }
        } catch (error) {
            console.error("AI Service Error:", error);
            return { script: "Erro ao gerar script", error };
        }
    },

    /**
     * Call Anthropic Claude API
     */
    async callClaude(prompt: string) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": AI_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 500,
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        return { script: data.content[0].text, error: null };
    },

    /**
     * Call Google Gemini API
     */
    async callGemini(prompt: string) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        return { script: data.candidates[0].content.parts[0].text, error: null };
    }
};
