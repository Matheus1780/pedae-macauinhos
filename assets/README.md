# Imagens do protótipo PedeAê

As imagens foram geradas com a ferramenta de geração de imagens desta sessão em 09/11/2026.

- `brand/logo-themes.png`: adaptação da logo fornecida pelo proprietário, em duas linhas (letras pretas / letras brancas), com transparência. O componente BrandLogo seleciona a variante para o tema.
- `products/*.png`: seis conjuntos, cada um com cinco colunas e quatro linhas. A ordem das células segue `src/data/catalog.json`, índice zero. O arquivo de Limpeza foi revisado para incluir todos os 20 produtos.
- `src/ui/productAssets.ts`: mapa dos arquivos locais; `ProductImage` recorta a célula na interface sem alterar os arquivos originais.

Direção visual usada: fotografias realistas de produtos de supermercado brasileiro, fundo branco, iluminação de estúdio suave, embalagens reconhecíveis e conteúdo totalmente dentro de cada célula. Os nomes e tamanhos usados no pedido de geração correspondem ao cadastro no JSON. Hortifruti utiliza fotos ilustrativas dos alimentos sem marca. As imagens não substituem dados oficiais de embalagem, ingredientes, certificações ou alergênicos.

As marcas identificam os produtos ilustrados; não indicam parceria, fornecimento ou afiliação com PedeAê. Para operar lojas reais, substituir pelos arquivos oficiais autorizados do catálogo de cada mercado.

# Ícone de instalação

`brand/app-icon.png` e `../public/icons/` foram preparados a partir de uma imagem
gerada por IA com a marca de referência: o P verde, a sacola e a casa. Os tamanhos
PNG foram adaptados às exigências do manifesto web e Expo. O logo claro/escuro
dentro do aplicativo permanece em `brand/logo-themes.png`.
