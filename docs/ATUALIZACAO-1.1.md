# PedeAê 1.1 — catálogo, aparência e montagem

Atualizado em 09/11/2026. Módulo Cliente em React Native / Expo SDK 54. As operações continuam demonstrativas; nenhum banco externo ou repasse financeiro foi ativado.

## Comportamentos entregues

- O **+** no card adiciona uma unidade sem navegar. Depois aparecem quantidade e ação de diminuir/remover. A foto e o nome abrem detalhes, observações e ampliação. Os alvos são separados, com área mínima de 44 px. O botão fica ocupado durante a gravação e respeita estoque, limite de 99 unidades e mercado fechado.
- Trocar de mercado pede confirmação antes de substituir a feira. Cancelar preserva os itens anteriores. Adições concorrentes são serializadas pelo repositório.
- **120 produtos distintos, 20 em cada uma das seis categorias**, disponíveis nos três mercados de demonstração: 360 ofertas. Os IDs dos 14 produtos anteriores foram preservados. Estoque, feira, endereços, conta e pedidos existentes sobrevivem à atualização.
- Imagens locais geradas por IA, organizadas em seis arquivos de 20 imagens. Os componentes recortam visualmente a célula correspondente; não dependem de um servidor de imagens. Nomes e apresentações reais, imagens ilustrativas, sem promessa de reprodução exata de rótulos e embalagens. Ingredientes e alergênicos devem vir do cadastro oficial do mercado na produção.
- Claro, escuro e sistema, com preferência persistida. A lua/sol da Home alterna diretamente; Perfil → Aparência oferece as três opções. A logo baseada no arquivo enviado mantém o P verde, com letras pretas no claro e brancas no escuro.
- Verde mais discreto, fundos neutros, tipografia consistente, categorias sem arco-íris de cores, cards com contorno sutil. Nenhum desconto artificial é anunciado.

## Regra do bônus confirmada pelo proprietário

**Bônus = subtotal dos produtos × 1,5%, arredondado uma vez para centavos.** Entrega e Taxa PedeAê não entram na base. A plataforma financia o bônus usando sua taxa; não existe taxa adicional de montagem para o cliente.

Exemplo: R$ 100,00 em produtos + R$ 7,90 de entrega + R$ 2,10 de Taxa PedeAê = **R$ 110,00** para o cliente. R$ 1,50 da receita da plataforma é destinado a quem monta a feira. A entrega continua remunerada separadamente. Mercado e entregador nunca recebem dois bônus pelo mesmo pedido.

| Cenário                        | Quem seleciona e organiza os produtos | Destinatário do bônus                 |
| ------------------------------ | ------------------------------------- | ------------------------------------- |
| Mercado monta                  | Equipe do mercado                     | Mercado                               |
| Mercado não monta              | Entregador, dentro do mercado         | Entregador                            |
| Mercado delega antes da coleta | Entregador assume a montagem          | Bônus único transferido ao entregador |

O Mercado Bom Preço começa com montagem pelo mercado; Sabor da Terra começa com montagem pelo entregador. No catálogo, **Testar cenários de montagem** permite simular a decisão do mercado. No pedido ativo, antes da coleta, **Simular: mercado delega montagem** demonstra a transferência. Esses controles não são enviados em modo API: decisões de montagem pertencem ao mercado/backend, não ao cliente.

A cotação guarda a versão da política e o responsável original. Alterar a política invalida cotações antigas mesmo sem mudar o total. O pedido mantém sua própria atribuição; uma recusa antes da coleta atualiza o destinatário sem modificar a cotação original. O acompanhamento conserva os cinco estados oficiais e detalha quando o entregador está selecionando os produtos.

No protótipo, o bônus passa por `pending → assembling → ready → earned` e é registrado como ganho na entrega concluída. Cancelamento ou PIX expirado tornam o bônus `void`; substituições ajustam a base dos produtos. `earned` é um registro demonstrativo, não uma transferência bancária. Para operação real, o serviço de liquidação precisa confirmar o provedor e registrar o pagamento efetivo.

A taxa demonstrativa continua em R$ 2,10. Em compras acima de R$ 140,00 o bônus supera essa taxa: a diferença fica a cargo da plataforma, sem reduzir o bônus ou aumentar silenciosamente o preço ao cliente. A política comercial da taxa de produção e a reserva financeira da plataforma devem ser configuradas no backend.

## Dados e integração futura

- `src/data/catalog.json`: cadastro demonstrativo, preços em centavos, unidade, peso, ID anterior e chave da fonte consultada.
- `src/data/fixtures.ts`: fontes, montagem dos três catálogos e migração não destrutiva para `catalogVersion: 2`.
- `src/ui/productAssets.ts`: arquivos locais e organização das células. Uma API real pode continuar enviando uma URL HTTPS no campo `Product.image`.
- `src/state/ThemeProvider.tsx`: preferência em `pedeae.appearance.v1`, independente dos pedidos.
- `src/domain/rules.ts`: arredondamento inteiro e cálculo da cotação, sem somar o bônus ao total.
- `database/002_assembly_bonus.sql`: política dos mercados, cotações, atribuição e livro de repasses. Não foi aplicada a um banco real.
- `docs/API.md`: campos e responsabilidades adicionais. O app continua acessando uma API autenticada, nunca o banco diretamente.

## Referências pesquisadas

Consulta em 09/11/2026. Resultados de varejo podem estar indexados há meses; os valores não foram confirmados para um CEP em Parambu e não são cotações ao vivo. Os preços variam por região, embalagem, promoção e disponibilidade. O detalhe distingue preço pesquisado, preço convertido proporcionalmente de kg e estimativa demonstrativa; itens sem comprovação não são rotulados como preço pesquisado.

### Padrões de interação

- [Instacart — páginas de departamento](https://docs.instacart.com/storefront/pages/department_pages/): cards com informações essenciais, adição pelo controle e detalhe pelo produto. Aplicado sem copiar a identidade visual.
- [Instacart — compra e checkout](https://docs.instacart.com/storefront_pro/cart_and_checkout/cart): revisão de itens e quantidades.
- [iFood — mercado perto de mim](https://institucional.ifood.com.br/clientes/mercado-perto-de-mim/): descoberta de mercados pela localização.

### Referências de preços

| Fonte consultada                                                                                                  | Exemplos usados no protótipo                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Carrefour — alimentos básicos](https://mercado.carrefour.com.br/categoria/mercearia/alimentos-basicos)           | Arroz Tio João 5 kg R$ 31,22; feijão Kicaldo 1 kg R$ 8,49; flocão Yoki 500 g R$ 3,99                    |
| [Carrefour — café e leite](https://mercado.carrefour.com.br/colecao/20384)                                        | Pilão 500 g R$ 24,90; Italac integral 1 L R$ 5,48; Piracanjuba 1 L R$ 5,69                              |
| [Carrefour — Antarctica](https://mercado.carrefour.com.br/marca/antarctica)                                       | Guaraná 2 L R$ 8,99                                                                                     |
| [Carrefour — refrigerantes](https://mercado.carrefour.com.br/categoria/bebidas/refrigerantes/)                    | Pepsi 2 L R$ 7,99; H2OH! 500 ml R$ 4,49                                                                 |
| [Carrefour — higiene](https://mercado.carrefour.com.br/colecao/1860/)                                             | Colgate Tripla Ação 90 g R$ 6,81; fio dental 50 m R$ 19,49                                              |
| [Carrefour — Ypê](https://mercado.carrefour.com.br/marca/ype)                                                     | Água sanitária 2 L R$ 6,89; Tixan 2,2 kg R$ 23,99                                                       |
| [Carrefour — Veja](https://mercado.carrefour.com.br/marca/veja)                                                   | Multiuso 500 ml R$ 3,99; tira-limo 500 ml R$ 14,89                                                      |
| [Carrefour — hortifruti](https://mercado.carrefour.com.br/colecao/25532/score-desc/categoria/categoria/mercearia) | Banana prata R$ 10,90/kg; batata R$ 8,99/kg; cenoura R$ 5,99/kg (R$ 3,00 por 500 g após arredondamento) |
| [Carrefour — frescos](https://mercado.carrefour.com.br/colecao/28649/score-desc/0)                                | Sassami Seara 1 kg R$ 26,90                                                                             |

Os demais preços estão marcados como estimativas. O catálogo demo repete os valores nas três lojas por simplicidade e não afirma que esses estabelecimentos vendem nesses preços.

## Handoff para Figma

Usar `design/tokens.json` com dois modos de variáveis: Light e Dark. Componentes principais: BrandLogo (theme), ProductCard (available / in-cart / pending / sold-out / closed), ThemeControl (light / dark / system), AssemblyInfo (market / courier / completed / cancelled). Manter os 5 estados de tela descritos em UX-UI.md.

No protótipo, conectar `+ → alteração de quantidade na mesma tela`, `foto/nome → detalhe`, `tema → mudar modo de variáveis`, `mercado delega → atualizar AssemblyInfo`. Nenhuma transição de tema deve remontar o formulário ou apagar a feira. O estado de edição e o foco são preservados.
