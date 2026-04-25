import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Força atualização automática do PWA em todos os dispositivos (incluindo iOS)
registerSW({
  onNeedRefresh() {
    // Novo SW disponível: recarrega automaticamente sem precisar de ação do usuário
    window.location.reload();
  },
  onOfflineReady() {
    console.log("PWA pronto para uso offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
