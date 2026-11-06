import { DomainError } from './types';
import type { Cart, Product, Market, Quote, Address, Vehicle } from './types';
export const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const digits = (s: string) => s.replace(/\D/g, '');
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export function assertQuantity(n: number) {
  if (!Number.isSafeInteger(n) || n < 0 || n > 99)
    throw new DomainError('QUANTITY', 'Escolha uma quantidade entre 0 e 99.');
}
export function totals(cart: Cart, products: Product[]) {
  return cart.items.reduce(
    (a, item) => {
      const p = products.find((x) => x.id === item.productId);
      if (!p)
        throw new DomainError(
          'PRODUCT_REMOVED',
          'Um produto não está mais disponível. Revise sua feira.',
        );
      return {
        subtotal: a.subtotal + p.price * item.quantity,
        weightGrams: a.weightGrams + p.weightGrams * item.quantity,
        count: a.count + item.quantity,
      };
    },
    { subtotal: 0, weightGrams: 0, count: 0 },
  );
}
export function quoteCart(
  cart: Cart,
  products: Product[],
  markets: Market[],
  address: Address | undefined,
  vehicle: Vehicle,
  now = Date.now(),
): Quote {
  if (!cart.items.length) throw new DomainError('EMPTY_CART', 'Adicione produtos à sua feira.');
  const market = markets.find((x) => x.id === cart.marketId);
  if (!market?.open)
    throw new DomainError('MARKET_CLOSED', 'Este mercado está fechado. Sua feira foi preservada.');
  if (!address || normalize(address.city) !== 'parambu' || address.state !== 'CE')
    throw new DomainError('OUTSIDE_COVERAGE', 'A demonstração atende endereços de Parambu, CE.');
  for (const item of cart.items) {
    assertQuantity(item.quantity);
    const p = products.find((x) => x.id === item.productId);
    if (!p || p.marketId !== market.id || item.quantity < 1 || item.quantity > p.stock)
      throw new DomainError('STOCK_CHANGED', 'A disponibilidade mudou. Revise as quantidades.');
  }
  const { subtotal, weightGrams } = totals(cart, products);
  if (subtotal < market.minimum)
    throw new DomainError(
      'MINIMUM',
      `Faltam ${money(market.minimum - subtotal)} para o mínimo deste mercado.`,
    );
  if (weightGrams > (vehicle === 'moto' ? 15000 : 80000))
    throw new DomainError(
      'VEHICLE_CAPACITY',
      'O peso estimado excede a capacidade desta modalidade.',
    );
  const deliveryFee = vehicle === 'moto' ? 790 : 1490;
  const platformFee = 210; // Fictional fixtures, never a production pricing rule.
  return {
    id: `quote-${now}-${cart.revision}`,
    revision: cart.revision,
    addressId: address.id,
    addressRevision: address.revision ?? 0,
    vehicle,
    subtotal,
    deliveryFee,
    platformFee,
    total: subtotal + deliveryFee + platformFee,
    weightGrams,
    expiresAt: now + 5 * 60000,
  };
}
export function validateAddress(a: Address) {
  if (![a.label, a.street, a.number, a.neighborhood, a.city, a.state].every((x) => x.trim()))
    throw new DomainError('ADDRESS', 'Preencha os campos obrigatórios do endereço.');
  if (digits(a.zip).length !== 8) throw new DomainError('ZIP', 'Informe um CEP com 8 dígitos.');
  if (a.instructions.length > 240)
    throw new DomainError('INSTRUCTIONS', 'Use até 240 caracteres nas instruções.');
}
