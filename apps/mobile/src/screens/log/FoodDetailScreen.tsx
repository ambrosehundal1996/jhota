import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ConfirmSheet,
  IconButton,
  Screen,
  SheetHeader,
  showToast,
  Stepper,
  TextField,
} from '../../components';
import { addFoodLog, deleteFoodLog, toggleFavorite, undoLogs, updateFoodLog } from '../../features/logging/actions';
import type { LogScreenProps } from '../../navigation/types';
import { foodProvider, loggableFromNormalized } from '../../services/foodProvider/FoodProvider';
import { useAppStore } from '../../state/appStore';
import { findFavorite } from '../../state/selectors';
import type { FoodLog, LoggableFood } from '../../types/models';
import { colors, spacing } from '../../theme';
import { formatServing, formatShortDay, trimNumber } from '../../utils/format';
import { closeLog, useLogContext } from './useLogContext';

const round1 = (v: number) => Math.round(v * 10) / 10;
const formatServings = (v: number) => trimNumber(v);

function servingText(food: LoggableFood, servings: number): string {
  const base = food.serving_description || formatServing(food.serving_quantity, food.serving_unit) || '1 serving';
  return servings === 1 ? base : `${formatServings(servings)} × ${base}`;
}

export function FoodDetailScreen({ navigation, route }: LogScreenProps<'FoodDetail'>) {
  return route.params.mode === 'edit' ? (
    <EditLog logId={route.params.logId} navigation={navigation} />
  ) : (
    <AddFood navigation={navigation} route={route as LogScreenProps<'FoodDetail'>['route']} />
  );
}

function AddFood({ navigation, route }: Pick<LogScreenProps<'FoodDetail'>, 'navigation' | 'route'>) {
  const params = route.params as Extract<LogScreenProps<'FoodDetail'>['route']['params'], { mode: 'add' }>;
  const { date, isToday } = useLogContext(params);
  const [food, setFood] = useState<LoggableFood>(params.food);
  const [servings, setServings] = useState(params.servings ?? 1);
  const isFavorite = useAppStore(s => !!findFavorite(s, food));

  // Search results can be abbreviated; fetch full serving details when available.
  useEffect(() => {
    if (params.food.external_provider !== 'usda' || !params.food.external_food_id) return;
    let alive = true;
    foodProvider
      .getFoodDetails('usda', params.food.external_food_id)
      .then(detail => {
        if (alive && detail && detail.proteinG > 0) setFood(loggableFromNormalized(detail));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [params.food]);

  const protein = round1(food.protein_g * servings);
  const calories = food.calories === null ? null : Math.round(food.calories * servings);

  const add = () => {
    const log = addFoodLog({ food, servings, date, source: params.source });
    if (!log) return;
    showToast(`Added ${food.food_name} · ${Math.round(log.protein_g)}g${isToday ? '' : ` to ${formatShortDay(date)}`}`, {
      label: 'Undo',
      onPress: () => undoLogs([log.id]),
    });
    closeLog(navigation);
  };

  const favorite = () => {
    const nowFavorite = toggleFavorite(food, servings);
    showToast(nowFavorite ? 'Added to favorites' : 'Removed from favorites');
  };

  return (
    <Screen
      footer={
        <Button
          label={`Add to ${isToday ? 'today' : formatShortDay(date)} · ${Math.round(protein)}g`}
          variant="filled"
          onPress={add}
          disabled={servings <= 0}
          testID="add-food"
        />
      }
    >
      <SheetHeader
        title=""
        onClose={navigation.goBack}
        left={
          <IconButton
            icon={isFavorite ? 'heartFilled' : 'heart'}
            tone="plain"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onPress={favorite}
          />
        }
      />
      <AppText variant="title" accessibilityRole="header">
        {food.food_name}
      </AppText>
      {food.brand ? (
        <AppText variant="body" tone="secondary">
          {food.brand}
        </AppText>
      ) : null}

      <Card tone="mint" style={styles.hero}>
        <AppText variant="display" accessibilityLabel={`${protein} grams protein`}>
          {trimNumber(protein)}
          <AppText variant="h2" tone="secondary">
            g
          </AppText>
        </AppText>
        <AppText variant="body" tone="secondary">
          protein · {servingText(food, servings)}
        </AppText>
        {calories !== null ? (
          <AppText variant="caption" tone="tertiary" style={styles.calories}>
            {calories} kcal
          </AppText>
        ) : null}
      </Card>

      <View style={styles.row}>
        <AppText variant="bodyStrong">Servings</AppText>
        <Stepper value={servings} onChange={setServings} step={0.5} min={0.5} max={20} format={formatServings} label="Servings" />
      </View>

      {food.external_provider === 'off' ? (
        <AppText variant="caption" tone="tertiary" style={styles.attribution}>
          Product data from Open Food Facts. Check the label if something looks off.
        </AppText>
      ) : null}
    </Screen>
  );
}

function EditLog({ logId, navigation }: { logId: string; navigation: LogScreenProps<'FoodDetail'>['navigation'] }) {
  const log = useAppStore(s => s.logs[logId]) as FoodLog | undefined;
  const [proteinText, setProteinText] = useState(log ? trimNumber(log.protein_g) : '');
  const [scale, setScale] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!log || log.deleted_at) closeLog(navigation);
  }, [log, navigation]);
  if (!log || log.deleted_at) return null;

  const scalable = log.source !== 'quick_add' && log.source !== 'ai_photo';
  const protein = scalable ? round1(log.protein_g * scale) : Number(proteinText);
  const valid = Number.isFinite(protein) && protein >= 0 && protein <= 500;
  const dirty = protein !== log.protein_g;

  const save = () => {
    const factor = log.protein_g > 0 ? protein / log.protein_g : 1;
    const scaleOrNull = (v: number | null) => (v === null ? null : round1(v * factor));
    updateFoodLog(log.id, {
      protein_g: protein,
      serving_quantity: scalable ? scaleOrNull(log.serving_quantity) : log.serving_quantity,
      calories: scaleOrNull(log.calories),
      carbs_g: scaleOrNull(log.carbs_g),
      fat_g: scaleOrNull(log.fat_g),
    });
    showToast('Entry updated');
    closeLog(navigation);
  };

  const remove = () => {
    const undo = deleteFoodLog(log.id);
    setConfirmDelete(false);
    showToast(`Removed ${log.food_name}`, { label: 'Undo', onPress: undo });
    closeLog(navigation);
  };

  return (
    <Screen keyboard footer={<Button label="Save changes" variant="filled" onPress={save} disabled={!dirty || !valid} />}>
      <SheetHeader title="Edit entry" onClose={() => closeLog(navigation)} />
      <AppText variant="title" accessibilityRole="header">
        {log.food_name}
      </AppText>
      <AppText variant="body" tone="secondary">
        {[log.brand, formatShortDay(log.log_date)].filter(Boolean).join(' · ')}
      </AppText>

      {scalable ? (
        <>
          <Card tone="mint" style={styles.hero}>
            <AppText variant="display">
              {trimNumber(protein)}
              <AppText variant="h2" tone="secondary">
                g
              </AppText>
            </AppText>
            <AppText variant="body" tone="secondary">
              protein
              {log.serving_quantity !== null
                ? ` · ${formatServing(round1(log.serving_quantity * scale), log.serving_unit)}`
                : ''}
            </AppText>
          </Card>
          <View style={styles.row}>
            <AppText variant="bodyStrong">Amount</AppText>
            <Stepper value={scale} onChange={setScale} step={0.5} min={0.5} max={20} format={v => `${trimNumber(v)}×`} label="Amount" />
          </View>
        </>
      ) : (
        <View style={styles.field}>
          <TextField
            label="Protein"
            value={proteinText}
            onChangeText={t => setProteinText(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            suffix="g"
            size="large"
            error={!valid ? 'Enter a number between 0 and 500.' : null}
          />
        </View>
      )}

      <Button label="Delete entry" variant="destructive" size="medium" onPress={() => setConfirmDelete(true)} style={styles.delete} />

      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this entry?"
        message={`${log.food_name} · ${Math.round(log.protein_g)}g will be removed from this day.`}
        onDismiss={() => setConfirmDelete(false)}
        actions={[
          { label: 'Delete', onPress: remove, variant: 'destructive' },
          { label: 'Cancel', onPress: () => setConfirmDelete(false), variant: 'ghost' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
  calories: { color: colors.textTertiary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl },
  field: { marginTop: spacing.xl },
  attribution: { marginTop: spacing.xl },
  delete: { marginTop: spacing.xxl },
});
