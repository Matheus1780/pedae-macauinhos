# PedeAê 1.3 — catálogo e compra recorrente

Referência pública consultada em 12/11/2026: [Mercado Modelo — Instabuy](https://play.google.com/store/apps/details?id=br.com.mercadomodelo&hl=pt_BR).
Análise da descrição, notas públicas de versão e quatro imagens promocionais. Não tivemos acesso ao código-fonte nem ao aplicativo autenticado. As imagens da referência não são distribuídas no PedeAê.

| Observação da referência | Aplicação no PedeAê |
| --- | --- |
| Produtos com foco em foto, nome e preço, adição rápida | Cards mais leves; + continua direto na feira; foto/nome continuam abrindo detalhes |
| Organização por categorias e filtros | Busca e categorias fixas; menor/maior preço, nome, estoque e favoritos combináveis |
| Favoritos e compras recorrentes descritos na loja | Coração por produto, tela de favoritos persistidos, atalhos na Home e Perfil; histórico com Repetir Feira já existente |
| Resumo da compra acessível durante escolha | Barra fixa com quantidade, mercado e subtotal no catálogo e favoritos; resumo compacto no detalhe |
| Comentários por item recolhidos | Observações opcionais expansíveis na feira, com prévia do texto salvo |

## Limites e próximos recursos

Entrega agendada e retirada na loja aparecem na descrição da referência, mas exigem capacidade/horários por mercado, cálculo de taxas e estados de logística próprios. Não foram simuladas como disponibilidade real. Descontos progressivos também exigem regras de quantidade, vigência, estoque, cupom e cálculo autoritativo no backend; não criamos preços anteriores ou economias fictícias.

O bônus de montagem continua em 1,5% do subtotal dos produtos, financiado pela Taxa PedeAê, destinado a quem monta a feira. Nenhuma taxa extra foi adicionada. Compras, pagamentos e entregas continuam demonstrativos.

Favoritos são por oferta/mercado, persistidos no dispositivo e preservados na atualização de dados antigos. Login mantém a seleção; sair/excluir conta limpa os dados demonstrativos. Filtros não alteram preços, estoque ou o pedido atual. Ordenação compara preços da embalagem/porção exibida, não preços normalizados por kg.

## Verificação

Testes de domínio cobrem persistência/migração, idempotência de favoritos, preservação no login e combinação dos filtros. As jornadas de navegador verificam adição rápida, detalhes, troca de mercado, tema, observações e checkout. Build Android inclui bundle local, sem depender de terminal ou Expo Go.
