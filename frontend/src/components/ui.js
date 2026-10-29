import React from 'react';
import { Alert, View, Text as NativeText, Pressable, TextInput, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT_BODY, FONT_HEADING } from '../theme';
import { initial } from '../utils';

export const Screen = ({ children, scroll, footer, pad = true, centerContent = false, onRefresh }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      Alert.alert('Could not refresh', error.message || 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {scroll
          ? <ScrollView
            contentContainerStyle={[pad && s.pad, { gap: 12 }, centerContent && s.centerContent]}
            keyboardShouldPersistTaps="handled"
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.green]} tintColor={C.green} /> : undefined}
          >{children}</ScrollView>
          : <View style={[{ flex: 1, gap: 12 }, pad && s.pad]}>{children}</View>}
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const Text = ({ style, ...props }) => <NativeText {...props} style={[s.bodyText, style]} />;
export const HeadingText = ({ style, ...props }) => <NativeText {...props} style={[s.headingText, style]} />;

export const Header = ({ title, sub, onBack, right }) => {
  const headerTitle = typeof title === 'string' && title.trim() ? title : 'Untitled';

  return (
    <View style={s.header}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {onBack ? <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={s.back}><Text style={s.backTxt}>‹</Text></Pressable> : null}
        <View style={{ flex: 1 }}>
          <HeadingText style={[s.hTitle, !onBack && s.hTitleNoBack]} numberOfLines={1}>{headerTitle}</HeadingText>
          {sub ? <Text style={s.muted}>{sub}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
};

export const H1 = ({ children }) => <HeadingText style={s.h1}>{children}</HeadingText>;
export const Muted = ({ children, style }) => <Text style={[s.muted, style]}>{children}</Text>;
export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

const kinds = {
  primary: { bg: C.green, fg: '#fff', border: C.green },
  outline: { bg: 'transparent', fg: C.green, border: C.green },
  danger: { bg: C.warn, fg: '#fff', border: C.warn },
  dangerOutline: { bg: 'transparent', fg: C.warn, border: C.warn },
};
export const Btn = ({ title, onPress, kind = 'primary', disabled, small, style }) => {
  const k = kinds[kind];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.btn, small && s.btnSm, { backgroundColor: k.bg, borderColor: k.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}>
      <Text style={[s.btnTxt, small && { fontSize: 14 }, { color: k.fg }]}>{title}</Text>
    </Pressable>
  );
};

export const Field = ({ label, error, style, ...p }) => (
  <View style={{ gap: 6 }}>
    {label ? <Text style={s.label}>{label}</Text> : null}
    <TextInput placeholderTextColor="#8A958E" autoCapitalize="none" {...p}
      style={[s.input, { fontFamily: FONT_BODY }, p.multiline && { minHeight: 90, textAlignVertical: 'top' }, error && { borderColor: C.warn }, style]} />
    {error ? <Text style={{ color: C.warn, fontSize: 13 }}>{error}</Text> : null}
  </View>
);

export const Chip = ({ label, on, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} style={[s.chip, on && s.chipOn]}>
    <Text style={{ color: on ? '#fff' : C.ink, fontWeight: '500' }}>{label}</Text>
  </Pressable>
);
export const Tag = ({ label, warn }) => (
  <View style={[s.tag, warn && { backgroundColor: C.warnSoft, borderColor: C.warn }]}><Text style={{ fontSize: 12, color: warn ? '#7A2A0C' : C.ink }}>{label}</Text></View>
);
export const Row = ({ a, b }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
    <Text style={s.muted}>{a}</Text><Text style={{ color: C.ink, flexShrink: 1, textAlign: 'right' }}>{b}</Text>
  </View>
);
export const Avatar = ({ name, size = 40, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Account" style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={{ fontWeight: '700', color: C.green, fontSize: size * 0.4 }}>{initial(name)}</Text>
  </Pressable>
);
export const Stepper = ({ value, min, max, onChange }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <Pressable accessibilityLabel="Decrease" onPress={() => onChange(Math.max(min, value - 1))} style={s.step}><Text style={s.stepTxt}>−</Text></Pressable>
    <Text style={{ fontSize: 18, fontWeight: '600', minWidth: 28, textAlign: 'center' }}>{value}</Text>
    <Pressable accessibilityLabel="Increase" onPress={() => onChange(Math.min(max, value + 1))} style={s.step}><Text style={s.stepTxt}>+</Text></Pressable>
  </View>
);
export const Radio = ({ on, label, sub, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: !!on }} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, on && { borderColor: C.green, borderWidth: 2 }]}>
    <View style={[s.radio, on && { borderColor: C.green }]}>{on ? <View style={s.radioDot} /> : null}</View>
    <View style={{ flex: 1 }}><Text style={{ fontWeight: '600', color: C.ink }}>{label}</Text>{sub ? <Text style={s.muted}>{sub}</Text> : null}</View>
  </Pressable>
);
export const Check = ({ on, label, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!on }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 44 }}>
    <View style={[s.box, on && { backgroundColor: C.green, borderColor: C.green }]}>{on ? <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text> : null}</View>
    <Text style={{ flex: 1, color: C.ink }}>{label}</Text>
  </Pressable>
);

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  centerContent: { flexGrow: 1, justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 10, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  backTxt: { fontSize: 32, color: C.green, lineHeight: 34, paddingLeft: 8 },
  hTitle: { fontSize: 22, fontWeight: '700', color: C.ink, paddingLeft: 8 },
  hTitleNoBack: { paddingLeft: 0 },
  h1: { fontSize: 28, fontWeight: '700', color: C.ink, lineHeight: 34 },
  bodyText: { fontFamily: FONT_BODY },
  headingText: { fontFamily: FONT_HEADING },
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, gap: 8 },
  btn: { minHeight: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnSm: { minHeight: 44, borderRadius: 12, paddingHorizontal: 14 },
  btnTxt: { fontSize: 16, fontWeight: '600' },
  label: { color: C.muted, fontSize: 13 },
  input: { borderWidth: 1.5, borderColor: '#CFC9BA', borderRadius: 12, minHeight: 48, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff', color: C.ink },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: '#CFC9BA', backgroundColor: '#fff', justifyContent: 'center' },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  tag: { borderWidth: 1, borderColor: '#CFC9BA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#fff', alignSelf: 'flex-start' },
  avatar: { backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  step: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 22, color: C.green, lineHeight: 24 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA39D', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#9AA39D', alignItems: 'center', justifyContent: 'center' },
});
