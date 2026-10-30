import React from 'react';
import { Alert, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Muted, Card, Avatar, HeadingText, Text } from '../../components/ui';
import MealView from '../../components/MealView';
import { useApp } from '../../store';
import { C } from '../../theme';
import { greeting, planOf } from '../../utils';

const Icon = ({ name, label, onPress, dot }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name} size={26} color={C.ink} />
    {dot ? <View style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: C.warn }} /> : null}
  </Pressable>
);

export default function DashboardScreen({ navigation }) {
  const { me, db, toggleDone, refresh } = useApp();
  const plan = planOf(db, me);
  const hasNotes = db.notifications.some((n) => n.userId === me.id);
  const toggle = async (key) => {
    try {
      await toggleDone(plan.id, key);
    } catch (error) {
      Alert.alert('Could not update meal progress', error.message);
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <Screen scroll onRefresh={refresh}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Muted>{greeting()},</Muted>
            <HeadingText style={{ fontSize: 22, fontWeight: '700', color: C.ink }} numberOfLines={1}>{me.name}</HeadingText>
          </View>
          <Icon name="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} dot={hasNotes} />
          <Avatar name={me.name} onPress={() => navigation.navigate('Profile')} />
        </View>
        {plan ? (
          <MealView plan={plan} onToggle={toggle} showNutrition />
        ) : (
          <Card>
            <HeadingText style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>Your dietitian is preparing your plan</HeadingText>
            <Muted>We will notify you once the diet plan is ready.</Muted>
          </Card>
        )}
        <Muted style={{ textAlign: 'center', fontSize: 12 }}>General diet guidance, not medical advice.</Muted>
      </Screen>
      <Pressable onPress={() => navigation.navigate('Ask')} accessibilityRole="button" accessibilityLabel="Ask a question"
        style={({ pressed }) => ({
          position: 'absolute', right: 20, bottom: 20, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, borderRadius: 28, backgroundColor: C.green, opacity: pressed ? 0.85 : 1,
          elevation: 5, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
        })}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700' }}>Ask a question</Text>
      </Pressable>
    </View>
  );
}
