import React from 'react';
import { View } from 'react-native';
import { Screen, Header, Card, Row, Tag, Btn, Muted, Text, HeadingText } from '../../components/ui';
import { useApp } from '../../store';
import { C } from '../../theme';
import { planOf, statusOf, STATUS_LABEL, planEnd, fmt, bmi } from '../../utils';

export default function UserDetailScreen({ navigation, route }) {
  const { db } = useApp();
  const u = db.users.find((x) => x.id === route.params.id);
  if (!u) return <Screen><Header title="User" onBack={() => navigation.goBack()} /><Muted>This user no longer exists.</Muted></Screen>;
  const plan = planOf(db, u), st = statusOf(db, u);
  return (
    <Screen scroll footer={<Btn title="Assign a plan" onPress={() => navigation.navigate('Assign', { userId: u.id })} />}>
      <Header title={u.name} sub={`Joined ${fmt(u.joined)}`} onBack={() => navigation.goBack()} />
      {u.allergies ? <Card style={{ backgroundColor: C.warnSoft, borderColor: C.warn }}><Text style={{ color: '#7A2A0C', fontWeight: '700' }}>Allergies: {u.allergies}</Text></Card> : null}
      <Card>
        <HeadingText style={{ fontWeight: '700', color: C.ink }}>Profile</HeadingText>
        <Row a="Age" b={u.age} /><Row a="Gender" b={u.gender} /><Row a="Height" b={`${u.heightCm} cm`} /><Row a="Weight" b={`${u.weightKg} kg`} /><Row a="BMI" b={bmi(u.heightCm, u.weightKg)} />
      </Card>
      <Card>
        <HeadingText style={{ fontWeight: '700', color: C.ink }}>Other details</HeadingText>
        <Row a="Diet" b={u.diet} /><Row a="Goal and about" b={u.goal || '-'} /><Row a="Allergies" b={u.allergies || 'None'} /><Row a="Doesn't eat" b={u.dislikes || '-'} />
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <HeadingText style={{ fontWeight: '700', color: C.ink }}>Current diet plan</HeadingText><Tag label={STATUS_LABEL[st]} warn={st !== 'active'} />
        </View>
        {plan ? (
          <>
            <HeadingText style={{ color: C.ink, fontSize: 16 }}>{plan.name}</HeadingText>
            <Muted>{fmt(plan.startDate)} – {fmt(planEnd(plan))} · repeats for {plan.repeatDays} days</Muted>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Btn small kind="outline" title="View plan" onPress={() => navigation.navigate('UserPlan', { userId: u.id })} />
              <Btn small kind="outline" title="Edit plan" onPress={() => navigation.navigate('PlanEditor', { userId: u.id })} />
            </View>
          </>
        ) : <Muted>No active plan</Muted>}
      </Card>
    </Screen>
  );
}
