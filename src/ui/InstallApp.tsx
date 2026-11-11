import React from 'react';
import { Platform, Text } from 'react-native';
import { Card, Button, Icon, useUI } from './components';
import { usePwa } from '../state/PwaProvider';

export function InstallApp() {
  const { s } = useUI();
  const pwa = usePwa();
  if (Platform.OS !== 'web') return null;
  return (
    <Card>
      <Icon name="download-outline" />
      <Text style={s.sectionTitle}>
        {pwa.installed ? 'PedeAê no seu dispositivo' : 'Tenha o PedeAê por perto'}
      </Text>
      <Text style={s.body}>
        {pwa.installed
          ? 'Abra pelo ícone na tela inicial, sem precisar do terminal.'
          : 'Instale para abrir pelo ícone no celular ou no computador.'}
      </Text>
      {!pwa.installed && !pwa.published && (
        <Text style={s.small}>
          A instalação fica disponível na versão publicada com endereço seguro (HTTPS).
        </Text>
      )}
      {!pwa.installed &&
        pwa.published &&
        (pwa.available ? (
          <Button
            label="Instalar PedeAê"
            icon="download-outline"
            loading={pwa.installing}
            onPress={() => void pwa.install()}
          />
        ) : (
          <Text style={s.body}>
            {pwa.device === 'ios'
              ? 'No Safari, toque em Compartilhar → Adicionar à Tela de Início → Adicionar. Se aparecer, ative “Abrir como App da Web”.'
              : pwa.device === 'android'
                ? 'No Chrome, abra o menu ⋮ → Instalar aplicativo ou Adicionar à tela inicial. Se estiver em outro aplicativo, abra este endereço no Chrome.'
                : 'No Chrome ou Edge, procure o ícone de instalação na barra de endereço ou a opção Instalar no menu. No Safari do Mac, use Arquivo → Adicionar ao Dock, quando disponível. Em navegadores sem instalação, continue usando normalmente pela web.'}
          </Text>
        ))}
      {!!pwa.message && (
        <Text accessibilityLiveRegion="polite" style={s.small}>
          {pwa.message}
        </Text>
      )}
      <Text style={s.small}>
        Esta versão é demonstrativa. Internet necessária para abrir e atualizar. Os dados de teste
        ficam neste dispositivo e não são sincronizados.
      </Text>
    </Card>
  );
}
