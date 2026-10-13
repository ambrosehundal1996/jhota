import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  isScannedCode,
  useCameraPermission,
  useObjectOutput,
  type ScannedObject,
} from 'react-native-vision-camera';
import { analytics } from '../../analytics';
import { AppText, Button, EmptyState, IconButton, Screen } from '../../components';
import type { LogScreenProps } from '../../navigation/types';
import { ApiError } from '../../services/api/client';
import { foodProvider, loggableFromNormalized } from '../../services/foodProvider/FoodProvider';
import { colors, radii, spacing } from '../../theme';
import { useLogContext } from './useLogContext';

type ScanState = { kind: 'scanning' } | { kind: 'looking_up'; code: string } | { kind: 'not_found'; code: string } | { kind: 'error'; message: string };

export function BarcodeScreen({ navigation, route }: LogScreenProps<'Barcode'>) {
  const { date, meal, src } = useLogContext(route.params);
  const ctx = { date, meal, src };
  const focused = useIsFocused();
  const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission();
  const [state, setState] = useState<ScanState>({ kind: 'scanning' });
  const busy = useRef(false);

  const lookup = useCallback(
    async (code: string) => {
      setState({ kind: 'looking_up', code });
      try {
        const food = await foodProvider.lookupBarcode(code);
        analytics.track(food ? 'barcode_scanned' : 'barcode_not_found', { found: !!food });
        if (!food) {
          setState({ kind: 'not_found', code });
          return;
        }
        navigation.replace('FoodDetail', { ...ctx, mode: 'add', food: loggableFromNormalized(food), source: 'barcode' });
      } catch (e) {
        setState({
          kind: 'error',
          message: e instanceof ApiError && e.isOffline ? 'Barcode lookup needs a connection.' : 'We couldn’t look that up. Please try again.',
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, date, meal, src],
  );

  const output = useObjectOutput({
    types: ['ean-13', 'ean-8', 'upc-e'],
    onObjectsScanned: (objects: ScannedObject[]) => {
      if (busy.current) return;
      const code = objects.find(isScannedCode)?.value;
      if (!code) return;
      busy.current = true;
      void lookup(code);
    },
  });

  const rescan = () => {
    busy.current = false;
    setState({ kind: 'scanning' });
  };

  if (!hasPermission) {
    return (
      <Screen>
        <View style={styles.headerRow}>
          <IconButton icon="back" tone="plain" accessibilityLabel="Back" onPress={navigation.goBack} />
        </View>
        <EmptyState
          icon="barcode"
          title="Scan barcodes with your camera"
          message="Steady uses the camera only while you’re scanning. Nothing is recorded."
        >
          {canRequestPermission ? (
            <Button label="Allow camera" variant="filled" size="medium" onPress={() => void requestPermission()} />
          ) : (
            <Button label="Open Settings" variant="filled" size="medium" onPress={() => Linking.openSettings()} />
          )}
          <Button label="Search instead" variant="ghost" size="medium" onPress={() => navigation.replace('Search', ctx)} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <View style={styles.fill}>
      <Camera style={StyleSheet.absoluteFill} device="back" isActive={focused && state.kind === 'scanning'} outputs={[output]} />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <IconButton icon="close" tone="surface" accessibilityLabel="Close scanner" onPress={navigation.goBack} />
        </View>
        <View style={styles.frame} accessibilityLabel="Point the camera at a barcode" />
        <View style={styles.panel}>
          {state.kind === 'scanning' ? (
            <AppText variant="bodyStrong" align="center">
              Point at a barcode
            </AppText>
          ) : null}
          {state.kind === 'looking_up' ? (
            <View style={styles.rowCenter}>
              <ActivityIndicator color={colors.accent} />
              <AppText variant="bodyStrong">Looking up {state.code}…</AppText>
            </View>
          ) : null}
          {state.kind === 'not_found' ? (
            <>
              <AppText variant="h3" align="center">
                We couldn’t find this product
              </AppText>
              <AppText variant="caption" tone="secondary" align="center">
                Barcode {state.code}. Add it yourself and it’ll be in My foods next time.
              </AppText>
              <Button label="Create custom food" variant="filled" size="medium" onPress={() => navigation.replace('CustomFood', ctx)} />
              <Button label="Scan again" variant="ghost" size="medium" onPress={rescan} />
            </>
          ) : null}
          {state.kind === 'error' ? (
            <>
              <AppText variant="bodyStrong" align="center">
                {state.message}
              </AppText>
              <Button label="Try again" variant="filled" size="medium" onPress={rescan} />
              <Button label="Quick add instead" variant="ghost" size="medium" onPress={() => navigation.replace('QuickAdd', ctx)} />
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  headerRow: { paddingTop: spacing.sm },
  overlay: { flex: 1, justifyContent: 'space-between', padding: spacing.xl, paddingTop: 60 },
  topBar: { alignItems: 'flex-end' },
  frame: {
    alignSelf: 'center',
    width: '86%',
    aspectRatio: 1.7,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  panel: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
