import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Screen, H1, Muted, Card, Btn, Field, Chip, Check, Text } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';

const SLIDES = [
  { t: 'What does your plate look like?', b: 'We only suggest meals that fit. You can change this later anytime.' },
  { t: 'Help us understand you better.', b: '"Your experience is tailored to what matters to you — your needs, your aims, your priorities."' },
  { t: 'Get your personal diet plan', b: 'A dietitian reviews your answers and prepares a plan just for you.' },
];
const STEPS = ['gender', 'age', 'heightCm', 'weightKg', 'diet', 'goal', 'allergies', 'dislikes'];
const TITLES = {
  gender: "What's your gender?", age: "What's your age?", heightCm: "What's your height? (in cm)", weightKg: "What's your weight? (in kg)",
  diet: 'Diet', goal: 'Feeling confident? Tell us about yourself', allergies: 'Allergies (comma separated)', dislikes: "Foods you don't eat (comma separated)",
};
const num = (v) => (v === '' ? NaN : Number(v));
const errorFor = (k, v) => {
  if (k === 'age') { const n = num(v); return v === '' ? 'required' : !Number.isInteger(n) || n > 100 ? 'Enter a valid age' : n < 18 ? 'You must be 18 or older to use this app.' : ''; }
  if (k === 'heightCm') { const n = num(v); return !(n >= 100 && n <= 250) ? 'Enter a height between 100 and 250 cm' : ''; }
  if (k === 'weightKg') { const n = num(v); return !(n >= 25 && n <= 300) ? 'Enter a weight between 25 and 300 kg' : ''; }
  if (k === 'gender' || k === 'diet') return v ? '' : 'required';
  return '';
};

export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding, signOut } = useApp();
  const [stage, setStage] = useState('intro');
  const [slide, setSlide] = useState(0);
  const [agree, setAgree] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ gender: '', age: '', heightCm: '', weightKg: '', diet: '', goal: '', allergies: '', dislikes: '' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  if (stage === 'intro') {
    const sl = SLIDES[slide], last = slide === SLIDES.length - 1;
    return (
      <Screen footer={<Btn title={last ? "Let's Start" : 'Continue'} onPress={() => (last ? setStage('consent') : setSlide(slide + 1))} />}>
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable onPress={() => setStage('consent')} accessibilityLabel="Skip" style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20, color: C.muted }}>✕</Text></Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <H1>{sl.t}</H1>
          <Muted>{sl.b}</Muted>
          <View style={{ flexDirection: 'row', gap: 6 }}>{SLIDES.map((_, i) => <View key={i} style={{ height: 6, flex: 1, borderRadius: 3, backgroundColor: i <= slide ? C.green : C.line }} />)}</View>
        </View>
      </Screen>
    );
  }

  if (stage === 'consent') {
    return (
      <Screen scroll footer={<><Btn title="Agree and continue" disabled={!agree} onPress={() => setStage('questions')} /><Btn title="Back" kind="outline" onPress={() => { setSlide(SLIDES.length - 1); setStage('intro'); }} /></>}>
        <Muted>Before we begin</Muted>
        <H1>Your details, your choice</H1>
        <Muted>Your dietitian needs some details to build your plan.</Muted>
        <Card>
          <Text style={{ fontWeight: '700', color: C.ink }}>What we collect</Text>
          <Muted>Age, height, weight, gender, diet, goal, allergies, health notes you share, and your chats with the dietitian.</Muted>
          <Text style={{ fontWeight: '700', color: C.ink }}>Why</Text>
          <Muted>To prepare your plan and answer your questions.</Muted>
          <Text style={{ fontWeight: '700', color: C.ink }}>Who sees it</Text>
          <Muted>Your dietitian and the services that run the app. You can withdraw consent and delete your data any time in Profile.</Muted>
        </Card>
        <Pressable onPress={() => navigation.navigate('LegalPage', { title: 'Privacy policy' })} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: C.green, textDecorationLine: 'underline' }}>Read the full privacy policy</Text>
        </Pressable>
        <Check on={agree} onPress={() => setAgree(!agree)} label="I agree to my details being used as described." />
      </Screen>
    );
  }

  if (stage === 'done') {
    const profile = { gender: f.gender, age: Number(f.age), heightCm: Number(f.heightCm), weightKg: Number(f.weightKg), diet: f.diet, goal: f.goal.trim(), allergies: f.allergies.trim(), dislikes: f.dislikes.trim() };
    const finish = async () => {
      setSaving(true);
      try {
        await completeOnboarding(profile);
      } catch (error) {
        Alert.alert('Could not save your details', error.message);
      } finally {
        setSaving(false);
      }
    };
    return (
      <Screen footer={<Btn title={saving ? 'Saving…' : 'Dashboard →'} onPress={finish} disabled={saving} />}>
        <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
          <H1>Thank you. Our dietitian is now preparing your plan</H1>
          <Muted>We will notify you once the diet plan is ready.</Muted>
        </View>
      </Screen>
    );
  }

  const k = STEPS[step], err = errorFor(k, f[k]), last = step === STEPS.length - 1;
  return (
    <Screen scroll centerContent footer={<>
      <Btn title={last ? 'Finish' : 'Continue'} disabled={!!err} onPress={() => (last ? setStage('done') : setStep(step + 1))} />
      <Btn title="Back" kind="outline" onPress={() => (step === 0 ? setStage('consent') : setStep(step - 1))} />
    </>}>
      <Muted>Step {step + 1} of {STEPS.length}</Muted>
      <H1>{TITLES[k]}</H1>
      {k === 'gender' && <View style={{ flexDirection: 'row', gap: 8 }}>{[['male', 'M'], ['female', 'F'], ['other', 'Other']].map(([v, l]) => <Chip key={v} label={l} on={f.gender === v} onPress={() => set('gender')(v)} />)}</View>}
      {k === 'diet' && <View style={{ flexDirection: 'row', gap: 8 }}>{[['veg', 'Veg'], ['nonveg', 'Non-veg'], ['jain', 'Jain']].map(([v, l]) => <Chip key={v} label={l} on={f.diet === v} onPress={() => set('diet')(v)} />)}</View>}
      {['age', 'heightCm', 'weightKg'].includes(k) && <Field value={f[k]} onChangeText={set(k)} keyboardType="number-pad" error={err && err !== 'required' ? err : ''} />}
      {k === 'goal' && <Field value={f.goal} onChangeText={set('goal')} multiline placeholder="Example: I want to gain more muscles. Add any health conditions or medicines your dietitian should know." />}
      {(k === 'allergies' || k === 'dislikes') && <Field value={f[k]} onChangeText={set(k)} placeholder={k === 'allergies' ? 'e.g. peanuts, milk' : 'e.g. brinjal, mushroom'} />}
      {k === 'age' && err === 'You must be 18 or older to use this app.' ? <Btn title="Log out" kind="dangerOutline" small onPress={signOut} /> : null}
    </Screen>
  );
}
