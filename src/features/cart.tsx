import React, { useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, Animated } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../state/AppProvider';
import {
  Screen,
  Card,
  Button,
  Icon,
  ProductImage,
  Stepper,
  Field,
  Toggle,
  Empty,
  Banner,
  useUI,
} from '../ui/components';
import { totals, money } from '../domain/rules';
import type { CartItem, Product } from '../domain/types';
function ItemRow({ item, p, onRemove }: { item: CartItem; p: Product; onRemove: () => void }) {
  const { c, s } = useUI();
  const a = useApp();
  const x = useRef(new Animated.Value(0)).current;
  const [note, setNote] = useState(item.note);
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderMove: (_, g) => x.setValue(Math.min(0, Math.max(-100, g.dx))),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -75) onRemoveRef.current();
        Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;
  return (
    <View style={{ backgroundColor: c.errorSoft, borderRadius: 16 }}>
      <View style={{ position: 'absolute', right: 20, top: 35 }}>
        <Icon name="trash-outline" color={c.error} />
      </View>
      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }] }}>
        <Card>
          <View style={s.row}>
            <ProductImage uri={p.image} emoji={p.emoji} size={64} />
            <View style={s.flex}>
              <Text style={s.label}>{p.name}</Text>
              <Text style={s.small}>{p.unit}</Text>
              <Text style={[s.label, { color: c.primary }]}>{money(p.price * item.quantity)}</Text>
            </View>
            <Pressable
              accessibilityLabel={`Remover ${p.name}`}
              accessibilityRole="button"
              onPress={onRemove}
              style={{ padding: 12 }}
            >
              <Icon name="trash-outline" size={20} color={c.muted} />
            </Pressable>
          </View>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.small}>{money(p.price)} cada</Text>
            <Stepper
              label={p.name}
              value={item.quantity}
              max={Math.min(99, p.stock)}
              onChange={(quantity) =>
                void a
                  .send({ type: 'quantity', productId: p.id, quantity })
                  .catch((e) => a.notify(e.message, true))
              }
            />
          </View>
          <Field
            label={`Observação: ${p.name}`}
            value={note}
            onChangeText={setNote}
            maxLength={240}
            placeholder="Preferência de escolha (opcional)"
            onBlur={() =>
              void a
                .send({ type: 'note', productId: p.id, note })
                .catch((e) => a.notify(e.message, true))
            }
          />
        </Card>
      </Animated.View>
    </View>
  );
}
export function Feira() {
  const { c, s } = useUI();
  const a = useApp();
  const data = a.data!;
  const [removed, setRemoved] = useState<CartItem | null>(null);
  const cart = data.cart;
  const summary = totals(cart, data.products);
  const market = data.markets.find((x) => x.id === cart.marketId);
  async function remove(item: CartItem) {
    try {
      await a.send({
        type: 'quantity',
        productId: item.productId,
        quantity: 0,
      });
      setRemoved(item);
    } catch (e) {
      a.notify((e as Error).message, true);
    }
  }
  async function undo() {
    if (!removed) return;
    try {
      await a.send({
        type: 'addItem',
        productId: removed.productId,
        quantity: removed.quantity,
        note: removed.note,
      });
      setRemoved(null);
    } catch (e) {
      a.notify((e as Error).message, true);
    }
  }
  const missing = Math.max(0, (market?.minimum ?? 0) - summary.subtotal);
  return (
    <Screen
      title="Minha feira"
      back={false}
      footer={
        cart.items.length ? (
          <>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={s.label}>Subtotal dos produtos</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: c.primary }}>
                {money(summary.subtotal)}
              </Text>
            </View>
            <Button
              label={missing ? `Faltam ${money(missing)} para continuar` : 'Continuar para entrega'}
              onPress={() => router.push(data.profile ? '/delivery' : '/login')}
              disabled={missing > 0 || !market?.open}
            />
            <Text style={[s.small, { textAlign: 'center' }]}>
              Entrega e Taxa PedeAê serão exibidas antes da confirmação.
            </Text>
          </>
        ) : undefined
      }
    >
      {removed && (
        <Card style={{ backgroundColor: c.soft }}>
          <Text style={s.label}>Item removido da feira</Text>
          <Button secondary label="Desfazer remoção" onPress={() => void undo()} />
        </Card>
      )}
      {!cart.items.length ? (
        <Empty
          title="Sua feira está esperando por você"
          description="Encontre produtos fresquinhos nos mercados do seu bairro."
          action="Explorar mercados"
          onAction={() => router.push('/markets')}
        />
      ) : (
        <>
          <View style={s.row}>
            <Icon name="storefront-outline" />
            <View style={s.flex}>
              <Text style={s.label}>{market?.name}</Text>
              <Text style={s.small}>
                {summary.count} unidades · {(summary.weightGrams / 1000).toLocaleString('pt-BR')} kg
                estimados
              </Text>
            </View>
          </View>
          {cart.items.map((item) => {
            const p = data.products.find((x) => x.id === item.productId);
            return p ? (
              <ItemRow key={item.productId} item={item} p={p} onRemove={() => void remove(item)} />
            ) : (
              <Banner
                key={item.productId}
                text="Produto removido do catálogo. Atualize sua feira."
                error
              />
            );
          })}
          <Button
            secondary
            label="Adicionar mais produtos"
            icon="add"
            onPress={() => router.push(`/market/${cart.marketId}`)}
          />
          <Card>
            <Toggle
              title="Pode falar comigo sobre substituições"
              description="O mercado pode sugerir uma alternativa. Nenhum item será trocado sem sua confirmação."
              value={cart.allowContact}
              onChange={(value) =>
                void a
                  .send({ type: 'contactPreference', value })
                  .catch((e) => a.notify(e.message, true))
              }
            />
          </Card>
          <Card>
            <Text style={s.label}>
              {missing
                ? `Faltam ${money(missing)} para o mínimo do mercado`
                : 'Valor mínimo alcançado'}
            </Text>
            <View
              style={{
                height: 7,
                backgroundColor: c.line,
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 7,
                  backgroundColor: c.primary,
                  width: `${Math.min(100, (summary.subtotal / (market?.minimum || 1)) * 100)}%`,
                }}
              />
            </View>
            <Text style={s.small}>
              Mínimo em produtos: {money(market?.minimum ?? 0)}. Arraste um item para a esquerda
              para removê-lo.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
