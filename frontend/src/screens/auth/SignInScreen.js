import React, { useState } from 'react';
import { Image, Pressable } from 'react-native';
import { Screen, H1, Muted, Field, Btn, Text } from '../../components/ui';
import BrandFooter from '../../components/BrandFooter';
import { useApp } from '../../store';
import { C } from '../../theme';

export default function SignInScreen({ navigation }) {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setErr('');
    setBusy(true);
    try {
      await signIn(email, pw);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll footer={<BrandFooter />}>
      <Image
        source={require('../../../assets/revup-fit-logo.png')}
        accessibilityLabel="RevUp Fit"
        resizeMode="contain"
        style={{ width: 240, height: 68, alignSelf: 'center', marginTop: 16 }}
      />
      <H1>Welcome back</H1>
      <Muted>Sign in to continue</Muted>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry error={err} />
      <Btn title={busy ? 'Signing in…' : 'Sign in'} onPress={go} disabled={!email || !pw || busy} />
      <Pressable onPress={() => navigation.navigate('Forgot')} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: C.green, fontWeight: '600' }}>Forgot password?</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('SignUp')} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: C.ink }}>Don&apos;t have an account? <Text style={{ color: C.green, fontWeight: '700' }}>Sign up</Text></Text>
      </Pressable>
    </Screen>
  );
}
