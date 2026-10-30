import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  /** Pinned to the bottom, above the safe area (primary CTAs). */
  footer?: React.ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  keyboard?: boolean;
  /** Forest-green branded shell (welcome). Cream is the default. */
  tone?: 'default' | 'hero';
  testID?: string;
}

export function Screen({
  children,
  scroll = true,
  footer,
  edges = ['top', 'bottom'],
  contentStyle,
  keyboard,
  tone = 'default',
  testID,
}: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
  );
  const inner = (
    <>
      {body}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );
  const hero = tone === 'hero';
  return (
    <SafeAreaView style={[styles.safe, hero && styles.hero]} edges={edges} testID={testID}>
      <StatusBar barStyle={hero ? 'light-content' : 'dark-content'} />
      {keyboard ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.hero },
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
});
