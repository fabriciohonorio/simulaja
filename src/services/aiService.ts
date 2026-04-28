/**
 * AI Service Integration (Claude / Gemini)
 * Handles lead analysis and sales script generation.
 */
import { env } from '../config/env';

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
        if (!env.ai.apiKey) {
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
            if (env.ai.provider === "claude") {
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
     * Ask Jarvis a question with full CRM context
     */
    async askJarvis(context: string, question: string) {
        if (!env.ai.apiKey) {
            console.warn("AI API Key not configured.");
            return { answer: "Estou sem minha chave de API configurada no momento. Por favor, adicione a VITE_AI_API_KEY no arquivo .env para que eu possa processar sua pergunta com inteligência artificial.", error: "AI Key missing" };
        }

        const prompt = `Você é o Jarvis, o estrategista comercial de elite e assistente inteligente de um sistema de CRM de consórcios.
Você tem acesso aos seguintes dados em tempo real da operação:

${context}

Responda à pergunta do usuário de forma concisa, direta, extremamente inteligente e analítica. 
Aja como um parceiro de negócios e consultor de elite. Traga insights se possível. 
Se a pergunta for sobre simulação (ex: parcelas, prazos), use as informações de grupos fornecidas no contexto.
Se a pergunta for sobre um cliente específico, procure-o no contexto. Se não encontrar os detalhes, diga o que você sabe ou peça mais informações.
NÃO seja robótico. Seja persuasivo e motivador.

PERGUNTA DO USUÁRIO: "${question}"`;

        try {
            if (env.ai.provider === "claude") {
                const res = await this.callClaude(prompt);
                return { answer: res.script, error: null };
            } else {
                const res = await this.callGemini(prompt);
                return { answer: res.script, error: null };
            }
        } catch (error) {
            console.error("AI Service Error:", error);
            return { answer: "Desculpe, ocorreu um erro de conexão com meu núcleo de processamento neural. Tente novamente em instantes.", error };
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
                "x-api-key": env.ai.apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-5",
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.ai.apiKey}`, {
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
