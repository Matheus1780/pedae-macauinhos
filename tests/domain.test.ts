import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoRepository } from '../src/data/demoRepository';
import { ApiRepository } from '../src/data/apiRepository';
import { initialSnapshot, migrateCatalog, categories } from '../src/data/fixtures';
import { selectProducts } from '../src/domain/catalog';
import { assemblyBonus, quoteCart, totals, money } from '../src/domain/rules';
import type { Address, CheckoutInput } from '../src/domain/types';
const address: Address = {
  id: 'home',
  label: 'Casa',
  street: 'Rua de teste',
  number: '123',
  neighborhood: 'Centro',
  city: 'Parambu',
  state: 'CE',
  zip: '63680000',
  complement: '',
  instructions: '',
};
function setup() {
  let clock = 1_800_000_000_000;
  const values = new Map<string, string>();
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
  };
  const repo = new DemoRepository(storage, () => clock);
  return {
    repo,
    storage,
    values,
    tick: (n: number) => {
      clock += n;
    },
  };
}
async function ready(repo: DemoRepository) {
  await repo.load();
  const ch = await repo.requestOtp('88999990000', 'sms');
  await repo.verifyOtp(ch.id, '123456', 'Pessoa de teste');
  await repo.dispatch({ type: 'saveAddress', address });
  await repo.dispatch({
    type: 'addItem',
    productId: 'bom-preco-7',
    quantity: 1,
  });
  return repo.quote('home', 'moto');
}
test('money totals include products, delivery and platform exactly', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  assert.equal(q.subtotal, 3122);
  assert.equal(q.total, 4122);
  assert.equal(q.total, q.subtotal + q.deliveryFee + q.platformFee);
  assert.match(money(q.total), /41,22/);
});
test('six-item produce basket uses the updated fixed-portion prices', () => {
  const s = initialSnapshot();
  s.cart.items = [1, 2, 3, 4, 5, 6].map((id) => ({
    productId: `bom-preco-${id}`,
    quantity: 1,
    note: '',
  }));
  assert.equal(totals(s.cart, s.products).subtotal, 4386);
});
test('negative and fractional quantities rejected without changing state', async () => {
  const { repo } = setup();
  for (const quantity of [-1, 1.5, 100])
    await assert.rejects(repo.dispatch({ type: 'addItem', productId: 'bom-preco-1', quantity }), {
      code: 'QUANTITY',
    });
  assert.equal((await repo.load()).cart.items.length, 0);
});
test('stock limits enforced and unavailable items cannot be added', async () => {
  const { repo } = setup();
  await assert.rejects(repo.dispatch({ type: 'addItem', productId: 'bom-preco-14', quantity: 1 }), {
    code: 'STOCK_CHANGED',
  });
  await assert.rejects(repo.dispatch({ type: 'addItem', productId: 'bom-preco-1', quantity: 31 }), {
    code: 'STOCK_CHANGED',
  });
});
test('market switch requires explicit confirmation', async () => {
  const { repo } = setup();
  await repo.dispatch({
    type: 'addItem',
    productId: 'bom-preco-1',
    quantity: 1,
  });
  await assert.rejects(
    repo.dispatch({ type: 'addItem', productId: 'sabor-terra-1', quantity: 1 }),
    { code: 'SWITCH_MARKET' },
  );
  assert.equal((await repo.load()).cart.marketId, 'bom-preco');
  const s = await repo.dispatch({
    type: 'addItem',
    productId: 'sabor-terra-1',
    quantity: 1,
    switchMarket: true,
  });
  assert.equal(s.cart.items.length, 1);
  assert.equal(s.cart.marketId, 'sabor-terra');
});
test('minimum and coverage block quote', async () => {
  const { repo } = setup();
  await ready(repo);
  await repo.dispatch({
    type: 'quantity',
    productId: 'bom-preco-7',
    quantity: 0,
  });
  await repo.dispatch({
    type: 'addItem',
    productId: 'bom-preco-1',
    quantity: 1,
  });
  await assert.rejects(repo.quote('home', 'moto'), { code: 'MINIMUM' });
  await repo.dispatch({
    type: 'saveAddress',
    address: { ...address, city: 'Outra cidade' },
  });
  await assert.rejects(repo.quote('home', 'moto'), {
    code: 'OUTSIDE_COVERAGE',
  });
});
test('vehicle capacity blocks overweight purchases', async () => {
  const { repo } = setup();
  await ready(repo);
  await repo.dispatch({
    type: 'quantity',
    productId: 'bom-preco-7',
    quantity: 4,
  });
  await assert.rejects(repo.quote('home', 'moto'), {
    code: 'VEHICLE_CAPACITY',
  });
  assert.equal((await repo.quote('home', 'carro')).weightGrams, 20000);
});
test('cart revisions invalidate old quotes', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  await repo.dispatch({
    type: 'quantity',
    productId: 'bom-preco-7',
    quantity: 2,
  });
  await assert.rejects(
    repo.checkout({
      quoteId: q.id,
      payment: 'cash',
      idempotencyKey: 'revision',
    }),
    { code: 'QUOTE_EXPIRED' },
  );
});
test('expired quotes require a new review', async () => {
  const { repo, tick } = setup();
  const q = await ready(repo);
  tick(300001);
  await assert.rejects(
    repo.checkout({ quoteId: q.id, payment: 'cash', idempotencyKey: 'expiry' }),
    { code: 'QUOTE_EXPIRED' },
  );
});
test('double submit and restart return one order with persisted idempotency', async () => {
  const { repo, storage } = setup();
  const q = await ready(repo);
  const input: CheckoutInput = {
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'unique',
  };
  const [a, b] = await Promise.all([repo.checkout(input), repo.checkout(input)]);
  assert.equal(a.order.id, b.order.id);
  assert.equal((await repo.load()).orders.length, 1);
  const restarted = new DemoRepository(storage);
  const replay = await restarted.checkout(input);
  assert.equal(replay.order.id, a.order.id);
  await assert.rejects(repo.checkout({ ...input, payment: 'pix' }), {
    code: 'IDEMPOTENCY_CONFLICT',
  });
});
test('cash change must cover the total', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  await assert.rejects(
    repo.checkout({
      quoteId: q.id,
      payment: 'cash',
      cashChangeFor: 100,
      idempotencyKey: 'cash',
    }),
    { code: 'CHANGE' },
  );
});
test('PIX cannot advance before payment and expiry releases reserved stock', async () => {
  const { repo, tick } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'pix',
    idempotencyKey: 'pix',
  });
  assert.equal(order.lifecycle, 'awaiting_payment');
  assert.equal(order.history.length, 0);
  await assert.rejects(repo.dispatch({ type: 'demoAdvance', orderId: order.id }), {
    code: 'ORDER_INACTIVE',
  });
  assert.equal((await repo.load()).products.find((p) => p.id === 'bom-preco-7')!.stock, 29);
  tick(300001);
  const s = await repo.load();
  assert.equal(s.orders[0]!.lifecycle, 'cancelled');
  assert.equal(s.products.find((p) => p.id === 'bom-preco-7')!.stock, 30);
  await assert.rejects(repo.dispatch({ type: 'demoPay', orderId: order.id }), {
    code: 'PIX_EXPIRED',
  });
});
test('payment confirmation unlocks exactly the five official stages', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'pix',
    idempotencyKey: 'flow',
  });
  await repo.dispatch({ type: 'demoPay', orderId: order.id });
  for (let i = 0; i < 4; i++) await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  const result = (await repo.load()).orders[0]!;
  assert.equal(result.status, 'Entregue');
  assert.equal(result.history.length, 5);
  assert.equal(result.lifecycle, 'completed');
});
test('cancellation is idempotent and does not restore stock twice', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'cancel',
  });
  await repo.dispatch({ type: 'cancel', orderId: order.id });
  await repo.dispatch({ type: 'cancel', orderId: order.id });
  assert.equal((await repo.load()).products.find((p) => p.id === 'bom-preco-7')!.stock, 30);
});
test('substitution requires explicit approval and adjusts total without an increase', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'sub',
  });
  await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  const suggestion = await repo.dispatch({
    type: 'demoSubstitution',
    orderId: order.id,
  });
  assert.equal(suggestion.orders[0]!.quote.total, q.total);
  await assert.rejects(repo.dispatch({ type: 'demoAdvance', orderId: order.id }), {
    code: 'SUBSTITUTION_PENDING',
  });
  const s = await repo.dispatch({
    type: 'resolveSubstitution',
    id: suggestion.substitutions[0]!.id,
    accept: true,
  });
  assert.ok(s.orders[0]!.quote.total < q.total);
  assert.equal(s.orders[0]!.items[0]!.productId, s.substitutions[0]!.replacement.productId);
  await assert.rejects(
    repo.dispatch({
      type: 'resolveSubstitution',
      id: s.substitutions[0]!.id,
      accept: true,
    }),
    { code: 'SUBSTITUTION' },
  );
});
test('OTP expires, rate limits resend and limits guesses', async () => {
  const { repo, tick } = setup();
  const ch = await repo.requestOtp('88999990000', 'sms');
  await assert.rejects(repo.requestOtp('88999990000', 'sms'), {
    code: 'RATE_LIMIT',
  });
  for (let i = 0; i < 5; i++)
    await assert.rejects(repo.verifyOtp(ch.id, '000000', 'Teste'), {
      code: 'OTP_INVALID',
    });
  await assert.rejects(repo.verifyOtp(ch.id, '123456', 'Teste'), {
    code: 'OTP_LOCKED',
  });
  tick(60000);
  const ch2 = await repo.requestOtp('88999990000', 'whatsapp');
  tick(300001);
  await assert.rejects(repo.verifyOtp(ch2.id, '123456', 'Teste'), {
    code: 'OTP_EXPIRED',
  });
});
test('concurrent additions are serialized, with no lost updates', async () => {
  const { repo } = setup();
  await Promise.all(
    Array.from({ length: 10 }, () =>
      repo.dispatch({ type: 'addItem', productId: 'bom-preco-1', quantity: 1 }),
    ),
  );
  assert.equal((await repo.load()).cart.items[0]!.quantity, 10);
});
test('storage failure does not commit a partial cart mutation', async () => {
  let fail = false;
  let value: string | null = null;
  const repo = new DemoRepository({
    getItem: async () => value,
    setItem: async (_k, v) => {
      if (fail) throw Error('disk full');
      value = v;
    },
  });
  await repo.load();
  fail = true;
  await assert.rejects(repo.dispatch({ type: 'addItem', productId: 'bom-preco-1', quantity: 1 }));
  fail = false;
  assert.equal((await repo.load()).cart.items.length, 0);
});
test('logout clears personal data and private commands require login', async () => {
  const { repo } = setup();
  await ready(repo);
  const s = await repo.dispatch({ type: 'logout' });
  assert.equal(s.profile, null);
  assert.deepEqual(s.addresses, []);
  await assert.rejects(repo.dispatch({ type: 'saveAddress', address }), {
    code: 'UNAUTHORIZED',
  });
});
test('API uses bearer auth and idempotency header without exposing DB credentials', async () => {
  const calls: { url: string; options: RequestInit }[] = [];
  const api = new ApiRepository(
    'https://api.example.com/v1',
    { get: async () => 'session-test', set: async () => {} },
    async (url, options) => {
      calls.push({ url: String(url), options: options! });
      return new Response(JSON.stringify({ snapshot: initialSnapshot(), order: { id: 'o' } }), {
        status: 200,
      });
    },
  );
  await api.checkout({
    quoteId: 'q',
    payment: 'pix',
    idempotencyKey: 'request-1',
  });
  assert.equal(calls[0]!.url, 'https://api.example.com/v1/checkout');
  assert.equal(
    (calls[0]!.options.headers as Record<string, string>)['Idempotency-Key'],
    'request-1',
  );
  assert.equal(
    (calls[0]!.options.headers as Record<string, string>).Authorization,
    'Bearer session-test',
  );
  await assert.rejects(api.dispatch({ type: 'demoAdvance', orderId: 'o' }), {
    code: 'DEMO_ONLY',
  });
  assert.throws(
    () =>
      new ApiRepository('http://insecure', {
        get: async () => null,
        set: async () => {},
      }),
  );
});
test('API surfaces backend errors with actionable domain codes', async () => {
  const api = new ApiRepository(
    'https://api.example.com',
    { get: async () => null, set: async () => {} },
    async () =>
      new Response(JSON.stringify({ code: 'STOCK_CHANGED', message: 'Revise o estoque.' }), {
        status: 409,
      }),
  );
  await assert.rejects(api.load(), {
    code: 'STOCK_CHANGED',
    message: 'Revise o estoque.',
  });
});

test('editing the delivery address invalidates a previously approved quote', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  await repo.dispatch({ type: 'saveAddress', address: { ...address, number: '999' } });
  await assert.rejects(
    repo.checkout({ quoteId: q.id, payment: 'cash', idempotencyKey: 'address-changed' }),
    { code: 'QUOTE_EXPIRED' },
  );
});

test('quotes for different vehicles cannot overwrite each other in the same millisecond', async () => {
  const { repo } = setup();
  const moto = await ready(repo);
  const carro = await repo.quote('home', 'carro');
  assert.notEqual(moto.id, carro.id);
  const { order } = await repo.checkout({
    quoteId: moto.id,
    payment: 'cash',
    idempotencyKey: 'vehicle',
  });
  assert.equal(order.quote.vehicle, 'moto');
  assert.equal(order.quote.total, moto.total);
});

test('changing a saved address cannot alter an existing order snapshot', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'snapshot',
  });
  await repo.dispatch({ type: 'saveAddress', address: { ...address, street: 'Rua nova' } });
  assert.equal(
    (await repo.load()).orders.find((o) => o.id === order.id)!.address.street,
    'Rua de teste',
  );
});

test('each market has 20 distinct products and image cells per category', () => {
  const s = initialSnapshot();
  for (const m of s.markets)
    for (const category of categories) {
      const items = s.products.filter((p) => p.marketId === m.id && p.category === category.name);
      assert.equal(items.length, 20);
      assert.equal(new Set(items.map((p) => p.name)).size, 20);
      assert.equal(new Set(items.map((p) => p.image)).size, 20);
      assert(items.every((p) => p.image.startsWith('atlas:') && p.priceReference && p.price > 0));
    }
  assert.equal(new Set(s.products.map((p) => p.id)).size, 360);
});
test('assembly bonus rounds once in cents, on products only', () => {
  for (const [base, bonus] of [
    [0, 0],
    [33, 0],
    [34, 1],
    [100, 2],
    [10000, 150],
    [3122, 47],
  ])
    assert.equal(assemblyBonus(base!), bonus);
  for (const invalid of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    assert.throws(() => assemblyBonus(invalid));
});
test('platform funds assembly and changing vehicle never changes the bonus', async () => {
  const { repo } = setup();
  const moto = await ready(repo),
    carro = await repo.quote('home', 'carro');
  assert.equal(moto.assembly?.by, 'market');
  assert.equal(moto.assembly?.fundedBy, 'platform');
  assert.equal(moto.assembly?.bonus, 47);
  assert.equal(carro.assembly?.bonus, 47);
  assert.equal(moto.total, 4122);
  assert.equal(carro.total - moto.total, 700);
});
test('courier receives the bonus when the market does not assemble', async () => {
  const { repo } = setup();
  await ready(repo);
  await repo.dispatch({
    type: 'addItem',
    productId: 'sabor-terra-7',
    quantity: 1,
    switchMarket: true,
  });
  const q = await repo.quote('home', 'moto');
  assert.equal(q.assembly?.by, 'courier');
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'courier',
  });
  assert.equal(order.assembly?.by, 'courier');
  assert.equal(order.assembly?.bonus, 47);
  assert.equal(order.quote.deliveryFee, 790);
  assert.equal(order.quote.total, 4122);
});
test('market policy changes invalidate quotes even when the total stays equal', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  await repo.dispatch({ type: 'demoConfigureAssembly', marketId: 'bom-preco', by: 'courier' });
  await assert.rejects(
    repo.checkout({ quoteId: q.id, payment: 'cash', idempotencyKey: 'stale-policy' }),
    { code: 'QUOTE_EXPIRED' },
  );
  const fresh = await repo.quote('home', 'moto');
  assert.equal(fresh.total, q.total);
  assert.equal(fresh.assembly?.by, 'courier');
});
test('delegation transfers the one bonus without charging the client again', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'delegate',
  });
  await repo.dispatch({ type: 'demoDelegateAssembly', orderId: order.id });
  let s = await repo.dispatch({ type: 'demoDelegateAssembly', orderId: order.id });
  assert.equal(s.orders[0]!.assembly?.by, 'courier');
  assert.equal(s.orders[0]!.quote.total, q.total);
  assert.equal(s.orders[0]!.quote.assembly?.by, 'market'); // Original quote snapshot is retained.
  s = await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  assert.equal(s.orders[0]!.assembly?.state, 'assembling');
  s = await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  assert.equal(s.orders[0]!.assembly?.state, 'ready');
  await assert.rejects(repo.dispatch({ type: 'demoDelegateAssembly', orderId: order.id }), {
    code: 'ASSEMBLY_CLOSED',
  });
  await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  s = await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  assert.equal(s.orders[0]!.assembly?.state, 'earned');
  assert.equal(s.orders[0]!.assembly?.bonus, 47);
  await assert.rejects(repo.dispatch({ type: 'demoAdvance', orderId: order.id }), {
    code: 'ORDER_INACTIVE',
  });
});
test('cancellation and PIX expiration void the bonus', async () => {
  for (const expire of [false, true]) {
    const { repo, tick } = setup();
    const q = await ready(repo);
    const { order } = await repo.checkout({
      quoteId: q.id,
      payment: 'pix',
      idempotencyKey: 'void',
    });
    if (expire) tick(300001);
    else await repo.dispatch({ type: 'cancel', orderId: order.id });
    assert.equal((await repo.load()).orders[0]!.assembly?.state, 'void');
  }
});
test('substitution updates bonus from the remaining product subtotal', async () => {
  const { repo } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'sub-bonus',
  });
  await repo.dispatch({ type: 'demoAdvance', orderId: order.id });
  const s = await repo.dispatch({ type: 'demoSubstitution', orderId: order.id });
  const result = await repo.dispatch({
    type: 'resolveSubstitution',
    id: s.substitutions[0]!.id,
    accept: true,
  });
  const o = result.orders[0]!;
  assert.equal(o.assembly?.bonus, assemblyBonus(o.quote.subtotal));
  assert.equal(o.quote.total, o.quote.subtotal + o.quote.deliveryFee + o.quote.platformFee);
});
test('catalog migration retains historical order money, stock and the existing cart', async () => {
  const { repo, values, storage } = setup();
  const q = await ready(repo);
  const { order } = await repo.checkout({
    quoteId: q.id,
    payment: 'cash',
    idempotencyKey: 'legacy-order',
  });
  await repo.dispatch({
    type: 'addItem',
    productId: 'bom-preco-1',
    quantity: 2,
    note: 'Menos madura',
  });
  const legacy = JSON.parse(values.get('pedeae.demo.v1')!);
  delete legacy.snapshot.catalogVersion;
  legacy.snapshot.products = legacy.snapshot.products.filter(
    (p: { id: string }) => /-(?:[1-9]|1[0-4])$/.test(p.id) && !p.id.includes('mercearia'),
  );
  delete legacy.snapshot.orders[0].assembly;
  delete legacy.snapshot.orders[0].quote.assembly;
  values.set('pedeae.demo.v1', JSON.stringify(legacy));
  const upgraded = await new DemoRepository(storage).load();
  assert.equal(upgraded.products.length, 360);
  assert.equal(upgraded.orders[0]!.quote.total, order.quote.total);
  assert.equal(upgraded.orders[0]!.assembly, undefined);
  assert.equal(upgraded.cart.items[0]!.quantity, 2);
  assert.equal(upgraded.cart.items[0]!.note, 'Menos madura');
  assert.equal(upgraded.products.find((p) => p.id === 'bom-preco-7')!.stock, 29);
  assert.deepEqual(migrateCatalog(upgraded), upgraded);
});

test('favorites survive restart and login, are idempotent and clear on logout', async () => {
  const { repo, storage } = setup();
  await repo.dispatch({ type: 'addItem', productId: 'bom-preco-7', quantity: 1 });
  await repo.dispatch({ type: 'setFavorite', productId: 'bom-preco-7', value: true });
  await repo.dispatch({ type: 'setFavorite', productId: 'bom-preco-7', value: true });
  const restarted = new DemoRepository(storage);
  assert.deepEqual((await restarted.load()).favoriteProductIds, ['bom-preco-7']);
  const ch = await restarted.requestOtp('88999990000', 'sms');
  const logged = await restarted.verifyOtp(ch.id, '123456', 'Cliente Teste');
  assert.deepEqual(logged.favoriteProductIds, ['bom-preco-7']);
  assert.equal(logged.cart.items[0]!.quantity, 1);
  await assert.rejects(
    restarted.dispatch({ type: 'setFavorite', productId: 'missing', value: true }),
    { code: 'PRODUCT' },
  );
  assert.deepEqual((await restarted.dispatch({ type: 'logout' })).favoriteProductIds, []);
});
test('older stored snapshots gain favorites without losing their cart', async () => {
  const { repo, values, storage } = setup();
  await repo.dispatch({ type: 'addItem', productId: 'bom-preco-7', quantity: 2 });
  const raw = JSON.parse(values.get('pedeae.demo.v1')!);
  delete raw.snapshot.favoriteProductIds;
  values.set('pedeae.demo.v1', JSON.stringify(raw));
  const updated = await new DemoRepository(storage).load();
  assert.deepEqual(updated.favoriteProductIds, []);
  assert.equal(updated.cart.items[0]!.quantity, 2);
});

test('catalog filters combine and price sorting does not mutate the catalog', () => {
  const data = initialSnapshot();
  const before = data.products.map((p) => p.id);
  const list = selectProducts(data.products, {
    marketId: 'bom-preco',
    availableOnly: true,
    sort: 'priceAsc',
  });
  assert.ok(list.every((p) => p.stock > 0 && p.marketId === 'bom-preco'));
  assert.ok(list.every((p, i) => i === 0 || p.price >= list[i - 1]!.price));
  assert.deepEqual(
    data.products.map((p) => p.id),
    before,
  );
  assert.deepEqual(
    selectProducts(data.products, {
      marketId: 'bom-preco',
      favoritesOnly: true,
      favoriteIds: ['sabor-terra-7'],
    }),
    [],
  );
  assert.equal(
    selectProducts(data.products, {
      marketId: 'bom-preco',
      query: 'JOAO',
      favoritesOnly: true,
      favoriteIds: ['bom-preco-7'],
    })[0]!.id,
    'bom-preco-7',
  );
});
