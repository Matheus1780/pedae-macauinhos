import type { Product } from './types';
import { normalize } from './rules';
export type ProductSort = 'selection' | 'priceAsc' | 'priceDesc' | 'name';
export function selectProducts(
  products: Product[],
  options: {
    marketId?: string;
    category?: string;
    query?: string;
    availableOnly?: boolean;
    favoritesOnly?: boolean;
    favoriteIds?: string[];
    sort?: ProductSort;
  },
): Product[] {
  const favorites = new Set(options.favoriteIds ?? []);
  const list = products.filter(
    (p) =>
      (!options.marketId || p.marketId === options.marketId) &&
      (!options.category || options.category === 'Todos' || p.category === options.category) &&
      normalize(p.name).includes(normalize(options.query ?? '')) &&
      (!options.availableOnly || p.stock > 0) &&
      (!options.favoritesOnly || favorites.has(p.id)),
  );
  if (options.sort === 'priceAsc') list.sort((a, b) => a.price - b.price);
  if (options.sort === 'priceDesc') list.sort((a, b) => b.price - a.price);
  if (options.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return list;
}
