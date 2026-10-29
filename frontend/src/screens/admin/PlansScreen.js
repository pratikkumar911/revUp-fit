import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Screen, Header, Field, Card, Btn, Muted, Avatar, HeadingText } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';

export default function PlansScreen({ navigation }) {
  const { db, me, cloneTemplate, deleteTemplate } = useApp();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const list = db.templates.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()));
  const remove = async (id) => {
    setBusy(true);
    try {
      await deleteTemplate(id);
    } catch (error) {
      Alert.alert('Could not delete plan', error.message);
    } finally {
      setBusy(false);
    }
  };
  const clone = async (id) => {
    setBusy(true);
    try {
      await cloneTemplate(id);
    } catch (error) {
      Alert.alert('Could not copy plan', error.message);
    } finally {
      setBusy(false);
    }
  };
  const del = (t) => Alert.alert('Delete plan?', `"${t.name}" will be removed. Plans already assigned to users are not affected.`, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove(t.id) },
  ]);
  return (
    <Screen scroll>
      <Header title="Plans" right={<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Btn small title="+ New Plan" onPress={() => navigation.navigate('PlanEditor', {})} /><Avatar name={me.name} onPress={() => navigation.navigate('AdminAccount')} /></View>} />
      <Field label="Search" value={q} onChangeText={setQ} placeholder="Plan name" />
      {list.length === 0 ? <Muted>No plans yet. Create one with + New Plan.</Muted> : null}
      {list.map((t) => (
        <Card key={t.id}>
          <HeadingText style={{ fontSize: 17, fontWeight: '700', color: C.ink }}>{t.name}</HeadingText>
          <Muted>Assigned to {db.plans.filter((p) => p.templateId === t.id).length} users · {t.durationDays || t.days.length} days</Muted>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Btn small kind="outline" title="Edit" onPress={() => navigation.navigate('PlanEditor', { templateId: t.id })} />
            <Btn small kind="outline" title="Clone" onPress={() => clone(t.id)} disabled={busy} />
            <Btn small title="Assign" onPress={() => navigation.navigate('Assign', { templateId: t.id })} />
            <Btn small kind="dangerOutline" title="Delete" onPress={() => del(t)} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
