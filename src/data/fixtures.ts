import type { Snapshot, Product, Category, Market } from '../domain/types';
import catalog from './catalog.json';
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=720&q=80`;
export const categories: { name: Category; icon: string; color: string; key: string }[] = [
  { name: 'Mercearia', icon: 'basket-outline', color: '#EAF0E9', key: 'mercearia' },
  { name: 'Bebidas', icon: 'wine-outline', color: '#EAF0E9', key: 'bebidas' },
  { name: 'Higiene', icon: 'heart-outline', color: '#EAF0E9', key: 'higiene' },
  { name: 'Limpeza', icon: 'water-outline', color: '#EAF0E9', key: 'limpeza' },
  { name: 'Hortifruti', icon: 'leaf-outline', color: '#EAF0E9', key: 'hortifruti' },
  { name: 'Alimentos Frescos', icon: 'fish-outline', color: '#EAF0E9', key: 'frescos' },
];
export const priceSources: Record<string, string> = {
  basicos: 'https://mercado.carrefour.com.br/categoria/mercearia/alimentos-basicos',
  cafe: 'https://mercado.carrefour.com.br/colecao/20384',
  refrigerantes: 'https://newsitefood.cloud.carrefour.com.br/busca?PS=12&fq=C%3A%2F4599%2F390%2F',
  refrigerantesLista: 'https://mercado.carrefour.com.br/categoria/bebidas/refrigerantes/',
  antarctica: 'https://mercado.carrefour.com.br/marca/antarctica',
  higiene: 'https://mercado.carrefour.com.br/colecao/1860/',
  higieneEscova: 'https://mercado.carrefour.com.br/colecao/1860/score-desc/0',
  ypeColecao: 'https://mercado.carrefour.com.br/colecao/20487/score-desc/0?page=2',
  ype: 'https://mercado.carrefour.com.br/marca/ype',
  veja: 'https://mercado.carrefour.com.br/marca/veja',
  hortifrutiKg:
    'https://mercado.carrefour.com.br/colecao/25532/score-desc/categoria/categoria/mercearia',
  frescos: 'https://mercado.carrefour.com.br/colecao/28649/score-desc/0',
};
export function initialSnapshot(): Snapshot {
  const markets: Market[] = [
    {
      id: 'bom-preco',
      name: 'Mercado Bom Preço',
      neighborhood: 'Centro',
      distanceKm: 0.6,
      eta: '25–40 min',
      rating: 4.9,
      open: true,
      minimum: 2000,
      image: photo('photo-1542838132-92c53300491e'),
      assemblyMode: 'market',
      assemblyRevision: 1,
    },
    {
      id: 'sabor-terra',
      name: 'Sabor da Terra',
      neighborhood: 'Cidade Nova',
      distanceKm: 1.1,
      eta: '35–50 min',
      rating: 4.8,
      open: true,
      minimum: 1500,
      image: photo('photo-1542838132-92c53300491e'),
      assemblyMode: 'courier',
      assemblyRevision: 1,
    },
    {
      id: 'super-parambu',
      name: 'Super Parambu',
      neighborhood: 'Centro',
      distanceKm: 1.8,
      eta: '40–55 min',
      rating: 4.7,
      open: false,
      minimum: 2500,
      image: photo('photo-1542838132-92c53300491e'),
      assemblyMode: 'market',
      assemblyRevision: 1,
    },
  ];
  const products: Product[] = markets.flatMap((m) =>
    Object.entries(catalog).flatMap(([key, group]) =>
      group.products.map((row, index) => {
        const [name, unit, price, grams, legacyId, sourceKey] = row as [
          string,
          string,
          number,
          number,
          number?,
          string?,
        ];
        const source = sourceKey ? priceSources[sourceKey] : undefined;
        return {
          id: `${m.id}-${legacyId || `${key}-${index + 1}`}`,
          marketId: m.id,
          name,
          category: group.category as Category,
          unit,
          price,
          weightGrams: grams,
          emoji: '',
          image: `atlas:${key}:${index}`,
          stock: legacyId === 14 ? 0 : 30,
          description: `${name}. Apresentação: ${unit}. ${key === 'hortifruti' ? 'Porção de peso fixo no protótipo; tamanho e aparência podem variar.' : 'Consulte composição, conservação e alergênicos na embalagem original.'}`,
          priceReference: {
            kind:
              sourceKey === 'hortifrutiKg'
                ? ('normalized' as const)
                : source
                  ? ('retailer' as const)
                  : ('estimated' as const),
            source,
            checkedAt: '2026-11-09',
          },
        };
      }),
    ),
  );
  return {
    version: 1,
    catalogVersion: 2,
    onboarded: false,
    city: '',
    markets,
    products,
    profile: null,
    cart: { marketId: null, items: [], allowContact: true, revision: 0 },
    addresses: [],
    cards: [],
    orders: [],
    messages: [],
    substitutions: [],
    recentSearches: [],
  };
}
/** Upgrade the demo catalog once, preserving personal data, quantities, stock and historical prices. */
export function migrateCatalog(snapshot: Snapshot): Snapshot {
  if ((snapshot.catalogVersion ?? 1) >= 2) return snapshot;
  const fresh = initialSnapshot();
  const old = new Map(snapshot.products.map((p) => [p.id, p]));
  snapshot.products = fresh.products.map((p) => ({ ...p, stock: old.get(p.id)?.stock ?? p.stock }));
  snapshot.markets = fresh.markets.map((m) => ({
    ...m,
    ...snapshot.markets.find((x) => x.id === m.id),
    assemblyMode: m.assemblyMode,
    assemblyRevision: 1,
  }));
  snapshot.catalogVersion = 2;
  snapshot.cart.revision++;
  return snapshot;
}
