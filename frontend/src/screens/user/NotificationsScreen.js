import React from 'react';
import { Alert, View, Pressable } from 'react-native';
import { Screen, Header, Card, Muted, Text } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';
import { ago } from '../../utils';

export default function NotificationsScreen({ navigation }) {
  const { me, db, dismissNotification } = useApp();
  const list = db.notifications.filter((n) => n.userId === me.id).sort((a, b) => b.at - a.at);
  const dismiss = async (id) => {
    try {
      await dismissNotification(id);
    } catch (error) {
      Alert.alert('Could not dismiss notification', error.message);
    }
  };
  return (
    <Screen scroll>
      <Header title="Notifications" sub="Last 7 days" onBack={() => navigation.goBack()} />
      {list.length === 0 ? <Muted>No notifications yet.</Muted> : null}
      {list.map((n) => (
        <Card key={n.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontWeight: '700', color: C.ink, flex: 1 }}>{n.title}</Text>
            <Pressable onPress={() => dismiss(n.id)} accessibilityLabel="Dismiss" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -10, marginRight: -10 }}>
              <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
            </Pressable>
          </View>
          <Muted>{n.body}</Muted>
          <Muted style={{ fontSize: 12 }}>{ago(n.at)}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
