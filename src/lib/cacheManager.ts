/**
 * cacheManager.ts
 * Detecta nova versão do build e limpa todos os caches do SW,
 * forçando hard reload em todos os dispositivos (Android, iOS, Desktop).
 */

const BUILD_VERSION = __APP_VERSION__;
const VERSION_KEY = "app_build_version";

export async function checkAndClearCache(): Promise<void> {
  const stored = localStorage.getItem(VERSION_KEY);

  // Primeira vez ou versão diferente → limpa tudo e recarrega
  if (stored !== BUILD_VERSION) {
    console.log(`[CacheManager] Nova versão detectada: ${stored} → ${BUILD_VERSION}. Limpando cache...`);

    // 1. Apaga todos os caches do Service Worker
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      console.log(`[CacheManager] ${keys.length} cache(s) removidos.`);
    }

    // 2. Desregistra SW antigos
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
      console.log(`[CacheManager] ${registrations.length} SW(s) desregistrados.`);
    }

    // 3. Salva a nova versão e recarrega forçado
    localStorage.setItem(VERSION_KEY, BUILD_VERSION);
    window.location.reload();
  }
}
