import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme, type ThemePreference } from '../state/ThemeProvider';
import { useApp } from '../state/AppProvider';
import { Card, Icon, useUI, type IconName } from './components';
export function ThemeControl() {
  const { c, s } = useUI();
  const { preference, setPreference } = useTheme();
  const a = useApp();
  const options: { value: ThemePreference; name: string; icon: IconName }[] = [
    { value: 'light', name: 'Claro', icon: 'sunny-outline' },
    { value: 'dark', name: 'Escuro', icon: 'moon-outline' },
    { value: 'system', name: 'Sistema', icon: 'phone-portrait-outline' },
  ];
  return (
    <Card>
      <Text style={s.label}>Aparência</Text>
      <Text style={s.small}>Escolha o tema ou acompanhe o seu dispositivo.</Text>
      <View style={[s.row, { gap: 8 }]}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={`Tema ${o.name.toLowerCase()}`}
            accessibilityState={{ checked: preference === o.value }}
            onPress={() =>
              void setPreference(o.value).catch(() =>
                a.notify('Não foi possível salvar o tema.', true),
              )
            }
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 8,
              paddingVertical: 14,
              borderRadius: 10,
              backgroundColor: preference === o.value ? c.soft : c.background,
              borderWidth: 1,
              borderColor: preference === o.value ? c.primary : c.line,
            }}
          >
            <Icon name={o.icon} />
            <Text style={s.label}>{o.name}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
