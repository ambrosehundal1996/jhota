import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, ConfirmSheet, Screen, SheetHeader, showToast, TextField } from '../../components';
import { addFoodLog, deleteCustomFood, saveCustomFood, undoLogs } from '../../features/logging/actions';
import type { LogScreenProps } from '../../navigation/types';
import { loggableFromCustom } from '../../services/foodProvider/FoodProvider';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';
import { closeLog, useLogContext } from './useLogContext';

const numberOrNull = (text: string) => (text.trim() === '' ? null : Number(text));

export function CustomFoodScreen({ navigation, route }: LogScreenProps<'CustomFood'>) {
  const { date, meal, isToday } = useLogContext(route.params);
  const existing = useAppStore(s => (route.params?.customFoodId ? s.customFoods[route.params.customFoodId] : undefined));
  const [name, setName] = useState(existing?.food_name ?? route.params?.name ?? '');
  const [serving, setServing] = useState(existing?.serving_description ?? '');
  const [protein, setProtein] = useState(existing ? String(existing.protein_g) : '');
  const [calories, setCalories] = useState(existing?.calories != null ? String(existing.calories) : '');
  const [touched, setTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const proteinValue = Number(protein);
  const caloriesValue = numberOrNull(calories);
  const errors = {
    name: !name.trim() ? 'Give it a name.' : null,
    protein: protein === '' || !Number.isFinite(proteinValue) || proteinValue < 0 || proteinValue > 300 ? 'Enter protein between 0 and 300g.' : null,
    calories: caloriesValue !== null && (!Number.isFinite(caloriesValue) || caloriesValue < 0) ? 'Enter a valid number.' : null,
  };
  const valid = !errors.name && !errors.protein && !errors.calories;

  const save = (andLog: boolean) => {
    setTouched(true);
    if (!valid) return;
    const food = saveCustomFood(
      { food_name: name, serving_description: serving, protein_g: proteinValue, calories: caloriesValue, notes: null },
      existing?.id,
    );
    if (andLog) {
      const log = addFoodLog({ food: loggableFromCustom(food), meal, date, source: 'custom' });
      showToast(`Added ${food.food_name} · ${Math.round(log.protein_g)}g`, { label: 'Undo', onPress: () => undoLogs([log.id]) });
      closeLog(navigation);
    } else {
      showToast('Saved to My foods');
      navigation.goBack();
    }
  };

  return (
    <Screen
      keyboard
      footer={
        <>
          <Button label={isToday ? 'Save and add to today' : 'Save and add'} variant="filled" onPress={() => save(true)} />
          <Button label="Save to My foods" variant="ghost" onPress={() => save(false)} />
        </>
      }
    >
      <SheetHeader title={existing ? 'Edit food' : 'Custom food'} onClose={navigation.goBack} />
      <View style={styles.form}>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Morning shake" autoFocus={!existing} maxLength={80} error={touched ? errors.name : null} />
        <TextField label="Serving" value={serving} onChangeText={setServing} placeholder="e.g. 1 scoop, 1 bowl" maxLength={60} />
        <TextField
          label="Protein per serving"
          value={protein}
          onChangeText={t => setProtein(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          suffix="g"
          error={touched ? errors.protein : null}
        />
        <TextField
          label="Calories (optional)"
          value={calories}
          onChangeText={t => setCalories(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          suffix="kcal"
          error={touched ? errors.calories : null}
        />
      </View>
      {existing ? (
        <Button label="Delete food" variant="destructive" size="medium" onPress={() => setConfirmDelete(true)} style={styles.delete} />
      ) : (
        <AppText variant="caption" tone="tertiary" style={styles.note}>
          Custom foods are private to you and searchable offline.
        </AppText>
      )}
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this food?"
        message="It’s removed from My foods. Entries you already logged stay as they are."
        onDismiss={() => setConfirmDelete(false)}
        actions={[
          {
            label: 'Delete',
            variant: 'destructive',
            onPress: () => {
              if (existing) deleteCustomFood(existing.id);
              setConfirmDelete(false);
              navigation.goBack();
            },
          },
          { label: 'Cancel', variant: 'ghost', onPress: () => setConfirmDelete(false) },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, marginTop: spacing.md },
  delete: { marginTop: spacing.xxl },
  note: { marginTop: spacing.lg },
});
