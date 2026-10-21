import type {
  AiConfidence,
  DailyOverride,
  FoodLog,
  FoodProviderId,
  GoalType,
  LocalDate,
  MealType,
  NormalizedFood,
  UncertaintyReason,
  WeightUnit,
} from '@jota/domain';

export type { DailyOverride, FoodLog, LocalDate, MealType, NormalizedFood };

export interface Profile {
  id: string;
  goal_type: GoalType | null;
  weight_value: number | null;
  weight_unit: WeightUnit;
  protein_goal_min: number | null;
  protein_goal_max: number | null;
  protein_goal_is_custom: boolean;
  timezone: string;
  display_name: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface FoodSnapshot {
  food_name: string;
  brand: string | null;
  serving_quantity: number | null;
  serving_unit: string | null;
  protein_g: number;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  external_provider: FoodProviderId | null;
  external_food_id: string | null;
  custom_food_id: string | null;
}

export interface Favorite extends FoodSnapshot {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomFood {
  id: string;
  user_id: string;
  food_name: string;
  serving_description: string;
  protein_g: number;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SavedMeal {
  id: string;
  user_id: string;
  name: string;
  default_meal_type: MealType | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SavedMealItem extends FoodSnapshot {
  id: string;
  saved_meal_id: string;
  user_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  enabled: boolean;
  morning_9am: boolean;
  zero_log_2pm: boolean;
  remaining_4pm: boolean;
  remaining_7pm: boolean;
  zero_log_8pm: boolean;
  progress_reminder: boolean;
  permission_status: string | null;
  updated_at: string;
}

export type SyncedTable =
  | 'profiles'
  | 'food_logs'
  | 'daily_overrides'
  | 'favorites'
  | 'custom_foods'
  | 'saved_meals'
  | 'saved_meal_items'
  | 'notification_preferences'
  | 'ai_photo_analyses';

export type OutboxItem =
  | {
      id: string;
      table: SyncedTable;
      op: 'upsert';
      rowId: string;
      row: Record<string, unknown>;
      attempts: number;
      enqueuedAt: string;
    }
  | {
      id: string;
      table: SyncedTable;
      op: 'update';
      rowId: string;
      patch: Record<string, unknown>;
      attempts: number;
      enqueuedAt: string;
    };

/** A food the user can log: from search, barcode, custom foods, favorites, or recents. */
export interface LoggableFood extends FoodSnapshot {
  serving_description: string;
  /** Grams for one serving when known (used for display only). */
  serving_grams: number | null;
  barcode: string | null;
}

export interface SubscriptionSnapshot {
  isActive: boolean;
  isTrial: boolean;
  /** True when the user previously had the entitlement and it lapsed. */
  hasExpired: boolean;
  expiresAt: string | null;
  willRenew: boolean | null;
  productIdentifier: string | null;
  checkedAt: string;
}

export interface AiDraftItem {
  key: string;
  name: string;
  portion: string;
  protein_g: number;
  /** Null for items the user added. */
  original_protein_g: number | null;
  original_name?: string | null;
  /** The AI's rating of its original estimate; never updated by user edits. */
  confidence?: AiConfidence | null;
  uncertainty_reasons?: UncertaintyReason[];
}

export interface AiDraft {
  id: string;
  date: LocalDate;
  photoUri: string | null;
  storagePath: string | null;
  context: string;
  status: 'picked' | 'uploading' | 'analyzing' | 'ready' | 'clarify' | 'failed';
  error: string | null;
  analysisId: string | null;
  rawItems: { name: string; protein_g: number }[] | null;
  rawTotal: number | null;
  items: AiDraftItem[];
  overallConfidence?: AiConfidence | null;
  reviewNotes?: string[];
  clarificationQuestion?: string | null;
  /** Context sent with the latest analysis, so a retry only happens with new information. */
  analyzedContext?: string | null;
  createdAt: string;
}
