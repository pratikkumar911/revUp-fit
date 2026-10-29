import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen, Header, Field, Btn, Radio, Muted } from '../../components/ui';
import { useApp } from '../../store';
import { today, addDays, isDateKey, fmt, statusOf, STATUS_LABEL } from '../../utils';

// Params: { templateId? } from the Plans list, or { userId? } from a user's page. The missing one is picked here.
export default function AssignScreen({ navigation, route }) {
  const { db, assignPlan } = useApp();
  const p = route.params || {};
  const [tid, setTid] = useState(p.templateId || null);
  const [uid, setUid] = useState(p.userId || null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [start, setStart] = useState(today());
  const template = db.templates.find((x) => x.id === tid);
  const durationDays = template?.durationDays || template?.days.length || 1;
  const endDate = isDateKey(start) && template ? addDays(start, durationDays - 1) : null;
  const endDateOk = endDate != null && isDateKey(endDate);
  const ok = tid && uid && isDateKey(start) && endDateOk;
  const users = db.users.filter((u) => u.role === 'user' && u.onboarded && u.name.toLowerCase().includes(q.trim().toLowerCase()));
  const go = async () => {
    const t = template, u = db.users.find((x) => x.id === uid);
    setBusy(true);
    try {
      await assignPlan({ userId: uid, templateId: tid, startDate: start, repeatDays: durationDays });
      Alert.alert('Plan assigned', `"${t.name}" is now assigned to ${u.name}. They have been notified.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Could not assign plan', error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll footer={<Btn title={busy ? 'Assigning…' : 'Assign'} onPress={go} disabled={!ok || busy} />}>
      <Header title="Assign plan" onBack={() => navigation.goBack()} />
      <Muted>Select plan</Muted>
      {(p.templateId ? db.templates.filter((t) => t.id === p.templateId) : db.templates).map((t) => (
        <Radio key={t.id} on={tid === t.id} label={t.name} sub={`${t.durationDays || t.days.length} days`} onPress={() => setTid(t.id)} />
      ))}
      <Muted>Select user</Muted>
      {!p.userId ? <Field value={q} onChangeText={setQ} placeholder="Search users" /> : null}
      {(p.userId ? users.filter((u) => u.id === p.userId) : users).map((u) => (
        <Radio key={u.id} on={uid === u.id} label={u.name} sub={STATUS_LABEL[statusOf(db, u)]} onPress={() => setUid(u.id)} />
      ))}
      <Field label="Start date (YYYY-MM-DD)" value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" error={isDateKey(start) ? '' : 'Use the format YYYY-MM-DD'} />
      {endDateOk ? <Muted>This daily diet will run for {durationDays} days, until {fmt(endDate)}.</Muted> : null}
      {isDateKey(start) && template && !endDateOk ? <Muted>The plan duration exceeds the supported calendar range.</Muted> : null}
    </Screen>
  );
}
