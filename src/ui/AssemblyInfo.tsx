import React from 'react';
import { View, Text } from 'react-native';
import type { AssemblyAllocation, Order } from '../domain/types';
import { money } from '../domain/rules';
import { Card, Icon, useUI } from './components';
export function AssemblyInfo({
  allocation,
  state,
}: {
  allocation?: AssemblyAllocation;
  state?: NonNullable<Order['assembly']>['state'];
}) {
  const { c, s } = useUI();
  if (!allocation) return null;
  const courier = allocation.by === 'courier';
  return (
    <Card>
      <View style={s.row}>
        <Icon name={courier ? 'bicycle-outline' : 'storefront-outline'} />
        <View style={s.flex}>
          <Text style={s.label}>
            {courier ? 'O entregador monta sua feira' : 'O mercado monta sua feira'}
          </Text>
          <Text style={s.small}>
            {courier
              ? 'Ele vai ao mercado, seleciona os produtos e faz a entrega.'
              : 'A equipe separa os produtos para a coleta do entregador.'}
          </Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: c.line }} />
      <Text style={s.small}>
        {state === 'void'
          ? 'Bônus cancelado'
          : state === 'earned'
            ? 'Bônus registrado'
            : 'Bônus de montagem'}
        : <Text style={{ fontWeight: '700', color: c.ink }}>{money(allocation.bonus)}</Text> · 1,5%
        dos produtos.
      </Text>
      <Text style={s.small}>
        Pago pela PedeAê com a taxa da plataforma, sem cobrança extra para você. A remuneração da
        entrega é separada.
      </Text>
    </Card>
  );
}
