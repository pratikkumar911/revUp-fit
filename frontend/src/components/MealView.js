import React, { useState } from 'react';
import { View, Pressable, Modal, StyleSheet, ScrollView } from 'react-native';
import { C } from '../theme';
import { Btn, Card, HeadingText, Muted, Text } from './ui';
import { today, weekOf, WD, parse, planState, fmt } from '../utils';

export const emptyDay = () => ({ breakfast: [], lunch: [], snack: { pre: [], post: [] }, dinner: [] });
export const groupsOf = (day) => [
  { meal: 'breakfast', title: 'Breakfast', items: day.breakfast || [] },
  { meal: 'lunch', title: 'Lunch', items: day.lunch || [] },
  { meal: 'snackPre', title: 'Snack · Pre-workout', items: day.snack?.pre || [] },
  { meal: 'snackPost', title: 'Snack · Post-workout', items: day.snack?.post || [] },
  { meal: 'dinner', title: 'Dinner', items: day.dinner || [] },
];
export const setItems = (day, meal, items) => {
  if (meal === 'snackPre') return { ...day, snack: { ...day.snack, pre: items } };
  if (meal === 'snackPost') return { ...day, snack: { ...day.snack, post: items } };
  return { ...day, [meal]: items };
};

// Seven weekday buttons (Mon to Sun) for the week of the selected date.
export function WeekStrip({ date, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayStrip}>
      {weekOf(date).map((k, i) => {
        const on = k === date, isToday = k === today();
        return (
          <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={[s.day, on && { backgroundColor: C.green, borderColor: C.green }, isToday && !on && { borderColor: C.green, borderWidth: 2 }]}>
            <Text style={{ fontSize: 12, color: on ? '#fff' : C.muted }}>{WD[i]}</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: on ? '#fff' : C.ink }}>{parse(k).getDate()}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Shows one day of a plan. Users tap for food details or hold to mark it done; admins view it read-only.
export default function MealView({ plan, readOnly, onToggle }) {
  const [date, setDate] = useState(today());
  const [sel, setSel] = useState(null);
  const st = planState(plan, date);
  const day = st.status === 'active' ? plan.days[st.index] : null;
  const msg = { none: 'No plan yet.', ended: `The plan ended on ${st.endedOn ? fmt(st.endedOn) : ''}.`, upcoming: plan ? `The plan starts on ${fmt(plan.startDate)}.` : '' }[st.status];
  return (
    <View style={{ gap: 12 }}>
      <WeekStrip date={date} onChange={setDate} />
      {day ? groupsOf(day).filter((g) => g.items.length).map((g) => (
        <View key={g.meal} style={{ gap: 8 }}>
          <HeadingText style={s.gt}>{g.title}</HeadingText>
          {g.items.map((i) => {
            const done = !!plan.done[`${date}|${g.meal}|${i.id}`];
            return (
              <Pressable key={i.id} delayLongPress={350} accessibilityHint={readOnly ? undefined : 'Tap for food details or tap and hold to mark done'}
                onPress={readOnly ? undefined : () => setSel({ type: 'details', item: i })}
                onLongPress={readOnly ? undefined : () => setSel({ type: 'done', meal: g.meal, item: i, done })}
                style={[s.item, done && { backgroundColor: C.done, borderColor: C.green }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: C.ink }}>{i.name}{done ? '  ✓' : ''}</Text>
                  <Muted>{i.quantity}{i.notes ? ` · ${i.notes}` : ''}</Muted>
                </View>
                {i.calories != null ? <Muted>{i.calories} kcal</Muted> : null}
              </Pressable>
            );
          })}
        </View>
      )) : <Card><Muted>{msg}</Muted></Card>}
      {day && !readOnly ? <Muted>Tap and hold a food item to mark it done.</Muted> : null}
      <Modal visible={!!sel} transparent animationType={sel?.type === 'details' ? 'slide' : 'fade'} onRequestClose={() => setSel(null)}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <HeadingText style={{ fontSize: 20, fontWeight: '700', color: C.ink }}>{sel?.item.name}</HeadingText>
            {sel?.type === 'details' ? (
              <>
                <HeadingText style={{ fontSize: 14, color: C.muted }}>Directions</HeadingText>
                {sel.item.quantity ? <Muted>Serving: {sel.item.quantity}</Muted> : null}
                {sel.item.calories != null ? <Muted>{sel.item.calories} kcal</Muted> : null}
                {sel.item.notes ? <Muted>{sel.item.notes}</Muted> : null}
                <ScrollView style={s.directions}>
                  <Text style={{ color: C.ink, lineHeight: 22 }}>
                    {sel.item.directions || 'No directions have been added by your dietitian.'}
                  </Text>
                </ScrollView>
                <Btn title="Close" onPress={() => setSel(null)} />
              </>
            ) : (
              <>
                <Btn title={sel?.done ? 'Mark as not done' : 'Done'} onPress={() => { onToggle(`${date}|${sel.meal}|${sel.item.id}`); setSel(null); }} />
                <Btn title="Cancel" kind="outline" onPress={() => setSel(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  dayStrip: { flexDirection: 'row', gap: 6 },
  day: { width: 48, minHeight: 56, borderRadius: 12, borderWidth: 1, borderColor: '#CFC9BA', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  gt: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, minHeight: 56 },
  backdrop: { flex: 1, backgroundColor: C.dim, justifyContent: 'flex-end' },
  sheet: { maxHeight: '75%', backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12, paddingBottom: 32 },
  directions: { flexGrow: 0, maxHeight: 240, borderRadius: 12, backgroundColor: '#fff', padding: 14 },
});
