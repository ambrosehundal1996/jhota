import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

/** Whole-gram numeric keypad (mockup 08). */
export function Keypad({ value, onChange, maxDigits = 3 }: { value: string; onChange: (value: string) => void; maxDigits?: number }) {
  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'back') return onChange(value.slice(0, -1));
    if (!key) return;
    if (value === '0') return onChange(key);
    if (value.length >= maxDigits) return;
    onChange(value + key);
  };
  return (
    <View style={styles.grid}>
      {KEYS.map((key, i) => (
        <Pressable
          key={`${key}-${i}`}
          disabled={!key}
          accessibilityRole="keyboardkey"
          accessibilityLabel={key === 'back' ? 'Delete' : key}
          onPress={() => press(key)}
          onLongPress={key === 'back' ? () => onChange('') : undefined}
          style={({ pressed }) => [styles.key, pressed && !!key && styles.pressed]}
        >
          {key === 'back' ? (
            <Icon name="backspace" size={24} color={colors.text} />
          ) : (
            <AppText variant="h2" style={styles.keyText}>
              {key}
            </AppText>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xs },
  key: { width: '33.33%', height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  pressed: { backgroundColor: colors.surface },
  keyText: { fontWeight: '400' },
});
