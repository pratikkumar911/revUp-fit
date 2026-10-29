import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Header, Field, Btn, Muted, Text } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';
import { ago } from '../../utils';

export default function QueryDetailScreen({ navigation, route }) {
  const { db, replyQuery, resolveQuery, loadQuery } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    loadQuery(route.params.id).catch((error) => setLoadError(error.message));
  }, [loadQuery, route.params.id]);
  const q = db.queries.find((x) => x.id === route.params.id);
  const u = q && db.users.find((x) => x.id === q.userId);
  if (!q) return <Screen><Header title="Query" onBack={() => navigation.goBack()} /><Muted>This query no longer exists.</Muted></Screen>;
  const send = async () => {
    setBusy(true);
    try {
      await replyQuery(q.id, text.trim());
      await loadQuery(q.id);
      setText('');
    } catch (error) {
      Alert.alert('Could not send reply', error.message);
    } finally {
      setBusy(false);
    }
  };
  const resolve = async () => {
    setBusy(true);
    try {
      await resolveQuery(q.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not resolve query', error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll onRefresh={() => loadQuery(q.id)} footer={
      <>
        <Btn title={busy ? 'Saving…' : 'Send reply'} onPress={send} disabled={!text.trim() || busy} />
        <Btn title="Resolve" kind="outline" onPress={resolve} disabled={busy} />
      </>
    }>
      <Header title={u?.name || 'Deleted user'} sub={u ? `${u.age} · ${u.gender?.[0]?.toUpperCase()} · ${u.heightCm} cm · ${u.weightKg} kg` : undefined} onBack={() => navigation.goBack()}
        right={u ? <Btn small kind="outline" title="View profile" onPress={() => navigation.navigate('UserDetail', { id: u.id })} /> : null} />
      {loadError ? <Muted>{loadError}</Muted> : null}
      {(q.messages || []).map((m) => (
        <View key={m.id} style={{ alignSelf: m.from === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: m.from === 'admin' ? C.greenSoft : '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, gap: 4 }}>
          <Text style={{ color: C.ink, fontSize: 16 }}>{m.text}</Text>
          <Muted style={{ fontSize: 12 }}>{m.from === 'admin' ? 'You' : u?.name || 'User'} · {ago(m.at)}</Muted>
        </View>
      ))}
      <Field label="Your reply" value={text} onChangeText={setText} multiline autoCapitalize="sentences" />
    </Screen>
  );
}
