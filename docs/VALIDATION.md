# Validação da entrega

Execução em 06/11/2026: TypeScript sem erros; **24 testes aprovados**; jornada Playwright aprovada sem exceções JavaScript; `expo export --platform all` concluído para web, Android e iOS. A migração foi analisada pelo parser PostgreSQL (`pglast`): 30 instruções sintaticamente válidas. Não foi aplicada a um PostgreSQL real; constraints, papéis e políticas ainda precisam de teste de integração na conexão futura. Os bundles nativos não foram instalados em dispositivos.

## Verificação automatizada

Em 09/11/2026, o comando de testes foi ajustado para funcionar em Node 22 e 24 sem a opção exclusiva do Node 24 `--test-isolation=none`. A automação valida agora ambas as versões. O comando executa o arquivo com `node:test` e o loader TypeScript; falhas dos testes continuam retornando exit code diferente de zero.

`npm run check` executa TypeScript em modo strict e testes de domínio/adaptador. Os cenários incluem:

- soma em centavos, subtotal de exemplo, quantidade inválida e limite de estoque;
- troca explícita de mercado, mínimo e cobertura;
- capacidade de veículo, revisão e expiração de cotação;
- idempotência em duplo envio, reinício e corpo conflitante;
- troco, PIX pendente, liberação de reserva na expiração e sequência dos cinco estados;
- cancelamento repetido, autorização de substituição e ajuste de total;
- validade, reenvio e limite de tentativas do OTP;
- concorrência de mutações locais, falha de persistência e limpeza de sessão;
- headers/autorização do adaptador HTTP, erros do servidor e bloqueio de comandos demo.

`npm run export:web` gera o bundle estático. Exportar Android/iOS verifica empacotamento JavaScript, não substitui build nativo ou teste em dispositivo.

## Navegação no navegador

O teste `tests/e2e_flow.py` usa Playwright e Chromium em viewport 390 × 844. Ele percorre onboarding, localização, catálogo, produto com observação, feira, entrada OTP, endereço, modalidade, revisão de total, PIX demonstrativo, avanço do pedido, chat, entrega, recarregamento/persistência e repetição da feira. Também coleta exceções JavaScript da página.

Execução: iniciar `npm run web -- --port 19006` e rodar `python tests/e2e_flow.py` com Playwright instalado. Configure `CHROMIUM_PATH`, `BASE_URL` e `ARTIFACT_DIR` conforme seu ambiente. Nenhum dado real é necessário.

## Antes de operar com usuários reais

Validações ainda necessárias, pois dependem de dispositivo/serviço real:

- Android e iOS físicos: gestos, teclado, áreas seguras, persistência, permissão de GPS e biometria.
- VoiceOver/TalkBack, navegação por teclado, foco em modal, contraste completo e fontes em 200%.
- OAuth, entrega de SMS/WhatsApp, expiração/renovação/revogação de sessão.
- Transações PostgreSQL, políticas RLS, propriedade de recursos e concorrência entre clientes.
- Tokenização, 3DS quando aplicável, PIX válido, assinatura de webhook, duplicatas, reembolso e conciliação de pagamento tardio.
- GPS do entregador, mapa real, atraso de eventos, reconexão, push e suporte efetivo.
- Política comercial de taxas/mínimo/substituição/cancelamento e termos de privacidade.

Um teste do modo demo não certifica nenhum desses serviços. Os controles demonstrativos precisam permanecer indisponíveis no backend de produção.

## Dependências antes da produção

A consulta `npm audit` em 09/11/2026 apontou 18 ocorrências na árvore atual: 5 altas, 12 moderadas e 1 baixa, incluindo dependências transitivas do Expo/Metro/Router. Entre as causas estão `decode-uri-component`, `image-size` e `postcss`. Uma ocorrência na árvore não comprova exploração pelo app, mas os alertas não devem ser ignorados ao preparar a operação real.

As versões corrigidas consultadas têm mudanças de contrato (por exemplo, CommonJS para ESM no decodificador) ou estão fora das faixas fixadas pelo SDK. Não foi aplicado `npm audit fix --force`, que propõe inclusive trocar a versão principal do Expo. A atualização coordenada do SDK e a revisão dessas ocorrências permanecem pendentes antes de distribuir o produto em produção. Os testes funcionais e o CI aprovado não equivalem a uma certificação de segurança.

## Atualização 1.1 — 09/11/2026

- TypeScript estrito e **33 testes** passaram: 24 testes anteriores atualizados para os novos preços e 9 cenários de catálogo, bônus e migração.
- `tests/e2e_flow.py`: jornada completa no Chromium a 390 × 844, incluindo adição rápida, detalhe, OTP local, endereço, checkout, bônus R$ 0,47 sobre R$ 31,22 em produtos, delegação ao entregador, PIX, entrega, persistência e repetição. Sem erros JavaScript de página.
- `tests/e2e_catalog.py`: claro/escuro/sistema, persistência do tema, mudança de aparência do sistema, + sem navegação, quantidade, detalhe/ampliação, confirmação de troca de mercado, 20 produtos por categoria e visual em 390 × 844 e 1280 × 900. Sem erros JavaScript de página.
- As duas migrações SQL passaram pela análise sintática do PostgreSQL via pglast. Isso não equivale a executar a migração contra um banco real.
- Imagens dos 120 produtos inspecionadas por conjunto; corrigida a célula de sabão em barra na categoria Limpeza. As duas variantes de logo foram verificadas na interface.
- Dispositivos físicos, provedores de pagamento, banco externo e repasses reais continuam fora desta validação.
- Exportação JavaScript de **web, Android e iOS** concluída com `expo export --platform all`. Isso valida empacotamento e recursos; não substitui um teste em celular nem gera APK/IPA assinados.

# Instalação PWA — versão 1.2

- `npm run check`: TypeScript e 33 testes passaram.
- `npm run export:web`: exportação com manifesto, ícones e service worker passou.
- `python tests/e2e_pwa.py`: Chromium em perfil temporário normal, sem erros de
  elegibilidade de instalação; tamanhos dos ícones e idioma verificados.
- Interações aceitar/dispensar instalação verificadas com eventos simulados; não
  representam uma instalação real no sistema operacional.
- Abertura offline, aviso e recuperação online passaram. Cache Storage contém
  somente `offline.html`; nenhum dado de API/cliente entra nesse cache.
- Instruções de iPhone verificadas em Chromium com identificação de iPhone;
  teste físico em Safari/iOS e Android permanece pendente.
- Exportações JavaScript/Hermes para Android e iOS passaram. Não foram gerados
  APK/AAB/IPA assinados nem submetidos às lojas.
- Publicação HTTPS depende da autorização da conta de hospedagem.
