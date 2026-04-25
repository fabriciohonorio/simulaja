import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { checkAndClearCache } from "./lib/cacheManager";

// Verifica versão do build e limpa cache se necessário (resolve Android/iOS travado)
checkAndClearCache().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});

// Listener de atualização do SW — recarrega automaticamente ao detectar nova versão
registerSW({
  onNeedRefresh() {
    window.location.reload();
  },
  onOfflineReady() {
    console.log("PWA pronto para uso offline");
  },
});

