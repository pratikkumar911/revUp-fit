import React from 'react';
import { Alert, Linking, Pressable } from 'react-native';
import { Screen, Header, Card, Text } from '../../components/ui';
import { C } from '../../theme';

const PAGES = ['Privacy policy', 'Terms of use', 'Medical disclaimer', 'Consent notice'];
const DELETE_ACCOUNT_URL = 'https://revup-fit-1.onrender.com';

export default function LegalScreen({ navigation }) {
  const openDeleteAccountWebsite = async () => {
    try {
      await Linking.openURL(DELETE_ACCOUNT_URL);
    } catch (error) {
      Alert.alert('Could not open website', error.message || 'Please try again.');
    }
  };

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
      <Card style={{ paddingVertical: 4 }}>
        <Pressable onPress={openDeleteAccountWebsite} accessibilityRole="link" accessibilityLabel="Delete account website" style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, color: C.ink }}>Delete account website</Text><Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
