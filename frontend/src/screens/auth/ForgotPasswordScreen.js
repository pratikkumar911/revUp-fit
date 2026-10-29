import React, { useState } from 'react';
import { Screen, Header, Field, Btn, Card, Muted } from '../../components/ui';
import { resetPassword } from '../../api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setError('');
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll>
      <Header title="Forgot password" onBack={() => navigation.goBack()} />
      {sent ? (
        <Card><Muted>If an account exists for {email}, we have sent a link to reset the password. Check your spam folder too.</Muted></Card>
      ) : (
        <>
          <Muted>Enter your email and we will send you a link to set a new password.</Muted>
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" error={error} />
          <Btn title={busy ? 'Sending…' : 'Send reset link'} onPress={send} disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())} />
        </>
      )}
      <Btn title="Back to sign in" kind="outline" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
