import { DEFAULT_REMINDER_PREFERENCES, type GoalType, type LocalDate, type WeightUnit } from '@steady/domain';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  AiDraft,
  CustomFood,
  DailyOverride,
  Favorite,
  FoodLog,
  NotificationPreferences,
  OutboxItem,
  Profile,
  SavedMeal,
  SavedMealItem,
  SubscriptionSnapshot,
  SyncedTable,
} from '../types/models';
import { zustandStorage } from './storage';

/** Placeholder owner for rows created before the first (anonymous) session exists. */
export const LOCAL_USER_ID = 'local';

export interface OnboardingDraft {
  goalType: GoalType | null;
  weightValue: number | null;
  weightUnit: WeightUnit;
}

export interface AppFlags {
  notificationPromptShown: boolean;
  /** Date for which the goal-reached screen was already shown. */
  celebratedDate: LocalDate | null;
  pendingCelebrationDate: LocalDate | null;
  reportedReminderIds: string[];
  devBypassPaywall: boolean;
}

export interface AppData {
  userId: string;
  isAnonymous: boolean;
  appleLinked: boolean;
  profile: Profile | null;
  onboarding: OnboardingDraft;
  logs: Record<string, FoodLog>;
  overrides: Record<string, DailyOverride>;
  favorites: Record<string, Favorite>;
  customFoods: Record<string, CustomFood>;
  savedMeals: Record<string, SavedMeal>;
  savedMealItems: Record<string, SavedMealItem>;
  notificationPrefs: NotificationPreferences;
  outbox: OutboxItem[];
  lastPulledAt: Partial<Record<SyncedTable, string>>;
  subscription: SubscriptionSnapshot | null;
  aiDraft: AiDraft | null;
  flags: AppFlags;
}

export const defaultNotificationPrefs = (userId: string): NotificationPreferences => ({
  user_id: userId,
  enabled: DEFAULT_REMINDER_PREFERENCES.enabled,
  zero_log_2pm: DEFAULT_REMINDER_PREFERENCES.zeroLog2pm,
  zero_log_7pm: DEFAULT_REMINDER_PREFERENCES.zeroLog7pm,
  progress_reminder: DEFAULT_REMINDER_PREFERENCES.progressReminder,
  permission_status: null,
  updated_at: new Date(0).toISOString(),
});

export const initialAppData = (): AppData => ({
  userId: LOCAL_USER_ID,
  isAnonymous: true,
  appleLinked: false,
  profile: null,
  onboarding: { goalType: null, weightValue: null, weightUnit: 'lb' },
  logs: {},
  overrides: {},
  favorites: {},
  customFoods: {},
  savedMeals: {},
  savedMealItems: {},
  notificationPrefs: defaultNotificationPrefs(LOCAL_USER_ID),
  outbox: [],
  lastPulledAt: {},
  subscription: null,
  aiDraft: null,
  flags: {
    notificationPromptShown: false,
    celebratedDate: null,
    pendingCelebrationDate: null,
    reportedReminderIds: [],
    devBypassPaywall: false,
  },
});

export const useAppStore = create<AppData>()(
  persist(initialAppData, {
    name: 'steady-app',
    version: 1,
    storage: createJSONStorage(() => zustandStorage),
  }),
);

export const getState = () => useAppStore.getState();
export const setState = useAppStore.setState;
