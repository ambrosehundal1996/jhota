import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, TextInput, View } from 'react-native';
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { AppText, Button, Card, EmptyState, Icon, Screen, SheetHeader, showToast } from '../../components';
import { discardDraft, NOT_FOOD, runAnalysis, setDraftContext, startDraft } from '../../features/ai/draft';
import type { LogScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { colors, radii, spacing, typography } from '../../theme';
import { closeLog, useLogContext } from './useLogContext';

const PICKER_OPTIONS = { mediaType: 'photo', maxWidth: 1280, maxHeight: 1280, quality: 0.7, includeBase64: false } as const;

export function PhotoScreen({ navigation, route }: LogScreenProps<'Photo'>) {
  const { date, meal } = useLogContext(route.params);
  const draft = useAppStore(s => s.aiDraft);
  const busy = draft?.status === 'uploading' || draft?.status === 'analyzing';

  useEffect(() => {
    if (draft?.status === 'ready') navigation.navigate('PhotoReview');
  }, [draft?.status, navigation]);

  const handlePick = (response: ImagePickerResponse) => {
    if (response.didCancel) return;
    if (response.errorCode === 'permission') {
      Alert.alert('Allow access to take meal photos', 'You can turn this on for Steady in Settings.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    if (response.errorCode === 'camera_unavailable') {
      showToast('The camera isn’t available. Choose a photo instead.');
      return;
    }
    const uri = response.assets?.[0]?.uri;
    if (!uri) {
      showToast('We couldn’t open that photo. Try another one.');
      return;
    }
    startDraft(uri, date, meal);
  };

  const takePhoto = () => launchCamera({ ...PICKER_OPTIONS, saveToPhotos: false, cameraType: 'back' }, handlePick);
  const choosePhoto = () => launchImageLibrary({ ...PICKER_OPTIONS, selectionLimit: 1 }, handlePick);

  const cancel = () => {
    if (busy) return;
    discardDraft();
    closeLog(navigation);
  };

  if (!draft) {
    return (
      <Screen edges={['bottom']}>
        <SheetHeader title="AI photo" onClose={() => closeLog(navigation)} />
        <EmptyState icon="camera" title="Snap your meal" message="We’ll estimate the protein. You review and edit everything before it’s logged.">
          <Button label="Take photo" icon="camera" variant="filled" onPress={takePhoto} testID="take-photo" />
          <Button label="Choose from library" icon="image" variant="secondary" onPress={choosePhoto} />
        </EmptyState>
        <AppText variant="caption" tone="tertiary" align="center" style={styles.privacy}>
          Photos are stored privately and used only to estimate this meal.
        </AppText>
      </Screen>
    );
  }

  const notFood = draft.status === 'failed' && draft.error === NOT_FOOD;
  const failed = draft.status === 'failed' && !notFood;

  return (
    <Screen
      edges={['bottom']}
      keyboard
      footer={
        notFood ? (
          <>
            <Button label="Try another photo" variant="filled" onPress={() => { discardDraft(); choosePhoto(); }} />
            <Button label="Quick add instead" variant="ghost" onPress={() => { discardDraft(); navigation.replace('QuickAdd', { date, meal }); }} />
          </>
        ) : failed ? (
          <>
            <Button label="Retry" variant="filled" onPress={() => void runAnalysis()} testID="retry-analysis" />
            <Button label="Quick add instead" variant="ghost" onPress={() => { discardDraft(); navigation.replace('QuickAdd', { date, meal }); }} />
          </>
        ) : (
          <Button label={busy ? 'Estimating…' : 'Estimate protein'} variant="filled" loading={busy} disabled={busy} onPress={() => void runAnalysis()} testID="estimate" />
        )
      }
    >
      <SheetHeader title="AI photo" onClose={cancel} />
      {draft.photoUri ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: draft.photoUri }} style={styles.photo} accessibilityLabel="Your meal photo" />
          {busy ? (
            <View style={styles.photoOverlay}>
              <ActivityIndicator color="#fff" />
              <AppText variant="bodyStrong" style={styles.overlayText}>
                {draft.status === 'uploading' ? 'Uploading…' : 'Estimating protein…'}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {notFood ? (
        <Card style={styles.message}>
          <AppText variant="bodyStrong">We couldn’t spot food in this photo</AppText>
          <AppText variant="caption" tone="secondary">
            Try a clearer shot of the plate, or add the protein yourself.
          </AppText>
        </Card>
      ) : failed ? (
        <Card style={styles.message}>
          <View style={styles.row}>
            <Icon name="cloudOff" size={18} color={colors.textSecondary} />
            <AppText variant="bodyStrong">Estimate didn’t finish</AppText>
          </View>
          <AppText variant="caption" tone="secondary">
            {draft.error} Your photo is saved here, so you can retry.
          </AppText>
        </Card>
      ) : (
        <View style={styles.context}>
          <AppText variant="bodyStrong">Anything the photo can’t show? (optional)</AppText>
          <TextInput
            value={draft.context}
            onChangeText={setDraftContext}
            editable={!busy}
            placeholder="e.g. 8 oz chicken, protein pasta, double meat"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            multiline
            maxLength={200}
            accessibilityLabel="Extra details about your meal"
          />
          <Button label="Use a different photo" variant="ghost" size="small" onPress={choosePhoto} disabled={busy} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  privacy: { marginTop: spacing.md, paddingHorizontal: spacing.xl },
  photoWrap: { borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface, marginTop: spacing.sm },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  overlayText: { color: '#fff' },
  message: { marginTop: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  context: { marginTop: spacing.lg, gap: spacing.sm },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
