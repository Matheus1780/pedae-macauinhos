# PedeAê · módulo Cliente

**O mercado na palma da mão e sua compra do mercado até você.**

Protótipo funcional em **React Native + Expo + TypeScript**, para Android, iOS e navegador. Implementa a jornada do cliente: descobrir mercados locais, montar a **Minha feira**, definir entrega, revisar custos e acompanhar pedidos.

## Novidades da versão 1.1

Logo adaptada ao claro/escuro, adição direta pelo **+**, **120 produtos diferentes (20 por categoria)** com imagens locais de IA e bônus de montagem de **1,5% dos produtos**, pago pela PedeAê ao mercado ou entregador. Consulte [as regras, fontes de preços e detalhes da atualização](docs/ATUALIZACAO-1.1.md).

## Executar

**Instalação sem terminal:** a versão web agora tem suporte a PWA para computador,
Android e iPhone/iPad, quando publicada em HTTPS. Veja o [guia de instalação](docs/INSTALAR.md).
O aplicativo pode ser aberto por um ícone. O ZIP é o código-fonte; o Drive não executa o app.

Requisitos: Node.js 22.13+ e npm. Use a versão do Expo Go compatível com SDK 54 ou um development build. iOS local requer macOS/Xcode; Android local requer Android Studio.

```sh
npm ci
npm run web
# ou
npm start
npm run android
npm run ios
```

**No Windows:** depois de extrair o projeto, dê dois cliques em `CRIAR-ATALHO-WINDOWS.cmd` **uma única vez**. Nas próximas vezes, abra **PedeAe (teste)** pela Área de Trabalho. Mantenha a pasta do projeto no mesmo local. Você também pode abrir diretamente por `INICIAR-WINDOWS.cmd`.

O iniciador instala os componentes na primeira abertura e reutiliza a instalação nas seguintes. Ele reinstala se os arquivos de dependências, a versão do Node ou a instalação mudarem. Você pode minimizar a janela de comandos enquanto usa o app. Fechar essa janela encerra o servidor local. O VS Code não precisa estar aberto.

Não é necessário configurar conta de banco, API ou pagamentos para testar. O padrão é `demo`. Copie `.env.example` para `.env` apenas quando quiser configurar o adaptador HTTP.

### Testar a jornada

1. Pular ou concluir a apresentação e escolher **Parambu, CE**.
2. Abrir **Mercado Bom Preço**, adicionar produtos até o mínimo de R$ 20,00 e abrir **Minha feira**.
3. Entrar com nome e telefone **fictícios**. O código de demonstração é **123456**. Nenhum SMS/WhatsApp é enviado.
4. Cadastrar um endereço fictício em Parambu, escolher moto/carro e revisar o total.
5. Confirmar com PIX e tocar em **Simular pagamento aprovado**, ou escolher pagamento na entrega.
6. Avançar pelos cinco estados com os **Controles da demonstração**. Durante a preparação é possível simular uma sugestão de substituição.
7. Conversar no chat local, concluir a entrega, consultar o histórico e usar **Repetir Feira**.

Cartões de teste usam apenas bandeira e quatro últimos dígitos fictícios. Não digite PAN, CVV, dados financeiros ou dados pessoais reais. Sair da conta apaga os dados privados da demonstração neste dispositivo.

## O que está implementado

- 26 rotas funcionais mais estados de OTP, modais de confirmação e zoom de produto.
- Design system com cores, tipografia, cartões, botões, inputs, badges, steppers, estados vazios e feedback háptico nativo.
- Onboarding, localização manual/GPS com permissão, login por OTP demonstrativo, recuperação de acesso demonstrativa e verificação biométrica local quando suportada.
- Home, categorias, busca por produto/mercado, histórico de busca, filtros de mercados, catálogo e detalhes com observações.
- Minha feira de um mercado, quantidades, remoção por swipe/botão, desfazer, mínimo, peso e autorização de contato.
- CRUD de endereços, moto/carro com limite de peso, revisão de taxas, PIX demonstrativo com QR dinâmico não pagável, cartões fictícios, dinheiro/troco e maquininha.
- Pedido, cinco estados oficiais, mapa ilustrativo identificado, chat local, histórico, repetição, substituições, cancelamento antes da preparação e privacidade.
- Persistência local serializada; valores em centavos; validação de estoque; validade de cotação; reserva/liberação de estoque demo; idempotência persistida.
- Adaptador HTTP, contrato de backend e esquema PostgreSQL para conexão futura.

## Limites explícitos da versão

Este é um protótipo executável, **não um marketplace pronto para operar pagamentos e entregas reais**. O backend e o banco externo serão conectados em etapa posterior.

| Recurso                    | Estado atual                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Banco                      | Dados locais via AsyncStorage. Migração PostgreSQL preparada, não aplicada.                                                           |
| Google/Apple               | Opções identificadas como integração pendente; não há OAuth configurado.                                                              |
| SMS/WhatsApp e recuperação | Fluxo demonstrativo, sem envio real. A conta por OTP não possui senha.                                                                |
| Biometria                  | Verificação pelo dispositivo; não cria uma sessão autenticada no servidor.                                                            |
| PIX/cartões/estorno        | Simulados; nenhuma cobrança. QR demo não representa PIX válido.                                                                       |
| Rastreamento               | Cinco estados funcionais e rota ilustrativa; GPS do entregador e mapas reais pendentes.                                               |
| Chat, suporte e push       | Chat local e caixa de eventos; nenhum atendimento, chamada ou push real enviado.                                                      |
| Figma                      | Especificação e tokens entregues; arquivo Figma editável ainda não criado.                                                            |
| Plataformas                | TypeScript e exportações verificáveis. Teste visual automatizado no Chromium; validação em dispositivos iOS/Android ainda necessária. |

## Conectar um banco depois

O ponto de troca está em `src/data/index.ts`. As telas dependem da interface `Repository`, não de um banco específico.

```env
EXPO_PUBLIC_DATA_MODE=api
EXPO_PUBLIC_API_URL=https://seu-backend.example/v1
```

Essas variáveis só devem ser usadas **depois de implementar e configurar a API**. A documentação [Banco de dados](database/README.md) e o [contrato HTTP](docs/API.md) descrevem a conexão. Recomenda-se PostgreSQL/Supabase atrás de backend autenticado. Senhas de banco, chaves administrativas e segredos do PSP ficam exclusivamente no servidor.

## Documentação para desenvolvimento e Figma

- [Especificação completa das telas e estados](docs/UX-UI.md)
- [Arquitetura e decisões](docs/ARCHITECTURE.md)
- [API e responsabilidades do servidor](docs/API.md)
- [Modelo PostgreSQL e integração futura](database/README.md)
- [Migração SQL inicial](database/001_initial.sql)
- [Tokens do design system](design/tokens.json)
- [Validação e roteiro de testes](docs/VALIDATION.md)

## Verificação

```sh
npm run check       # TypeScript + testes de domínio e adaptador
npm run export:web  # build estático em dist/
npm run format
```

O teste de navegação usa Python + Playwright/Chromium e requer o servidor web já iniciado:

```sh
pip install playwright
CHROMIUM_PATH=/caminho/para/chromium python tests/e2e_flow.py
```

`BASE_URL` muda o endereço do servidor e `ARTIFACT_DIR` muda o diretório das capturas. O teste usa somente dados fictícios.

## Estrutura

```text
app/                 Rotas Expo Router e navegação por abas
src/features/        Telas por domínio funcional
src/ui/              Componentes, tokens e háptica
src/state/           Estado da aplicação, carregamento e feedback
src/domain/          Entidades e regras independentes da interface
src/data/            Contratos, repositório demo e adaptador HTTP
database/            Migração PostgreSQL e guia de conexão
design/              Tokens para o handoff do Figma
docs/                Especificação visual, arquitetura, API e validação
tests/               Regras de negócio, transporte e jornada no navegador
```

As 120 imagens de produtos são ilustrações realistas geradas por IA e incluídas no projeto; fotos de capa dos mercados vêm do Unsplash. Os estabelecimentos são demonstrativos. Parte dos preços vem de referências de varejo pesquisadas, com fonte no detalhe; os demais estão explicitamente marcados como estimativas. As referências fornecidas orientaram a linguagem visual; as telas de ganhos e oportunidades do entregador estão fora do módulo Cliente.

## Atualizar a cópia do computador

Se baixou um ZIP do GitHub, essa pasta não se atualiza sozinha: baixe o ZIP atualizado e extraia em uma **nova pasta**, preservando a anterior e qualquer arquivo `.env` próprio. Abra a nova pasta no VS Code ou execute `INICIAR-WINDOWS.cmd`.

Se clonou com Git/GitHub Desktop, use **Pull origin** no GitHub Desktop (ou `git pull` no terminal da pasta, depois de salvar suas alterações). Em seguida execute `npm ci` e `npm run web`. Não é preciso baixar o projeto inteiro novamente com Git.

Os dados do protótipo ficam no navegador/dispositivo. A migração mantém os pedidos antigos e atualiza o catálogo ao abrir a nova versão no mesmo endereço de acesso.
