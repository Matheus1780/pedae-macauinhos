export const ORDER_STATUSES = [
  'Pedido Enviado',
  'Mercado Preparando',
  'Pedido com Entregador',
  'A Caminho',
  'Entregue',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Category =
  'Mercearia' | 'Bebidas' | 'Higiene' | 'Limpeza' | 'Hortifruti' | 'Alimentos Frescos';
export type Money = number; // Integer BRL cents; never float reais.
export interface Market {
  id: string;
  name: string;
  neighborhood: string;
  distanceKm: number;
  eta: string;
  rating: number;
  open: boolean;
  minimum: Money;
  image: string;
}
export interface Product {
  id: string;
  marketId: string;
  name: string;
  category: Category;
  unit: string;
  price: Money;
  stock: number;
  weightGrams: number;
  emoji: string;
  image: string;
  description: string;
}
export interface CartItem {
  productId: string;
  quantity: number;
  note: string;
}
export interface Cart {
  marketId: string | null;
  items: CartItem[];
  allowContact: boolean;
  revision: number;
}
export interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  complement: string;
  instructions: string;
  revision?: number;
}
export interface Profile {
  id: string;
  name: string;
  phone: string;
  email: string;
}
export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
} // PSP token reference only.
export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'terminal';
export type Vehicle = 'moto' | 'carro';
export interface Quote {
  id: string;
  revision: number;
  addressId: string;
  addressRevision: number;
  vehicle: Vehicle;
  subtotal: Money;
  deliveryFee: Money;
  platformFee: Money;
  total: Money;
  weightGrams: number;
  expiresAt: number;
}
export interface OrderItem extends CartItem {
  name: string;
  unit: string;
  unitPrice: Money;
  emoji: string;
}
export interface Order {
  id: string;
  marketId: string;
  marketName: string;
  items: OrderItem[];
  quote: Quote;
  address: Address;
  status: OrderStatus;
  statusIndex: number;
  history: { status: OrderStatus; at: string }[];
  payment: PaymentMethod;
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'on_delivery' | 'refunded';
  lifecycle: 'awaiting_payment' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  pixExpiresAt?: number;
  pixCopyPaste?: string;
  cashChangeFor?: Money;
  allowContact: boolean;
}
export interface ChatMessage {
  id: string;
  orderId: string;
  sender: 'client' | 'market' | 'support';
  text: string;
  at: string;
}
export interface Substitution {
  id: string;
  orderId: string;
  originalProductId: string;
  replacement: OrderItem;
  state: 'pending' | 'accepted' | 'declined';
}
export interface Snapshot {
  version: 1;
  onboarded: boolean;
  city: string;
  markets: Market[];
  products: Product[];
  profile: Profile | null;
  cart: Cart;
  addresses: Address[];
  cards: SavedCard[];
  orders: Order[];
  messages: ChatMessage[];
  substitutions: Substitution[];
  recentSearches: string[];
}
export type Command =
  | { type: 'onboard'; city: string }
  | {
      type: 'addItem';
      productId: string;
      quantity: number;
      note?: string;
      switchMarket?: boolean;
    }
  | { type: 'quantity'; productId: string; quantity: number }
  | { type: 'note'; productId: string; note: string }
  | { type: 'contactPreference'; value: boolean }
  | { type: 'saveAddress'; address: Address }
  | { type: 'removeAddress'; id: string }
  | { type: 'profile'; name: string; email: string }
  | { type: 'search'; query: string }
  | { type: 'clearSearches' }
  | { type: 'saveDemoCard'; brand: string; last4: string }
  | { type: 'removeCard'; id: string }
  | { type: 'repeat'; orderId: string; replace: boolean }
  | { type: 'chat'; orderId: string; text: string }
  | { type: 'cancel'; orderId: string }
  | { type: 'demoAdvance'; orderId: string }
  | { type: 'demoPay'; orderId: string }
  | { type: 'demoSubstitution'; orderId: string }
  | { type: 'resolveSubstitution'; id: string; accept: boolean }
  | { type: 'logout' }
  | { type: 'deleteAccount' };
export interface CheckoutInput {
  quoteId: string;
  payment: PaymentMethod;
  cardId?: string;
  cashChangeFor?: Money;
  idempotencyKey: string;
}
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
