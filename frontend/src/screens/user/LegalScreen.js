import React from 'react';
import { Pressable } from 'react-native';
import { Screen, Header, Card, Text } from '../../components/ui';
import { C } from '../../theme';

const PAGES = ['Privacy policy', 'Terms of use', 'Medical disclaimer', 'Consent notice'];

export default function LegalScreen({ navigation }) {
  return (
    <Screen scroll>
      <Header title="Legal and support" onBack={() => navigation.goBack()} />
      <Card style={{ paddingVertical: 4 }}>
        {PAGES.map((p) => (
          <Pressable key={p} onPress={() => navigation.navigate('LegalPage', { title: p })} accessibilityRole="button" style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, color: C.ink }}>{p}</Text><Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
