import type { LocalDate, LogSource, MealType } from '@steady/domain';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoggableFood } from '../types/models';

/** Where a logging flow was launched from (analytics only). */
export type LaunchSource = 'widget' | 'notification' | 'today' | 'history' | undefined;

interface LogContext {
  date?: LocalDate;
  meal?: MealType;
  src?: LaunchSource;
}

export type LogStackParamList = {
  LogHome: LogContext | undefined;
  Search: (LogContext & { query?: string }) | undefined;
  FoodDetail:
    | (LogContext & { mode: 'add'; food: LoggableFood; source: LogSource; servings?: number })
    | { mode: 'edit'; logId: string };
  QuickAdd: LogContext | undefined;
  SetTotal: LogContext | undefined;
  Photo: LogContext | undefined;
  PhotoReview: undefined;
  Barcode: LogContext | undefined;
  CustomFood: (LogContext & { customFoodId?: string; name?: string }) | undefined;
};

export type TabParamList = {
  Today: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goal: undefined;
  Weight: undefined;
  Range: undefined;
  Ready: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  Paywall: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Log: NavigatorScreenParams<LogStackParamList> | undefined;
  Day: { date: LocalDate };
  GoalReached: undefined;
  ProteinGoal: undefined;
  BodyWeight: undefined;
  GoalTypeSettings: undefined;
  NotificationSettings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type LogScreenProps<T extends keyof LogStackParamList> = NativeStackScreenProps<LogStackParamList, T>;
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = NativeStackScreenProps<OnboardingStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
