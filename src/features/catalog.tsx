import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, ScrollView, TextInput, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../state/AppProvider';
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
  s,
} from '../ui/components';
import type { IconName } from '../ui/components';
import { colors as c } from '../ui/theme';
export function MarketCard({ market }: { market: Market }) {
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
export function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${product.name}`}
      onPress={() => router.push(`/product/${product.id}`)}
      style={{ width: '48%', minWidth: 140 }}
    >
      <Card style={{ padding: 12, height: 276 }}>
        <View style={{ alignItems: 'center' }}>
          <ProductImage uri={product.image} emoji={product.emoji} size={112} />
        </View>
        <Text style={[s.label, { height: 42 }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={s.small}>{product.unit}</Text>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: c.primary }}>
            {money(product.price)}
          </Text>
          <View
            style={{
              backgroundColor: product.stock ? c.soft : c.line,
              borderRadius: 12,
              padding: 8,
            }}
          >
            <Icon name={product.stock ? 'add' : 'close'} size={20} />
          </View>
        </View>
        {!product.stock && <Text style={s.error}>Esgotado</Text>}
      </Card>
    </Pressable>
  );
}
export function Home() {
  const a = useApp();
  const data = a.data!;
  const covered = normalize(data.city).includes('parambu');
  const [banner, setBanner] = useState(0);
  const promos = [
    {
      tag: 'FRESQUINHO, PERTINHO',
      title: 'Sua feira de hoje.\nO carinho de sempre.',
      body: 'Escolha o melhor do seu bairro.',
      icon: 'leaf-outline' as const,
    },
    {
      tag: 'DO MERCADO ATÉ VOCÊ',
      title: 'Mais tempo\npara o que importa.',
      body: 'Monte sua feira em poucos toques.',
      icon: 'basket-outline' as const,
    },
  ];
  const p = promos[banner]!;
  return (
    <Screen
      back={false}
      refresh
      fixedTop={
        <>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View>
              <Text
                style={{
                  fontSize: 30,
                  color: c.primary,
                  fontWeight: '800',
                  letterSpacing: -1,
                }}
              >
                PedeAê<Text style={{ color: c.orange }}> ✦</Text>
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/location')}
                style={[s.row, { paddingVertical: 8 }]}
              >
                <Icon name="location" size={14} />
                <Text style={s.label}>{data.city || 'Escolher localização'}</Text>
                <Icon name="chevron-down" size={14} />
              </Pressable>
            </View>
            <IconButton
              name="notifications-outline"
              label="Notificações"
              onPress={() => router.push('/notifications')}
            />
          </View>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Buscar produtos ou mercados"
            onPress={() => router.push('/search')}
            style={[s.input, s.row]}
          >
            <Icon name="search-outline" />
            <Text style={s.small}>O que você precisa hoje?</Text>
          </Pressable>
        </>
      }
    >
      <View
        style={{
          backgroundColor: '#143F2A',
          borderRadius: 24,
          padding: 24,
          gap: 12,
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: c.lime,
            fontWeight: '800',
          }}
        >
          {p.tag}
        </Text>
        <Text style={[s.heroTitle, { color: 'white', maxWidth: 300 }]}>{p.title}</Text>
        <Text style={{ fontSize: 14, color: '#D9E8DB' }}>{p.body}</Text>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Pressable
            onPress={() => router.push('/markets')}
            accessibilityRole="button"
            style={{ backgroundColor: c.lime, padding: 12, borderRadius: 12 }}
          >
            <Text style={{ fontWeight: '700', color: '#143F2A' }}>Explorar mercados</Text>
          </Pressable>
          <Icon name={p.icon} size={56} color={c.lime} />
        </View>
        <View style={s.row}>
          {promos.map((_, i) => (
            <Pressable
              key={i}
              accessibilityLabel={`Banner ${i + 1}`}
              onPress={() => setBanner(i)}
              style={{ padding: 10 }}
            >
              <View
                style={{
                  height: 5,
                  width: banner === i ? 24 : 8,
                  backgroundColor: banner === i ? c.lime : '#6D937D',
                  borderRadius: 3,
                }}
              />
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Heading title="O que vai na sua feira?" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {categories.map((cat) => (
            <Pressable
              key={cat.name}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/search',
                  params: { category: cat.name },
                })
              }
              style={{
                width: '30%',
                flexGrow: 1,
                alignItems: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 16,
                backgroundColor: cat.color,
              }}
            >
              <Icon name={cat.icon as IconName} size={28} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: c.ink,
                  textAlign: 'center',
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Heading
          title="Mercados pertinho"
          subtitle="Seu comércio local, na palma da mão."
          action="Ver todos"
          onAction={() => router.push('/markets')}
        />
        {covered ? (
          <View style={{ gap: 12 }}>
            {data.markets.slice(0, 2).map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </View>
        ) : (
          <Empty
            title="Ainda não chegamos por aqui"
            description="Escolha Parambu, CE para explorar o catálogo demonstrativo."
            action="Alterar cidade"
            onAction={() => router.push('/location')}
          />
        )}
      </View>
      <Card style={{ backgroundColor: c.soft }}>
        <View style={s.row}>
          <Icon name="shield-checkmark-outline" size={30} />
          <View style={s.flex}>
            <Text style={s.label}>Cuidado do início ao fim</Text>
            <Text style={s.small}>Custos claros e cada etapa da entrega acompanhada.</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
export function Markets() {
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
              backgroundColor: sort === label ? c.primary : 'white',
              borderWidth: 1,
              borderColor: c.line,
            }}
          >
            <Text
              style={{
                color: sort === label ? 'white' : c.ink,
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
  const a = useApp();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState(''),
    [debounced, setDebounced] = useState('');
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
        autoFocus
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
            subtitle="Cada produto pertence ao mercado indicado no detalhe."
          />
          {matched.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {matched.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          ) : (
            <Empty
              icon="search-outline"
              title="Nenhum resultado"
              description="Tente outro nome ou uma categoria diferente."
            />
          )}
        </>
      )}
    </Screen>
  );
}
export function Catalog() {
  const a = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState('Todos'),
    [query, setQuery] = useState('');
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
                color: cat === category ? 'white' : c.primary,
              }}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {list.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </View>
      ) : (
        <Empty
          title="Nenhum produto encontrado"
          description="Experimente outra categoria ou busca."
        />
      )}
    </Screen>
  );
}
export function ProductDetail() {
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
          disabled={!p.stock || !market.open}
        />
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ampliar imagem do produto"
        onPress={() => setZoom(true)}
        style={{
          alignItems: 'center',
          backgroundColor: 'white',
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
      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View>
            <Text style={s.label}>Quantidade</Text>
            <Text style={s.small}>Máximo disponível: {p.stock}</Text>
          </View>
          <Stepper value={quantity} onChange={setQuantity} min={1} max={Math.min(99, p.stock)} />
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
            backgroundColor: 'white',
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
