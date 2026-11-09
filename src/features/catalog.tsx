import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { BrandLogo } from '../ui/BrandLogo';
import { useTheme } from '../state/ThemeProvider';
import { feedback } from '../ui/feedback';
import { categories } from '../data/fixtures';
import type { Market, Product } from '../domain/types';
import { normalize, money } from '../domain/rules';
import {
  Screen,
  Card,
  Heading,
  Icon,
  IconButton,
  ProductImage,
  Button,
  Badge,
  Empty,
  Field,
  Stepper,
  Confirm,
  Banner,
  useUI,
} from '../ui/components';
import type { IconName } from '../ui/components';
export function MarketCard({ market }: { market: Market }) {
  const { c, s } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${market.name}`}
      onPress={() => router.push(`/market/${market.id}`)}
    >
      <Card>
        <View style={s.row}>
          <Image
            source={{ uri: market.image }}
            style={{
              width: 84,
              height: 84,
              borderRadius: 14,
              backgroundColor: c.soft,
            }}
          />
          <View style={s.flex}>
            <Text style={s.sectionTitle}>{market.name}</Text>
            <Text style={s.small}>
              ★ {market.rating.toFixed(1)} · {market.distanceKm.toFixed(1).replace('.', ',')} km ·{' '}
              {market.eta}
            </Text>
            <View style={[s.row, { marginTop: 7 }]}>
              <Badge
                text={market.open ? 'Aberto agora' : 'Fechado'}
                tone={market.open ? 'green' : 'gray'}
              />
              <Text style={s.small}>{market.neighborhood}</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} />
        </View>
      </Card>
    </Pressable>
  );
}
export function ProductCard({
  product,
  showMarket = false,
}: {
  product: Product;
  showMarket?: boolean;
}) {
  const { c, s } = useUI();
  const a = useApp();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const cardWidth = (Math.min(width, 1080) - 40 - 12 * (columns - 1)) / columns;
  const quantity = a.data!.cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const market = a.data!.markets.find((m) => m.id === product.marketId);
  const [pending, setPending] = useState(false),
    [switching, setSwitching] = useState(false);
  const lock = useRef(false);
  const disabled = !product.stock || !market?.open;
  async function change(delta: number, force = false) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    try {
      if (delta > 0)
        await a.send({ type: 'addItem', productId: product.id, quantity: 1, switchMarket: force });
      else
        await a.send({
          type: 'quantity',
          productId: product.id,
          quantity: Math.max(0, quantity - 1),
        });
      setSwitching(false);
      feedback('success');
      if (!quantity || force) a.notify('Adicionado à Minha feira');
    } catch (e) {
      if ((e as { code?: string }).code === 'SWITCH_MARKET') setSwitching(true);
      else a.notify((e as Error).message, true);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <View style={{ width: cardWidth }} testID={`product-card-${product.id}`}>
      <Card style={{ padding: 12, gap: 8, height: showMarket ? 326 : 304 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver ${product.name}`}
          onPress={() => router.push(`/product/${product.id}`)}
          style={{ gap: 6, flex: 1 }}
        >
          <View
            style={{
              alignItems: 'center',
              backgroundColor: c.photo,
              borderRadius: 10,
              paddingVertical: 8,
            }}
          >
            <ProductImage
              uri={product.image}
              emoji={product.emoji}
              size={Math.min(120, cardWidth - 26)}
            />
          </View>
          <Text
            style={[s.label, { fontSize: 14, lineHeight: 20, minHeight: 40 }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text style={s.small}>{product.unit}</Text>
          {showMarket && (
            <Text style={[s.small, { fontSize: 11 }]} numberOfLines={1}>
              {market?.name}
            </Text>
          )}
        </Pressable>
        <Text style={[s.label, { fontSize: 18, fontWeight: '700' }]}>{money(product.price)}</Text>
        <View
          style={[
            s.row,
            {
              justifyContent: 'space-between',
              gap: 0,
              borderWidth: 1,
              borderColor: c.line,
              borderRadius: 10,
              minHeight: 44,
            },
          ]}
        >
          {quantity > 0 ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Diminuir ${product.name}`}
                disabled={pending}
                onPress={() => void change(-1)}
                style={{ height: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name={quantity === 1 ? 'trash-outline' : 'remove'} size={19} />
              </Pressable>
              <Text style={s.label} accessibilityLiveRegion="polite">
                {quantity}
              </Text>
            </>
          ) : (
            <Text style={[s.small, { paddingLeft: 10, flex: 1 }]}>
              {!product.stock ? 'Esgotado' : !market?.open ? 'Fechado' : 'Adicionar'}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${product.name}`}
            accessibilityState={{
              disabled: disabled || pending || quantity >= Math.min(99, product.stock),
              busy: pending,
            }}
            disabled={disabled || pending || quantity >= Math.min(99, product.stock)}
            onPress={() => void change(1)}
            style={{
              height: 44,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.4 : 1,
              backgroundColor: c.soft,
              borderRadius: 9,
            }}
          >
            {pending ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <Icon name="add" size={23} />
            )}
          </Pressable>
        </View>
      </Card>
      <Confirm
        visible={switching}
        title="Começar uma feira neste mercado?"
        message={`Sua feira atual será substituída por uma nova em ${market?.name}.`}
        confirm="Trocar de mercado"
        onCancel={() => setSwitching(false)}
        onConfirm={() => void change(1, true)}
      />
    </View>
  );
}
export function Home() {
  const { c, s } = useUI();
  const a = useApp(),
    data = a.data!;
  const theme = useTheme();
  const covered = normalize(data.city).includes('parambu');
  const [banner, setBanner] = useState(0);
  const promos = [
    {
      title: 'Frescos para a semana',
      body: 'Frutas e verduras dos mercados perto de você.',
      category: 'Hortifruti',
      image: 'atlas:hortifruti:0',
    },
    {
      title: 'O básico bem escolhido',
      body: 'Arroz, feijão e os itens que fazem parte da sua rotina.',
      category: 'Mercearia',
      image: 'atlas:mercearia:0',
    },
  ];
  const promo = promos[banner]!;
  return (
    <Screen
      back={false}
      refresh
      fixedTop={
        <>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <BrandLogo width={165} />
            <View style={[s.row, { gap: 0 }]}>
              <IconButton
                name={theme.dark ? 'sunny-outline' : 'moon-outline'}
                label={theme.dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                onPress={() =>
                  void theme
                    .setPreference(theme.dark ? 'light' : 'dark')
                    .catch(() => a.notify('Não foi possível salvar o tema.', true))
                }
              />
              <IconButton
                name="notifications-outline"
                label="Notificações"
                onPress={() => router.push('/notifications')}
              />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar localização"
            onPress={() => router.push('/location')}
            style={[s.row, { paddingVertical: 10 }]}
          >
            <Icon name="location-outline" size={17} />
            <Text style={s.label}>{data.city || 'Escolher localização'}</Text>
            <Icon name="chevron-down" size={14} />
          </Pressable>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Buscar produtos ou mercados"
            onPress={() => router.push('/search')}
            style={[s.input, s.row, { backgroundColor: c.surface }]}
          >
            <Icon name="search-outline" color={c.muted} />
            <Text style={s.small}>Busque um produto ou mercado</Text>
          </Pressable>
        </>
      }
    >
      <Card style={{ backgroundColor: c.soft, borderWidth: 0, padding: 20 }}>
        <View style={[s.row, { gap: 12 }]}>
          <View style={[s.flex, { gap: 8 }]}>
            <Text style={[s.sectionTitle, { fontSize: 24, lineHeight: 29 }]}>{promo.title}</Text>
            <Text style={s.small}>{promo.body}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/search', params: { category: promo.category } })
              }
              style={{ paddingVertical: 10 }}
            >
              <Text style={s.link}>Ver produtos →</Text>
            </Pressable>
          </View>
          <ProductImage uri={promo.image} emoji="" size={102} />
        </View>
        <View style={[s.row, { justifyContent: 'center', gap: 4 }]}>
          {promos.map((_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Banner ${i + 1}`}
              accessibilityState={{ selected: banner === i }}
              onPress={() => setBanner(i)}
              style={{ padding: 10 }}
            >
              <View
                style={{
                  width: banner === i ? 20 : 6,
                  height: 4,
                  borderRadius: 3,
                  backgroundColor: banner === i ? c.primary : c.line,
                }}
              />
            </Pressable>
          ))}
        </View>
      </Card>
      <View>
        <Heading title="Categorias" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {categories.map((cat) => (
            <Pressable
              key={cat.name}
              accessibilityRole="button"
              accessibilityLabel={cat.name}
              onPress={() => router.push({ pathname: '/search', params: { category: cat.name } })}
              style={{
                width: '30%',
                flexGrow: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 16,
                paddingHorizontal: 4,
                borderRadius: 12,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
              }}
            >
              <Icon name={cat.icon as IconName} size={27} />
              <Text style={[s.small, { textAlign: 'center', color: c.ink, fontWeight: '500' }]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Heading
          title="Mercados próximos"
          action="Ver todos"
          onAction={() => router.push('/markets')}
        />
        {covered ? (
          <View style={{ gap: 10 }}>
            {data.markets.slice(0, 2).map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </View>
        ) : (
          <Empty
            title="Ainda não chegamos por aqui"
            description="Escolha Parambu, CE para explorar a demonstração."
            action="Alterar cidade"
            onAction={() => router.push('/location')}
          />
        )}
      </View>
      {covered && (
        <View>
          <Heading
            title="Para sua próxima feira"
            subtitle="Seleção do Mercado Bom Preço"
            action="Ver catálogo"
            onAction={() => router.push('/market/bom-preco')}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {['bom-preco-7', 'bom-preco-8', 'bom-preco-1', 'bom-preco-10']
              .map((id) => data.products.find((p) => p.id === id))
              .filter((p): p is Product => !!p)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </View>
        </View>
      )}
      <Text style={[s.small, { textAlign: 'center' }]}>
        Seu mercado local. Sua feira do seu jeito.
      </Text>
    </Screen>
  );
}
export function Markets() {
  const { c, s } = useUI();
  const { data } = useApp();
  const [sort, setSort] = useState('Próximos');
  const list = [...data!.markets]
    .filter((m) => sort !== 'Abertos' || m.open)
    .sort((a, b) => (sort === 'Bem avaliados' ? b.rating - a.rating : a.distanceKm - b.distanceKm));
  return (
    <Screen title="Mercados locais" subtitle={data!.city} refresh>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {['Próximos', 'Abertos', 'Bem avaliados'].map((label) => (
          <Pressable
            key={label}
            onPress={() => setSort(label)}
            style={{
              padding: 13,
              borderRadius: 24,
              backgroundColor: sort === label ? c.primary : c.surface,
              borderWidth: 1,
              borderColor: c.line,
            }}
          >
            <Text
              style={{
                color: sort === label ? c.onPrimary : c.ink,
                fontWeight: '600',
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {normalize(data!.city).includes('parambu') ? (
        list.map((m) => <MarketCard key={m.id} market={m} />)
      ) : (
        <Empty
          title="Sem mercados nesta cidade"
          description="A demonstração está disponível em Parambu, CE."
          action="Alterar cidade"
          onAction={() => router.push('/location')}
        />
      )}
    </Screen>
  );
}
export function Search() {
  const { c, s } = useUI();
  const a = useApp();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState(''),
    [debounced, setDebounced] = useState('');
  const [limit, setLimit] = useState(24);
  useEffect(() => setLimit(24), [debounced, category]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);
  const matched = a.data!.products.filter(
    (p) =>
      (!category || p.category === category) && normalize(p.name).includes(normalize(debounced)),
  );
  const markets = a.data!.markets.filter((m) => normalize(m.name).includes(normalize(debounced)));
  const remember = (q: string) =>
    void a.send({ type: 'search', query: q }).catch((e) => a.notify(e.message, true));
  return (
    <Screen title={category || 'Encontre sua próxima feira'}>
      <Field
        label="Buscar produtos e mercados"
        placeholder="Arroz, banana, mercado..."
        value={query}
        onChangeText={setQuery}
        autoFocus={!category}
        returnKeyType="search"
        onSubmitEditing={() => remember(query)}
      />
      {!query && !category ? (
        <>
          <Heading
            title="Buscas recentes"
            action="Limpar"
            onAction={() =>
              void a.send({ type: 'clearSearches' }).catch((e) => a.notify(e.message, true))
            }
          />
          {a.data!.recentSearches.length ? (
            a.data!.recentSearches.map((q) => (
              <Pressable
                key={q}
                onPress={() => {
                  setQuery(q);
                  remember(q);
                }}
                style={[s.row, { padding: 12 }]}
              >
                <Icon name="time-outline" />
                <Text style={s.body}>{q}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={s.small}>Suas buscas aparecerão aqui.</Text>
          )}
          <Heading title="Explore por categoria" />
          {categories.map((cat) => (
            <Pressable
              key={cat.name}
              onPress={() =>
                router.replace({
                  pathname: '/search',
                  params: { category: cat.name },
                })
              }
              style={[s.row, { padding: 12 }]}
            >
              <Icon name={cat.icon as IconName} />
              <Text style={s.body}>{cat.name}</Text>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          {!category && markets.map((m) => <MarketCard key={m.id} market={m} />)}
          <Heading
            title="Produtos"
            subtitle="O mercado aparece em cada produto. Sua feira reúne itens de um mercado."
          />
          {matched.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {matched.slice(0, limit).map((p) => (
                <ProductCard key={p.id} product={p} showMarket />
              ))}
            </View>
          ) : (
            <Empty
              icon="search-outline"
              title="Nenhum resultado"
              description="Tente outro nome ou uma categoria diferente."
            />
          )}
          {matched.length > limit && (
            <Button
              secondary
              label="Mostrar mais resultados"
              onPress={() => setLimit((n) => n + 24)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
export function Catalog() {
  const { c, s } = useUI();
  const a = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState('Todos'),
    [query, setQuery] = useState('');
  const [limit, setLimit] = useState(24);
  const [assemblyDemo, setAssemblyDemo] = useState(false);
  useEffect(() => setLimit(24), [id, category, query]);
  const market = a.data!.markets.find((m) => m.id === id);
  if (!market)
    return (
      <Screen title="Mercado">
        <Empty
          title="Mercado não encontrado"
          description="Volte à lista para escolher outro estabelecimento."
        />
      </Screen>
    );
  const list = a.data!.products.filter(
    (p) =>
      p.marketId === id &&
      (category === 'Todos' || p.category === category) &&
      normalize(p.name).includes(normalize(query)),
  );
  return (
    <Screen
      title={market.name}
      subtitle={`${market.eta} · ★ ${market.rating} · ${market.distanceKm} km`}
      refresh
      footer={
        a.data!.cart.items.length ? (
          <Button
            label="Ver Minha feira"
            icon="basket-outline"
            onPress={() => router.push('/(tabs)/feira')}
          />
        ) : undefined
      }
    >
      <Image
        source={{ uri: market.image }}
        style={{
          width: '100%',
          height: 150,
          borderRadius: 20,
          backgroundColor: c.soft,
        }}
      />
      <View style={s.row}>
        <Badge
          text={market.open ? 'Aberto agora' : 'Fechado'}
          tone={market.open ? 'green' : 'gray'}
        />
        <Text style={s.small}>Mínimo {money(market.minimum)}</Text>
      </View>
      {!market.open && (
        <Banner text="Você pode consultar os produtos. Novos pedidos ficam disponíveis quando o mercado abrir." />
      )}
      <Field
        label="Buscar neste mercado"
        placeholder="Qual produto você procura?"
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {['Todos', ...categories.map((x) => x.name)].map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            style={{
              padding: 12,
              borderRadius: 24,
              backgroundColor: cat === category ? c.primary : c.soft,
            }}
          >
            <Text
              style={{
                fontWeight: '600',
                color: cat === category ? c.onPrimary : c.primary,
              }}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Text style={s.small}>{list.length} produtos</Text>
        <Text style={s.small}>
          {market.assemblyMode === 'market' ? 'Montagem pelo mercado' : 'Montagem pelo entregador'}
        </Text>
      </View>
      {list.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {list.slice(0, limit).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </View>
      ) : (
        <Empty
          title="Nenhum produto encontrado"
          description="Experimente outra categoria ou busca."
        />
      )}
      {list.length > limit && (
        <Button
          secondary
          label={`Mostrar mais produtos (${list.length - limit})`}
          onPress={() => setLimit((n) => n + 24)}
        />
      )}
      {a.demo && (
        <Card>
          <Pressable accessibilityRole="button" onPress={() => setAssemblyDemo(!assemblyDemo)}>
            <Text style={s.link}>Testar cenários de montagem {assemblyDemo ? '−' : '+'}</Text>
          </Pressable>
          {assemblyDemo && (
            <>
              <Text style={s.small}>
                Controle de demonstração. No serviço real, esta escolha pertence ao mercado.
              </Text>
              <Button
                secondary
                label={
                  market.assemblyMode === 'market'
                    ? 'Simular: entregador monta'
                    : 'Simular: mercado monta'
                }
                onPress={() =>
                  void a
                    .send({
                      type: 'demoConfigureAssembly',
                      marketId: market.id,
                      by: market.assemblyMode === 'market' ? 'courier' : 'market',
                    })
                    .then(() => a.notify('Responsável pela montagem atualizado'))
                    .catch((e) => a.notify(e.message, true))
                }
              />
            </>
          )}
        </Card>
      )}
    </Screen>
  );
}
export function ProductDetail() {
  const { c, s } = useUI();
  const a = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1),
    [note, setNote] = useState(''),
    [zoom, setZoom] = useState(false),
    [switching, setSwitching] = useState(false);
  const p = a.data!.products.find((x) => x.id === id);
  if (!p)
    return (
      <Screen title="Produto">
        <Empty
          title="Produto indisponível"
          description="Volte ao catálogo para escolher outro item."
        />
      </Screen>
    );
  const market = a.data!.markets.find((x) => x.id === p.marketId)!;
  const alreadyAdded = a.data!.cart.items.find((i) => i.productId === p.id)?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(99 - alreadyAdded, p.stock - alreadyAdded));
  async function add(force = false) {
    try {
      await a.send({
        type: 'addItem',
        productId: p!.id,
        quantity,
        note,
        switchMarket: force,
      });
      setSwitching(false);
      a.notify('Adicionado à Minha feira');
      router.back();
    } catch (e) {
      if ((e as { code?: string }).code === 'SWITCH_MARKET') setSwitching(true);
      else a.notify((e as Error).message, true);
    }
  }
  return (
    <Screen
      title="Detalhes do produto"
      footer={
        <Button
          label={`Adicionar à Minha Feira · ${money(p.price * quantity)}`}
          icon="basket-outline"
          onPress={() => void add()}
          loading={a.busy}
          disabled={!remaining || !market.open}
        />
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ampliar imagem do produto"
        onPress={() => setZoom(true)}
        style={{
          alignItems: 'center',
          backgroundColor: c.surface,
          padding: 20,
          borderRadius: 24,
        }}
      >
        <ProductImage uri={p.image} emoji={p.emoji} size={250} />
        <Text style={s.small}>Toque para ampliar</Text>
      </Pressable>
      <View style={s.row}>
        <Badge text={p.stock ? 'Disponível' : 'Esgotado'} tone={p.stock ? 'green' : 'gray'} />
        <Text style={s.small}>{market.name}</Text>
      </View>
      <Text style={s.heroTitle}>{p.name}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: c.primary }}>{money(p.price)}</Text>
      <Text style={s.small}>{p.unit}</Text>
      <Text style={s.body}>{p.description}</Text>
      {a.demo && (
        <Card>
          <Text style={s.small}>
            Imagem ilustrativa gerada por IA. A embalagem recebida pode variar.
          </Text>
          <Text style={s.small}>
            {p.priceReference?.kind === 'estimated'
              ? 'Preço estimado para demonstração.'
              : 'Preço de referência pesquisado em 09/11/2026; pode variar conforme a loja e a região.'}
          </Text>
          {p.priceReference?.source && (
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                void Linking.openURL(p.priceReference!.source!).catch(() =>
                  a.notify('Não foi possível abrir a referência.', true),
                )
              }
            >
              <Text style={s.link}>Consultar referência de preço</Text>
            </Pressable>
          )}
        </Card>
      )}
      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View>
            <Text style={s.label}>Quantidade</Text>
            <Text style={s.small}>Você pode adicionar mais {remaining}</Text>
          </View>
          <Stepper value={quantity} onChange={setQuantity} min={1} max={remaining} />
        </View>
      </Card>
      <Field
        label="Observações para o mercado"
        placeholder="Ex.: escolher frutas menos maduras"
        multiline
        maxLength={240}
        value={note}
        onChangeText={setNote}
        hint={`${note.length}/240 caracteres`}
      />
      <Confirm
        visible={switching}
        title="Começar uma feira neste mercado?"
        message="Cada feira pertence a um mercado. Os itens da feira atual serão retirados se você continuar."
        confirm="Trocar de mercado"
        onConfirm={() => void add(true)}
        onCancel={() => setSwitching(false)}
      />
      <Modal visible={zoom} onRequestClose={() => setZoom(false)} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: c.surface,
            padding: 24,
            paddingTop: 60,
          }}
        >
          <Button label="Fechar imagem" secondary onPress={() => setZoom(false)} />
          <ScrollView
            minimumZoomScale={1}
            maximumZoomScale={3}
            centerContent
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ProductImage uri={p.image} emoji={p.emoji} size={330} />
          </ScrollView>
          <Text style={[s.small, { textAlign: 'center' }]}>
            Imagem ilustrativa. Zoom por pinça disponível no iOS.
          </Text>
        </View>
      </Modal>
    </Screen>
  );
}
