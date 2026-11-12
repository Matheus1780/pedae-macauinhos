# Contrato da API v1

Contrato preparado para implementação futura. Este repositório entrega o cliente, adaptador HTTP e esquema SQL; **não inclui um servidor de produção**. O modo `api` falha de forma explícita se a API não estiver configurada. Não existe fallback silencioso para dados fictícios.

## Transporte e sessão

- HTTPS obrigatório. API recebe/retorna JSON UTF-8; datas ISO 8601 UTC, valores monetários inteiros em centavos.
- iOS/Android: token de acesso em Expo SecureStore, `Authorization: Bearer ...`. Implementar expiração, renovação e revogação no serviço; o adaptador atual recebe novo token ao verificar o OTP.
- Web: cookie de sessão `HttpOnly`, `Secure` e política SameSite adequada; backend deve validar Origin/CSRF, configurar CORS com origens explícitas e `credentials`. O cliente não persiste tokens no localStorage.
- O backend infere o cliente pela sessão verificada. Nunca confiar em `customer_id`, preços, status ou totais vindos do app.
- `src/data/contracts.ts` e `src/domain/types.ts` são os contratos TypeScript do handoff.
- Resposta de erro: `{ "code": "STOCK_CHANGED", "message": "A disponibilidade mudou. Revise sua feira." }`. Nunca enviar stack, SQL ou dados de outros usuários ao cliente.

| Método e rota        | Entrada                                   | Saída e responsabilidade                                                                                                                           |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/snapshot`      | Sessão opcional                           | `Snapshot`: catálogo público e somente dados privados do cliente autenticado. Sem sessão: perfil nulo, sem endereços/cartões/pedidos de terceiros. |
| POST `/auth/otp`     | `{phone, channel: "sms"                   | "whatsapp"}`                                                                                                                                       | `Challenge {id, expiresAt, resendAt}`. Rate limit por telefone/IP/dispositivo, validade e máximo de tentativas controlados no servidor. |
| POST `/auth/verify`  | `{challengeId, code, name}`               | `{snapshot, accessToken?}`. No web, definir cookie HttpOnly e omitir token. OTP de uso único, nunca registrar código ou telefone integral em logs. |
| POST `/auth/recover` | `{identifier}`                            | JSON `{accepted:true}` com resposta indistinguível para conta existente ou não. Encaminhar ao provedor de identidade.                              |
| POST `/commands`     | União `Command`                           | `Snapshot` atualizado. Validar posse, campos e permissões. Negar todos os comandos `demo*` e `saveDemoCard` em produção.                           |
| POST `/quotes`       | `{addressId, vehicle}`                    | `Quote`. Calcular estoque, cobertura, mínimo, peso/volume, distância, taxas e validade no servidor.                                                |
| POST `/checkout`     | `CheckoutInput`; header `Idempotency-Key` | `{snapshot, order}`. Repetir a mesma chave/corpo retorna o mesmo pedido; mesma chave com corpo diferente retorna 409.                              |

O protocolo de snapshot torna o protótipo simples. Para escala, paginar catálogo, pedidos e mensagens e introduzir endpoints por recurso mantendo a interface dos repositórios. Não retornar o histórico inteiro indefinidamente.

## Comandos permitidos ao cliente

`onboard`, `addItem`, `quantity`, `note`, `contactPreference`, `saveAddress`, `removeAddress`, `profile`, `search`, `clearSearches`, `removeCard`, `repeat`, `chat`, `cancel`, `resolveSubstitution`, `logout`, `deleteAccount`.

- `addItem` com outro mercado exige `switchMarket=true`, emitido somente após confirmação na interface.
- `quantity=0` remove. Quantidades 1–99, dentro do estoque. Produtos em porção fixa no protótipo; peso variável exige novo contrato de medição e aprovação de ajuste.
- `repeat` reavalia os preços e quantidades atuais; não cria nem cobra um pedido.
- `cancel` no fluxo demonstrativo é permitido antes da preparação. A política comercial definitiva deve ser implementada no backend.
- `resolveSubstitution` exige sugestão pendente pertencente ao pedido do cliente e respeita o prazo. Primeiro escopo: igual ou menor valor, sem cobrança adicional automática.
- `logout` revoga a sessão no servidor. `deleteAccount` exige reautenticação, tratamento de pedidos ativos e retenção legal; a exclusão imediata do modo demo não é uma política de produção.

## Endpoints adicionais exigidos para operação real

Ainda não conectados no cliente: OAuth Google/Apple, renovação de sessão, tokenização de cartão pelo SDK/checkout hospedado do PSP, webhooks PIX/cartão, suporte com protocolos, chamadas protegidas, push e localização ao vivo.

- `POST /payments/webhooks/{provider}`: somente provedor, assinatura, timestamp, deduplicação e reconciliação de valor/moeda/referência.
- `POST /orders/{id}/status`: somente mercado/entregador habilitados; cliente não recebe essa permissão.
- `GET /orders/{id}/events`: SSE/WebSocket autenticado com `eventId`, `sequence`, `occurredAt` e reconexão por cursor. Descartar eventos duplicados/antigos e atualizar por snapshot quando houver lacuna.
- `GET /orders/{id}/location`: localização somente após coleta e enquanto entrega estiver ativa; mostrar timestamp, tratar posição vencida sem inventar movimento. Polling do snapshot a cada 10 s já existe como base para pedidos e PIX em modo API, mas não é GPS ao vivo.
- `POST /payments/cards`: recebe referência tokenizada pelo PSP, nunca PAN ou CVV. Retorna somente `id`, `brand`, `last4` ao cliente.

## Códigos de erro

`UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `RATE_LIMIT` (429), `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `STOCK_CHANGED`, `PRICE_CHANGED`, `QUOTE_EXPIRED`, `MINIMUM`, `OUTSIDE_COVERAGE`, `VEHICLE_CAPACITY`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_DECLINED`, `PAYMENT_PENDING`, `NETWORK`.

Em timeout do checkout, manter a chave de idempotência e consultar/repetir a mesma operação; nunca criar outra cobrança porque o cliente não recebeu a resposta. A UI conserva a chave enquanto a cotação e a tela permanecem válidas. A API de produção deve permitir recuperar uma tentativa após reinício do app e impedir dois pedidos originados da mesma cotação.

## Extensão 1.1: montagem financiada pela plataforma

`Market.assemblyMode: market | courier` e `assemblyRevision: number` são definidos pelo serviço do mercado. `Quote.assembly` contém `{ by, rateBps: 150, bonus, fundedBy: platform, policyRevision }`. `bonus` é calculado no servidor em centavos: `floor((subtotal * 150 + 5000) / 10000)`. A base é exclusivamente o subtotal dos produtos. `total = subtotal + deliveryFee + platformFee`; nunca somar o bônus.

`Order.assembly` copia a alocação aprovada, acrescenta `state`, `assignedAt` e `reassignedAt?`. Estados: pending, assembling, ready, earned, void. `Order.quote` guarda o responsável originalmente cotado; `Order.assembly` guarda o destinatário atual. Ordens antigas podem omitir ambos os objetos.

O checkout revalida a política de montagem além de endereço, produtos, disponibilidade e revisão da feira. O backend publica eventos de reatribuição antes da coleta sem duplicar o bônus e sem aumentar o total. Substituições recalculam a base; cancelamento expira o bônus. A confirmação de entrega e o livro de repasses exigem autorização de servidor, idempotência e conciliação financeira. A UI de cliente não escolhe nem liquida o recebedor.

`demoConfigureAssembly` e `demoDelegateAssembly` são bloqueados pelo ApiRepository. A implementação real de decisão do mercado é uma operação administrativa/operacional separada, autenticada e auditada. `Product.image` aceita URL HTTPS de uma foto oficial; os identificadores `atlas:*` são exclusivos das fixtures locais. `Product.priceReference` distingue retailer, normalized e estimated no protótipo.

## Favoritos (v1.3)

`Snapshot.favoriteProductIds: string[]` contém somente os favoritos da sessão atual.
`POST /commands` aceita `{type:"setFavorite", productId, value:boolean}`. Operação idempotente:
`value=true` faz upsert; `false` remove; validar existência do produto. A migração
`database/003_favorites.sql` prepara armazenamento no futuro servidor, sem acesso direto do app.
Na API, autenticar o cliente ou usar uma sessão anônima verificada e migrar seus favoritos no login;
nunca receber `customer_id` do aplicativo. O demo permite uso sem login, persiste localmente,
preserva favoritos durante login e os apaga ao sair/excluir a conta. Não há sincronização entre dispositivos.
