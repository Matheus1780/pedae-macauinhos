import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Platform, PanResponder } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { useApp } from '../state/AppProvider';
import { repository } from '../data';
import type { Challenge } from '../data/contracts';
import { Screen, Button, Card, Field, Icon, Banner, Choice, s } from '../ui/components';
import { colors as c } from '../ui/theme';
import { digits } from '../domain/rules';
const slides = [
  {
    icon: 'storefront-outline' as const,
    title: 'Seu bairro tem\ntudo que você precisa.',
    body: 'Descubra os mercados perto de você e fortaleça o comércio local.',
    eyebrow: 'PERTINHO DE VOCÊ',
  },
  {
    icon: 'basket-outline' as const,
    title: 'Uma feira completa.\nDo seu jeito.',
    body: 'Escolha os produtos, deixe suas preferências e organize tudo na Minha feira.',
    eyebrow: 'MINHA FEIRA',
  },
  {
    icon: 'bicycle-outline' as const,
    title: 'Do mercado\naté a sua porta.',
    body: 'Veja os custos antes de confirmar e acompanhe cada etapa da entrega.',
    eyebrow: 'CUIDADO EM CADA ETAPA',
  },
];
export function Onboarding() {
  const [step, setStep] = useState(0);
  const slide = slides[step]!;
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 45)
            setStep((current) => Math.max(0, Math.min(2, current + (g.dx < 0 ? 1 : -1))));
        },
      }),
    [],
  );
  return (
    <Screen
      footer={
        <>
          <Button
            label={step === 2 ? 'Iniciar' : 'Continuar'}
            onPress={() => (step === 2 ? router.replace('/location') : setStep(step + 1))}
          />
          <Button
            secondary
            label="Pular apresentação"
            onPress={() => router.replace('/location')}
          />
        </>
      }
    >
      <View {...swipe.panHandlers} style={{ paddingVertical: 24, gap: 28 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: c.primary }}>
          PedeAê<Text style={{ color: c.orange }}> ✦</Text>
        </Text>
        <View
          style={{
            height: 260,
            backgroundColor: c.soft,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 160,
              height: 160,
              backgroundColor: c.lime,
              borderRadius: 80,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={slide.icon} size={88} />
          </View>
          <Text
            style={{
              position: 'absolute',
              bottom: 22,
              color: c.primary,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 2,
            }}
          >
            {slide.eyebrow}
          </Text>
        </View>
        <Text style={s.heroTitle}>{slide.title}</Text>
        <Text style={[s.body, { color: c.muted }]}>{slide.body}</Text>
        <View style={[s.row, { justifyContent: 'center' }]}>
          {slides.map((_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Slide ${i + 1} de 3`}
              onPress={() => setStep(i)}
              style={{ padding: 12 }}
            >
              <View
                style={{
                  width: i === step ? 28 : 8,
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: i === step ? c.primary : c.line,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Text style={[s.small, { textAlign: 'center' }]}>
          O mercado na palma da mão e sua compra do mercado até você
        </Text>
      </View>
    </Screen>
  );
}
export function LocationScreen() {
  const a = useApp();
  const [city, setCity] = useState(a.data?.city || 'Parambu, CE'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function gps() {
    setBusy(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted')
        throw Error('Permissão não concedida. Você pode informar sua cidade manualmente.');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (Platform.OS === 'web') {
        setError(
          'Localização obtida. Confirme sua cidade abaixo; a cobertura demonstrativa é Parambu, CE.',
        );
      } else {
        const [place] = await Location.reverseGeocodeAsync(position.coords);
        if (place)
          setCity(
            `${place.city || place.subregion || 'Parambu'}, ${place.region === 'Ceará' ? 'CE' : place.region || 'CE'}`,
          );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    try {
      await a.send({ type: 'onboard', city });
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen
      title="Onde vai ser sua feira?"
      footer={
        <Button
          label="Explorar mercados"
          onPress={() => void confirm()}
          disabled={!city.trim()}
          loading={a.busy}
        />
      }
    >
      <View style={{ paddingVertical: 24, gap: 16 }}>
        <Icon name="location-outline" size={64} />
        <Text style={s.heroTitle}>Tudo começa\nperto de você.</Text>
        <Text style={s.body}>
          Escolha sua cidade para encontrar os mercados da região. O endereço completo fica para a
          entrega.
        </Text>
      </View>
      <Button
        label="Usar minha localização"
        secondary
        icon="navigate-outline"
        loading={busy}
        onPress={() => void gps()}
      />
      <Field
        label="Cidade e estado"
        value={city}
        onChangeText={setCity}
        placeholder="Ex.: Parambu, CE"
      />
      {error && <Banner text={error} error />}
      <Banner text="O catálogo de demonstração está disponível em Parambu, CE. Nenhuma localização é compartilhada com um entregador nesta versão." />
    </Screen>
  );
}
export function Login() {
  const a = useApp();
  const [phone, setPhone] = useState(''),
    [name, setName] = useState(''),
    [code, setCode] = useState(''),
    [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms'),
    [challenge, setChallenge] = useState<Challenge | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  async function request() {
    setError('');
    setBusy(true);
    try {
      setChallenge(await repository.requestOtp(phone, channel));
      setCode('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError('');
    try {
      a.acceptSnapshot(await repository.verifyOtp(challenge!.id, code, name));
      a.notify('Conta pronta. Bem-vindo ao PedeAê!');
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const wait = Math.max(0, Math.ceil(((challenge?.resendAt ?? 0) - now) / 1000));
  return (
    <Screen title={challenge ? 'Confirme seu número' : 'Entre para continuar'}>
      <View style={{ gap: 12, paddingVertical: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: c.primary }}>PedeAê ✦</Text>
        <Text style={s.heroTitle}>
          {challenge ? 'Só falta o código.' : 'Sua feira começa\ncom você.'}
        </Text>
        <Text style={s.body}>
          {challenge
            ? `Código de 6 dígitos para o número terminado em ${digits(phone).slice(-4)}.`
            : 'Explore sem cadastro. Entre para salvar endereços e confirmar pedidos.'}
        </Text>
      </View>
      {a.demo && (
        <Banner text="Login demonstrativo: nenhum SMS ou WhatsApp será enviado. Use o código 123456 e dados fictícios." />
      )}
      {!challenge ? (
        <>
          <Field
            label="Como podemos chamar você?"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            placeholder="Seu nome"
            error={name.length === 1 ? 'Use pelo menos 2 caracteres.' : undefined}
          />
          <Field
            label="Telefone com DDD"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="(88) 99999-0000"
            maxLength={16}
          />
          <Choice
            title="Receber por SMS"
            selected={channel === 'sms'}
            onPress={() => setChannel('sms')}
            icon="chatbox-outline"
          />
          <Choice
            title="Receber por WhatsApp"
            selected={channel === 'whatsapp'}
            onPress={() => setChannel('whatsapp')}
            icon="logo-whatsapp"
          />
          <Button
            label="Receber código"
            onPress={() => void request()}
            loading={busy}
            disabled={name.trim().length < 2 || digits(phone).length < 10}
          />
          <View style={s.row}>
            <View style={{ height: 1, backgroundColor: c.line, flex: 1 }} />
            <Text style={s.small}>ou</Text>
            <View style={{ height: 1, backgroundColor: c.line, flex: 1 }} />
          </View>
          <Button
            label="Google · integração pendente"
            secondary
            disabled
            onPress={() => {}}
            icon="logo-google"
          />
          <Button
            label="Apple · integração pendente"
            secondary
            disabled
            onPress={() => {}}
            icon="logo-apple"
          />
          <Pressable onPress={() => router.push('/recover')} style={{ padding: 16 }}>
            <Text style={[s.link, { textAlign: 'center' }]}>Preciso recuperar meu acesso</Text>
          </Pressable>
          <Text style={s.small}>
            Ao continuar, você acessa uma demonstração local. Consulte as informações de privacidade
            no Perfil.
          </Text>
        </>
      ) : (
        <>
          <Field
            label="Código de verificação"
            value={code}
            onChangeText={(v) => setCode(digits(v).slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            maxLength={6}
            placeholder="000000"
          />
          <Button
            label="Validar código e entrar"
            onPress={() => void verify()}
            disabled={code.length !== 6}
            loading={busy}
          />
          <Button
            label={wait ? `Reenviar em ${wait}s` : 'Reenviar código'}
            secondary
            onPress={() => void request()}
            disabled={wait > 0 || busy}
          />
          <Button
            label="Alterar telefone"
            secondary
            onPress={() => {
              setChallenge(null);
              setError('');
            }}
          />
        </>
      )}
      {error && <Banner error text={error} />}
    </Screen>
  );
}
export function Recover() {
  const a = useApp();
  const [identifier, setIdentifier] = useState(''),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!remaining) return;
    const t = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  async function recover() {
    setBusy(true);
    try {
      await repository.recover(identifier);
      setSent(true);
      setRemaining(60);
    } catch (e) {
      a.notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Recuperar acesso">
      <Icon name="shield-checkmark-outline" size={56} />
      <Text style={s.heroTitle}>Vamos ajudar você\na entrar novamente.</Text>
      <Text style={s.body}>
        O acesso por telefone não usa senha. Solicite um novo código na tela de entrada. Para contas
        migradas, o serviço de recuperação pode usar o e-mail cadastrado.
      </Text>
      <Field
        label="Telefone ou e-mail"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />
      {sent && (
        <Banner
          text={
            a.demo
              ? 'Solicitação simulada. Nenhuma mensagem foi enviada.'
              : 'Se os dados corresponderem a uma conta, você receberá instruções de recuperação.'
          }
        />
      )}
      <Button
        label={remaining ? `Reenviar em ${remaining}s` : 'Solicitar recuperação'}
        disabled={!identifier.trim() || remaining > 0}
        loading={busy}
        onPress={() => void recover()}
      />
      <Button
        label="Voltar à entrada por código"
        secondary
        onPress={() => router.replace('/login')}
      />
    </Screen>
  );
}
export function Biometrics() {
  const a = useApp();
  const [available, setAvailable] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web')
      void Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]).then(([h, e]) => setAvailable(h && e));
  }, []);
  async function verify() {
    setBusy(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verificar identidade no dispositivo',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (result.success) a.notify('Verificação local concluída.');
      else a.notify('Verificação não concluída. Você pode continuar pelo código.', true);
    } catch {
      a.notify('Biometria indisponível neste dispositivo.', true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Biometria e acesso">
      <Icon name="finger-print-outline" size={72} />
      <Text style={s.heroTitle}>Sua identidade,\nno seu dispositivo.</Text>
      <Banner text="A biometria verifica quem está usando este dispositivo. Ela não substitui a validação de uma sessão pelo servidor." />
      {!a.data?.profile ? (
        <Button label="Entrar primeiro" onPress={() => router.push('/login')} />
      ) : (
        <Button
          label={available ? 'Verificar com biometria' : 'Biometria indisponível neste dispositivo'}
          onPress={() => void verify()}
          disabled={!available}
          loading={busy}
        />
      )}
      <Text style={s.small}>
        Face ID requer um build nativo com a permissão configurada. No navegador, use a entrada por
        código.
      </Text>
    </Screen>
  );
}
