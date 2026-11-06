# Validação da entrega

Execução em 06/11/2026: TypeScript sem erros; **24 testes aprovados**; jornada Playwright aprovada sem exceções JavaScript; `expo export --platform all` concluído para web, Android e iOS. A migração foi analisada pelo parser PostgreSQL (`pglast`): 30 instruções sintaticamente válidas. Não foi aplicada a um PostgreSQL real; constraints, papéis e políticas ainda precisam de teste de integração na conexão futura. Os bundles nativos não foram instalados em dispositivos.

## Verificação automatizada

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
