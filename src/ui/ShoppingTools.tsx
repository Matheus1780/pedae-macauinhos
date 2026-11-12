import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { money, totals } from '../domain/rules';
import type { Product } from '../domain/types';
import type { ProductSort } from '../domain/catalog';
import { Card, Button, Icon, useUI } from './components';
import { feedback } from './feedback';
export function FavoriteButton({ product }: { product: Product }) {
  const a = useApp();
  const { c } = useUI();
  const selected = a.data!.favoriteProductIds?.includes(product.id) ?? false;
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await a.send({ type: 'setFavorite', productId: product.id, value: !selected });
      feedback('success');
      a.notify(selected ? 'Removido dos favoritos' : 'Salvo nos favoritos');
    } catch (e) {
      a.notify((e as Error).message, true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${selected ? 'Desfavoritar' : 'Favoritar'} ${product.name}`}
      accessibilityState={{ selected, busy, disabled: busy }}
      disabled={busy}
      onPress={() => void save()}
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surface,
        borderRadius: 22,
      }}
    >
      <Icon name={selected ? 'heart' : 'heart-outline'} size={21} />
    </Pressable>
  );
}
export function BasketSummary({ compact = false }: { compact?: boolean }) {
  const a = useApp();
  const { c, s } = useUI();
  const data = a.data!;
  if (!data.cart.items.length) return null;
  const summary = totals(data.cart, data.products);
  const market = data.markets.find((m) => m.id === data.cart.marketId);
  return (
    <Pressable
      testID="basket-summary"
      accessibilityRole="button"
      accessibilityLabel="Ver Minha feira"
      onPress={() => router.push('/(tabs)/feira')}
      style={{
        backgroundColor: compact ? c.soft : c.primary,
        padding: compact ? 12 : 16,
        borderRadius: 14,
        gap: 4,
      }}
    >
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Text style={[s.label, { color: compact ? c.primary : c.onPrimary }]}>
          {summary.count} {summary.count === 1 ? 'unidade' : 'unidades'} · Minha feira
        </Text>
        <Text style={[s.label, { color: compact ? c.primary : c.onPrimary }]}>
          {money(summary.subtotal)}
        </Text>
      </View>
      {!compact && (
        <Text style={{ fontSize: 12, color: c.onPrimary }}>Subtotal · {market?.name}</Text>
      )}
    </Pressable>
  );
}
const sorts: [ProductSort, string][] = [
  ['selection', 'Seleção do mercado'],
  ['priceAsc', 'Menor preço'],
  ['priceDesc', 'Maior preço'],
  ['name', 'Nome A–Z'],
];
export function CatalogTools({
  sort,
  onSort,
  availableOnly,
  onAvailable,
  favoritesOnly,
  onFavorites,
}: {
  sort: ProductSort;
  onSort: (value: ProductSort) => void;
  availableOnly: boolean;
  onAvailable: (value: boolean) => void;
  favoritesOnly: boolean;
  onFavorites: (value: boolean) => void;
}) {
  const { c, s } = useUI();
  const [open, setOpen] = useState(false);
  const chip = (label: string, selected: boolean, action: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={action}
      style={[
        s.row,
        {
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: selected ? c.primary : c.line,
          backgroundColor: selected ? c.soft : c.surface,
        },
      ]}
    >
      <Text style={[s.small, { color: selected ? c.primary : c.ink }]}>{label}</Text>
    </Pressable>
  );
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {chip(
          sort === 'selection' ? 'Ordenar ↕' : sorts.find((x) => x[0] === sort)![1],
          sort !== 'selection',
          () => setOpen(true),
        )}
        {chip('Em estoque', availableOnly, () => onAvailable(!availableOnly))}
        {chip('Favoritos', favoritesOnly, () => onFavorites(!favoritesOnly))}
      </ScrollView>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 24 }}
        >
          <Card style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
            <Text style={s.sectionTitle}>Ordenar produtos</Text>
            <Text style={s.small}>Preço por embalagem ou porção indicada no produto.</Text>
            {sorts.map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: sort === value }}
                onPress={() => {
                  onSort(value);
                  setOpen(false);
                }}
                style={[s.row, { minHeight: 48, justifyContent: 'space-between' }]}
              >
                <Text style={s.body}>{label}</Text>
                <Icon name={sort === value ? 'radio-button-on' : 'radio-button-off'} />
              </Pressable>
            ))}
            <Button secondary label="Fechar ordenação" onPress={() => setOpen(false)} />
          </Card>
        </View>
      </Modal>
    </>
  );
}
