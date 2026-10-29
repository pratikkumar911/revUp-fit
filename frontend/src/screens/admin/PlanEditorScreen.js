import React, { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Screen, Header, Field, Btn, Card, Muted, Text, HeadingText } from '../../components/ui';
import ItemModal from '../../components/ItemModal';
import { emptyDay, groupsOf, setItems } from '../../components/MealView';
import { useApp } from '../../store';
import { C } from '../../theme';
import { today, addDays, isDateKey, fmt } from '../../utils';

// Two modes. Template: params { templateId? } (new when empty). User's plan: params { userId } (edits that user's copy only).
export default function PlanEditorScreen({ navigation, route }) {
  const { db, saveTemplate, updateUserPlan } = useApp();
  const { templateId, userId } = route.params || {};
  const userPlan = userId ? db.plans.find((p) => p.userId === userId) : null;
  const src = userPlan || db.templates.find((t) => t.id === templateId) || null;
  const [name, setName] = useState(src?.name || '');
  const [days, setDays] = useState(() => src?.days?.length ? JSON.parse(JSON.stringify(src.days)) : [emptyDay()]);
  const [duration, setDuration] = useState(String(userPlan?.repeatDays || src?.durationDays || src?.days?.length || 7));
  const [start, setStart] = useState(userPlan?.startDate || today());
  const [modal, setModal] = useState(null); // { meal, title, item? }
  const [saving, setSaving] = useState(false);

  const upd = (meal, fn) => setDays((current) => current.map((day, index) => (
    index === 0 ? setItems(day, meal, fn(groupsOf(day).find((g) => g.meal === meal).items)) : day
  )));
  const onSave = (item) => {
    if (modal.item) upd(modal.meal, (items) => items.map((x) => (x.id === modal.item.id ? { ...x, ...item } : x)));
    else upd(modal.meal, (items) => [...items, { id: `i${Date.now()}`, ...item }]);
    setModal(null);
  };
  const onDelete = () => { upd(modal.meal, (items) => items.filter((x) => x.id !== modal.item.id)); setModal(null); };

  const durationDays = Number(duration);
  const durationOk = Number.isSafeInteger(durationDays) && durationDays >= 1 && durationDays <= 365;
  const endDate = isDateKey(start) && durationOk ? addDays(start, durationDays - 1) : null;
  const endDateOk = endDate != null && isDateKey(endDate);
  const save = async () => {
    if (!name.trim()) return Alert.alert('Plan name needed', 'Please enter a name for the plan.');
    if (!durationOk) return Alert.alert('Check the number of days', 'Enter a whole number greater than zero.');
    if (userPlan) {
      if (!isDateKey(start)) return Alert.alert('Check the start date', 'Use the format YYYY-MM-DD.');
      if (!endDateOk) return Alert.alert('Check the plan duration', 'The end date is outside the supported calendar range.');
    }
    setSaving(true);
    try {
      if (userPlan) await updateUserPlan(userId, { name: name.trim(), days, startDate: start, repeatDays: durationDays });
      else await saveTemplate({ id: templateId, name: name.trim(), days, durationDays });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not save plan', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Screen scroll footer={<Btn title={saving ? 'Saving…' : 'Save'} onPress={save} disabled={saving} />}>
        <Header title={userPlan ? 'Edit user plan' : templateId ? 'Edit plan' : 'New plan'} onBack={() => navigation.goBack()} />
        <Field label="Plan name" value={name} onChangeText={setName} autoCapitalize="sentences" />
        <Field label={userPlan ? 'Plan duration (days)' : 'No. of days'} value={duration} onChangeText={setDuration} keyboardType="number-pad" error={duration && !durationOk ? 'Enter a whole number from 1 to 365' : ''} />
        {userPlan ? (
          <>
            <Field label="Start date (YYYY-MM-DD)" value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" />
            {endDateOk ? <Muted>Last day: {fmt(endDate)}</Muted> : null}
          </>
        ) : null}
        {groupsOf(days[0]).map((g) => (
          <Card key={g.meal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <HeadingText style={{ fontWeight: '700', color: C.ink, fontSize: 16 }}>{g.title}</HeadingText>
              <Pressable onPress={() => setModal({ meal: g.meal, title: g.title })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ color: C.green, fontWeight: '700' }}>+ Add</Text>
              </Pressable>
            </View>
            {g.items.length === 0 ? <Muted>No items</Muted> : g.items.map((i) => (
              <Pressable key={i.id} onPress={() => setModal({ meal: g.meal, item: i, title: g.title })} accessibilityRole="button"
                style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line }}>
                <Text style={{ color: C.ink, flex: 1 }}>{i.name}{i.quantity ? ` · ${i.quantity}` : ''}</Text>
                <Text style={{ color: C.green }}>Edit</Text>
              </Pressable>
            ))}
          </Card>
        ))}
      </Screen>
      <ItemModal visible={!!modal} title={modal?.title} initial={modal?.item} onClose={() => setModal(null)} onSave={onSave} onDelete={onDelete} />
    </>
  );
}
