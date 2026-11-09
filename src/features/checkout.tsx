import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { AssemblyInfo } from '../ui/AssemblyInfo';
import { useApp } from '../state/AppProvider';
import {
  Screen,
  Card,
  Button,
  Choice,
  Row,
  Field,
  Empty,
  Banner,
  Icon,
  Skeleton,
  Heading,
  useUI,
} from '../ui/components';
import { money, totals, digits } from '../domain/rules';
import type { Address, Vehicle, PaymentMethod, Quote } from '../domain/types';
export function Addresses() {
  const { c, s } = useUI();
  const a = useApp();
  const { select } = useLocalSearchParams<{ select?: string }>();
  return (
    <Screen title={select ? 'Onde vamos entregar?' : 'Meus endereços'}>
      <Button
        secondary
        label="Adicionar endereço"
        icon="add"
        onPress={() => router.push({ pathname: '/address/new', params: { select } })}
      />
      {!a.data!.profile ? (
        <Empty
          title="Entre para salvar endereços"
          description="Seus endereços ficam associados à sua conta."
          action="Entrar"
          onAction={() => router.push('/login')}
        />
      ) : !a.data!.addresses.length ? (
        <Empty
          icon="location-outline"
          title="Seu primeiro endereço"
          description="Adicione o local onde você quer receber sua feira."
        />
      ) : (
        a.data!.addresses.map((address) => (
          <Card key={address.id}>
            <View style={s.row}>
              <Icon name="location-outline" />
              <View style={s.flex}>
                <Text style={s.label}>{address.label}</Text>
                <Text style={s.body}>
                  {address.street}, {address.number}
                </Text>
                <Text style={s.small}>
                  {address.neighborhood} · {address.city}, {address.state}
                </Text>
              </View>
            </View>
            {select && (
              <Button
                label={`Entregar em ${address.label}`}
                onPress={() =>
                  router.replace({
                    pathname: '/delivery',
                    params: { addressId: address.id },
                  })
                }
              />
            )}
            <View style={s.row}>
              <Pressable
                style={{ padding: 10 }}
                onPress={() =>
                  router.push({
                    pathname: '/address/new',
                    params: { id: address.id, select },
                  })
                }
              >
                <Text style={s.link}>Editar</Text>
              </Pressable>
              <Pressable
                style={{ padding: 10 }}
                onPress={() =>
                  void a
                    .send({ type: 'removeAddress', id: address.id })
                    .then(() => a.notify('Endereço removido'))
                    .catch((e) => a.notify(e.message, true))
                }
              >
                <Text style={s.error}>Remover</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
export function AddressForm() {
  const { c, s } = useUI();
  const a = useApp();
  const { id, select } = useLocalSearchParams<{
    id?: string;
    select?: string;
  }>();
  const original = a.data!.addresses.find((x) => x.id === id);
  const [form, setForm] = useState<Address>(
    original ?? {
      id: '',
      label: 'Casa',
      street: '',
      number: '',
      neighborhood: '',
      city: 'Parambu',
      state: 'CE',
      zip: '',
      complement: '',
      instructions: '',
    },
  );
  const [error, setError] = useState('');
  function field(key: keyof Address, value: string) {
    setForm({ ...form, [key]: value });
  }
  async function save() {
    setError('');
    try {
      await a.send({ type: 'saveAddress', address: form });
      a.notify('Endereço salvo');
      router.replace({ pathname: '/addresses', params: { select } });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen
      title={id ? 'Editar endereço' : 'Novo endereço'}
      footer={<Button label="Salvar endereço" loading={a.busy} onPress={() => void save()} />}
    >
      <Banner text="Confirme rua, número e bairro. A demonstração usa endereços de Parambu, CE; não envia esses dados para um servidor." />
      {(
        [
          {
            key: 'label',
            label: 'Nome do endereço',
            placeholder: 'Casa, trabalho...',
          },
          { key: 'zip', label: 'CEP', placeholder: '63680-000' },
          {
            key: 'street',
            label: 'Rua ou avenida',
            placeholder: 'Nome da rua',
          },
          { key: 'number', label: 'Número', placeholder: '123 ou S/N' },
          { key: 'neighborhood', label: 'Bairro', placeholder: 'Centro' },
          { key: 'city', label: 'Cidade', placeholder: 'Parambu' },
          { key: 'state', label: 'Estado (UF)', placeholder: 'CE' },
          {
            key: 'complement',
            label: 'Complemento (opcional)',
            placeholder: 'Apartamento, bloco...',
          },
        ] as const
      ).map((x) => (
        <Field
          key={x.key}
          label={x.label}
          value={form[x.key]}
          onChangeText={(v) => field(x.key, x.key === 'state' ? v.toUpperCase().slice(0, 2) : v)}
          placeholder={x.placeholder}
          keyboardType={x.key === 'zip' ? 'number-pad' : 'default'}
          maxLength={x.key === 'zip' ? 9 : 120}
        />
      ))}
      <Field
        label="Instruções para a entrega (opcional)"
        value={form.instructions}
        onChangeText={(v) => field('instructions', v)}
        multiline
        maxLength={240}
        placeholder="Ex.: tocar o interfone 12"
      />
      {error && <Banner error text={error} />}
    </Screen>
  );
}
export function Delivery() {
  const { c, s } = useUI();
  const a = useApp();
  const params = useLocalSearchParams<{ addressId?: string }>();
  const [vehicle, setVehicle] = useState<Vehicle>('moto');
  const [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  const address = a.data!.addresses.find((x) => x.id === params.addressId) ?? a.data!.addresses[0];
  const weight = totals(a.data!.cart, a.data!.products).weightGrams;
  useEffect(() => {
    let active = true;
    setQuote(null);
    setError('');
    if (!address) return;
    setLoading(true);
    a.quote(address.id, vehicle)
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    address?.id,
    JSON.stringify(address),
    vehicle,
    a.data!.cart.revision,
    a.data!.markets.find((m) => m.id === a.data!.cart.marketId)?.assemblyRevision,
  ]);
  if (!a.data!.profile)
    return (
      <Screen title="Definir entrega">
        <Empty
          title="Entre para continuar"
          description="Precisamos identificar quem vai receber a feira."
          action="Entrar"
          onAction={() => router.push('/login')}
        />
      </Screen>
    );
  if (!a.data!.cart.items.length)
    return (
      <Screen title="Definir entrega">
        <Empty
          title="Sua feira está vazia"
          description="Adicione produtos antes de escolher a entrega."
          action="Explorar mercados"
          onAction={() => router.push('/markets')}
        />
      </Screen>
    );
  return (
    <Screen
      title="Como você quer receber?"
      subtitle="Entrega · etapa 1 de 2"
      footer={
        <Button
          label="Revisar e pagar"
          disabled={!quote || loading}
          onPress={() =>
            router.push({
              pathname: '/checkout',
              params: { addressId: address!.id, vehicle },
            })
          }
        />
      }
    >
      <Heading
        title="Endereço de entrega"
        action={address ? 'Alterar' : 'Adicionar'}
        onAction={() => router.push({ pathname: '/addresses', params: { select: '1' } })}
      />
      {address ? (
        <Card>
          <View style={s.row}>
            <Icon name="location-outline" />
            <View style={s.flex}>
              <Text style={s.label}>{address.label}</Text>
              <Text style={s.body}>
                {address.street}, {address.number}
              </Text>
              <Text style={s.small}>
                {address.neighborhood} · {address.city}, {address.state}
              </Text>
              {address.instructions && <Text style={s.small}>{address.instructions}</Text>}
            </View>
          </View>
        </Card>
      ) : (
        <Button
          label="Adicionar endereço"
          onPress={() => router.push({ pathname: '/address/new', params: { select: '1' } })}
        />
      )}
      <Heading
        title="Escolha a modalidade"
        subtitle={`Peso estimado: ${(weight / 1000).toLocaleString('pt-BR')} kg`}
      />
      <Choice
        title="Moto"
        description={
          weight > 15000
            ? 'Indisponível: limite demonstrativo de 15 kg'
            : '25–40 min · pedidos menores'
        }
        icon="bicycle-outline"
        selected={vehicle === 'moto'}
        disabled={weight > 15000}
        onPress={() => setVehicle('moto')}
      />
      <Choice
        title="Carro"
        description={
          weight > 80000
            ? 'Indisponível: limite demonstrativo de 80 kg'
            : '35–55 min · compras maiores'
        }
        icon="car-outline"
        selected={vehicle === 'carro'}
        disabled={weight > 80000}
        onPress={() => setVehicle('carro')}
      />
      {loading ? (
        <Skeleton />
      ) : quote ? (
        <Card>
          <Row label="Subtotal dos produtos" value={money(quote.subtotal)} />
          <Row label="Taxa de entrega" value={money(quote.deliveryFee)} />
          <Row label="Taxa PedeAê" value={money(quote.platformFee)} />
          <Row label="Total do pedido" value={money(quote.total)} strong />
        </Card>
      ) : null}
      {quote && <AssemblyInfo allocation={quote.assembly} />}
      {error && <Banner error text={error} />}
      <Banner text="Estimativas e capacidades são ilustrativas. No serviço real, distância, volume e disponibilidade serão calculados pelo servidor." />
    </Screen>
  );
}
export function Checkout() {
  const { c, s } = useUI();
  const a = useApp();
  const params = useLocalSearchParams<{
    addressId?: string;
    vehicle?: string;
    payment?: string;
    cardId?: string;
    cashChangeFor?: string;
  }>();
  const address = a.data!.addresses.find((x) => x.id === params.addressId);
  const vehicle: Vehicle = params.vehicle === 'carro' ? 'carro' : 'moto';
  const payment: PaymentMethod = ['pix', 'credit', 'debit', 'cash', 'terminal'].includes(
    params.payment ?? '',
  )
    ? (params.payment as PaymentMethod)
    : 'pix';
  const [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0);
  const key = useRef(''),
    submitting = useRef(false);
  const card = a.data!.cards.find((x) => x.id === params.cardId) ?? a.data!.cards[0];
  useEffect(() => {
    let active = true;
    setQuote(null);
    setError('');
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    a.quote(address.id, vehicle)
      .then((q) => {
        if (active) {
          setQuote(q);
          key.current = `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    address?.id,
    JSON.stringify(address),
    vehicle,
    a.data!.cart.revision,
    a.data!.markets.find((m) => m.id === a.data!.cart.marketId)?.assemblyRevision,
    attempt,
  ]);
  async function confirm() {
    if (!quote || submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      const order = await a.checkout({
        quoteId: quote.id,
        payment,
        cardId: card?.id,
        cashChangeFor: params.cashChangeFor ? Number(params.cashChangeFor) : undefined,
        idempotencyKey: key.current,
      });
      router.replace({
        pathname: order.lifecycle === 'awaiting_payment' ? '/pix/[id]' : '/order/[id]',
        params: { id: order.id, received: '1' },
      });
      a.notify(
        order.lifecycle === 'awaiting_payment' ? 'PIX demonstrativo criado' : 'Pedido recebido!',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      submitting.current = false;
    }
  }
  const paymentNames = {
    pix: 'PIX',
    credit: 'Cartão de crédito',
    debit: 'Cartão de débito',
    cash: 'Dinheiro na entrega',
    terminal: 'Maquininha na entrega',
  };
  return (
    <Screen
      title="Finalize sua feira"
      subtitle="Revisão · etapa 2 de 2"
      footer={
        <Button
          label={quote ? `Confirmar pedido · ${money(quote.total)}` : 'Confirmar pedido'}
          icon="lock-closed-outline"
          loading={a.busy}
          disabled={!quote || loading || !a.data!.profile}
          onPress={() => void confirm()}
        />
      }
    >
      <Banner
        text={
          a.demo
            ? 'Nenhuma cobrança será realizada. Este pedido é demonstrativo.'
            : 'Confira os valores antes de confirmar.'
        }
      />
      {address ? (
        <Card>
          <Text style={s.label}>Entregar em {address.label}</Text>
          <Text style={s.body}>
            {address.street}, {address.number}
          </Text>
          <Text style={s.small}>
            {address.neighborhood} · {address.city}, {address.state}
          </Text>
          <Text style={s.small}>{address.instructions}</Text>
        </Card>
      ) : (
        <Empty
          title="Selecione um endereço"
          description="Volte à entrega para escolher onde receber."
          action="Definir entrega"
          onAction={() => router.replace('/delivery')}
        />
      )}
      <Card>
        <Heading
          title="Resumo da feira"
          action="Editar"
          onAction={() => router.push('/(tabs)/feira')}
        />
        {a.data!.cart.items.map((i) => {
          const p = a.data!.products.find((x) => x.id === i.productId)!;
          return (
            <Row
              key={i.productId}
              label={`${i.quantity} × ${p.name}`}
              value={money(i.quantity * p.price)}
            />
          );
        })}
      </Card>
      {loading ? (
        <Skeleton />
      ) : quote ? (
        <Card>
          <Row label="Subtotal dos produtos" value={money(quote.subtotal)} />
          <Row label={`Taxa de entrega · ${vehicle}`} value={money(quote.deliveryFee)} />
          <Row label="Taxa PedeAê" value={money(quote.platformFee)} />
          <Text style={s.small}>
            A Taxa PedeAê mantém o serviço e financia o bônus de montagem de 1,5% dos produtos.
          </Text>
          <View style={{ height: 1, backgroundColor: c.line }} />
          <Row label="Total do pedido" value={money(quote.total)} strong />
        </Card>
      ) : null}
      {quote && <AssemblyInfo allocation={quote.assembly} />}
      <Card>
        <Heading
          title="Como vai pagar?"
          action="Alterar"
          onAction={() =>
            router.push({
              pathname: '/payment',
              params: {
                addressId: params.addressId,
                vehicle,
                payment,
                cardId: card?.id,
              },
            })
          }
        />
        <View style={s.row}>
          <Icon
            name={
              payment === 'pix'
                ? 'qr-code-outline'
                : payment === 'cash'
                  ? 'cash-outline'
                  : 'card-outline'
            }
          />
          <Text style={s.label}>{paymentNames[payment]}</Text>
        </View>
        {['credit', 'debit'].includes(payment) && (
          <Text style={s.small}>
            {card
              ? `${card.brand} •••• ${card.last4}`
              : 'Adicione um cartão demonstrativo em Alterar.'}
          </Text>
        )}
        {payment === 'cash' && (
          <Text style={s.small}>
            {params.cashChangeFor
              ? `Troco para ${money(Number(params.cashChangeFor))}`
              : 'Sem troco'}
          </Text>
        )}
      </Card>
      {error && (
        <>
          <Banner error text={error} />
          <Button secondary label="Recalcular valores" onPress={() => setAttempt((x) => x + 1)} />
        </>
      )}
    </Screen>
  );
}
export function Payment() {
  const { c, s } = useUI();
  const a = useApp();
  const params = useLocalSearchParams<{
    addressId: string;
    vehicle: string;
    payment?: PaymentMethod;
    cardId?: string;
  }>();
  const [method, setMethod] = useState<PaymentMethod>(params.payment ?? 'pix'),
    [cardId, setCardId] = useState(params.cardId ?? a.data!.cards[0]?.id),
    [change, setChange] = useState('');
  useEffect(() => {
    if (!cardId || !a.data!.cards.some((card) => card.id === cardId)) {
      setCardId(a.data!.cards[0]?.id);
    }
  }, [a.data!.cards, cardId]);
  return (
    <Screen
      title="Forma de pagamento"
      footer={
        <Button
          label="Usar esta forma de pagamento"
          disabled={['credit', 'debit'].includes(method) && !cardId}
          onPress={() =>
            router.replace({
              pathname: '/checkout',
              params: {
                addressId: params.addressId,
                vehicle: params.vehicle,
                payment: method,
                cardId,
                cashChangeFor:
                  method === 'cash' && change
                    ? String(Math.round(Number(change.replace(',', '.')) * 100))
                    : undefined,
              },
            })
          }
        />
      }
    >
      <Choice
        title="PIX"
        description="QR Code e copia e cola"
        selected={method === 'pix'}
        onPress={() => setMethod('pix')}
        icon="qr-code-outline"
      />
      <Choice
        title="Crédito no app"
        description={
          a.demo ? 'Cartão fictício · sem cobrança' : 'Depende do provedor de pagamentos'
        }
        selected={method === 'credit'}
        onPress={() => setMethod('credit')}
        icon="card-outline"
      />
      <Choice
        title="Débito no app"
        description={a.demo ? 'Simulação · sem cobrança' : 'Disponibilidade conforme o provedor'}
        selected={method === 'debit'}
        onPress={() => setMethod('debit')}
        icon="card-outline"
      />
      {['credit', 'debit'].includes(method) && (
        <Card>
          {a.data!.cards.map((card) => (
            <Choice
              key={card.id}
              title={`${card.brand} •••• ${card.last4}`}
              selected={cardId === card.id}
              onPress={() => setCardId(card.id)}
            />
          ))}
          <Button secondary label="Gerenciar cartões" onPress={() => router.push('/cards')} />
          {!a.data!.cards.length && (
            <Text style={s.small}>Cadastre um cartão de teste para continuar.</Text>
          )}
        </Card>
      )}
      <Choice
        title="Maquininha na entrega"
        description="Crédito ou débito com o entregador"
        selected={method === 'terminal'}
        onPress={() => setMethod('terminal')}
        icon="card-outline"
      />
      <Choice
        title="Dinheiro na entrega"
        selected={method === 'cash'}
        onPress={() => setMethod('cash')}
        icon="cash-outline"
      />
      {method === 'cash' && (
        <Field
          label="Troco para (opcional)"
          value={change}
          onChangeText={(v) => setChange(v.replace(/[^0-9,.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="Ex.: 100,00"
          hint="Deixe vazio se não precisar de troco."
        />
      )}
      <Banner text="Formas de pagamento reais dependem da disponibilidade do mercado e da integração com um provedor. Nenhum dado de cartão completo é coletado no modo demonstração." />
    </Screen>
  );
}
export function Pix() {
  const { c, s } = useUI();
  const a = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = a.data!.orders.find((o) => o.id === id);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!a.demo) {
      const t = setInterval(() => void a.refresh(), 10000);
      return () => clearInterval(t);
    }
  }, [a.demo]);
  useEffect(() => {
    if (order && order.lifecycle === 'active') router.replace(`/order/${order.id}`);
  }, [order?.lifecycle]);
  if (!order)
    return (
      <Screen title="PIX">
        <Empty title="Pagamento não encontrado" description="Confira seus pedidos." />
      </Screen>
    );
  const remaining = Math.max(0, Math.ceil(((order.pixExpiresAt ?? 0) - now) / 1000));
  const payload = a.demo ? `PEDEAE-DEMONSTRACAO-NAO-PAGAR-${order.id}` : order.pixCopyPaste;
  return (
    <Screen title="Pague com PIX">
      <Text style={[s.heroTitle, { textAlign: 'center' }]}>{money(order.quote.total)}</Text>
      <Banner
        text={
          a.demo
            ? 'QR Code de demonstração, sem valor financeiro. Não tente pagá-lo no seu banco.'
            : 'Abra seu banco e escolha PIX copia e cola, ou escaneie o QR Code.'
        }
      />
      {remaining > 0 && order.lifecycle !== 'cancelled' ? (
        <>
          <Card style={{ alignItems: 'center', padding: 24 }}>
            {payload ? (
              <QRCode value={payload} size={220} backgroundColor="white" color="#16231B" />
            ) : (
              <Banner error text="Aguardando o código do provedor de pagamento." />
            )}
            <Text accessibilityLiveRegion="polite" style={s.label}>
              Expira em {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
            </Text>
          </Card>
          <Button
            label="Copiar código PIX"
            icon="copy-outline"
            disabled={!payload}
            onPress={() =>
              void Clipboard.setStringAsync(payload!)
                .then(() => a.notify('Código copiado'))
                .catch(() => a.notify('Não foi possível copiar.', true))
            }
          />
          {a.demo && (
            <Button
              label="Simular pagamento aprovado"
              secondary
              onPress={() =>
                void a
                  .send({ type: 'demoPay', orderId: id })
                  .then(() => a.notify('Pagamento demonstrativo confirmado'))
                  .catch((e) => a.notify(e.message, true))
              }
            />
          )}
          <Text style={s.small}>
            Copiar o código não confirma o pagamento. O pedido segue para o mercado após a
            confirmação do provedor.
          </Text>
        </>
      ) : (
        <Empty
          title="PIX expirado ou cancelado"
          description="Não faça o pagamento deste código. Volte aos pedidos para montar uma nova feira."
          action="Ver pedidos"
          onAction={() => router.replace('/(tabs)/orders')}
        />
      )}
      <Button
        secondary
        label="Ver detalhes do pedido"
        onPress={() => router.replace(`/order/${id}`)}
      />
    </Screen>
  );
}
