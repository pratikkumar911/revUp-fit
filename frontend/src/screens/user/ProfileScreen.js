import React from 'react';
import { Alert, View, Pressable, Switch } from 'react-native';
import { Screen, Header, Card, Muted, Avatar, Text, HeadingText } from '../../components/ui';
import BrandFooter from '../../components/BrandFooter';
import { useApp } from '../../store';
import { C } from '../../theme';

const Item = ({ label, onPress, danger, right }) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text style={{ fontSize: 16, color: danger ? C.warn : C.ink }}>{label}</Text>
    {right ?? <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>}
  </Pressable>
);

export default function ProfileScreen({ navigation }) {
  const { me, updateProfile, signOut } = useApp();
  const [savingNotifications, setSavingNotifications] = React.useState(false);
  const setNotifications = async (notifOn) => {
    if (savingNotifications || notifOn === !!me.notifOn) return;
    setSavingNotifications(true);
    try {
      await updateProfile({ notifOn });
    } catch (error) {
      Alert.alert('Could not update notification settings', error.message);
    } finally {
      setSavingNotifications(false);
    }
  };
  return (
    <Screen scroll footer={<BrandFooter />}>
      <Header title="Profile" onBack={() => navigation.goBack()} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar name={me.name} size={64} />
        <View><HeadingText style={{ fontSize: 20, fontWeight: '700', color: C.ink }}>{me.name}</HeadingText><Muted>{me.email}</Muted></View>
      </View>
      <Card style={{ paddingVertical: 4 }}>
        <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => setNotifications(!me.notifOn)}
            disabled={savingNotifications}
            accessibilityRole="button"
            style={{ flex: 1, minHeight: 52, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, color: C.ink }}>Notification settings</Text>
          </Pressable>
          <Switch
            value={!!me.notifOn}
            onValueChange={setNotifications}
            disabled={savingNotifications}
            trackColor={{ true: C.green }}
            accessibilityLabel="Notifications"
          />
        </View>
        <Item label="Edit my details" onPress={() => navigation.navigate('EditDetails')} />
        <Item label="Legal and support" onPress={() => navigation.navigate('Legal')} />
        <Item label="Log out" onPress={signOut} />
        <Item label="Delete account" danger onPress={() => navigation.navigate('DeleteAccount')} />
      </Card>
    </Screen>
  );
}
