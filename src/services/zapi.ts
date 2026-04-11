/**
 * Z-API Service Integration
 * Handles WhatsApp messaging using Z-API.
 */
import { env } from '../config/env';

export interface ZApiMessage {
    phone: string;
    message: string;
}

export const zapiService = {
    /**
     * Sends a text message via WhatsApp.
     */
    async sendMessage({ phone, message }: ZApiMessage) {
        if (!env.zapi.instance || !env.zapi.token) {
            console.warn("Z-API credentials not configured. Please add VITE_ZAPI_INSTANCE and VITE_ZAPI_TOKEN to .env");
            return { error: "Z-API credentials missing" };
        }

        const cleanPhone = phone.replace(/\D/g, "");
        const url = `https://api.z-api.io/instances/${env.zapi.instance}/token/${env.zapi.token}/send-text`;

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
