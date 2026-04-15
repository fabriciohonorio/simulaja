import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./ui/button";

let deferredPrompt: any = null;

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // Se já estiver instalado/standalone, não mostra nada
    if (isStandalone) return;

    // Para Android e Desktop modernos
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Dica para iOS: iOS não dispara beforeinstallprompt, então mostramos um prompt manual depois de alguns segundos
    if (isIOS && !isStandalone) {
      const timer = setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa_ios_prompted');
        if (!hasSeenPrompt) {
          setShowPrompt(true);
        }
      }, 5000); // 5 segundos para não interromper a navegação imediatamente
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("Usuário instalou o PWA");
      }
      deferredPrompt = null;
      setShowPrompt(false);
    } else {
      // É provável que seja iOS
      alert("Para instalar no iPhone/iPad: Toque no ícone de Compartilhar e depois em 'Adicionar à Tela de Início'.");
      localStorage.setItem('pwa_ios_prompted', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
       localStorage.setItem('pwa_ios_prompted', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-500 max-w-lg mx-auto">
      <div className="flex-1 flex items-center gap-4">
        <div className="bg-primary/20 p-3 rounded-2xl">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="font-black text-sm uppercase tracking-wide">Instale o App</h4>
          <p className="text-xs text-slate-400 font-medium">Instale na tela de início para acessar mais rápido e com suporte offline.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button onClick={handleDismiss} variant="ghost" className="h-10 px-3 text-slate-400 hover:text-white rounded-xl uppercase text-[10px] font-black tracking-widest flex-1 sm:flex-none">
          Depois
        </Button>
        <Button onClick={handleInstallClick} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl uppercase text-[10px] font-black tracking-widest flex-1 sm:flex-none shadow-lg shadow-primary/20">
          Instalar Agora
        </Button>
      </div>
    </div>
  );
}
