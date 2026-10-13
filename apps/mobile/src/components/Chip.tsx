import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  icon?: IconName;
  tone?: 'mint' | 'neutral';
  onPress?: () => void;
}

export function Chip({ label, icon, tone = 'mint', onPress }: Props) {
  const color = tone === 'mint' ? colors.accentText : colors.textSecondary;
  const body = (
    <View style={[styles.chip, tone === 'neutral' && styles.neutral]}>
      {icon ? <Icon name={icon} size={13} color={color} strokeWidth={2.2} /> : null}
      <AppText variant="captionStrong" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {body}
    </Pressable>
  );
}

/** Large tile for logging methods (AI Photo, Quick Add, Set Total, Scan). */
export function MethodTile({ label, icon, onPress, testID }: { label: string; icon: IconName; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      <View style={styles.tileIcon}>
        <Icon name={icon} size={20} color={colors.accentText} />
      </View>
      <AppText variant="captionStrong" align="center" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: colors.accentTint,
  },
  neutral: { backgroundColor: colors.surface },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentTint,
  },
});
