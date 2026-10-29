import React, { useState } from 'react';
import { Screen, Header, Card, Field, Btn, Muted, Text } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';

export default function DeleteAccountScreen({ navigation }) {
  const { deleteAccount } = useApp();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setErr('');
    setBusy(true);
    try {
      await deleteAccount(pw);
    } catch (error) {
      setErr(error.code === 'auth/invalid-credential' ? 'Wrong password' : error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll footer={<><Btn title={busy ? 'Deleting…' : 'Delete my account'} kind="danger" onPress={go} disabled={!pw || busy} /><Btn title="Cancel" kind="outline" onPress={() => navigation.goBack()} /></>}>
      <Header title="Delete account" onBack={() => navigation.goBack()} />
      <Card style={{ backgroundColor: C.warnSoft, borderColor: C.warn }}>
        <Text style={{ color: '#7A2A0C' }}>This permanently deletes your profile, health details, plan and chats. It cannot be undone.</Text>
      </Card>
      <Muted>Enter your password to confirm.</Muted>
      <Field label="Password" value={pw} onChangeText={(v) => { setPw(v); setErr(''); }} secureTextEntry error={err} />
    </Screen>
  );
}
