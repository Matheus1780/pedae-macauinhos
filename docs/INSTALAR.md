# Instalar o PedeAê no computador ou celular

O PedeAê tem uma versão web instalável (PWA). Depois de publicada em HTTPS,
ela abre por um ícone, sem Node.js, VS Code ou terminal no dispositivo do cliente.
O Google Drive guarda os arquivos; ele não hospeda nem executa o aplicativo.

## Android

1. Abra o endereço publicado no Google Chrome.
2. No PedeAê, abra **Perfil** e toque em **Instalar PedeAê**, se o botão aparecer.
3. Alternativamente, use o menu **⋮ → Instalar aplicativo / Adicionar à tela inicial**.
4. Confirme e abra pelo novo ícone.

## iPhone e iPad

1. Abra o endereço publicado no Safari.
2. Toque em **Compartilhar → Adicionar à Tela de Início**.
3. Quando disponível, ative **Abrir como App da Web** e toque em **Adicionar**.
4. Abra pelo ícone PedeAê. O iPhone não usa o botão automático do Chrome/Android.

## Windows, macOS e Linux

1. Abra o endereço publicado no Chrome ou Edge atualizado.
2. Clique no ícone de instalação na barra de endereço ou na opção **Instalar** do menu.
3. Confirme; o app abre em uma janela própria.
4. No Safari recente do Mac: **Arquivo → Adicionar ao Dock**.

Os nomes dos menus variam com a versão. Navegadores que não oferecem instalação
continuam podendo acessar o app pela web. Não existe um único executável que
instale nativamente em todos os sistemas e versões.

## Atualizações, conexão e dados

- Abra novamente com internet para carregar uma atualização publicada.
- Esta versão precisa de internet. Sem conexão ao reabrir, mostra **Vamos nos reconectar?**.
- O service worker guarda somente a página de aviso offline; não guarda respostas da API,
  tokens, pedidos ou pagamentos no Cache Storage.
- Dados da demonstração continuam no armazenamento local já usado pelo app.
  Dispositivos diferentes não sincronizam contas, compras ou endereços.
- Os pagamentos, OTP, chat e rastreamento continuam simulados. Código de teste: **123456**.
- O link local `localhost` só funciona enquanto o servidor daquele computador estiver ligado.
  Para distribuir o app, use o endereço HTTPS publicado, não esse link local.

## Publicar o pacote web

O repositório inclui `vercel.json`, manifesto, ícones, tela offline e exportação automatizada.
No projeto Vercel ligado a este repositório, use:

```text
Install command: npm ci
Build command: npm run export:web
Output directory: dist
Node: 24.x (ou 22.13+)
```

Use o modo demo padrão. Não configure API fictícia. Se a Vercel pedir autorização
de acesso à equipe, o titular precisa aprovar pelo link de consentimento.
Para outro provedor estático, envie **o conteúdo de dist**, sirva pela raiz `/`,
com HTTPS e redirecione as rotas de tela para `/index.html`. Preserve arquivos
estáticos, `/sw.js`, `/offline.html`, `/manifest.webmanifest` e `/icons/*`.
O worker e o manifesto devem ser revalidados (Cache-Control: no-cache).
Esta configuração não atende hospedagem em subpasta sem adaptação dos caminhos.

## Aplicativos nativos / lojas

O código React Native continua compartilhado. `eas.json` prepara os perfis de
compilação; não representa APK/IPA já gerado ou aprovado nas lojas.

Para o desenvolvedor, depois de entrar em uma conta Expo e vincular o projeto:

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
# Gera APK Android para testes, após configurar a assinatura.
npx eas-cli build --platform android --profile production
# Gera AAB para submissão ao Google Play.
npx eas-cli build --platform ios --profile production
# Requer a conta Apple Developer e certificados apropriados.
```

A geração nativa pode ter limites/custos da Expo. Distribuir pela App Store ou
Google Play exige contas de desenvolvedor, assinatura, dados de privacidade e
aprovação das lojas. A PWA instalada pelo navegador não exige essas contas.
Testes em aparelhos físicos e integrações de produção ainda são necessários.

## Alternativa de desenvolvimento no Windows

Quem quiser editar o código pode baixar o ZIP, extrair, instalar Node.js 24 e abrir
`CRIAR-ATALHO-WINDOWS.cmd` uma vez. Depois, use **PedeAe (teste)** na Área de Trabalho.
Esse atalho local ainda usa um servidor e mantém sua janela de comandos aberta.
