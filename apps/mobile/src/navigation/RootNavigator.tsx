import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Icon, type IconName } from '../components';
import { hasAccess } from '../services/subscriptions';
import { useAppStore } from '../state/appStore';
import { colors } from '../theme';
import { DayHistoryScreen } from '../screens/day/DayHistoryScreen';
import { GoalReachedScreen } from '../screens/today/GoalReachedScreen';
import { TodayScreen } from '../screens/today/TodayScreen';
import { ProgressScreen } from '../screens/progress/ProgressScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProteinGoalScreen } from '../screens/profile/ProteinGoalScreen';
import { BodyWeightScreen } from '../screens/profile/BodyWeightScreen';
import { GoalTypeScreen } from '../screens/profile/GoalTypeScreen';
import { NotificationSettingsScreen } from '../screens/profile/NotificationSettingsScreen';
import { PaywallScreen } from '../screens/paywall/PaywallScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { GoalScreen } from '../screens/onboarding/GoalScreen';
import { WeightScreen } from '../screens/onboarding/WeightScreen';
import { RangeScreen } from '../screens/onboarding/RangeScreen';
import { ReadyScreen } from '../screens/onboarding/ReadyScreen';
import { LogHomeScreen } from '../screens/log/LogHomeScreen';
import { SearchScreen } from '../screens/log/SearchScreen';
import { FoodDetailScreen } from '../screens/log/FoodDetailScreen';
import { QuickAddScreen } from '../screens/log/QuickAddScreen';
import { SetTotalScreen } from '../screens/log/SetTotalScreen';
import { PhotoScreen } from '../screens/log/PhotoScreen';
import { PhotoReviewScreen } from '../screens/log/PhotoReviewScreen';
import { BarcodeScreen } from '../screens/log/BarcodeScreen';
import { CustomFoodScreen } from '../screens/log/CustomFoodScreen';
import type { LogStackParamList, OnboardingStackParamList, RootStackParamList, TabParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();
const Onboarding = createNativeStackNavigator<OnboardingStackParamList>();
const LogStack = createNativeStackNavigator<LogStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const plain = { headerShown: false, contentStyle: { backgroundColor: colors.background } } as const;

function OnboardingNavigator() {
  return (
    <Onboarding.Navigator screenOptions={plain}>
      <Onboarding.Screen name="Welcome" component={WelcomeScreen} />
      <Onboarding.Screen name="Goal" component={GoalScreen} />
      <Onboarding.Screen name="Weight" component={WeightScreen} />
      <Onboarding.Screen name="Range" component={RangeScreen} />
      <Onboarding.Screen name="Ready" component={ReadyScreen} options={{ gestureEnabled: false }} />
    </Onboarding.Navigator>
  );
}

function LogNavigator() {
  return (
    <LogStack.Navigator screenOptions={plain}>
      <LogStack.Screen name="LogHome" component={LogHomeScreen} />
      <LogStack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade_from_bottom' }} />
      <LogStack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <LogStack.Screen name="QuickAdd" component={QuickAddScreen} />
      <LogStack.Screen name="SetTotal" component={SetTotalScreen} />
      <LogStack.Screen name="Photo" component={PhotoScreen} />
      <LogStack.Screen name="PhotoReview" component={PhotoReviewScreen} options={{ gestureEnabled: false }} />
      <LogStack.Screen name="Barcode" component={BarcodeScreen} />
      <LogStack.Screen name="CustomFood" component={CustomFoodScreen} />
    </LogStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof TabParamList, IconName> = { Today: 'today', Progress: 'progress', Profile: 'profile' };

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color }) => <Icon name={TAB_ICONS[route.name]} size={22} color={color} />,
      })}
    >
      <Tabs.Screen name="Today" component={TodayScreen} />
      <Tabs.Screen name="Progress" component={ProgressScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const onboarded = useAppStore(s => !!s.profile?.onboarding_complete);
  const entitled = useAppStore(s => hasAccess(s));

  return (
    <Root.Navigator screenOptions={plain}>
      {!onboarded ? (
        <Root.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : !entitled ? (
        <Root.Screen name="Paywall" component={PaywallScreen} options={{ animation: 'fade' }} />
      ) : (
        <>
          <Root.Screen name="Main" component={MainTabs} />
          <Root.Screen name="Log" component={LogNavigator} options={{ presentation: 'modal' }} />
          <Root.Screen name="Day" component={DayHistoryScreen} />
          <Root.Screen name="GoalReached" component={GoalReachedScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Root.Screen name="ProteinGoal" component={ProteinGoalScreen} />
          <Root.Screen name="BodyWeight" component={BodyWeightScreen} />
          <Root.Screen name="GoalTypeSettings" component={GoalTypeScreen} />
          <Root.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        </>
      )}
    </Root.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});
