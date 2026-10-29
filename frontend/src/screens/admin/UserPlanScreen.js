import React from 'react';
import { View } from 'react-native';
import { Screen, Header, Tag, Muted, HeadingText } from '../../components/ui';
import MealView from '../../components/MealView';
import { useApp } from '../../store';
import { C } from '../../theme';
import { planOf, statusOf, STATUS_LABEL, planEnd, fmt } from '../../utils';

// Read-only view of a user's plan. Foods the user marked done have a green background.
export default function UserPlanScreen({ navigation, route }) {
  const { db, refresh } = useApp();
  const u = db.users.find((x) => x.id === route.params.userId);
  const plan = u && planOf(db, u);
  return (
    <Screen scroll onRefresh={refresh}>
      <Header title={u ? u.name : 'User'} sub="Assigned plan" onBack={() => navigation.goBack()} />
      {plan ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View><HeadingText style={{ fontWeight: '700', color: C.ink, fontSize: 17 }}>{plan.name}</HeadingText><Muted>{fmt(plan.startDate)} – {fmt(planEnd(plan))}</Muted></View>
            <Tag label={STATUS_LABEL[statusOf(db, u)]} warn={statusOf(db, u) !== 'active'} />
          </View>
          <MealView plan={plan} readOnly />
        </>
      ) : <Muted>No active plan.</Muted>}
    </Screen>
  );
}
