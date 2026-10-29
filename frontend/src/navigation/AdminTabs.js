import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store';
import { C } from '../theme';
import UsersScreen from '../screens/admin/UsersScreen';
import QueriesScreen from '../screens/admin/QueriesScreen';
import PlansScreen from '../screens/admin/PlansScreen';

const Tab = createBottomTabNavigator();
const ICON = { Users: 'people-outline', Queries: 'chatbubbles-outline', Templates: 'albums-outline' };

export default function AdminTabs() {
  const { db } = useApp();
  const open = db.queries.filter((q) => q.status === 'open').length;
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false, tabBarActiveTintColor: C.green, tabBarInactiveTintColor: C.muted,
      tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.line },
      tabBarIcon: ({ color, size }) => <Ionicons name={ICON[route.name]} size={size} color={color} />,
    })}>
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Queries" component={QueriesScreen} options={{ tabBarBadge: open > 0 ? open : undefined }} />
      <Tab.Screen name="Templates" component={PlansScreen} />
    </Tab.Navigator>
  );
}
