import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface ToastState {
  id: number;
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
}

const useToastStore = create<ToastState>(() => ({ id: 0, message: null }));

export function showToast(message: string, action?: { label: string; onPress: () => void }) {
  useToastStore.setState(s => ({ id: s.id + 1, message, actionLabel: action?.label, onAction: action?.onPress }));
  AccessibilityInfo.announceForAccessibility(message);
}

export const hideToast = () => useToastStore.setState({ message: null });

/** One global toast, used for "Added 17g · Undo" confirmations. */
export function ToastHost() {
  const { id, message, actionLabel, onAction } = useToastStore();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hideToast, actionLabel ? 5000 : 2800);
    return () => clearTimeout(timer);
  }, [id, message, actionLabel]);
  if (!message) return null;
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.host, { paddingBottom: insets.bottom + 72 }]}>
      <Animated.View key={id} entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(160)} style={styles.toast}>
        <Icon name="check" size={18} color={colors.accentTintStrong} strokeWidth={2.4} />
        <AppText variant="bodyStrong" tone="onAccent" style={styles.message} numberOfLines={2}>
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={() => {
              onAction();
              hideToast();
            }}
            hitSlop={12}
          >
            <AppText variant="bodyStrong" style={{ color: colors.accentTintStrong }}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: spacing.xl },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    backgroundColor: colors.text,
  },
  message: { flex: 1 },
});
