import React, { useState } from 'react';
import { Modal } from 'react-native';
import { Screen, Header, Field, Btn } from './ui';

const blank = { name: '', quantity: '', directions: '' };
const formFrom = (initial) => initial ? {
  name: initial.name,
  quantity: initial.quantity || '',
  directions: initial.directions || '',
} : blank;

// Add or edit one food item on a full-screen editor.
export default function ItemModal({ visible, title, initial, onClose, onSave, onDelete }) {
  return (
    <Modal visible={visible} animationType="none" presentationStyle="fullScreen" onRequestClose={onClose}>
      {visible ? <ItemForm title={title} initial={initial} onClose={onClose} onSave={onSave} onDelete={onDelete} /> : null}
    </Modal>
  );
}

function ItemForm({ title, initial, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => formFrom(initial));
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => onSave({ name: f.name.trim(), quantity: f.quantity.trim(), directions: f.directions.trim() || undefined });
  return (
    <Screen scroll footer={<>
      <Btn title={initial ? 'Save changes' : 'Add'} onPress={save} disabled={!f.name.trim()} />
      {initial ? <Btn title="Delete item" kind="dangerOutline" onPress={onDelete} /> : null}
      <Btn title="Cancel" kind="outline" onPress={onClose} />
    </>}>
      <Header title={initial ? 'Edit item' : 'Add item'} sub={title} />
      <Field label="Food name" value={f.name} onChangeText={set('name')} autoCapitalize="sentences" />
      <Field label="Quantity" value={f.quantity} onChangeText={set('quantity')} placeholder="e.g. 1 cup" />
      <Field label="Directions (optional)" value={f.directions} onChangeText={set('directions')} placeholder="How to prepare or serve this food" multiline />
    </Screen>
  );
}
