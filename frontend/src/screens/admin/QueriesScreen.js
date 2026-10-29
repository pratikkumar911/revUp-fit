import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, Header, Chip, Card, Tag, Muted, Avatar, HeadingText } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';
import { ago } from '../../utils';

export default function QueriesScreen({ navigation }) {
  const { db, me, refresh } = useApp();
  const [f, setF] = useState('open');
  const list = db.queries.filter((q) => f === 'all' || (f === 'open' ? q.status === 'open' : q.status !== 'open')).sort((a, b) => b.lastAt - a.lastAt);
  return (
    <Screen scroll onRefresh={refresh}>
      <Header title="Queries" sub={`${db.queries.length} total`} right={<Avatar name={me.name} onPress={() => navigation.navigate('AdminAccount')} />} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[['open', 'Unanswered'], ['answered', 'Answered'], ['all', 'All']].map(([k, l]) => <Chip key={k} label={l} on={f === k} onPress={() => setF(k)} />)}
      </View>
      {list.length === 0 ? <Muted>No queries here.</Muted> : null}
      {list.map((q) => {
        const u = db.users.find((x) => x.id === q.userId), last = q.messages?.[q.messages.length - 1];
        return (
          <Pressable key={q.id} onPress={() => navigation.navigate('QueryDetail', { id: q.id })} accessibilityRole="button">
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <HeadingText style={{ fontWeight: '700', color: C.ink, fontSize: 16 }}>{u?.name || 'Deleted user'}</HeadingText>
                <Tag label={q.status === 'open' ? 'Unanswered' : 'Answered'} warn={q.status === 'open'} />
              </View>
              <Muted numberOfLines={2}>{last?.text || q.preview}</Muted>
              <Muted style={{ fontSize: 12 }}>{ago(q.lastAt)}</Muted>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
