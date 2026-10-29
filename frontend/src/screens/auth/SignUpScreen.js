import React, { useState } from 'react';
import { Screen, Header, Field, Btn } from '../../components/ui';
import BrandFooter from '../../components/BrandFooter';
import { useApp } from '../../store';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useApp();
  const [f, setF] = useState({ name: '', email: '', pw: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const go = async () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email';
    if (f.pw.length < 6) e.pw = 'Use at least 6 characters';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await signUp(f.name, f.email, f.pw);
    } catch (error) {
      setErr({ email: error.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll footer={<BrandFooter />}>
      <Header title="Sign up" onBack={() => navigation.goBack()} />
      <Field label="Name" value={f.name} onChangeText={set('name')} autoCapitalize="words" error={err.name} />
      <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" error={err.email} />
      <Field label="Password" value={f.pw} onChangeText={set('pw')} secureTextEntry error={err.pw} />
      <Btn title={busy ? 'Creating account…' : 'Create account'} onPress={go} disabled={busy} />
    </Screen>
  );
}
