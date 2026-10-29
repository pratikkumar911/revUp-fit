import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, Header, Field, Chip, Card, Tag, Muted, Avatar, HeadingText } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';
import { statusOf, STATUS_LABEL, ago } from '../../utils';

export default function UsersScreen({ navigation }) {
  const { db, me } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState('all');
  const all = db.users.filter((u) => u.role === 'user' && u.onboarded);
  let rows = all.map((u) => ({ u, st: statusOf(db, u) }))
    .filter(({ u, st }) => (f === 'all' || (f === 'none' ? st !== 'active' : st === 'active')) && u.name.toLowerCase().includes(q.trim().toLowerCase()));
  if (f === 'none') rows.sort((a, b) => (a.u.waitingSince || 0) - (b.u.waitingSince || 0)); // longest waiting first
  return (
    <Screen scroll>
      <Header title="Users" sub={`${all.length} total`} right={<Avatar name={me.name} onPress={() => navigation.navigate('AdminAccount')} />} />
      <Field label="Search" value={q} onChangeText={setQ} placeholder="Name" autoCapitalize="none" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[['all', 'All'], ['none', 'No Plan'], ['active', 'Active Plan']].map(([k, l]) => <Chip key={k} label={l} on={f === k} onPress={() => setF(k)} />)}
      </View>
      {rows.length === 0 ? <Muted>No users found.</Muted> : null}
      {rows.map(({ u, st }) => (
        <Pressable key={u.id} onPress={() => navigation.navigate('UserDetail', { id: u.id })} accessibilityRole="button">
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <HeadingText style={{ fontSize: 17, fontWeight: '700', color: C.ink, flex: 1 }}>{u.name}</HeadingText>
              <Tag label={STATUS_LABEL[st]} warn={st !== 'active'} />
            </View>
            <Muted>{u.age} · {u.gender?.[0]?.toUpperCase()} · {u.heightCm} cm · {u.weightKg} kg</Muted>
            {st === 'none' && u.waitingSince ? <Muted>Waiting since {ago(u.waitingSince)}</Muted> : null}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
