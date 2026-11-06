import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useApp } from '../state/AppProvider';
import { ORDER_STATUSES } from '../domain/types';
import { money } from '../domain/rules';
import {
  Screen,
  Button,
  Card,
  Empty,
  Icon,
  Heading,
  Badge,
  Banner,
  Row,
  Confirm,
  Field,
  s,
} from '../ui/components';
import { colors as c } from '../ui/theme';
const date = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
export function Orders() {
  const { data } = useApp();
  const [filter, setFilter] = useState('Todos');
  const orders = data!.orders.filter(
    (o) =>
      filter === 'Todos' ||
      (filter === 'Em andamento'
        ? ['active', 'awaiting_payment'].includes(o.lifecycle)
        : ['completed', 'cancelled'].includes(o.lifecycle)),
  );
  return (
    <Screen
      title="Suas feiras"
      subtitle="Cada compra, uma história no seu bairro."
      back={false}
      refresh
    >
      <View style={s.row}>
        {['Todos', 'Em andamento', 'Finalizados'].map((x) => (
          <Pressable
            key={x}
            onPress={() => setFilter(x)}
            style={{
              padding: 12,
              borderRadius: 24,
              backgroundColor: filter === x ? c.primary : c.soft,
            }}
          >
            <Text
              style={{
                fontWeight: '600',
                fontSize: 12,
                color: filter === x ? 'white' : c.primary,
              }}
            >
              {x}
            </Text>
          </Pressable>
        ))}
      </View>
      {!data!.profile ? (
        <Empty
          icon="receipt-outline"
          title="Entre para ver seus pedidos"
          description="Acompanhe e repita suas feiras por aqui."
          action="Entrar"
          onAction={() => router.push('/login')}
        />
      ) : orders.length ? (
        orders.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            onPress={() => router.push(`/order/${o.id}`)}
          >
            <Card>
              <View style={s.row}>
                <View
                  style={{
                    backgroundColor: c.soft,
                    padding: 12,
                    borderRadius: 14,
                  }}
                >
                  <Icon name="basket-outline" size={28} />
                </View>
                <View style={s.flex}>
                  <Text style={s.label}>{o.marketName}</Text>
                  <Text style={s.small}>{date(o.createdAt)}</Text>
                </View>
                <Icon name="chevron-forward" />
              </View>
              <Badge
                text={
                  o.lifecycle === 'awaiting_payment'
                    ? 'Aguardando PIX'
                    : o.lifecycle === 'cancelled'
                      ? 'Cancelado'
                      : o.status
                }
                tone={
                  o.lifecycle === 'cancelled'
                    ? 'gray'
                    : o.lifecycle === 'awaiting_payment'
                      ? 'orange'
                      : 'green'
                }
              />
              <Row
                label={`${o.items.reduce((n, i) => n + i.quantity, 0)} unidades`}
                value={money(o.quote.total)}
              />
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          icon="receipt-outline"
          title="Sua primeira feira vem aí"
          description="Quando você fizer um pedido, ele aparecerá aqui com todas as etapas."
          action="Explorar mercados"
          onAction={() => router.push('/markets')}
        />
      )}
    </Screen>
  );
}
function DemoMap({ index }: { index: number }) {
  const position =
    index === 2 ? { x: 90, y: 180 } : index === 3 ? { x: 220, y: 108 } : { x: 310, y: 65 };
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Svg width="100%" height={240} viewBox="0 0 400 240">
        <Rect width={400} height={240} fill="#EDF2E9" />
        <Path
          d="M0 45H400M0 100H400M0 160H400M0 210H400M60 0V240M145 0V240M250 0V240M340 0V240"
          stroke="#FFFFFF"
          strokeWidth={16}
        />
        <Path d="M0 0L400 220M80 240L380 0" stroke="#FFFFFF" strokeWidth={9} />
        <Path
          d="M85 180L145 180L145 110L250 110L310 65"
          fill="none"
          stroke={c.primary}
          strokeWidth={5}
          strokeDasharray="8 5"
        />
        <Circle cx={85} cy={180} r={18} fill={c.primary} />
        <Circle cx={310} cy={65} r={18} fill={c.primary} />
        <SvgText x={85} y={185} fill="white" textAnchor="middle" fontSize={15}>
          M
        </SvgText>
        <SvgText x={310} y={70} fill="white" textAnchor="middle" fontSize={15}>
          C
        </SvgText>
        <Circle cx={position.x} cy={position.y} r={27} fill="#087F3D22" />
        <Circle
          cx={position.x}
          cy={position.y}
          r={9}
          fill={c.primary}
          stroke="white"
          strokeWidth={4}
        />
        <SvgText x={200} y={26} fill={c.muted} textAnchor="middle" fontSize={12}>
          ROTA ILUSTRATIVA · NÃO É GPS AO VIVO
        </SvgText>
        <SvgText x={75} y={218} fill={c.ink} fontSize={12}>
          Mercado
        </SvgText>
        <SvgText x={300} y={40} fill={c.ink} fontSize={12}>
          Casa
        </SvgText>
      </Svg>
    </Card>
  );
}
export function OrderDetail() {
  const a = useApp();
  const { id, received } = useLocalSearchParams<{
    id: string;
    received?: string;
  }>();
  const [cancel, setCancel] = useState(false),
    [repeat, setRepeat] = useState(false);
  const order = a.data!.orders.find((o) => o.id === id);
  useEffect(() => {
    if (a.demo) return;
    const timer = setInterval(() => void a.refresh(), 10000);
    return () => clearInterval(timer);
  }, [a.demo, id]);
  if (!order)
    return (
      <Screen title="Pedido">
        <Empty
          title="Pedido não encontrado"
          description="Confira sua conta ou volte ao histórico."
          action="Meus pedidos"
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </Screen>
    );
  const active = order.lifecycle === 'active';
  const pending = a.data!.substitutions.filter((x) => x.orderId === id && x.state === 'pending');
  async function repeatOrder() {
    try {
      await a.send({ type: 'repeat', orderId: id, replace: true });
      setRepeat(false);
      a.notify('Feira refeita com preços e disponibilidade atuais. Confira antes de comprar.');
      router.push('/(tabs)/feira');
    } catch (e) {
      a.notify((e as Error).message, true);
    }
  }
  return (
    <Screen
      title={received && active ? 'Pedido recebido!' : 'Acompanhar pedido'}
      subtitle={`Pedido ${order.id.slice(-8).toUpperCase()}`}
      refresh
    >
      {order.lifecycle === 'awaiting_payment' ? (
        <>
          <Banner text="O pedido aguarda pagamento. O mercado ainda não iniciou a preparação." />
          <Button label="Ver PIX" onPress={() => router.push(`/pix/${id}`)} />
        </>
      ) : order.lifecycle === 'cancelled' ? (
        <Banner
          text={`Pedido cancelado.${order.paymentStatus === 'refunded' ? ' Estorno demonstrativo registrado.' : ''}`}
        />
      ) : (
        <>
          <View style={s.row}>
            <View style={{ padding: 16, backgroundColor: c.soft, borderRadius: 20 }}>
              <Icon
                name={
                  order.lifecycle === 'completed' ? 'checkmark-circle-outline' : 'bicycle-outline'
                }
                size={36}
              />
            </View>
            <View style={s.flex}>
              <Text style={s.sectionTitle}>{order.status}</Text>
              <Text style={s.small}>
                {order.lifecycle === 'completed'
                  ? 'Sua feira chegou. Obrigado por comprar local.'
                  : 'Acompanhe cada etapa da sua feira.'}
              </Text>
            </View>
          </View>
          {order.statusIndex >= 2 ? (
            a.demo ? (
              <DemoMap index={order.statusIndex} />
            ) : (
              <Banner text="O mapa ao vivo depende do serviço de localização do entregador. O status abaixo continua disponível." />
            )
          ) : (
            <Banner text="A localização do entregador aparece após a coleta. Por enquanto, acompanhe a preparação abaixo." />
          )}
          <Card>
            {ORDER_STATUSES.map((status, i) => {
              const event = order.history.find((x) => x.status === status);
              return (
                <View key={status} style={[s.row, { minHeight: 58, alignItems: 'flex-start' }]}>
                  <View style={{ alignItems: 'center', width: 28 }}>
                    <Icon
                      name={i <= order.statusIndex ? 'checkmark-circle' : 'ellipse-outline'}
                      color={i <= order.statusIndex ? c.primary : '#A8B3AA'}
                      size={26}
                    />
                    {i < 4 && (
                      <View
                        style={{
                          height: 30,
                          width: 2,
                          backgroundColor: i < order.statusIndex ? c.primary : c.line,
                        }}
                      />
                    )}
                  </View>
                  <View style={s.flex}>
                    <Text style={[s.label, { color: i === order.statusIndex ? c.primary : c.ink }]}>
                      {status}
                    </Text>
                    {event && <Text style={s.small}>{date(event.at)}</Text>}
                  </View>
                </View>
              );
            })}
          </Card>
          {active && (
            <Card>
              <Text style={s.label}>Previsão de entrega</Text>
              <Text style={s.body}>
                {a.demo
                  ? '25–40 min · estimativa demonstrativa'
                  : 'Consulte as atualizações do mercado'}
              </Text>
              <Text style={s.small}>Os horários podem mudar conforme a preparação e a rota.</Text>
            </Card>
          )}
        </>
      )}
      {pending.map((sub) => (
        <Card key={sub.id} style={{ borderColor: c.orange }}>
          <Heading title="Uma sugestão do mercado" />
          <Text style={s.body}>
            O item selecionado ficou indisponível. Aceita {sub.replacement.name} (
            {sub.replacement.unit}) por {money(sub.replacement.unitPrice)} cada?
          </Text>
          <Banner text="Aceitar confirma apenas esta troca. Recusar retira o item original e reduz o total. Ajustes financeiros nesta versão são simulados." />
          <Button
            label="Aceitar substituição"
            onPress={() =>
              void a
                .send({ type: 'resolveSubstitution', id: sub.id, accept: true })
                .then(() => a.notify('Substituição confirmada'))
                .catch((e) => a.notify(e.message, true))
            }
          />
          <Button
            label="Retirar o item"
            secondary
            onPress={() =>
              void a
                .send({
                  type: 'resolveSubstitution',
                  id: sub.id,
                  accept: false,
                })
                .catch((e) => a.notify(e.message, true))
            }
          />
        </Card>
      ))}
      <Card>
        <Heading title={order.marketName} />
        {order.items.map((i, index) => (
          <View key={`${i.productId}-${index}`}>
            <Row label={`${i.quantity} × ${i.name}`} value={money(i.unitPrice * i.quantity)} />
            {i.note && <Text style={s.small}>{i.note}</Text>}
          </View>
        ))}
        <Row label="Subtotal dos produtos" value={money(order.quote.subtotal)} />
        <Row label="Taxa de entrega" value={money(order.quote.deliveryFee)} />
        <Row label="Taxa PedeAê" value={money(order.quote.platformFee)} />
        <Row label="Total do pedido" value={money(order.quote.total)} strong />
        <Text style={s.small}>
          Pagamento: {order.payment.toUpperCase()} ·{' '}
          {order.paymentStatus === 'pending'
            ? 'Aguardando'
            : order.paymentStatus === 'on_delivery'
              ? 'Na entrega'
              : order.paymentStatus === 'refunded'
                ? 'Estornado'
                : order.paymentStatus === 'authorized'
                  ? 'Autorizado'
                  : 'Pago'}
        </Text>
      </Card>
      <Card>
        <Text style={s.label}>Endereço de entrega</Text>
        <Text style={s.body}>
          {order.address.street}, {order.address.number}
        </Text>
        <Text style={s.small}>
          {order.address.neighborhood} · {order.address.city}, {order.address.state}
        </Text>
        <Text style={s.small}>{order.address.instructions}</Text>
      </Card>
      {active && (
        <Button
          label="Conversar sobre este pedido"
          icon="chatbubble-ellipses-outline"
          onPress={() => router.push(`/chat/${id}`)}
        />
      )}
      <Button
        secondary
        label="Preciso de ajuda"
        icon="headset-outline"
        onPress={() => router.push({ pathname: '/support', params: { orderId: id } })}
      />
      {(order.lifecycle === 'completed' || order.lifecycle === 'cancelled') && (
        <Button label="Repetir Feira" icon="refresh-outline" onPress={() => setRepeat(true)} />
      )}
      <Confirm
        visible={repeat}
        title="Repetir esta feira?"
        message="A feira atual será substituída. Usaremos os preços de hoje e apenas as quantidades disponíveis. Você revisará tudo antes de confirmar."
        confirm="Montar novamente"
        onConfirm={() => void repeatOrder()}
        onCancel={() => setRepeat(false)}
      />
      {order.statusIndex === 0 && order.lifecycle !== 'cancelled' && (
        <Button secondary label="Cancelar pedido" onPress={() => setCancel(true)} />
      )}
      <Confirm
        visible={cancel}
        title="Cancelar este pedido?"
        message={
          a.demo
            ? 'O pedido será cancelado nesta demonstração. Não houve cobrança real.'
            : 'Confira a política de cancelamento e o processamento de eventual estorno.'
        }
        confirm="Confirmar cancelamento"
        onCancel={() => setCancel(false)}
        onConfirm={() =>
          void a
            .send({ type: 'cancel', orderId: id })
            .then(() => {
              setCancel(false);
              a.notify('Pedido cancelado');
            })
            .catch((e) => a.notify(e.message, true))
        }
      />
      {a.demo && active && (
        <Card style={{ borderStyle: 'dashed', borderColor: c.primary }}>
          <Text style={s.label}>Controles da demonstração</Text>
          <Text style={s.small}>
            Avance manualmente para testar as cinco etapas. Em produção, somente a operação do
            mercado e do entregador poderá alterá-las.
          </Text>
          <Button
            label={`Simular: ${ORDER_STATUSES[Math.min(4, order.statusIndex + 1)]}`}
            secondary
            onPress={() =>
              void a
                .send({ type: 'demoAdvance', orderId: id })
                .catch((e) => a.notify(e.message, true))
            }
          />
          {order.statusIndex === 1 && order.allowContact && (
            <Button
              label="Simular sugestão de substituição"
              secondary
              onPress={() =>
                void a
                  .send({ type: 'demoSubstitution', orderId: id })
                  .catch((e) => a.notify(e.message, true))
              }
            />
          )}
        </Card>
      )}
    </Screen>
  );
}
export function Chat() {
  const a = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState('');
  const order = a.data!.orders.find((o) => o.id === id);
  const messages = a.data!.messages.filter((x) => x.orderId === id);
  async function send() {
    try {
      await a.send({ type: 'chat', orderId: id, text });
      setText('');
    } catch (e) {
      a.notify((e as Error).message, true);
    }
  }
  return (
    <Screen
      title="Conversa do pedido"
      subtitle={order?.marketName}
      footer={
        <>
          <Field
            label="Mensagem"
            value={text}
            onChangeText={setText}
            maxLength={1000}
            placeholder="Escreva sua mensagem..."
          />
          <Button
            label="Enviar mensagem"
            icon="send-outline"
            disabled={!text.trim() || !order || order.lifecycle === 'cancelled'}
            loading={a.busy}
            onPress={() => void send()}
          />
        </>
      }
    >
      {a.demo && (
        <Banner text="Conversa local de demonstração. As mensagens não são enviadas ao mercado ou a um entregador." />
      )}
      {messages.length ? (
        messages.map((m) => (
          <View
            key={m.id}
            style={{
              padding: 14,
              borderRadius: 18,
              backgroundColor: m.sender === 'client' ? c.soft : 'white',
              alignSelf: m.sender === 'client' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <Text style={s.body}>{m.text}</Text>
            <Text style={[s.small, { textAlign: 'right' }]}>
              {date(m.at)} · {a.demo ? 'Salva localmente' : 'Enviada'}
            </Text>
          </View>
        ))
      ) : (
        <Empty
          icon="chatbubble-ellipses-outline"
          title="Como podemos ajudar?"
          description="Use este espaço para falar sobre itens e instruções de entrega."
        />
      )}
    </Screen>
  );
}
export function Support() {
  const a = useApp();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [topic, setTopic] = useState('');
  return (
    <Screen title="Central de ajuda">
      <Icon name="headset-outline" size={56} />
      <Text style={s.heroTitle}>Conte com a gente.</Text>
      <Text style={s.body}>Escolha o assunto para encontrar o próximo passo.</Text>
      {[
        'Meu pedido está atrasado',
        'Recebi um item diferente',
        'Preciso corrigir o endereço',
        'Pagamento e estorno',
        'Problema durante a entrega',
      ].map((t) => (
        <Pressable key={t} onPress={() => setTopic(t)}>
          <Card>
            <View style={s.row}>
              <Text style={[s.label, s.flex]}>{t}</Text>
              <Icon name="chevron-forward" />
            </View>
          </Card>
        </Pressable>
      ))}
      {topic && (
        <Card>
          <Text style={s.sectionTitle}>{topic}</Text>
          <Text style={s.body}>
            {a.demo
              ? 'Este atendimento é demonstrativo. Nenhum chamado será enviado. Na versão conectada, esta opção abrirá um protocolo vinculado ao pedido.'
              : 'Converse com o atendimento sobre este pedido. Alterações de endereço e estornos dependem de validação da operação.'}
          </Text>
          {orderId && (
            <Button
              label="Abrir conversa do pedido"
              onPress={() => router.push(`/chat/${orderId}`)}
            />
          )}
        </Card>
      )}
      <Banner text="Suporte de pedidos não substitui serviços públicos de emergência. Em uma emergência real, procure o serviço local adequado." />
      <Button
        label="Ligação ao suporte · configuração pendente"
        secondary
        disabled
        onPress={() => {}}
      />
      <Text style={s.small}>
        O telefone de atendimento e as chamadas protegidas serão configurados com o serviço de
        suporte; nenhum número fictício é discado.
      </Text>
    </Screen>
  );
}
export function Notifications() {
  const { data } = useApp();
  const events = data!.orders
    .flatMap((o) =>
      o.history.map((h) => ({
        id: o.id,
        at: h.at,
        title: h.status,
        body: o.marketName,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Screen title="Notificações" refresh>
      {events.length ? (
        events.map((e, i) => (
          <Pressable key={`${e.id}-${i}`} onPress={() => router.push(`/order/${e.id}`)}>
            <Card>
              <View style={s.row}>
                <Icon name="notifications-outline" />
                <View style={s.flex}>
                  <Text style={s.label}>{e.title}</Text>
                  <Text style={s.small}>
                    {e.body} · {date(e.at)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          icon="notifications-outline"
          title="Tudo em dia por aqui"
          description="As atualizações dos seus pedidos aparecerão nesta lista. Notificações push dependem da integração do serviço."
        />
      )}
    </Screen>
  );
}
