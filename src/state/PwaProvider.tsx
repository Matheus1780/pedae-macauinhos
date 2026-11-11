import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
type Installation = {
  installed: boolean;
  available: boolean;
  installing: boolean;
  device: 'ios' | 'android' | 'desktop';
  published: boolean;
  message: string;
  install: () => Promise<void>;
};
const Context = createContext<Installation | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(Platform.OS !== 'web');
  const [installing, setInstalling] = useState(false);
  const [device, setDevice] = useState<Installation['device']>('desktop');
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const nav = navigator as Navigator & { standalone?: boolean };
    const ios =
      /iPad|iPhone|iPod/.test(nav.userAgent) ||
      (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    setDevice(ios ? 'ios' : /Android/.test(nav.userAgent) ? 'android' : 'desktop');
    setPublished(!__DEV__ && window.isSecureContext);
    const media = window.matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(media.matches || nav.standalone === true);
    sync();
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      if (!ios) setPrompt(event as InstallPrompt);
      setMessage('');
    };
    const completed = () => {
      setInstalled(true);
      setPrompt(null);
      setMessage('PedeAê instalado. Você já pode abrir pelo ícone.');
    };
    media.addEventListener('change', sync);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', completed);
    // Production only: never retain development bundles or API/customer data.
    if (!__DEV__ && window.isSecureContext && 'serviceWorker' in navigator) {
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => setMessage('Não foi possível preparar a instalação. Reabra com internet.'));
    }
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', completed);
    };
  }, []);

  const install = async () => {
    if (!prompt || installing) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setMessage(
        outcome === 'accepted'
          ? 'Instalação solicitada. Aguarde a confirmação do navegador.'
          : 'Você pode instalar depois pelo menu do navegador.',
      );
    } catch {
      setMessage('Use a opção de instalação no menu do navegador.');
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  };
  return (
    <Context.Provider
      value={{ installed, available: !!prompt, installing, device, published, message, install }}
    >
      {children}
    </Context.Provider>
  );
}

export function usePwa() {
  const context = useContext(Context);
  if (!context) throw new Error('PwaProvider ausente');
  return context;
}
