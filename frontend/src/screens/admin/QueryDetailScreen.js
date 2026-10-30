import React, { useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { Screen, Header, Btn, Muted, Text } from '../../components/ui';
import { useApp } from '../../store';
import { C, FONT_BODY } from '../../theme';
import { ago } from '../../utils';

export default function QueryDetailScreen({ navigation, route }) {
  const { db, replyQuery, resolveQuery, loadQuery } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    loadQuery(route.params.id)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, [loadQuery, route.params.id]);

  const q = db.queries.find((x) => x.id === route.params.id);
  const u = q && db.users.find((x) => x.id === q.userId);

  if (!q) {
    return <Screen><Header title="Query" onBack={() => navigation.goBack()} /><Muted>This query no longer exists.</Muted></Screen>;
  }

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadQuery(q.id);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const send = async () => {
    const reply = text.trim();
    if (!reply) return;
    setBusy(true);
    try {
      await replyQuery(q.id, reply);
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
    <Screen pad={false} footer={
      <>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a reply"
            placeholderTextColor="#8A958E"
            multiline
            accessibilityLabel="Your reply"
            style={{
              flex: 1,
              minHeight: 48,
              maxHeight: 120,
              borderWidth: 1.5,
              borderColor: C.line,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              fontFamily: FONT_BODY,
              backgroundColor: '#fff',
              color: C.ink,
            }}
          />
          <Btn
            title={busy ? '…' : 'Send'}
            onPress={send}
            disabled={!text.trim() || busy}
            style={{ minWidth: 76, borderRadius: 24 }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Muted>{q.status === 'resolved' ? 'Resolved' : q.status === 'answered' ? 'Answered' : 'Awaiting reply'}</Muted>
          <Btn
            small
            kind="outline"
            title={q.status === 'resolved' ? 'Resolved' : 'Resolve conversation'}
            onPress={resolve}
            disabled={busy || q.status === 'resolved'}
          />
        </View>
      </>
    }>
      <Header
        title={u?.name || 'Deleted user'}
        sub={u ? `${u.age} · ${u.gender?.[0]?.toUpperCase()} · ${u.heightCm} cm · ${u.weightKg} kg` : undefined}
        onBack={() => navigation.goBack()}
        right={u ? <Btn small kind="outline" title="Profile" onPress={() => navigation.navigate('UserDetail', { id: u.id })} /> : null}
      />
      {loadError ? <Muted style={{ paddingHorizontal: 20 }}>{loadError}</Muted> : null}
      <ScrollView
        ref={messagesRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.green]} tintColor={C.green} />}
        onContentSizeChange={() => messagesRef.current?.scrollToEnd({ animated: true })}
      >
        {loading && !q.messages?.length ? <Muted>Loading conversation…</Muted> : null}
        {!loading && !q.messages?.length ? <Muted>No messages in this conversation yet.</Muted> : null}
        {(q.messages || []).map((message) => {
          const fromAdmin = message.from === 'admin';
          return (
            <View
              key={message.id}
              style={{ width: '100%', alignItems: fromAdmin ? 'flex-end' : 'flex-start' }}
            >
              <View
                style={{
                  maxWidth: '88%',
                  backgroundColor: fromAdmin ? C.greenSoft : '#fff',
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 18,
                  borderBottomRightRadius: fromAdmin ? 5 : 18,
                  borderBottomLeftRadius: fromAdmin ? 18 : 5,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  gap: 4,
                }}
              >
                <Text style={{ color: C.ink, fontSize: 16 }}>{message.text}</Text>
                <Muted style={{ fontSize: 12, textAlign: 'right' }}>
                  {fromAdmin ? 'You' : u?.name || 'User'} · {ago(message.at)}
                </Muted>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
