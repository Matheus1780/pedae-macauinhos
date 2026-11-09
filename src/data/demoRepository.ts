import { initialSnapshot, migrateCatalog } from './fixtures';
import {
  assemblyBonus,
  assertQuantity,
  digits,
  normalize,
  quoteCart,
  validateAddress,
} from '../domain/rules';
import { DomainError, ORDER_STATUSES } from '../domain/types';
import type { Snapshot, Command, CheckoutInput, Quote, Vehicle, Order } from '../domain/types';
import type { Repository, KeyValueStorage, Challenge } from './contracts';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const KEY = 'pedeae.demo.v1';
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
type Envelope = {
  snapshot: Snapshot;
  receipts: Record<string, { fingerprint: string; orderId: string }>;
};
export class DemoRepository implements Repository {
  readonly mode = 'demo' as const;
  private data?: Envelope;
  private queue: Promise<unknown> = Promise.resolve();
  private quotes = new Map<string, Quote>();
  private challenges = new Map<string, Challenge & { phone: string; attempts: number }>();
  constructor(
    private storage: KeyValueStorage,
    private now: () => number = Date.now,
  ) {}
  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn);
    this.queue = next.catch(() => {});
    return next;
  }
  private async read() {
    if (!this.data) {
      const raw = await this.storage.getItem(KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Envelope;
          if (parsed.snapshot?.version !== 1 || !Array.isArray(parsed.snapshot.orders))
            throw Error();
          parsed.snapshot = migrateCatalog(parsed.snapshot);
          this.data = parsed;
        } catch {
          throw new DomainError(
            'CORRUPT_STORAGE',
            'Não foi possível ler os dados locais. Limpe os dados deste app para reiniciar a demonstração.',
          );
        }
      } else this.data = { snapshot: initialSnapshot(), receipts: {} };
    }
    return clone(this.data);
  }
  private async save(next: Envelope) {
    await this.storage.setItem(KEY, JSON.stringify(next));
    this.data = next;
    return clone(next.snapshot);
  }
  private restoreStock(s: Snapshot, o: Order) {
    for (const i of o.items) {
      const p = s.products.find((x) => x.id === i.productId);
      if (p) p.stock += i.quantity;
    }
  }
  private expire(s: Snapshot) {
    for (const o of s.orders)
      if (o.lifecycle === 'awaiting_payment' && (o.pixExpiresAt ?? 0) <= this.now()) {
        o.lifecycle = 'cancelled';
        if (o.assembly) o.assembly.state = 'void';
        this.restoreStock(s, o);
      }
  }
  load() {
    return this.serial(async () => {
      const d = await this.read();
      this.expire(d.snapshot);
      return this.save(d);
    });
  }
  dispatch(c: Command) {
    return this.serial(async () => {
      const d = await this.read();
      const s = d.snapshot;
      this.expire(s);
      const privateTypes = [
        'saveAddress',
        'removeAddress',
        'profile',
        'saveDemoCard',
        'removeCard',
        'repeat',
        'chat',
        'cancel',
        'demoAdvance',
        'demoPay',
        'demoSubstitution',
        'demoDelegateAssembly',
        'resolveSubstitution',
        'deleteAccount',
      ];
      if (privateTypes.includes(c.type) && !s.profile)
        throw new DomainError('UNAUTHORIZED', 'Entre na sua conta para continuar.');
      const order = (id: string) => {
        const o = s.orders.find((x) => x.id === id);
        if (!o) throw new DomainError('NOT_FOUND', 'Pedido não encontrado.');
        return o;
      };
      switch (c.type) {
        case 'onboard':
          if (!c.city.trim()) throw new DomainError('CITY', 'Informe uma cidade.');
          s.city = c.city.trim();
          s.onboarded = true;
          break;
        case 'addItem': {
          assertQuantity(c.quantity);
          const p = s.products.find((x) => x.id === c.productId);
          if (!p || c.quantity < 1) throw new DomainError('PRODUCT', 'Produto inválido.');
          if (!s.markets.find((x) => x.id === p.marketId)?.open)
            throw new DomainError(
              'MARKET_CLOSED',
              'Mercado fechado. Consulte o catálogo e volte mais tarde.',
            );
          if (
            s.cart.marketId &&
            s.cart.marketId !== p.marketId &&
            s.cart.items.length &&
            !c.switchMarket
          )
            throw new DomainError('SWITCH_MARKET', 'Sua feira possui itens de outro mercado.');
          if (s.cart.marketId !== p.marketId) s.cart.items = [];
          const existing = s.cart.items.find((x) => x.productId === p.id);
          const quantity = (existing?.quantity ?? 0) + c.quantity;
          assertQuantity(quantity);
          if (quantity > p.stock)
            throw new DomainError('STOCK_CHANGED', `Disponíveis: ${p.stock} unidades.`);
          if ((c.note?.length ?? 0) > 240) throw new DomainError('NOTE', 'Use até 240 caracteres.');
          if (existing) {
            existing.quantity = quantity;
            if (c.note !== undefined) existing.note = c.note;
          } else
            s.cart.items.push({
              productId: p.id,
              quantity: c.quantity,
              note: c.note ?? '',
            });
          s.cart.marketId = p.marketId;
          s.cart.revision++;
          break;
        }
        case 'quantity': {
          assertQuantity(c.quantity);
          const p = s.products.find((x) => x.id === c.productId);
          if (!p || c.quantity > p.stock)
            throw new DomainError('STOCK_CHANGED', 'Quantidade indisponível.');
          s.cart.items = s.cart.items.flatMap((i) =>
            i.productId === c.productId
              ? c.quantity
                ? [{ ...i, quantity: c.quantity }]
                : []
              : [i],
          );
          if (!s.cart.items.length) s.cart.marketId = null;
          s.cart.revision++;
          break;
        }
        case 'note':
          if (c.note.length > 240) throw new DomainError('NOTE', 'Use até 240 caracteres.');
          s.cart.items = s.cart.items.map((i) =>
            i.productId === c.productId ? { ...i, note: c.note } : i,
          );
          s.cart.revision++;
          break;
        case 'contactPreference':
          s.cart.allowContact = c.value;
          s.cart.revision++;
          break;
        case 'saveAddress':
          validateAddress(c.address);
          s.addresses = [
            ...s.addresses.filter((x) => x.id !== c.address.id),
            {
              ...c.address,
              id: c.address.id || uid('address'),
              revision: (s.addresses.find((a) => a.id === c.address.id)?.revision ?? 0) + 1,
            },
          ];
          break;
        case 'removeAddress':
          s.addresses = s.addresses.filter((x) => x.id !== c.id);
          break;
        case 'profile':
          if (c.name.trim().length < 2 || (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)))
            throw new DomainError('PROFILE', 'Confira seu nome e e-mail.');
          s.profile = {
            ...s.profile!,
            name: c.name.trim(),
            email: c.email.trim(),
          };
          break;
        case 'search':
          if (c.query.trim())
            s.recentSearches = [
              c.query.trim(),
              ...s.recentSearches.filter((x) => normalize(x) !== normalize(c.query)),
            ].slice(0, 8);
          break;
        case 'clearSearches':
          s.recentSearches = [];
          break;
        case 'saveDemoCard':
          if (!/^\d{4}$/.test(c.last4))
            throw new DomainError('CARD', 'Use apenas os quatro últimos dígitos fictícios.');
          s.cards.push({
            id: uid('demo-card'),
            brand: c.brand,
            last4: c.last4,
          });
          break;
        case 'removeCard':
          s.cards = s.cards.filter((x) => x.id !== c.id);
          break;
        case 'repeat': {
          const o = order(c.orderId);
          if (s.cart.items.length && !c.replace)
            throw new DomainError('CART_EXISTS', 'Confirme a substituição da feira atual.');
          const items = o.items.flatMap((i) => {
            const p = s.products.find((x) => x.id === i.productId);
            return p && p.stock > 0
              ? [
                  {
                    productId: p.id,
                    quantity: Math.min(i.quantity, p.stock),
                    note: i.note,
                  },
                ]
              : [];
          });
          if (!items.length)
            throw new DomainError(
              'NO_AVAILABLE_ITEMS',
              'Os produtos deste pedido estão indisponíveis.',
            );
          s.cart = {
            marketId: o.marketId,
            items,
            allowContact: o.allowContact,
            revision: s.cart.revision + 1,
          };
          break;
        }
        case 'chat': {
          const o = order(c.orderId);
          if (o.lifecycle === 'cancelled')
            throw new DomainError(
              'CHAT_CLOSED',
              'Este pedido foi cancelado. Use a central de ajuda.',
            );
          if (!c.text.trim() || c.text.length > 1000)
            throw new DomainError('MESSAGE', 'Escreva de 1 a 1.000 caracteres.');
          s.messages.push({
            id: uid('msg'),
            orderId: o.id,
            sender: 'client',
            text: c.text.trim(),
            at: new Date(this.now()).toISOString(),
          });
          break;
        }
        case 'cancel': {
          const o = order(c.orderId);
          if (o.lifecycle === 'cancelled') break;
          if (o.statusIndex > 0 || o.lifecycle === 'completed')
            throw new DomainError(
              'CANCEL_UNAVAILABLE',
              'A preparação começou. Entre em contato com o suporte.',
            );
          this.restoreStock(s, o);
          o.lifecycle = 'cancelled';
          if (o.assembly) o.assembly.state = 'void';
          if (['paid', 'authorized'].includes(o.paymentStatus)) o.paymentStatus = 'refunded';
          break;
        }
        case 'demoConfigureAssembly': {
          const market = s.markets.find((m) => m.id === c.marketId);
          if (!market || !['market', 'courier'].includes(c.by))
            throw new DomainError('MARKET', 'Mercado inválido.');
          if (market.assemblyMode !== c.by) {
            market.assemblyMode = c.by;
            market.assemblyRevision++;
          }
          break;
        }
        case 'demoDelegateAssembly': {
          const o = order(c.orderId);
          if (!o.assembly || o.lifecycle !== 'active' || o.statusIndex > 1)
            throw new DomainError('ASSEMBLY_CLOSED', 'A montagem já foi encerrada.');
          if (o.assembly.by === 'market') {
            o.assembly.by = 'courier';
            o.assembly.reassignedAt = new Date(this.now()).toISOString();
          }
          break;
        }
        case 'demoPay': {
          const o = order(c.orderId);
          if (o.lifecycle !== 'awaiting_payment' || (o.pixExpiresAt ?? 0) <= this.now())
            throw new DomainError(
              'PIX_EXPIRED',
              'Este PIX demonstrativo expirou. Faça um novo pedido.',
            );
          o.paymentStatus = 'paid';
          o.lifecycle = 'active';
          o.history = [
            {
              status: 'Pedido Enviado',
              at: new Date(this.now()).toISOString(),
            },
          ];
          break;
        }
        case 'demoAdvance': {
          const o = order(c.orderId);
          if (o.lifecycle !== 'active')
            throw new DomainError('ORDER_INACTIVE', 'Este pedido não está em andamento.');
          if (s.substitutions.some((x) => x.orderId === o.id && x.state === 'pending'))
            throw new DomainError(
              'SUBSTITUTION_PENDING',
              'Responda à substituição antes de avançar.',
            );
          o.statusIndex = Math.min(4, o.statusIndex + 1);
          o.status = ORDER_STATUSES[o.statusIndex]!;
          if (o.assembly)
            o.assembly.state =
              o.statusIndex === 1 ? 'assembling' : o.statusIndex === 4 ? 'earned' : 'ready';
          o.history.push({
            status: o.status,
            at: new Date(this.now()).toISOString(),
          });
          if (o.statusIndex === 4) {
            o.lifecycle = 'completed';
            o.paymentStatus = 'paid';
          }
          break;
        }
        case 'demoSubstitution': {
          const o = order(c.orderId);
          if (!o.allowContact || o.statusIndex !== 1 || o.lifecycle !== 'active')
            throw new DomainError(
              'SUBSTITUTION',
              'Simule uma sugestão durante a preparação, com contato autorizado.',
            );
          if (s.substitutions.some((x) => x.orderId === o.id))
            throw new DomainError('SUBSTITUTION', 'Este pedido já recebeu uma sugestão.');
          const original = o.items[0]!;
          const p = s.products.find(
            (x) =>
              x.marketId === o.marketId &&
              x.id !== original.productId &&
              x.price <= original.unitPrice &&
              x.stock >= original.quantity,
          );
          if (!p) throw new DomainError('SUBSTITUTION', 'Nenhuma alternativa disponível.');
          s.substitutions.push({
            id: uid('sub'),
            orderId: o.id,
            originalProductId: original.productId,
            replacement: {
              productId: p.id,
              name: p.name,
              unit: p.unit,
              unitPrice: p.price,
              quantity: original.quantity,
              note: '',
              emoji: p.emoji,
            },
            state: 'pending',
          });
          break;
        }
        case 'resolveSubstitution': {
          const sub = s.substitutions.find((x) => x.id === c.id);
          if (!sub || sub.state !== 'pending')
            throw new DomainError('SUBSTITUTION', 'Esta sugestão já foi respondida.');
          const o = order(sub.orderId);
          if (o.lifecycle !== 'active' || o.statusIndex !== 1)
            throw new DomainError('SUBSTITUTION', 'A preparação já foi encerrada.');
          const original = o.items.find((x) => x.productId === sub.originalProductId)!;
          const replacement = s.products.find((x) => x.id === sub.replacement.productId)!;
          if (c.accept && replacement.stock < sub.replacement.quantity)
            throw new DomainError(
              'STOCK_CHANGED',
              'A alternativa acabou. Recuse a sugestão para retirar o item.',
            );
          const old = s.products.find((x) => x.id === original.productId);
          if (old) old.stock += original.quantity;
          const difference =
            original.unitPrice * original.quantity -
            (c.accept ? sub.replacement.unitPrice * sub.replacement.quantity : 0);
          o.items = o.items.filter((x) => x.productId !== original.productId);
          if (c.accept) {
            replacement.stock -= sub.replacement.quantity;
            o.items.push(sub.replacement);
          }
          sub.state = c.accept ? 'accepted' : 'declined';
          o.quote.subtotal -= difference;
          o.quote.total -= difference;
          if (o.assembly) o.assembly.bonus = assemblyBonus(o.quote.subtotal);
          if (o.quote.assembly) o.quote.assembly.bonus = assemblyBonus(o.quote.subtotal);
          break;
        }
        case 'logout':
        case 'deleteAccount': {
          const fresh = initialSnapshot();
          fresh.onboarded = s.onboarded;
          fresh.city = s.city;
          d.snapshot = fresh;
          d.receipts = {};
          this.quotes.clear();
          this.challenges.clear();
          break;
        }
      }
      return this.save(d);
    });
  }
  requestOtp(phone: string, _channel: 'sms' | 'whatsapp') {
    return this.serial(async () => {
      const clean = digits(phone);
      if (!/^\d{10,11}$/.test(clean))
        throw new DomainError('PHONE', 'Informe DDD e telefone válidos.');
      const previous = [...this.challenges.values()].find(
        (x) => x.phone === clean && x.resendAt > this.now(),
      );
      if (previous) throw new DomainError('RATE_LIMIT', 'Aguarde o cronômetro para reenviar.');
      for (const [id, c] of this.challenges) if (c.phone === clean) this.challenges.delete(id);
      const c = {
        id: uid('otp'),
        phone: clean,
        attempts: 0,
        expiresAt: this.now() + 300000,
        resendAt: this.now() + 60000,
      };
      this.challenges.set(c.id, c);
      return { id: c.id, expiresAt: c.expiresAt, resendAt: c.resendAt };
    });
  }
  verifyOtp(id: string, code: string, name: string) {
    return this.serial(async () => {
      const c = this.challenges.get(id);
      if (!c || c.expiresAt <= this.now())
        throw new DomainError('OTP_EXPIRED', 'Código expirado. Solicite outro.');
      if (c.attempts >= 5)
        throw new DomainError(
          'OTP_LOCKED',
          'Limite de tentativas atingido. Solicite outro código após a espera.',
        );
      c.attempts++;
      if (code !== '123456')
        throw new DomainError('OTP_INVALID', 'Código inválido. Na demonstração, use 123456.');
      if (name.trim().length < 2)
        throw new DomainError('NAME', 'Informe como podemos chamar você.');
      const d = await this.read();
      d.snapshot.profile = {
        id: 'demo-customer',
        name: name.trim(),
        phone: c.phone,
        email: '',
      };
      const result = await this.save(d);
      this.challenges.delete(id);
      return result;
    });
  }
  async recover(identifier: string) {
    if (!identifier.trim()) throw new DomainError('IDENTIFIER', 'Informe seu telefone ou e-mail.');
  }
  quote(addressId: string, vehicle: Vehicle) {
    return this.serial(async () => {
      const d = await this.read();
      this.expire(d.snapshot);
      await this.save(d);
      const s = d.snapshot;
      const q = quoteCart(
        s.cart,
        s.products,
        s.markets,
        s.addresses.find((a) => a.id === addressId),
        vehicle,
        this.now(),
      );
      q.id = uid('quote');
      this.quotes.set(q.id, q);
      return clone(q);
    });
  }
  checkout(input: CheckoutInput) {
    return this.serial(async () => {
      const d = await this.read();
      const s = d.snapshot;
      this.expire(s);
      if (!s.profile) throw new DomainError('UNAUTHORIZED', 'Entre para confirmar sua feira.');
      if (!input.idempotencyKey.trim())
        throw new DomainError('IDEMPOTENCY', 'Identificador da operação ausente.');
      const fingerprint = JSON.stringify({
        quoteId: input.quoteId,
        payment: input.payment,
        cardId: input.cardId,
        cashChangeFor: input.cashChangeFor,
      });
      const receipt = d.receipts[input.idempotencyKey];
      if (receipt) {
        if (receipt.fingerprint !== fingerprint)
          throw new DomainError(
            'IDEMPOTENCY_CONFLICT',
            'Esta operação já foi usada com outros dados.',
          );
        return {
          snapshot: clone(s),
          order: clone(s.orders.find((x) => x.id === receipt.orderId)!),
        };
      }
      const q = this.quotes.get(input.quoteId);
      if (!q || q.expiresAt <= this.now() || q.revision !== s.cart.revision)
        throw new DomainError(
          'QUOTE_EXPIRED',
          'Sua cotação mudou ou expirou. Revise os valores antes de confirmar.',
        );
      const address = s.addresses.find((x) => x.id === q.addressId);
      const current = quoteCart(s.cart, s.products, s.markets, address, q.vehicle, this.now());
      if (current.addressRevision !== q.addressRevision)
        throw new DomainError(
          'QUOTE_EXPIRED',
          'O endereço foi alterado. Revise a entrega novamente.',
        );
      if (current.assembly?.policyRevision !== q.assembly?.policyRevision)
        throw new DomainError(
          'QUOTE_EXPIRED',
          'O responsável pela montagem mudou. Revise a entrega.',
        );
      if (current.total !== q.total)
        throw new DomainError('PRICE_CHANGED', 'O preço mudou. Revise sua feira.');
      if (!['pix', 'credit', 'debit', 'cash', 'terminal'].includes(input.payment))
        throw new DomainError('PAYMENT', 'Escolha uma forma de pagamento.');
      if (
        ['credit', 'debit'].includes(input.payment) &&
        !s.cards.some((x) => x.id === input.cardId)
      )
        throw new DomainError('CARD', 'Selecione um cartão demonstrativo.');
      if (
        input.payment === 'cash' &&
        input.cashChangeFor !== undefined &&
        (!Number.isSafeInteger(input.cashChangeFor) || input.cashChangeFor < q.total)
      )
        throw new DomainError('CHANGE', 'O valor para troco deve ser maior ou igual ao total.');
      const market = s.markets.find((x) => x.id === s.cart.marketId)!;
      const at = new Date(this.now()).toISOString();
      const o: Order = {
        id: uid('PA'),
        marketId: market.id,
        marketName: market.name,
        items: s.cart.items.map((i) => {
          const p = s.products.find((x) => x.id === i.productId)!;
          p.stock -= i.quantity;
          return {
            ...i,
            name: p.name,
            unit: p.unit,
            unitPrice: p.price,
            emoji: p.emoji,
          };
        }),
        quote: clone(q),
        assembly: q.assembly
          ? { ...clone(q.assembly), state: 'pending', assignedAt: at }
          : undefined,
        address: clone(address!),
        status: 'Pedido Enviado',
        statusIndex: 0,
        history: input.payment === 'pix' ? [] : [{ status: 'Pedido Enviado', at }],
        payment: input.payment,
        paymentStatus:
          input.payment === 'pix'
            ? 'pending'
            : ['cash', 'terminal'].includes(input.payment)
              ? 'on_delivery'
              : 'authorized',
        lifecycle: input.payment === 'pix' ? 'awaiting_payment' : 'active',
        createdAt: at,
        pixExpiresAt: input.payment === 'pix' ? this.now() + 300000 : undefined,
        cashChangeFor: input.cashChangeFor,
        allowContact: s.cart.allowContact,
      };
      s.orders.unshift(o);
      s.cart = {
        marketId: null,
        items: [],
        allowContact: true,
        revision: s.cart.revision + 1,
      };
      d.receipts[input.idempotencyKey] = { fingerprint, orderId: o.id };
      const snapshot = await this.save(d);
      return { snapshot, order: clone(o) };
    });
  }
}
