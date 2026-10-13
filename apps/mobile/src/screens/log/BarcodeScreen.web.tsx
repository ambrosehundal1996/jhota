import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Screen, SheetHeader, TextField } from '../../components';
import type { LogScreenProps } from '../../navigation/types';
import { ApiError } from '../../services/api/client';
import { foodProvider, loggableFromNormalized } from '../../services/foodProvider/FoodProvider';
import { colors, spacing } from '../../theme';
import { useLogContext } from './useLogContext';

type LookupState = { kind: 'idle' } | { kind: 'looking_up' } | { kind: 'not_found'; code: string } | { kind: 'error'; message: string };

/** Camera scanning is iOS-only; on web the barcode number is typed in. */
export function BarcodeScreen({ navigation, route }: LogScreenProps<'Barcode'>) {
  const { date, meal, src } = useLogContext(route.params);
  const ctx = { date, meal, src };
  const [code, setCode] = useState('');
  const [state, setState] = useState<LookupState>({ kind: 'idle' });
  const digits = code.replace(/\D/g, '');
  const valid = digits.length >= 8 && digits.length <= 14;

  const lookup = async () => {
    if (!valid) return;
    setState({ kind: 'looking_up' });
    try {
      const food = await foodProvider.lookupBarcode(digits);
      analytics.track(food ? 'barcode_scanned' : 'barcode_not_found', { found: !!food });
      if (!food) {
        setState({ kind: 'not_found', code: digits });
        return;
      }
      navigation.replace('FoodDetail', { ...ctx, mode: 'add', food: loggableFromNormalized(food), source: 'barcode' });
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError && e.isOffline ? 'Barcode lookup needs a connection.' : 'We couldn’t look that up. Please try again.',
      });
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={state.kind === 'looking_up' ? 'Looking up…' : 'Look up barcode'}
          variant="filled"
          disabled={!valid || state.kind === 'looking_up'}
          onPress={lookup}
        />
      }
    >
      <SheetHeader title="Barcode" onClose={navigation.goBack} />
      <AppText variant="body" tone="secondary" style={styles.intro}>
        Type the number under the barcode. Camera scanning is available in the Steady iOS app.
      </AppText>
      <TextField
        label="Barcode number"
        value={code}
        onChangeText={setCode}
        onSubmitEditing={lookup}
        keyboardType="number-pad"
        placeholder="e.g. 0012345678905"
        autoFocus
      />
      <View style={styles.status}>
        {state.kind === 'looking_up' ? <ActivityIndicator color={colors.accent} /> : null}
        {state.kind === 'not_found' ? (
          <>
            <AppText variant="h3" align="center">
              We couldn’t find this product
            </AppText>
            <AppText variant="caption" tone="secondary" align="center">
              Barcode {state.code}. Add it yourself and it’ll be in My foods next time.
            </AppText>
            <Button label="Create custom food" variant="ghost" size="medium" onPress={() => navigation.replace('CustomFood', ctx)} />
          </>
        ) : null}
        {state.kind === 'error' ? (
          <AppText variant="bodyStrong" align="center">
            {state.message}
          </AppText>
        ) : null}
      </View>
      <Button label="Search instead" variant="ghost" size="medium" onPress={() => navigation.replace('Search', ctx)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.lg },
  status: { gap: spacing.sm, marginVertical: spacing.lg, alignItems: 'center' },
});
