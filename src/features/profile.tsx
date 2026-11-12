import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { Screen, Card, Icon, Button, Field, Banner, Empty, Confirm, useUI } from '../ui/components';
import type { IconName } from '../ui/components';
import { ThemeControl } from '../ui/ThemeControl';
import { InstallApp } from '../ui/InstallApp';
export function Profile() {
  const { c, s } = useUI();
  const a = useApp();
  const [logout, setLogout] = useState(false);
  const profile = a.data!.profile;
  const links: {
    title: string;
    subtitle: string;
    icon: IconName;
    route: string;
  }[] = [
    {
      title: 'Meus favoritos',
      subtitle: 'Produtos salvos para comprar depois',
      icon: 'heart-outline',
      route: '/favorites',
    },
    {
      title: 'Meus dados',
      subtitle: 'Nome e informações de contato',
      icon: 'person-outline',
      route: '/account',
    },
    {
      title: 'Meus endereços',
      subtitle: 'Onde sua feira chega',
      icon: 'location-outline',
      route: '/addresses',
    },
    {
      title: 'Formas de pagamento',
      subtitle: 'Gerencie seus cartões',
      icon: 'card-outline',
      route: '/cards',
    },
    {
      title: 'Biometria',
      subtitle: 'Verificação no dispositivo',
      icon: 'finger-print-outline',
      route: '/biometrics',
    },
    {
      title: 'Ajuda e suporte',
      subtitle: 'Estamos aqui para ajudar',
      icon: 'headset-outline',
      route: '/support',
    },
    {
      title: 'Privacidade e dados',
      subtitle: 'Suas escolhas, com transparência',
      icon: 'shield-checkmark-outline',
      route: '/privacy',
    },
  ];
  return (
    <Screen title="Seu perfil" back={false}>
      <View style={[s.row, { paddingVertical: 12 }]}>
        <View
          style={{
            height: 74,
            width: 74,
            borderRadius: 26,
            backgroundColor: c.soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 30, fontWeight: '700', color: c.primary }}>
            {profile?.name[0]?.toUpperCase() ?? 'P'}
          </Text>
        </View>
        <View style={s.flex}>
          <Text style={s.sectionTitle}>
            {profile ? `Olá, ${profile.name.split(' ')[0]}!` : 'Bem-vindo ao PedeAê'}
          </Text>
          <Text style={s.small}>
            {profile ? 'Bom ter você por aqui.' : 'Seu mercado local, mais perto.'}
          </Text>
        </View>
      </View>
      {!profile && <Button label="Entrar ou criar conta" onPress={() => router.push('/login')} />}
      <ThemeControl />
      <InstallApp />
      <Card style={{ padding: 0 }}>
        {links.map((link, i) => (
          <Pressable
            key={link.route}
            accessibilityRole="button"
            onPress={() => router.push(link.route as never)}
            style={[
              s.row,
              {
                padding: 18,
                borderBottomWidth: i === links.length - 1 ? 0 : 1,
                borderBottomColor: c.line,
              },
            ]}
          >
            <Icon name={link.icon} />
            <View style={s.flex}>
              <Text style={s.label}>{link.title}</Text>
              <Text style={s.small}>{link.subtitle}</Text>
            </View>
            <Icon name="chevron-forward" size={18} />
          </Pressable>
        ))}
      </Card>
      {profile && <Button label="Sair da conta" secondary onPress={() => setLogout(true)} />}
      <Text style={[s.small, { textAlign: 'center', padding: 16 }]}>
        PedeAê · Cliente v1.3.0{a.demo ? '\nAmbiente de demonstração' : ''}
      </Text>
      <Confirm
        visible={logout}
        title="Sair da conta?"
        message={
          a.demo
            ? 'Os dados pessoais e pedidos demonstrativos deste dispositivo serão apagados ao sair.'
            : 'Você precisará entrar novamente para acessar seus pedidos.'
        }
        confirm="Sair"
        onCancel={() => setLogout(false)}
        onConfirm={() =>
          void a
            .send({ type: 'logout' })
            .then(() => {
              setLogout(false);
              a.notify('Você saiu da conta');
            })
            .catch((e) => a.notify(e.message, true))
        }
      />
    </Screen>
  );
}
export function Account() {
  const { c, s } = useUI();
  const a = useApp();
  const [name, setName] = useState(a.data!.profile?.name ?? ''),
    [email, setEmail] = useState(a.data!.profile?.email ?? '');
  if (!a.data!.profile)
    return (
      <Screen title="Meus dados">
        <Empty
          title="Entre para gerenciar seus dados"
          description="Você pode continuar explorando sem cadastro."
          action="Entrar"
          onAction={() => router.push('/login')}
        />
      </Screen>
    );
  return (
    <Screen
      title="Meus dados"
      footer={
        <Button
          label="Salvar alterações"
          loading={a.busy}
          onPress={() =>
            void a
              .send({ type: 'profile', name, email })
              .then(() => a.notify('Dados atualizados'))
              .catch((e) => a.notify(e.message, true))
          }
        />
      }
    >
      <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" />
      <Field
        label="E-mail (opcional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={
          email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ? 'Confira o formato do e-mail.'
            : undefined
        }
      />
      <Card>
        <Text style={s.label}>Telefone</Text>
        <Text style={s.body}>{a.data!.profile.phone}</Text>
        <Text style={s.small}>
          Alterações de telefone exigem uma nova validação de identidade pelo serviço de
          autenticação.
        </Text>
      </Card>
    </Screen>
  );
}
export function Cards() {
  const { c, s } = useUI();
  const a = useApp();
  const [last4, setLast4] = useState(''),
    [brand, setBrand] = useState('Visa');
  async function save() {
    try {
      await a.send({ type: 'saveDemoCard', last4, brand });
      setLast4('');
      a.notify('Cartão fictício adicionado');
    } catch (e) {
      a.notify((e as Error).message, true);
    }
  }
  return (
    <Screen title="Meus cartões">
      {!a.data!.profile ? (
        <Empty
          title="Entre para gerenciar cartões"
          description="Nenhum dado financeiro é coletado antes de você entrar."
          action="Entrar"
          onAction={() => router.push('/login')}
        />
      ) : (
        <>
          {a.data!.cards.map((card) => (
            <Card key={card.id}>
              <View style={s.row}>
                <Icon name="card-outline" size={32} />
                <View style={s.flex}>
                  <Text style={s.label}>
                    {card.brand} •••• {card.last4}
                  </Text>
                  <Text style={s.small}>
                    {a.demo ? 'Cartão demonstrativo' : 'Cartão tokenizado pelo provedor'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Remover cartão ${card.last4}`}
                  onPress={() =>
                    void a
                      .send({ type: 'removeCard', id: card.id })
                      .catch((e) => a.notify(e.message, true))
                  }
                  style={{ padding: 12 }}
                >
                  <Icon name="trash-outline" color={c.error} />
                </Pressable>
              </View>
            </Card>
          ))}
          {!a.data!.cards.length && (
            <Empty
              icon="card-outline"
              title="Nenhum cartão salvo"
              description={
                a.demo
                  ? 'Adicione um cartão fictício para testar o checkout.'
                  : 'Os cartões serão cadastrados pelo formulário seguro do provedor.'
              }
            />
          )}
          <Banner text="Nunca informe número completo ou CVV nesta demonstração. Em produção, o SDK do provedor de pagamentos coletará e tokenizará os dados." />
          {a.demo && (
            <Card>
              <Field label="Bandeira demonstrativa" value={brand} onChangeText={setBrand} />
              <Field
                label="Quatro últimos dígitos fictícios"
                value={last4}
                onChangeText={(v) => setLast4(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="1234"
              />
              <Button
                label="Adicionar cartão de teste"
                disabled={last4.length !== 4 || !brand.trim()}
                loading={a.busy}
                onPress={() => void save()}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
export function Privacy() {
  const { c, s } = useUI();
  const a = useApp();
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen title="Privacidade e seus dados">
      <Card>
        <Text style={s.sectionTitle}>Você está no controle</Text>
        <Text style={s.body}>
          {a.demo
            ? 'Este protótipo armazena os dados de demonstração localmente no seu dispositivo. Use informações fictícias. Não existe banco de dados externo conectado.'
            : 'Os dados da conta são tratados pelo serviço conectado. Consulte a política de privacidade publicada pela operação.'}
        </Text>
      </Card>
      <Card>
        <Text style={s.label}>Localização</Text>
        <Text style={s.body}>
          Solicitada somente quando você toca em “Usar minha localização”. Você pode informar sua
          cidade manualmente e revogar a permissão nas configurações do dispositivo.
        </Text>
      </Card>
      <Card>
        <Text style={s.label}>Pagamentos e biometria</Text>
        <Text style={s.body}>
          O app não armazena CVV, número completo de cartão ou dados biométricos. A biometria é
          processada pelo sistema operacional.
        </Text>
      </Card>
      <Card>
        <Text style={s.label}>Imagens externas</Text>
        <Text style={s.body}>
          Fotos ilustrativas são carregadas do Unsplash. A conexão com esse serviço transmite os
          dados técnicos normais de uma requisição, como endereço IP. Sem conexão, os produtos têm
          uma ilustração alternativa.
        </Text>
      </Card>
      {a.data!.profile && (
        <Button
          danger
          label={a.demo ? 'Apagar meus dados de demonstração' : 'Solicitar exclusão da conta'}
          onPress={() => setConfirm(true)}
        />
      )}
      <Confirm
        visible={confirm}
        title="Apagar os dados desta conta?"
        message={
          a.demo
            ? 'Perfil, endereços, cartões fictícios e pedidos demonstrativos serão apagados deste dispositivo.'
            : 'O serviço processará a solicitação conforme as obrigações de retenção aplicáveis.'
        }
        confirm="Confirmar exclusão"
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          void a
            .send({ type: 'deleteAccount' })
            .then(() => {
              a.notify('Dados removidos');
              router.replace('/(tabs)/profile');
            })
            .catch((e) => a.notify(e.message, true))
        }
      />
    </Screen>
  );
}
