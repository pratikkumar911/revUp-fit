import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { C } from '../theme';

export default function BrandFooter() {
  return (
    <View accessible accessibilityLabel="Powered by Revive Fitness Club" style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ color: C.muted, fontSize: 12 }}>Powered by</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: C.ink, fontSize: 13, fontWeight: '600' }}>Rev</Text>
        <Ionicons name="flash" size={13} color={C.ink} />
        <Text style={{ color: C.ink, fontSize: 13, fontWeight: '600' }}>ve Fitness Club</Text>
      </View>
    </View>
  );
}
