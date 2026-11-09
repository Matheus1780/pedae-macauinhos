import { Tabs } from 'expo-router';
import { Icon } from '../../src/ui/components';
import { useTheme } from '../../src/state/ThemeProvider';
import { useApp } from '../../src/state/AppProvider';
export default function TabLayout() {
  const { colors } = useTheme();
  const { data } = useApp();
  const count = data?.cart.items.reduce((n, i) => n + i.quantity, 0) ?? 0;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 76,
          paddingTop: 6,
          paddingBottom: 12,
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        sceneStyle: { backgroundColor: colors.background },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Icon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <Icon name="receipt-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feira"
        options={{
          title: 'Minha feira',
          tabBarBadge: count || undefined,
          tabBarIcon: ({ color }) => <Icon name="basket-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Icon name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
