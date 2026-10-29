import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Screen, Header, Field, Btn, Chip, Muted } from '../../components/ui';
import { useApp } from '../../store';

export default function EditDetailsScreen({ navigation }) {
  const { me, updateProfile } = useApp();
  const [f, setF] = useState({ gender: me.gender, diet: me.diet, age: String(me.age ?? ''), heightCm: String(me.heightCm ?? ''), weightKg: String(me.weightKg ?? ''), goal: me.goal || '', allergies: me.allergies || '', dislikes: me.dislikes || '' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const age = Number(f.age), h = Number(f.heightCm), w = Number(f.weightKg);
  const err = { age: !(Number.isInteger(age) && age >= 18 && age <= 100) ? 'You must be 18 or older to use this app.' : '', heightCm: !(h >= 100 && h <= 250) ? 'Between 100 and 250 cm' : '', weightKg: !(w >= 25 && w <= 300) ? 'Between 25 and 300 kg' : '' };
  const bad = err.age || err.heightCm || err.weightKg;
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...f, age, heightCm: h, weightKg: w, goal: f.goal.trim(), allergies: f.allergies.trim(), dislikes: f.dislikes.trim() });
      Alert.alert('Saved', 'Your dietitian can see your updated details.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Could not save changes', error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen scroll footer={<Btn title={saving ? 'Saving…' : 'Save changes'} onPress={save} disabled={!!bad || saving} />}>
      <Header title="Edit my details" onBack={() => navigation.goBack()} />
      <Muted>Gender</Muted>
      <View style={{ flexDirection: 'row', gap: 8 }}>{[['male', 'M'], ['female', 'F'], ['other', 'Other']].map(([v, l]) => <Chip key={v} label={l} on={f.gender === v} onPress={() => set('gender')(v)} />)}</View>
      <Field label="Age" value={f.age} onChangeText={set('age')} keyboardType="number-pad" error={err.age} />
      <Field label="Height (cm)" value={f.heightCm} onChangeText={set('heightCm')} keyboardType="number-pad" error={err.heightCm} />
      <Field label="Weight (kg)" value={f.weightKg} onChangeText={set('weightKg')} keyboardType="number-pad" error={err.weightKg} />
      <Muted>Diet</Muted>
      <View style={{ flexDirection: 'row', gap: 8 }}>{[['veg', 'Veg'], ['nonveg', 'Non-veg'], ['jain', 'Jain']].map(([v, l]) => <Chip key={v} label={l} on={f.diet === v} onPress={() => set('diet')(v)} />)}</View>
      <Field label="Goal and about you" value={f.goal} onChangeText={set('goal')} multiline />
      <Field label="Allergies (comma separated)" value={f.allergies} onChangeText={set('allergies')} />
      <Field label="Foods you don't eat (comma separated)" value={f.dislikes} onChangeText={set('dislikes')} />
    </Screen>
  );
}
