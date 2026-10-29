import React from 'react';
import { View } from 'react-native';
import { Screen, Header, Card, Btn, Muted, Avatar, HeadingText } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';

export default function AdminAccountScreen({ navigation }) {
  const { me, signOut } = useApp();
  return (
    <Screen scroll footer={<Btn title="Log out" kind="outline" onPress={signOut} />}>
      <Header title="Account" onBack={() => navigation.goBack()} />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={me.name} size={56} />
          <View><HeadingText style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{me.name}</HeadingText><Muted>{me.email}</Muted><Muted>Admin</Muted></View>
        </View>
      </Card>
    </Screen>
  );
}
