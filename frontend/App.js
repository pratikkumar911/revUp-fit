import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/store';
import RootNavigator from './src/navigation';
import { FONT_BODY, FONT_HEADING } from './src/theme';

const DMSansRegular = require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf');
const ManropeBold = require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf');

export default function App() {
  const [fontsLoaded] = useFonts({
    [FONT_BODY]: DMSansRegular,
    [FONT_HEADING]: ManropeBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
