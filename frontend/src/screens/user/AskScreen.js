import React, { useState } from 'react';
import { Alert, View, TextInput } from 'react-native';
import { Screen, Header, Muted, Btn, Text } from '../../components/ui';
import { useApp } from '../../store';
import { C, FONT_BODY } from '../../theme';
import { ago } from '../../utils';

export default function AskScreen({ navigation }) {
  const { me, db, sendMessage, refresh } = useApp();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const msgs = db.queries.filter((q) => q.userId === me.id).flatMap((q) => q.messages).sort((a, b) => a.at - b.at);
  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(text.trim());
      setText('');
    } catch (error) {
      Alert.alert('Could not send your message', error.message);
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      <Screen scroll onRefresh={refresh}
        footer={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <TextInput value={text} onChangeText={setText} placeholder="Type your question" placeholderTextColor="#8A958E" multiline accessibilityLabel="Your question"
              style={{ flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1.5, borderColor: '#CFC9BA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontFamily: FONT_BODY, backgroundColor: '#fff', color: C.ink }} />
            <Btn title={sending ? 'Sending…' : 'Send'} onPress={send} disabled={!text.trim() || sending} style={{ minWidth: 80 }} />
          </View>
        }>
        <Header title="Ask us" sub="You can expect a reply within 1 to 2 hours" onBack={() => navigation.goBack()} />
        {msgs.length === 0 ? <Muted>Ask your dietitian anything about your plan.</Muted> : null}
        {msgs.map((m) => (
          <View key={m.id} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.from === 'user' ? C.greenSoft : '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, gap: 4 }}>
            <Text style={{ color: C.ink, fontSize: 16 }}>{m.text}</Text>
            <Muted style={{ fontSize: 12 }}>{m.from === 'user' ? 'You' : 'Dietitian'} · {ago(m.at)}</Muted>
          </View>
        ))}
      </Screen>
    </>
  );
}
