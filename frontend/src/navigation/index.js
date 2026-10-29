import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../store';
import { C } from '../theme';
import AdminTabs from './AdminTabs';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import DashboardScreen from '../screens/user/DashboardScreen';
import AskScreen from '../screens/user/AskScreen';
import NotificationsScreen from '../screens/user/NotificationsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import EditDetailsScreen from '../screens/user/EditDetailsScreen';
import LegalScreen from '../screens/user/LegalScreen';
import LegalPageScreen from '../screens/user/LegalPageScreen';
import DeleteAccountScreen from '../screens/user/DeleteAccountScreen';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import UserPlanScreen from '../screens/admin/UserPlanScreen';
import QueryDetailScreen from '../screens/admin/QueryDetailScreen';
import PlanEditorScreen from '../screens/admin/PlanEditorScreen';
import AssignScreen from '../screens/admin/AssignScreen';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';

const Stack = createNativeStackNavigator();

// Which screens exist depends on who is signed in. Because the session is saved,
// reopening the app goes straight to the right place until the user logs out.
export default function RootNavigator() {
  const { ready, me } = useApp();
  if (!ready) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}><ActivityIndicator color={C.green} /></View>;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!me ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
          </>
        ) : me.role === 'admin' ? (
          <>
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
            <Stack.Screen name="UserDetail" component={UserDetailScreen} />
            <Stack.Screen name="UserPlan" component={UserPlanScreen} />
            <Stack.Screen name="QueryDetail" component={QueryDetailScreen} />
            <Stack.Screen name="PlanEditor" component={PlanEditorScreen} />
            <Stack.Screen name="Assign" component={AssignScreen} />
            <Stack.Screen name="AdminAccount" component={AdminAccountScreen} />
          </>
        ) : !me.onboarded ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="LegalPage" component={LegalPageScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Ask" component={AskScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditDetails" component={EditDetailsScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="LegalPage" component={LegalPageScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
