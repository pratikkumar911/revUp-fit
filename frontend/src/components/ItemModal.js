import React, { useState } from 'react';
import { Modal } from 'react-native';
import { Screen, Header, Field, Btn } from './ui';

const blank = { name: '', quantity: '', calories: '', notes: '', directions: '' };
const formFrom = (initial) => initial ? {
  name: initial.name,
  quantity: initial.quantity || '',
  calories: initial.calories != null ? String(initial.calories) : '',
  notes: initial.notes || '',
  directions: initial.directions || '',
} : blank;

// Add or edit one food item, including optional notes and preparation directions.
export default function ItemModal({ visible, title, initial, onClose, onSave, onDelete }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? <ItemForm title={title} initial={initial} onClose={onClose} onSave={onSave} onDelete={onDelete} /> : null}
    </Modal>
  );
}

function ItemForm({ title, initial, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => formFrom(initial));
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const cal = f.calories.trim();
  const save = () => onSave({ name: f.name.trim(), quantity: f.quantity.trim(), calories: cal === '' || isNaN(Number(cal)) ? undefined : Number(cal), notes: f.notes.trim() || undefined, directions: f.directions.trim() || undefined });
  return (
    <Screen scroll footer={<>
      <Btn title={initial ? 'Save changes' : 'Add'} onPress={save} disabled={!f.name.trim()} />
      {initial ? <Btn title="Delete item" kind="dangerOutline" onPress={onDelete} /> : null}
      <Btn title="Cancel" kind="outline" onPress={onClose} />
    </>}>
      <Header title={initial ? 'Edit item' : 'Add item'} sub={title} />
      <Field label="Food name" value={f.name} onChangeText={set('name')} autoCapitalize="sentences" />
      <Field label="Quantity" value={f.quantity} onChangeText={set('quantity')} placeholder="e.g. 1 cup" />
      <Field label="Calories (optional)" value={f.calories} onChangeText={set('calories')} keyboardType="number-pad" />
      <Field label="Notes (optional)" value={f.notes} onChangeText={set('notes')} multiline />
      <Field label="Directions (optional)" value={f.directions} onChangeText={set('directions')} placeholder="How to prepare or serve this food" multiline />
    </Screen>
  );
}
