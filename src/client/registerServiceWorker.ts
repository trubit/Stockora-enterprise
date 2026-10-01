/**
 * Stockora Enterprise Pro — PWA Service Worker Registration & Installation Manager
 *
 * Complies with modern PWA standards:
 * - Detects native beforeinstallprompt
 * - Handles service worker lifecycle events
 * - Provides non-blocking install prompt triggers
 * - Never forces aggressive page reload loops
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(isInstallable: boolean) => void>();

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Capture native install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    installListeners.forEach((listener) => listener(true));
  });

  // App installed event
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installListeners.forEach((listener) => listener(false));
    console.log('[PWA] Stockora Enterprise Pro installed successfully.');
  });

  // In development, NEVER register sw.js and proactively unregister any active worker
  // to avoid caching stale Vite modules, transformed chunks, and HMR tokens.
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.startsWith('stockora-pro-')) {
            caches.delete(key);
          }
        }
      });
    }
    return;
  }

  // Register worker on window load (production only)
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Listen for new service worker updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log(
                  '[PWA] New version of Stockora Enterprise Pro available. Ready for next session.'
                );
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration non-fatal error:', error);
      });
  });
}

export function isAppInstallable(): boolean {
  return deferredPrompt !== null;
}

export function subscribeInstallable(callback: (isInstallable: boolean) => void): () => void {
  installListeners.add(callback);
  callback(deferredPrompt !== null);
  return () => {
    installListeners.delete(callback);
  };
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!deferredPrompt) {
    return 'unsupported';
  }

  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      deferredPrompt = null;
      installListeners.forEach((listener) => listener(false));
    }
    return choice.outcome;
  } catch (err) {
    console.warn('[PWA] Prompt install exception:', err);
    return 'dismissed';
  }
}
