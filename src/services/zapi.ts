/**
 * Z-API Service Integration
 * Handles WhatsApp messaging using Z-API.
 */

const ZAPI_INSTANCE = import.meta.env.VITE_ZAPI_INSTANCE;
const ZAPI_TOKEN = import.meta.env.VITE_ZAPI_TOKEN;

export interface ZApiMessage {
    phone: string;
    message: string;
}

export const zapiService = {
    /**
     * Sends a text message via WhatsApp.
     */
    async sendMessage({ phone, message }: ZApiMessage) {
        if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
            console.warn("Z-API credentials not configured. Please add VITE_ZAPI_INSTANCE and VITE_ZAPI_TOKEN to .env");
            return { error: "Z-API credentials missing" };
        }

        const cleanPhone = phone.replace(/\D/g, "");
        const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone: `55${cleanPhone}`,
                    message: message,
                }),
            });

            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            console.error("Z-API Send Error:", error);
            return { data: null, error };
        }
    }
};
