import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlop, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  name: string;
  brand?: string | null;
  detail?: string | null;
  /** Muted secondary nutrition text (calories), only on search/detail surfaces. */
  meta?: string | null;
  protein: number;
  onPress?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  last?: boolean;
  testID?: string;
}

export function FoodRow({ name, brand, detail, meta, protein, onPress, onAdd, addLabel, last, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}${brand ? `, ${brand}` : ''}, ${Math.round(protein)} grams protein`}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.text}>
        {brand ? (
          <AppText variant="eyebrow" tone="tertiary" numberOfLines={1}>
            {brand}
          </AppText>
        ) : null}
        <AppText variant="bodyStrong" numberOfLines={2}>
          {name}
        </AppText>
        {detail || meta ? (
          <AppText variant="caption" tone="tertiary" numberOfLines={1}>
            {[detail, meta].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
      </View>
      <View style={styles.protein}>
        <AppText variant="numberSmall">{Math.round(protein)}g</AppText>
        <AppText variant="caption" tone="tertiary">
          protein
        </AppText>
      </View>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel ?? `Add ${name}`}
          hitSlop={hitSlop}
          onPress={onAdd}
          style={({ pressed }) => [styles.add, pressed && { backgroundColor: colors.accentTint }]}
        >
          <Icon name="plus" size={18} color={colors.accent} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
  text: { flex: 1, gap: 2 },
  protein: { alignItems: 'flex-end' },
  add: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
