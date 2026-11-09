# Conexão futura ao banco

O app funciona agora com dados locais. Nenhum banco externo está conectado e nenhuma migração foi executada em ambiente remoto.

Recomendação inicial: **PostgreSQL gerenciado (por exemplo, Supabase)** atrás de uma API autenticada. Também é possível usar outro banco implementando o contrato `Repository`. As telas não precisam conhecer SQL, URLs do banco ou chaves administrativas.

## Quando for conectar

1. Escolher provedor, região, ambiente e regras de autenticação. Criar um ambiente de desenvolvimento separado da produção.
2. Aplicar `001_initial.sql` com uma credencial de migração no servidor. A migração é de instalação inicial, não deve ser reaplicada sobre tabelas existentes.
3. Implementar os endpoints de `docs/API.md` com o papel correto para cliente, mercado e entregador. Não usar o usuário proprietário do banco no aplicativo móvel.
4. Configurar `DATABASE_URL`, credenciais do provedor de pagamento e segredos de autenticação **somente no backend**.
5. Implementar reservas de estoque, transações, idempotência, webhooks assinados, estornos e autorização por proprietário. O banco já tem os campos e índices para esses fluxos.
6. Instalar as políticas RLS correspondentes ao provedor de identidade escolhido. A migração habilita RLS e não concede acesso público: clientes não terão acesso direto por padrão. O proprietário das tabelas e papéis privilegiados podem contornar RLS, portanto não os use para tráfego comum.
7. Preencher as duas variáveis públicas de `.env.example`: `EXPO_PUBLIC_DATA_MODE=api` e `EXPO_PUBLIC_API_URL=https://.../v1`.
8. Executar testes de isolamento entre usuários, concorrência de estoque e pagamento antes de liberar uso real.

Para Supabase, não basta trocar uma URL: autenticação, políticas `auth.uid()` e funções transacionais ainda precisam ser implementadas. Nunca colocar `service_role`, senha do PostgreSQL ou segredo de webhook em `EXPO_PUBLIC_*`.

## Decisões de modelagem

- IDs UUID em produção; os identificadores legíveis do modo demo não são migrações reais.
- Dinheiro em centavos inteiros e peso em gramas inteiras.
- Uma feira por cliente e um mercado por feira; chave composta impede itens de outro mercado.
- `quotes` tem revisão da feira, versão do endereço e validade; cotação expirada exige revisão explícita.
- Pedidos guardam cópias imutáveis de endereço, nomes, unidades e preços. Editar cadastro não altera pedidos antigos.
- Pagamento, ciclo de vida e os cinco estados operacionais são independentes. PIX pendente não é pedido entregue ao mercado.
- Eventos de pagamento e chaves de idempotência têm unicidade. O cliente nunca confirma pagamento por si só.
- Substituições e mensagens têm vínculo com o pedido. Autorizar contato não é autorizar a troca.
- O total dos itens e o subtotal do pedido devem ser conciliados dentro da mesma transação de serviço; a soma entre tabelas não é garantida por uma coluna gerada SQL.
- Transições de status e permissão dos atores são responsabilidades do backend; o esquema não as substitui.

## Estrutura transacional do checkout

`BEGIN → identidade verificada → idempotência → bloquear feira/estoque → validar cotação/endereço/mercado → reservar itens → criar pedido e intenção de pagamento → outbox → COMMIT`.

O provedor externo participa por uma saga: falha, tempo limite e respostas tardias são reconciliados; não existe transação ACID abrangendo PostgreSQL e banco/PSP. A preparação só inicia após pagamento confirmado, autorização de cartão validada ou pagamento na entrega aceito. Expiração e cancelamento liberam as reservas uma única vez.

## Montagem e bônus (1.1)

Aplicar `002_assembly_bonus.sql` **depois** de `001_initial.sql`, no banco escolhido futuramente. Nenhuma das migrações foi aplicada a um banco externo nesta entrega. A segunda migração mantém a fórmula do total do cliente e registra a atribuição/repasse de 1,5% dos produtos, financiado pela plataforma. Ver [regras e decisões](../docs/ATUALIZACAO-1.1.md).

O backend deve bloquear pedido e atribuição na mesma transação, verificar subtotal autorizado e status, impedir mudança de responsável após a coleta e inserir um único lançamento por pedido. Não há políticas públicas de leitura/escrita nessas tabelas. Nunca aceitar destinatário, bônus ou status de liquidação enviados pelo cliente.
