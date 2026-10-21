import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import {
  AppText,
  Button,
  EmptyState,
  FoodRow,
  Icon,
  MethodTile,
  Screen,
  SectionLabel,
  SegmentedControl,
  SheetHeader,
  showToast,
} from '../../components';
import {
  favoriteToLoggable,
  logSavedMeal,
  recentToLoggable,
  relogFavorite,
  relogRecent,
  undoLogs,
} from '../../features/logging/actions';
import { useCustomFoods, useFavorites, useRecents } from '../../hooks/useAppData';
import type { LogScreenProps } from '../../navigation/types';
import { loggableFromCustom } from '../../services/foodProvider/FoodProvider';
import { useAppStore } from '../../state/appStore';
import { colors, radii, spacing } from '../../theme';
import { formatServing, formatShortDay } from '../../utils/format';
import { closeLog, useLogContext } from './useLogContext';

type Tab = 'recent' | 'favorites' | 'mine';
const TABS = [
  { value: 'recent', label: 'Recent' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'mine', label: 'My foods' },
] as const;

export function LogHomeScreen({ navigation, route }: LogScreenProps<'LogHome'>) {
  const { date, isToday, src } = useLogContext(route.params);
  const [tab, setTab] = useState<Tab>('recent');
  const recents = useRecents(20);
  const favorites = useFavorites();
  const customFoods = useCustomFoods();
  const savedMeals = useAppStore(s => s.savedMeals);
  const savedMealItems = useAppStore(s => s.savedMealItems);
  const ctx = { date, src };

  const meals = useMemo(
    () =>
      Object.values(savedMeals)
        .filter(m => !m.deleted_at)
        .map(m => {
          const items = Object.values(savedMealItems).filter(i => i.saved_meal_id === m.id);
          return { ...m, protein: items.reduce((sum, i) => sum + i.protein_g, 0), count: items.length };
        }),
    [savedMeals, savedMealItems],
  );

  const added = (name: string, protein: number, ids: string[]) =>
    showToast(`Added ${name} · ${Math.round(protein)}g${isToday ? '' : ` to ${formatShortDay(date)}`}`, {
      label: 'Undo',
      onPress: () => undoLogs(ids),
    });

  const startMethod = (method: 'ai_photo' | 'quick_add' | 'set_total' | 'barcode') => {
    analytics.track('log_started', { method, src: src ?? 'today' });
    const screen = ({ ai_photo: 'Photo', quick_add: 'QuickAdd', set_total: 'SetTotal', barcode: 'Barcode' } as const)[method];
    navigation.navigate(screen, ctx);
  };

  return (
    <Screen edges={['bottom']}>
      <SheetHeader title={isToday ? 'Log food' : `Log food · ${formatShortDay(date)}`} onClose={() => closeLog(navigation)} />

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search foods"
        onPress={() => navigation.navigate('Search', ctx)}
        style={styles.search}
        testID="open-search"
      >
        <Icon name="search" size={20} color={colors.textTertiary} />
        <AppText variant="body" tone="tertiary">
          Search foods
        </AppText>
      </Pressable>

      <View style={styles.tiles}>
        <MethodTile label="AI photo" icon="camera" onPress={() => startMethod('ai_photo')} testID="method-photo" />
        <MethodTile label="Quick add" icon="bolt" onPress={() => startMethod('quick_add')} />
        <MethodTile label="Set total" icon="sigma" onPress={() => startMethod('set_total')} />
        <MethodTile label="Scan" icon="barcode" onPress={() => startMethod('barcode')} />
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} style={styles.tabs} accessibilityLabel="Food lists" />

      {tab === 'recent' ? (
        recents.length ? (
          <View>
            {recents.map((recent, i) => (
              <FoodRow
                key={recent.key}
                name={recent.food_name}
                brand={recent.brand}
                detail={formatServing(recent.serving_quantity, recent.serving_unit) || null}
                protein={recent.protein_g}
                onPress={() =>
                  navigation.navigate('FoodDetail', { ...ctx, mode: 'add', food: recentToLoggable(recent), source: 'recent' })
                }
                onAdd={() => {
                  const log = relogRecent(recent, date);
                  if (!log) return;
                  added(recent.food_name, log.protein_g, [log.id]);
                  closeLog(navigation);
                }}
                addLabel={`Add ${recent.food_name}`}
                last={i === recents.length - 1}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="today" title="No recent foods yet" message="Foods you log show up here for one-tap re-logging." />
        )
      ) : null}

      {tab === 'favorites' ? (
        favorites.length ? (
          <View>
            {favorites.map((fav, i) => (
              <FoodRow
                key={fav.id}
                name={fav.food_name}
                brand={fav.brand}
                detail={formatServing(fav.serving_quantity, fav.serving_unit) || null}
                protein={fav.protein_g}
                onPress={() =>
                  navigation.navigate('FoodDetail', { ...ctx, mode: 'add', food: favoriteToLoggable(fav), source: 'favorite' })
                }
                onAdd={() => {
                  const log = relogFavorite(fav, date);
                  if (!log) return;
                  added(fav.food_name, log.protein_g, [log.id]);
                  closeLog(navigation);
                }}
                addLabel={`Add ${fav.food_name}`}
                last={i === favorites.length - 1}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="heart" title="No favorites yet" message="Tap the heart on any food to keep it here." />
        )
      ) : null}

      {tab === 'mine' ? (
        <View>
          {meals.length ? (
            <>
              <SectionLabel>Saved meals</SectionLabel>
              {meals.map((m, i) => (
                <FoodRow
                  key={m.id}
                  name={m.name}
                  detail={`${m.count} item${m.count === 1 ? '' : 's'}`}
                  protein={m.protein}
                  onAdd={() => {
                    const logs = logSavedMeal(m.id, date);
                    if (!logs.length) return;
                    added(m.name, m.protein, logs.map(l => l.id));
                    closeLog(navigation);
                  }}
                  addLabel={`Add ${m.name}`}
                  last={i === meals.length - 1}
                />
              ))}
              <SectionLabel>Custom foods</SectionLabel>
            </>
          ) : null}
          {customFoods.length ? (
            customFoods.map((food, i) => (
              <FoodRow
                key={food.id}
                name={food.food_name}
                detail={food.serving_description}
                protein={food.protein_g}
                onPress={() =>
                  navigation.navigate('FoodDetail', { ...ctx, mode: 'add', food: loggableFromCustom(food), source: 'custom' })
                }
                last={i === customFoods.length - 1}
              />
            ))
          ) : (
            <EmptyState icon="fork" title="No custom foods yet" message="Save foods you eat often, like your go-to shake." />
          )}
          <Button
            label="Create custom food"
            icon="plus"
            variant="secondary"
            size="medium"
            onPress={() => navigation.navigate('CustomFood', ctx)}
            style={styles.create}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tabs: { marginTop: spacing.xl, marginBottom: spacing.sm },
  create: { marginTop: spacing.lg },
});
