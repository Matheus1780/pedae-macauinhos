# PedeAê · especificação visual e funcional do Cliente

## 1. Escopo e decisões de produto

Esta especificação orienta Figma, React Native e uma futura implementação Flutter. O código entregue é o protótipo React Native/Expo, com operações locais de demonstração. As dependências reais estão identificadas em cada fluxo e no README; telas demonstrativas não comprovam que um serviço externo está integrado.

- Marca: **PedeAê**. Slogan: **O mercado na palma da mão e sua compra do mercado até você**.
- “Minha Compra” é o conceito de jornada. **Minha feira** é o nome consistente de tela/aba; CTA de produto: **Adicionar à Minha Feira**. Não usar “Carrinho” na interface.
- Cidade de referência: Parambu, CE. Cada feira contém produtos de **um único mercado**.
- Taxas, avaliações, capacidades, estoque e tempos presentes no protótipo são fixtures, não decisões comerciais aprovadas.
- Status oficiais: **Pedido Enviado → Mercado Preparando → Pedido com Entregador → A Caminho → Entregue**. Cancelamento, pagamento pendente e incidentes são informações paralelas.
- Os exemplos de ganhos e oportunidades pertencem ao entregador e servem somente como referência visual. Não inserir esses módulos na navegação do cliente.

## 2. Design system e regras comuns

### Grid e hierarquia

Frame de referência: **390 × 844**, com validação também em 360 × 800, 320 px de largura e fonte ampliada. Safe areas seguem o sistema; a barra de status não deve ser desenhada como parte do aplicativo.

- Margem externa: **20**; espaçamento entre blocos: **16**; padding de cards: **16**; gaps internos: **8–12**.
- Topo de tela interna: voltar com alvo **48 × 48**, título 20/28, subtítulo opcional 13/20. Altura adaptável, sem corte de texto.
- Corpo: rolagem vertical; teclado não deve encobrir campos e botões. Largura máxima de conteúdo no web: **900**, centralizada.
- Rodapé transacional: padding **16**, CTA com altura mínima **54**, safe area inferior. Total financeiro fica acima do CTA.
- Abas: Início, Pedidos, Minha feira e Perfil. Contador da feira = soma das quantidades, não número de linhas.
- Produtos: duas colunas no celular, gap 12; card de referência com 276 de altura. Em fonte ampliada, aumentar altura/reorganizar para evitar truncar preço e ações. Essa validação final em dispositivos é pendente.
- Categorias: grade de três colunas. A categoria selecionada deve ter texto e estado semântico, além da cor.
- Dialog: largura máxima 460, margem externa 24, padding 24, raio 24. Conter foco e permitir retorno/cancelamento.

### Tokens

| Token      | Valor     | Uso                                  |
| ---------- | --------- | ------------------------------------ |
| primary    | `#087F3D` | CTA, seleção, preço e ação principal |
| pressed    | `#06632F` | Estado pressionado/ênfase            |
| ink        | `#18251D` | Texto principal                      |
| muted      | `#536259` | Texto de apoio                       |
| background | `#F7F9F5` | Fundo geral                          |
| surface    | `#FFFFFF` | Cards e campos                       |
| line       | `#E3E9E1` | Divisórias e bordas decorativas      |
| soft       | `#EAF4E9` | Superfície de seleção e informação   |
| lime       | `#D9F49A` | Destaque no banner escuro            |
| error      | `#B42318` | Erro acompanhado de mensagem         |
| warning    | `#8A4B08` | Avisos, pendências e modo demo       |

Contraste calculado sobre branco: primary **5,11:1**, ink **15,89:1**, muted **6,44:1**, error **6,57:1**. Esses valores não substituem auditoria das combinações finais, foco, controles desabilitados e imagens. Bordas claras são decorativas; a identificação de campos depende também do rótulo.

Tipografia do sistema: hero **32/38, 800**; título **24/32, 700**; seção **21/28, 700**; corpo **16/24, 400**; rótulo **15/22, 600**; apoio **13/20**. Número monetário principal: 24–28, peso 800. Ícones Ionicons, normalmente 22–24; nunca substituir texto essencial apenas por ícone.

Componentes de referência: `Button`, `IconButton`, `Field`, `Card`, `Badge`, `Choice`, `Stepper`, `Toggle`, `Banner`, `Empty`, `Skeleton`, `Confirm`, `ProductImage`, `Row`, `Heading`, `Screen`. Variantes e nomenclatura ficam em `design/tokens.json` e `src/ui`.

### Estados e feedback compartilhados

- **Padrão:** informação verdadeira da fonte atual, campos editáveis e CTA contextual.
- **Carregando:** skeleton para conteúdo desconhecido; spinner no botão durante uma ação. Preservar texto e largura do CTA. Não mostrar spinner artificial em conteúdo estático.
- **Vazio:** explicar o motivo e oferecer um próximo passo; zero produtos, nenhuma cobertura e nenhum resultado são mensagens diferentes.
- **Erro:** campo inválido recebe mensagem junto ao campo; erro de página recebe banner com repetição; erro de checkout permanece na tela. Toast não deve ser o único aviso sobre dinheiro ou perda de dados.
- **Sucesso:** transição, atualização do resumo ou confirmação do servidor. “Copiado”, “enviado”, “autorizado” e “pago” são confirmações distintas.
- Háptica nativa: seleção leve; sucesso de ação confirmado pelo repositório; erro moderado. Respeitar preferências do sistema. Web mantém resposta visual e semântica.
- Movimento: referência 140 ms para press/seleção, 220 ms para mudanças locais; stack nativo lateral. Redução de movimento deve eliminar movimentos dispensáveis. O protótipo não implementa toda a coreografia avançada descrita para produção.
- Ações com swipe também têm botão acessível. Imagem com falha tem fallback. Teclado, VoiceOver/TalkBack, foco e texto a 200% precisam ser auditados antes do lançamento.

## 3. Onboarding e acesso

### T01 · Boas-vindas — `/onboarding`

1. **UI:** marca, ilustração local por slide, título, texto curto, três indicadores, Continuar/Iniciar e Pular apresentação.
2. **Hierarquia:** marca no topo do corpo; ilustração de 260 de altura; título e texto abaixo; indicadores; slogan. Rodapé fixo com CTA e ação secundária.
3. **Estados:** padrão no primeiro slide; carregamento não se aplica a conteúdo local; vazio usa ilustração vetorial/ícone; erro de mídia mantém texto; sucesso conclui apresentação e abre localização.
4. **Interação:** swipe horizontal ou toque nos indicadores; Continuar avança; Iniciar/Pular abre localização. Onboarding é considerado concluído quando a cidade é confirmada.
5. **Feedback:** indicador selecionado muda de largura; toque no CTA tem háptica leve; transição lateral. Não depender da animação para explicar a proposta.

### T02 · Localização inicial — `/location`

1. **UI:** ícone de localização, explicação, Usar minha localização, campo Cidade e estado, banner de cobertura e Explorar mercados.
2. **Hierarquia:** header/voltar; apresentação; ação de GPS; campo manual; avisos; CTA fixo inferior. Nenhum login obrigatório.
3. **Estados:** padrão com cidade salva ou Parambu sugerida; carregando somente a ação GPS; vazio pede cidade; erro de permissão/geocodificação preserva entrada manual; sucesso persiste cidade e abre Home.
4. **Interação:** solicitar permissão apenas após toque. GPS nativo resolve cidade; web solicita confirmação manual da cidade após obter coordenadas. Cidade fora da área mantém Home com estado sem cobertura.
5. **Feedback:** spinner no botão GPS, texto contextual no retorno; confirmação visual da cidade antes da navegação. Não interpretar permissão de GPS como consentimento de marketing.

### T03 · Entrada e cadastro — `/login`, primeira etapa

1. **UI:** nome, telefone com DDD, opções SMS/WhatsApp, Receber código, Google/Apple identificados como pendentes, Recuperar acesso.
2. **Hierarquia:** marca e objetivo acima do formulário; canais abaixo dos campos; CTA principal; métodos alternativos e recuperação no fim.
3. **Estados:** padrão com formulário vazio; carregando ao solicitar OTP; vazio exige nome/telefone; erro de formato aparece junto ao fluxo; sucesso abre a etapa do código sem perder os dados.
4. **Interação:** teclado telefônico, remoção de caracteres não numéricos para validação; nome mínimo de dois caracteres; DDD e telefone com 10–11 dígitos. Cadastro por telefone cria perfil após verificar OTP. E-mail opcional é editado em Meus dados.
5. **Feedback:** CTA habilita quando o formulário tem condição mínima; spinner bloqueia reenvio simultâneo; transição para OTP e confirmação sem anunciar envio real no modo demo.

**Limite:** Google e Apple não autenticam nesta entrega. A integração requer clientes OAuth, redirect URIs e validação de tokens no backend. Não há senha criada para a conta por OTP.

### T04 · Verificação OTP — `/login`, segunda etapa

1. **UI:** destino mascarado, input único de seis dígitos com autofill, Validar código e entrar, cronômetro, Reenviar e Alterar telefone.
2. **Hierarquia:** destino acima do campo; erro imediatamente abaixo da etapa; ação principal e reenvio separados, com alvo mínimo de toque.
3. **Estados:** padrão aguardando código; carregando validação; vazio mantém CTA desabilitado; erro distingue inválido/expirado/limite; sucesso recebe perfil e retoma a tela anterior.
4. **Interação:** permitir colar seis dígitos; demo aceita 123456. Validade de cinco minutos, reenvio após 60 s, cinco tentativas. Servidor deve controlar relógio e tentativas em produção; reenvio invalida desafio anterior.
5. **Feedback:** erro mantém o campo disponível para correção; sucesso emite háptica e “Conta pronta”. Código e telefone completo nunca entram em analytics.

### T05 · Biometria — `/biometrics`

1. **UI:** ícone de digital, explicação, verificação de disponibilidade e botão de autenticação do sistema.
2. **Hierarquia:** título; explicação da finalidade; ação central. Se deslogado, CTA Entrar primeiro.
3. **Estados:** padrão verifica hardware/cadastro; carregando prompt do sistema; vazio/sem hardware explica indisponibilidade; erro/cancelamento preserva login por código; sucesso confirma apenas verificação local.
4. **Interação:** usar Face ID/Touch ID/BiometricPrompt via Expo; não coletar biometria. Face ID precisa de build nativo com permissão. Na arquitetura real, revalidar sessão no servidor após desbloquear credencial local.
5. **Feedback:** prompt e confirmação nativos; sucesso textual adicional. Não afirmar que biometria cadastrou ou autenticou uma conta remota.

### T06 · Recuperação — `/recover`

1. **UI:** telefone/e-mail, Solicitar recuperação, cronômetro de reenvio e retorno à entrada por código.
2. **Hierarquia:** explicação do acesso sem senha; campo; banner de resultado; ação e alternativa.
3. **Estados:** padrão aguardando identificador; carregando solicitação; vazio bloqueia envio; erro permite corrigir/repetir; sucesso usa mensagem genérica, sem revelar existência da conta.
4. **Interação:** conta por OTP recupera acesso solicitando novo código. O demo não envia mensagens. Se uma versão futura incluir e-mail/senha, implementar token curto e único, tela Nova senha/Confirmar senha, política de senha e revogação de sessões no provedor. Isso não está implementado como autenticação por senha neste protótipo.
5. **Feedback:** banner persistente, cronômetro de 60 s e retorno previsível. Sem confete ou declaração de troca de senha não realizada.

## 4. Descoberta

### T07 · Home — `/(tabs)`

1. **UI:** marca, seletor de cidade, sino, busca global, dois banners navegáveis, seis categorias, cards de mercados e abas.
2. **Hierarquia:** localização/sino/busca fixos; conteúdo rolável com banner → categorias → mercados → informação de cuidado; abas fixas inferiores.
3. **Estados:** padrão por cidade; skeleton na carga inicial; vazio quando não existe cobertura; erro global oferece tentar novamente; sucesso exibe catálogo atual e mantém seleção de cidade.
4. **Interação:** tocar localização abre seletor; sino abre notificações; busca abre busca global; categoria filtra resultados; banner e “Ver todos” abrem mercados; pull-to-refresh atualiza o snapshot.
5. **Feedback:** categoria/banner selecionado tem destaque; navegação responde ao toque; atualização não apresenta preço antigo como recém-confirmado. Autoplay não é necessário para compreender promoções.

### T08 · Busca inteligente — `/search`

1. **UI:** input com foco, histórico recente, limpar histórico, sugestões por categoria, mercados encontrados e grade de produtos.
2. **Hierarquia:** header; campo; histórico/sugestões quando vazio ou resultados quando há termo. Produto abre detalhe com mercado explicitado.
3. **Estados:** padrão sem termo exibe histórico; carregando em busca remota usa skeleton; vazio de histórico e nenhum resultado têm mensagens distintas; erro de consulta mantém termo; sucesso atualiza resultados.
4. **Interação:** debounce de 300 ms; comparação sem diferença de acento/caixa; Enter salva termo, máximo de oito recentes; toque em histórico repete busca. O filtro local funciona como sugestões por prefixo/termo; ranking remoto e autocomplete especializado dependem da API.
5. **Feedback:** resultado muda sem deslocar o campo; não vibrar a cada letra; seleção confirma a navegação. Campo e resultado precisam de foco semântico.

### T09 · Mercados — `/markets`

1. **UI:** filtros Próximos/Abertos/Bem avaliados; card com imagem, nome, distância, prazo, avaliação, bairro, status e seta.
2. **Hierarquia:** header com cidade; filtros horizontais; lista vertical. Card de largura total, imagem 84 × 84, informações ao lado.
3. **Estados:** padrão ordenado por proximidade; skeleton em carga; vazio sem cobertura ou filtro sem resultados; erro mantém filtros e oferece atualização; sucesso ordena e abre o mercado selecionado.
4. **Interação:** filtros locais não apagam a cidade; mercado fechado permite consultar catálogo mas não adicionar/confirmar pedido. Distâncias e avaliações do demo são fictícias.
5. **Feedback:** filtro selecionado tem superfície verde e semântica de seleção no handoff; card responde ao toque sem movimentação excessiva.

### T10 · Notificações — `/notifications`

1. **UI:** lista de eventos com ícone, título, mercado, data/hora e entrada para o pedido.
2. **Hierarquia:** header; eventos do mais recente ao antigo. Corpo rolável, sem ação financeira no rodapé.
3. **Estados:** padrão com eventos; skeleton em carga; vazio “Tudo em dia por aqui”; erro permite refresh; sucesso abre o pedido referente ao evento.
4. **Interação:** tocar a notificação abre apenas recurso autorizado. Demo deriva eventos do histórico; push, leitura/não leitura e preferências granulares ficam para integração do serviço.
5. **Feedback:** evento textual acessível; atualizações relevantes devem anunciar-se sem deslocar foco. Não apresentar notificações fictícias como recebidas de terceiros.

## 5. Catálogo e composição da feira

### T11 · Catálogo do mercado — `/market/[id]`

1. **UI:** capa, nome, avaliação, distância, prazo, badge aberto/fechado, mínimo, busca interna, categorias horizontais e ProductCard.
2. **Hierarquia:** header; capa de 150; metadados; campo; abas de categoria; grade de duas colunas; CTA Ver Minha feira fixo quando houver itens.
3. **Estados:** padrão Todos; skeleton de produtos; vazio de busca/categoria; erro de mercado removido ou consulta; sucesso apresenta produtos atualizados. Esgotado é badge informativo, nunca um toggle editável pelo cliente.
4. **Interação:** busca é restrita ao mercado; categorias filtram; card abre detalhe; CTA inferior abre a feira sem alterá-la. Mercado fechado continua consultável.
5. **Feedback:** seleção da categoria altera cor/texto; erro não remove os itens da feira; toque em produto mantém contexto do mercado na volta.

### T12 · Produto — `/product/[id]`

1. **UI:** imagem 250, disponibilidade, mercado, nome, unidade, preço, descrição, Stepper, observação com contador 240 e CTA com total.
2. **Hierarquia:** imagem no início; identificação/preço; descrição; quantidade; observação. Rodapé fixo com **Adicionar à Minha Feira · R$ X**.
3. **Estados:** padrão quantidade 1; imagem com fallback/carga; vazio quando produto não existe; erro de estoque/mercado mantém seleção; sucesso confirma inclusão e retorna ao catálogo.
4. **Interação:** quantidade 1–99 limitada por estoque; preço do CTA = unidade × quantidade; observação vinculada ao item. Toque em imagem abre zoom. Outro mercado exige confirmação separada.
5. **Feedback:** Stepper com háptica leve; inclusão confirmada recebe toast e háptica de sucesso. Não vibrar sucesso antes de persistir/receber confirmação.

### T13 · Imagem ampliada — modal do produto

1. **UI:** imagem/ilustração, Fechar imagem e aviso de imagem ilustrativa.
2. **Hierarquia:** modal em tela cheia; fechamento no topo; imagem central em área de zoom; aviso no fim.
3. **Estados:** padrão imagem atual; carregando conserva placeholder; vazio/falha usa fallback; erro não impede fechar; sucesso retorna ao mesmo produto e mantém quantidade/observação.
4. **Interação:** pinça nativa no iOS; imagem ampliada também no Android/web. Zoom por gesto multiplataforma avançado ainda precisa de implementação específica. Back fecha o modal antes de sair do detalhe.
5. **Feedback:** transição fade; sem vibração para cada gesto; retorno de foco ao acionador no handoff de acessibilidade.

### T14 · Minha feira — `/(tabs)/feira`

1. **UI:** mercado, unidades/peso, linhas com foto, unidade, preço, observação, quantidade, remoção, desfazer; adicionar mais; toggle de contato; progresso de mínimo; subtotal.
2. **Hierarquia:** header fixo; lista vertical; preferência e mínimo ao fim; rodapé fixo com subtotal/Continuar para entrega; abas abaixo.
3. **Estados:** padrão itens atuais; carregando bloqueia mutação pendente sem zerar totais; vazio convida a explorar; erro de estoque/persistência mantém dados anteriores; sucesso reflete nova quantidade/remoção e subtotal.
4. **Interação:** +/- atualiza preço; zero remove; swipe para esquerda acima de 75 px ou botão remover; desfazer recoloca o item se ainda disponível. Mínimo é calculado só sobre produtos, sem somar taxas. Login exigido ao avançar.
5. **Feedback:** item acompanha swipe e retorna se não completar; confirmação e opção de desfazer após remover; subtotal atualiza sem animação que dificulte leitura.

### T15 · Trocar de mercado — dialog

1. **UI:** título, explicação de mercado único, Trocar de mercado e Voltar.
2. **Hierarquia:** modal central com mensagem antes da ação; fundo protegido contra toque acidental.
3. **Estados:** padrão sem mutação; carregando confirmação bloqueia repetição; vazio não se aplica; erro preserva feira antiga; sucesso substitui feira pelo item solicitado.
4. **Interação:** só `switchMarket=true` autoriza retirar itens anteriores. Cancelar fecha sem alterar nada. Navegar no catálogo de outro mercado sozinho não apaga a feira.
5. **Feedback:** sucesso somente depois da troca persistida; mensagem explícita evita surpresa. Não usar swipe para confirmar uma perda de seleção.

### T16 · Sugestão de substituição — card em `/order/[id]`

1. **UI:** item indisponível, alternativa com nome/unidade/quantidade/preço, Aceitar substituição, Retirar o item, efeito financeiro.
2. **Hierarquia:** card destacado entre o acompanhamento e o resumo. No design de produção, exibir comparação original/alternativa em duas linhas.
3. **Estados:** padrão sugestão pendente; carregando resposta; vazio sem sugestões não ocupa espaço; erro se sugestão expirou/estoque mudou; sucesso aplica uma decisão única e recalcula subtotal/total.
4. **Interação:** permitido durante preparação e com contato autorizado; não autoriza troca automática. Primeira política: valor igual ou menor. Recusar retira o original; decisão repetida é rejeitada. Em produção, mostrar estorno/ajuste pendente separadamente.
5. **Feedback:** confirmação por texto e háptica; preço antigo/novo deve ficar evidente. O demo sinaliza que o ajuste financeiro é simulado.

## 6. Entrega e checkout

### T17 · Endereços — `/addresses`

1. **UI:** cards Casa/Trabalho, rua/número/bairro/cidade, Adicionar, Editar, Remover e Entregar aqui no modo seleção.
2. **Hierarquia:** header; adicionar no topo; lista; ação de escolha em cada endereço. Mesmo componente serve ao Perfil e ao checkout.
3. **Estados:** padrão lista salva; carregando carga; vazio pede primeiro endereço; erro de conta/conexão preserva formulário; sucesso seleciona endereço ou atualiza lista.
4. **Interação:** requer conta; escolher volta à entrega com `addressId`; editar não modifica o snapshot de pedidos anteriores; excluir não cancela pedidos já criados.
5. **Feedback:** endereço salvo recebe confirmação; seleção deve distinguir nome e endereço completo. No modo real, falha em salvar não encerra a edição.

### T18 · Criar/editar endereço — `/address/new`

1. **UI:** nome, CEP, rua, número, bairro, cidade, UF, complemento e instruções de até 240 caracteres.
2. **Hierarquia:** campos empilhados com labels persistentes; instruções ao fim; Salvar fixo acima da safe area/teclado.
3. **Estados:** padrão com Parambu/CE sugeridos ou valores existentes; carregando gravação; vazio mantém obrigatórios identificáveis; erro indica validação e não apaga campos; sucesso retorna à lista.
4. **Interação:** CEP de oito dígitos; número aceita S/N; UF duas letras; endereço completo validado antes do checkout. Busca de CEP, geocodificação de endereço e ajuste de pin são integrações futuras, não resultados simulados.
5. **Feedback:** campo inválido recebe foco/mensagem no design final; gravação concluída anuncia Endereço salvo. Nenhuma confirmação de cobertura antes da cotação.

### T19 · Logística — `/delivery`

1. **UI:** endereço, alterar/adicionar, instruções salvas, peso estimado, opções Moto/Carro, parcelas financeiras e Revisar e pagar.
2. **Hierarquia:** endereço primeiro; modalidades em cards verticais com rádio; cotação abaixo; CTA fixo inferior.
3. **Estados:** padrão modalidade moto; carregando cotação limpa os valores anteriores; vazio sem endereço ou feira; erro de cobertura/mínimo/capacidade bloqueia avanço; sucesso exibe cotação válida.
4. **Interação:** trocar endereço/modalidade refaz cotação. Fixtures: moto até 15 kg, carro até 80 kg. Não desabilitar carro porque o peso é baixo; o motivo deve refletir disponibilidade/capacidade verdadeira. Operação real também considera volume, distância e frota.
5. **Feedback:** borda, ícone de rádio e descrição confirmam seleção; valores aparecem juntos após cotação. Mudança de taxa nunca deve ficar escondida.

### T20 · Revisão final — `/checkout`

1. **UI:** endereço/instruções, mercado e itens, pagamento, subtotal, entrega, Taxa PedeAê, total consolidado e Confirmar pedido com valor.
2. **Hierarquia:** dados de entrega; resumo dos produtos; bloco financeiro com quatro linhas; forma de pagamento; CTA fixo. O total é a informação de maior contraste no bloco financeiro.
3. **Estados:** padrão cotação atual; carregando cotação/envio; vazio sem endereço/feira; erro persistente de preço/estoque/expiração/pagamento; sucesso abre PIX pendente ou acompanhamento confirmado.
4. **Interação:** revalidar cotação antes de criar pedido; validade demo de cinco minutos; duplo toque protegido por lock e idempotência persistida. Recalcular exige nova revisão do valor. Dinheiro com troco inferior ao total é inválido.
5. **Feedback:** botão mantém largura ao carregar; vibração/confirmação apenas depois da resposta. Timeout não prova falha: produção deve reconciliar a tentativa sem gerar cobrança duplicada.

Exemplo demonstrativo: produtos R$ 31,54 + entrega R$ 12,90 + Taxa PedeAê R$ 2,10 = **R$ 46,54**. Esses números ilustram a fórmula; o código usa outras taxas fictícias de entrega. Não apresentar R$ 15,00 como total desse pedido.

### T21 · Forma de pagamento — `/payment`

1. **UI:** PIX, crédito, débito, maquininha na entrega, dinheiro, seleção de cartão mascarado e campo de troco.
2. **Hierarquia:** opções em grupo de rádio vertical; detalhes da opção aparecem junto dela; confirmar escolha no rodapé.
3. **Estados:** padrão PIX ou escolha anterior; carregando métodos reais deve usar skeleton; vazio de cartões oferece gestão; erro de cartão ausente/troco impede finalização; sucesso retorna ao checkout sem cobrar.
4. **Interação:** escolher pagamento não cria pedido. Débito online só deve aparecer como disponível quando suportado pelo PSP; disponibilidade por mercado deve vir da API. Na demo, todos são explicitamente simulados.
5. **Feedback:** rádio e descrição evidenciam escolha; total permanece para conferência no checkout. Nenhuma animação de pagamento aprovado nesta tela.

### T22 · Cartões — `/cards`

1. **UI:** bandeira, últimos quatro dígitos, remover e formulário de cartão fictício no demo.
2. **Hierarquia:** cartões existentes primeiro; explicação de segurança; formulário por último. Nunca renderizar campo de CVV no formulário demo.
3. **Estados:** padrão lista; carregando tokenização deve pertencer ao SDK real; vazio convida a adicionar; erro mantém lista anterior; sucesso inclui referência mascarada.
4. **Interação:** demo aceita somente bandeira e quatro dígitos. Produção requer SDK/checkout hospedado do PSP e token; remoção deve invalidar seleção do checkout. PAN/CVV não passam pelo repositório do app.
5. **Feedback:** cartão adicionado anunciado; nunca exibir o número completo na confirmação. Falha do PSP deve oferecer outro método.

### T23 · PIX — `/pix/[id]`

1. **UI:** total, QR dinâmico, Copiar código, validade mm:ss, status e retorno ao pedido. Demo inclui Simular pagamento aprovado.
2. **Hierarquia:** total no topo; aviso; QR central de 220 × 220 sobre branco; validade; copiar; status e ações.
3. **Estados:** padrão aguardando pagamento; carregando geração/consulta; vazio sem código apresenta aviso; erro/expiração bloqueia reutilização; sucesso ocorre por confirmação do provedor, ou por botão explicitamente simulado no demo.
4. **Interação:** copia e cola via clipboard; copiar não marca pago. QR demo codifica texto “NÃO PAGAR”, não um payload financeiro. Modo API recebe `pixCopyPaste` e consulta snapshot a cada 10 s enquanto a tela está aberta. Produção precisa de webhook e reconciliação de pagamento tardio.
5. **Feedback:** Copiado é confirmação de clipboard; pagamento confirmado abre acompanhamento. Expiração informa como iniciar outra compra sem cobrar duas vezes.

## 7. Pedido, comunicação e conta

### T24 · Confirmação — `/order/[id]?received=1`

1. **UI:** Pedido recebido, identificador, primeira etapa oficial, resumo financeiro/endereço e próximas ações.
2. **Hierarquia:** confirmação no header; status em destaque; linha do tempo; resumo; suporte. PIX ainda pendente aparece com mensagem própria, sem confirmação operacional.
3. **Estados:** padrão pedido aceito; carregando consulta quando resposta é incerta; vazio/ID inexistente retorna ao histórico; erro mantém tentativa reconciliável; sucesso exibe identificador estável.
4. **Interação:** não recriar pedido ao voltar/recarregar; abrir detalhes, chat e suporte. Pagamento na entrega aceita o pedido com estado financeiro pendente de recebimento.
5. **Feedback:** check/háptica de sucesso uma vez por confirmação, sem confete obrigatório. Respeitar redução de movimento.

### T25 · Acompanhamento — `/order/[id]`

1. **UI:** cinco etapas, horários, estimativa, mapa após coleta, endereço, resumo, contato e suporte; incidentes fora da linha oficial.
2. **Hierarquia:** status atual; mapa quando aplicável; timeline vertical legível; previsão; substituições; detalhes. Controles de avançar existem exclusivamente no modo demo.
3. **Estados:** padrão sincronizado; carregando preserva último estado com indicação de atualização; vazio sem entregador não inventa pin; erro de rede/localização mantém status conhecido e aviso de desatualização; sucesso registra Entregue e oferece histórico/repetição.
4. **Interação:** real-time futuro recebe eventos com sequência e descarta duplicados/antigos; polling do snapshot é fallback. Demo avança manualmente. Exibir localização só depois da coleta e enquanto ativa; mapa desta entrega é explicitamente ilustrativo, sem GPS ao vivo.
5. **Feedback:** mudança de etapa destaca texto e check; não anunciar localização a cada segundo. Entrega concluída deve vir da operação, nunca do relógio ou de animação de rota.

### T26 · Chat — `/chat/[id]`

1. **UI:** título do mercado, balões por remetente, horário, campo de 1–1.000 caracteres e Enviar.
2. **Hierarquia:** header fixo; conversa rolável; compositor fixo protegido do teclado. No demo, banner informa que mensagens não são transmitidas.
3. **Estados:** padrão conversa; carregando envio mantém texto; vazio convida à primeira mensagem; erro mantém conteúdo para tentar novamente; sucesso limpa campo depois da persistência/aceite.
4. **Interação:** chat vinculado ao pedido; envio vazio bloqueado; pedido cancelado encaminha ao suporte. Produção precisa de IDs de mensagem, deduplicação, paginação e status enviado/recebido/lido.
5. **Feedback:** mensagem aparece com horário e “Salva localmente” no demo. Não exibir “Lida” sem confirmação real do destinatário.

### T27 · Suporte — `/support`

1. **UI:** assuntos de ajuda, contexto do pedido, descrição do próximo passo, abrir conversa e indicação de ligação ainda não configurada.
2. **Hierarquia:** apresentação; lista de assuntos; detalhe escolhido; ações de atendimento; orientação de emergência.
3. **Estados:** padrão assuntos; carregando abertura de chamado pertence à futura API; vazio sem pedido oferece ajuda geral; erro de atendimento oferece alternativa configurada; sucesso real deve apresentar protocolo, não apenas fechar a tela.
4. **Interação:** protótipo não abre chamado nem disca número fictício. Operação real usa telefone protegido/chamada interna com permissão e disponibilidade. Atendimento de pedido não substitui serviço público de emergência.
5. **Feedback:** assunto selecionado revela orientação; protocolo e confirmação de envio só depois de resposta do suporte. Não anunciar atendimento humano quando ele não existe.

### T28 · Perfil — `/(tabs)/profile`

1. **UI:** avatar com inicial, saudação, Meus dados, Endereços, Cartões, Biometria, Ajuda, Privacidade e Sair.
2. **Hierarquia:** identificação acima dos atalhos; lista de navegação; Sair no fim; versão discreta. Abas inferiores persistentes.
3. **Estados:** padrão conta identificada; carregando dados; vazio de sessão apresenta Entrar; erro oferece atualização sem revelar dados de outro usuário; sucesso reflete alterações do perfil.
4. **Interação:** sair exige confirmação. Demo apaga os dados privados locais e informa isso antes; produção revoga sessão e limpa cache privado.
5. **Feedback:** edição bem-sucedida atualiza saudação; sair volta ao estado visitante, sem manter dados privados visíveis.

### T29 · Meus dados — `/account`

1. **UI:** nome, e-mail opcional, telefone informado e Salvar alterações.
2. **Hierarquia:** campos no corpo; telefone em bloco contextual; CTA no rodapé.
3. **Estados:** padrão preenchido; carregando gravação; vazio de sessão pede login; erro de nome/e-mail preserva entrada; sucesso anuncia Dados atualizados.
4. **Interação:** validar e-mail quando preenchido; telefone exige novo fluxo de verificação antes de alterar em produção. Não tratar nome informado como identidade civil verificada.
5. **Feedback:** validação contextual e háptica no salvamento; não encerrar formulário em caso de erro.

### T30 · Histórico — `/(tabs)/orders`

1. **UI:** filtros Todos/Em andamento/Finalizados, mercado, data/hora, estado, unidades e total.
2. **Hierarquia:** header; filtros; cards cronológicos; abas. Pedidos pendentes e cancelados têm rótulos próprios.
3. **Estados:** padrão todos; carregando lista; vazio por conta/filtro/primeiro pedido; erro permite atualizar; sucesso abre detalhe histórico imutável.
4. **Interação:** tocar card abre pedido; atualização não converte histórico em preços atuais. Paginar em produção; o demo usa lista local.
5. **Feedback:** filtro selecionado destaca estado; navegação preserva leitura do pedido. Não sobrescrever valores históricos ao atualizar catálogo.

### T31 · Repetir Feira — dialog a partir do histórico

1. **UI:** explicação de nova compra, efeito sobre feira atual, Montar novamente e Voltar.
2. **Hierarquia:** mensagem antes do CTA; depois da confirmação, abrir Minha feira para revisão completa.
3. **Estados:** padrão sem alteração; carregando consulta disponibilidade; vazio se nenhum item existir; erro preserva feira anterior; sucesso cria rascunho atualizado, sem pedido/pagamento.
4. **Interação:** copiar somente produtos existentes, ajustar quantidade ao estoque e usar preço atual. Informar que itens/valores podem ter mudado. Uma versão de produção deve mostrar um diff explícito item a item antes de aceitar aumentos.
5. **Feedback:** “Feira refeita com preços e disponibilidade atuais”; revisão obrigatória de checkout. Nenhuma confirmação de compra automática.

### T32 · Privacidade — `/privacy`

1. **UI:** explicação de dados locais/servidor, localização, cartões/biometria, imagens externas, exclusão e confirmação.
2. **Hierarquia:** blocos de informação; ação destrutiva separada ao fim; confirmação modal.
3. **Estados:** padrão informações; carregando solicitação; vazio de sessão oculta ação de exclusão; erro mantém conta e informa falha; sucesso retorna ao perfil visitante.
4. **Interação:** demo apaga perfil/endereço/cartões/pedidos locais. Produção exige reautenticação, política de retenção e tratamento de pedidos ativos antes de encerrar a conta; não copiar a exclusão demo como regra jurídica.
5. **Feedback:** ação tem confirmação com consequência explícita; sucesso somente após concluir. Revogação de localização ocorre nas configurações do sistema.

## 8. Handoff para Figma

Páginas propostas: `00 · Leia-me`, `01 · Foundations`, `02 · Components`, `03 · Cliente / Fluxos`, `04 · Estados e exceções`, `05 · Protótipo`.

Usar Auto Layout, tokens semânticos, componentes com variantes e constraints de safe area. Nomear frames `Cliente/T20/Checkout/Default`, `.../Loading`, `.../Empty`, `.../Error`, `.../Success`. Para estados não aplicáveis, registrar a justificativa em annotation em vez de desenhar conteúdo artificial.

Variantes mínimas: Button(primary/secondary/destructive × default/pressed/disabled/loading); Field(default/focus/error/disabled × single/multiline); Badge(open/closed/pending/success); ProductCard(available/soldOut/imageFallback); MarketCard(open/closed); Stepper(min/default/max); timeline(pending/current/done); dialog(confirm/cancel); toast(success/error).

Protótipo principal: T01 → T02 → T07 → T09 → T11 → T12 → T14 → T03/T04 → T17/T18 → T19 → T20/T21 → T23 → T24/T25 → T30/T31. Criar cenários adicionais para estoque esgotado, outro mercado, mínimo não alcançado, endereço fora de cobertura, moto incompatível, erro de cotação, PIX expirado, sugestão recusada e perda de conexão.

## 9. Critérios de aceite do produto

- Toda ação principal tem retorno visual e tratamento de falha, inclusive com háptica desativada.
- Nenhum pedido pode omitir uma das três parcelas financeiras ou apresentar total diferente da soma.
- Não adicionar produto esgotado, criar quantidade negativa, misturar mercados ou exceder capacidade sem aviso.
- Bloquear cotação vencida ou de revisão antiga; confirmação deve ser idempotente.
- Cliente autoriza cada substituição. Repetir feira nunca cobra automaticamente.
- Os cinco estados preservam a ordem e têm origem verificável; pagamento pendente não simula preparação.
- APIs reais negam leitura/escrita em pedido/endereço/cartão de outro cliente e rejeitam comandos demonstrativos.
- Antes de lançamento: validar dispositivo real, leitor de tela, teclado, fonte ampliada, contraste completo, rede intermitente, reconexão e disponibilidade dos provedores.

## Revisão 1.1 (precedência sobre os exemplos visuais anteriores)

Consultar [ATUALIZACAO-1.1.md](ATUALIZACAO-1.1.md) para os novos componentes, fontes e regra de montagem. Todos os componentes passam a usar os tokens semânticos reativos Light/Dark. Home e onboarding usam a logo enviada com duas variantes; o Perfil possui AppearanceControl. Cards de produto usam ações separadas: foto/nome abrem o detalhe, + adiciona diretamente e muda para controle de quantidade. Busca e catálogo carregam 24 ofertas por vez, com Mostrar mais; cada categoria de cada mercado contém 20 itens.

AssemblyInfo aparece na entrega, checkout e acompanhamento: responsável, tarefa, bônus e informação de que a plataforma o financia. Não existe nova linha de cobrança no total do cliente. A preparação mantém o status oficial Mercado Preparando e acrescenta a descrição do entregador selecionando os produtos quando aplicável.
