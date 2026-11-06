import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
  AccessibilityInfo,
} from 'react-native';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as c } from './theme';
import { feedback } from './feedback';
import { useApp } from '../state/AppProvider';
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export const Icon = ({
  name,
  size = 22,
  color = c.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) => <Ionicons name={name} size={size} color={color} />;
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  icon,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => {
        feedback();
        onPress();
      }}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && { backgroundColor: c.error },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? c.primary : 'white'} />
      ) : (
        <>
          {icon && <Icon name={icon} color={secondary ? c.primary : 'white'} />}
          <Text style={[s.buttonText, secondary && { color: c.primary }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={s.iconButton}
    >
      <Icon name={name} color={c.ink} />
    </Pressable>
  );
}
export function Heading({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[s.row, { marginBottom: 16 }]}>
      <View style={s.flex}>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle && <Text style={s.small}>{subtitle}</Text>}
      </View>
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction} style={{ padding: 8 }}>
          <Text style={s.link}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = true,
  footer,
  refresh = false,
  scroll = true,
  fixedTop,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  footer?: React.ReactNode;
  refresh?: boolean;
  scroll?: boolean;
  fixedTop?: React.ReactNode;
}) {
  const app = useApp();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {title && (
          <View style={s.header}>
            {back && (
              <IconButton
                name="arrow-back"
                label="Voltar"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              />
            )}
            <View style={s.flex}>
              <Text style={s.headerTitle}>{title}</Text>
              {subtitle && <Text style={s.small}>{subtitle}</Text>}
            </View>
          </View>
        )}
        {app.demo && (
          <View style={s.demo}>
            <Text style={s.demoText}>DEMONSTRAÇÃO · preços e operações fictícios</Text>
          </View>
        )}
        {fixedTop && (
          <View style={[s.content, { paddingBottom: 0, paddingTop: 12 }]}>{fixedTop}</View>
        )}
        {scroll ? (
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              refresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    void app.refresh().finally(() => setRefreshing(false));
                  }}
                  tintColor={c.primary}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[s.content, s.flex]}>{children}</View>
        )}
        {footer && (
          <SafeAreaView edges={['bottom']} style={s.footer}>
            {footer}
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Field({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ gap: 6, marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7F8A82"
        style={[
          s.input,
          props.multiline && { height: 96, textAlignVertical: 'top' },
          error && { borderColor: c.error },
        ]}
        {...props}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={s.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={s.small}>{hint}</Text>
      ) : null}
    </View>
  );
}
export function Badge({
  text,
  tone = 'green',
}: {
  text: string;
  tone?: 'green' | 'orange' | 'gray';
}) {
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor: tone === 'orange' ? '#FFF2DE' : tone === 'gray' ? '#EEF0ED' : c.soft,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: tone === 'orange' ? c.warning : tone === 'gray' ? c.muted : c.primary,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
export function Empty({
  title,
  description,
  action,
  onAction,
  icon = 'basket-outline',
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={38} />
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={[s.body, { textAlign: 'center', color: c.muted }]}>{description}</Text>
      {action && onAction && <Button label={action} onPress={onAction} />}
    </View>
  );
}
export function Banner({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <View
      accessibilityRole={error ? 'alert' : 'text'}
      style={[s.banner, error && { backgroundColor: '#FFF0ED' }]}
    >
      <Icon
        name={error ? 'alert-circle-outline' : 'information-circle-outline'}
        color={error ? c.error : c.primary}
      />
      <Text style={[s.small, s.flex, { color: error ? c.error : c.ink }]}>{text}</Text>
    </View>
  );
}
export function Skeleton() {
  return (
    <View
      accessibilityLabel="Carregando conteúdo"
      accessibilityRole="progressbar"
      style={{ gap: 16 }}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 100, borderRadius: 16, backgroundColor: '#E8EDE6' }} />
      ))}
    </View>
  );
}
export function LoadGate({ children }: { children: React.ReactNode }) {
  const a = useApp();
  if (a.loading)
    return (
      <Screen>
        <Skeleton />
      </Screen>
    );
  if (a.error || !a.data)
    return (
      <Screen>
        <Empty
          icon="cloud-offline-outline"
          title="Não conseguimos carregar"
          description={a.error ?? 'Tente novamente.'}
          action="Tentar novamente"
          onAction={() => void a.refresh()}
        />
      </Screen>
    );
  return <>{children}</>;
}
export function ProductImage({
  uri,
  emoji,
  size = 90,
}: {
  uri: string;
  emoji: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        backgroundColor: '#F3F6EF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      )}
    </View>
  );
}
export function Stepper({
  value,
  onChange,
  max = 99,
  label = 'Quantidade',
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  min?: number;
  label?: string;
}) {
  return (
    <View style={s.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${label}`}
        disabled={value <= min}
        onPress={() => {
          feedback();
          onChange(value - 1);
        }}
        style={s.stepButton}
      >
        <Icon name="remove" color={value <= min ? '#AEB8AF' : c.primary} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={s.label}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${label}`}
        disabled={value >= max}
        onPress={() => {
          feedback();
          onChange(value + 1);
        }}
        style={s.stepButton}
      >
        <Icon name="add" color={value >= max ? '#AEB8AF' : c.primary} />
      </Pressable>
    </View>
  );
}
export function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={[s.row, { paddingVertical: 9 }]}>
      <Text style={[s.body, s.flex, strong && { fontWeight: '700' }]}>{label}</Text>
      <Text style={[s.body, strong && { fontSize: 22, fontWeight: '800', color: c.primary }]}>
        {value}
      </Text>
    </View>
  );
}
export function Choice({
  title,
  description,
  selected,
  onPress,
  icon = 'checkmark-circle-outline',
  disabled = false,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      onPress={() => {
        feedback();
        onPress();
      }}
      disabled={disabled}
      style={[
        s.choice,
        selected && { borderColor: c.primary, backgroundColor: c.soft },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Icon name={icon} size={26} />
      <View style={s.flex}>
        <Text style={s.label}>{title}</Text>
        {description && <Text style={s.small}>{description}</Text>}
      </View>
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        color={selected ? c.primary : c.muted}
      />
    </Pressable>
  );
}
export function Confirm({
  visible,
  title,
  message,
  confirm = 'Continuar',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirm?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.scrim}>
        <View accessibilityViewIsModal style={s.dialog}>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.body}>{message}</Text>
          <Button label={confirm} onPress={onConfirm} />
          <Button label="Voltar" onPress={onCancel} secondary />
        </View>
      </View>
    </Modal>
  );
}
export function Toggle({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[s.row, { gap: 16 }]}>
      <View style={s.flex}>
        <Text style={s.label}>{title}</Text>
        <Text style={s.small}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.primary, false: '#D5DDD3' }}
      />
    </View>
  );
}
export const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: c.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { fontSize: 16, lineHeight: 24, color: c.ink },
  small: { fontSize: 13, lineHeight: 20, color: c.muted },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: c.ink },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
    color: c.ink,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: c.ink,
  },
  link: { color: c.primary, fontSize: 14, fontWeight: '700' },
  button: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondary: { backgroundColor: 'white', borderWidth: 1, borderColor: c.line },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: c.line,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
    fontSize: 16,
    color: c.ink,
    minHeight: 52,
  },
  error: { fontSize: 13, color: c.error },
  footer: {
    padding: 16,
    gap: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: c.line,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  badge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  empty: { paddingVertical: 48, gap: 16, alignItems: 'center' },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: c.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: c.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepper: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  scrim: {
    flex: 1,
    backgroundColor: '#10211777',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'white',
    gap: 18,
  },
  demo: { backgroundColor: '#FFF4DE', padding: 5, alignItems: 'center' },
  demoText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: c.warning,
  },
});
