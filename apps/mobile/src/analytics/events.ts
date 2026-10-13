/**
 * Every analytics event the app may emit. Properties must never include photo contents,
 * food-photo URLs, or free-text the user typed about their meal.
 */
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'goal_selected'
  | 'weight_entered'
  | 'protein_range_suggested'
  | 'protein_range_accepted'
  | 'protein_range_customized'
  | 'onboarding_completed'
  | 'log_started'
  | 'food_searched'
  | 'search_no_results'
  | 'food_logged'
  | 'food_log_edited'
  | 'food_log_deleted'
  | 'recent_food_logged'
  | 'favorite_food_logged'
  | 'favorite_added'
  | 'custom_food_created'
  | 'quick_add_used'
  | 'daily_total_set'
  | 'daily_total_removed'
  | 'ai_photo_started'
  | 'ai_photo_completed'
  | 'ai_photo_failed'
  | 'ai_estimate_edited'
  | 'ai_estimate_confirmed'
  | 'barcode_scanned'
  | 'barcode_not_found'
  | 'meal_copied'
  | 'saved_meal_created'
  | 'saved_meal_logged'
  | 'goal_reached'
  | 'notification_prompt_shown'
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'zero_log_reminder_sent'
  | 'zero_log_reminder_opened'
  | 'progress_reminder_opened'
  | 'widget_opened'
  | 'widget_quick_action_used'
  | 'progress_viewed'
  | 'day_history_viewed'
  | 'protein_range_recalculated'
  | 'body_weight_changed'
  | 'paywall_viewed'
  | 'trial_started'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'purchases_restored'
  | 'apple_account_linked';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent, props: AnalyticsProps, distinctId: string): void;
  identify(distinctId: string, traits: AnalyticsProps): void;
}
