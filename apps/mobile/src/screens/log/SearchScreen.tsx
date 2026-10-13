import type { NormalizedFood } from '@steady/domain';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, EmptyState, FoodRow, IconButton, Screen, SectionLabel } from '../../components';
import { useCustomFoods } from '../../hooks/useAppData';
import type { LogScreenProps } from '../../navigation/types';
import { ApiError } from '../../services/api/client';
import { foodProvider, loggableFromCustom, loggableFromNormalized, searchCustomFoods } from '../../services/foodProvider/FoodProvider';
import { colors, radii, spacing, typography } from '../../theme';
import { useLogContext } from './useLogContext';

type Status = 'idle' | 'loading' | 'done' | 'error';

export const servingDetail = (food: NormalizedFood) =>
  [food.brand, food.servingDescription].filter(Boolean).join(' · ') || null;

export const caloriesMeta = (kcal: number | null) => (kcal === null ? null : `${Math.round(kcal)} kcal`);

export function SearchScreen({ navigation, route }: LogScreenProps<'Search'>) {
  const { date, meal, src } = useLogContext(route.params);
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const customFoods = useCustomFoods();
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const ctx = { date, meal, src };

  const trimmed = query.trim();
  const customMatches = useMemo(() => searchCustomFoods(customFoods, trimmed), [customFoods, trimmed]);

  useEffect(() => {
    if (trimmed.length < 2) {
      setStatus('idle');
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    const timer = setTimeout(() => {
      foodProvider
        .searchFoods(trimmed, controller.signal)
        .then(found => {
          setResults(found);
          setStatus('done');
          setError(null);
          analytics.track('food_searched', { result_count: found.length, query_length: trimmed.length });
          if (!found.length) analytics.track('search_no_results', { query_length: trimmed.length });
        })
        .catch((e: unknown) => {
          if (e instanceof ApiError && e.code === 'cancelled') return;
          setError(e instanceof ApiError ? e : new ApiError(0, 'unknown', 'Search isn’t available right now.'));
          setStatus('error');
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, attempt]);

  const open = (food: NormalizedFood) =>
    navigation.navigate('FoodDetail', { ...ctx, mode: 'add', food: loggableFromNormalized(food), source: 'search' });

  const noResults = status === 'done' && !results.length && !customMatches.length;

  return (
    <Screen edges={['top', 'bottom']} keyboard>
      <View style={styles.bar}>
        <IconButton icon="back" tone="plain" accessibilityLabel="Back" onPress={navigation.goBack} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.input}
          accessibilityLabel="Search foods"
          testID="search-input"
        />
      </View>

      {customMatches.length ? (
        <>
          <SectionLabel>My foods</SectionLabel>
          {customMatches.map((food, i) => (
            <FoodRow
              key={food.id}
              name={food.food_name}
              detail={food.serving_description}
              meta={caloriesMeta(food.calories)}
              protein={food.protein_g}
              onPress={() => navigation.navigate('FoodDetail', { ...ctx, mode: 'add', food: loggableFromCustom(food), source: 'custom' })}
              last={i === customMatches.length - 1}
            />
          ))}
        </>
      ) : null}

      {status === 'loading' && !results.length ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {results.length ? (
        <>
          {customMatches.length ? <SectionLabel>All foods</SectionLabel> : null}
          {results.map((food, i) => (
            <FoodRow
              key={`${food.provider}:${food.id}`}
              name={food.name}
              detail={servingDetail(food)}
              meta={caloriesMeta(food.caloriesKcal)}
              protein={food.proteinG}
              onPress={() => open(food)}
              last={i === results.length - 1}
              testID={`search-result-${i}`}
            />
          ))}
          <AppText variant="caption" tone="tertiary" style={styles.attribution}>
            Nutrition data from USDA FoodData Central.
          </AppText>
        </>
      ) : null}

      {noResults ? (
        <EmptyState icon="search" title={`No results for “${trimmed}”`} message="Try a simpler name, or add it yourself.">
          <Button
            label="Create custom food"
            variant="secondary"
            size="medium"
            onPress={() => navigation.navigate('CustomFood', { ...ctx, name: trimmed })}
          />
          <Button label="Quick add protein" variant="ghost" size="medium" onPress={() => navigation.navigate('QuickAdd', ctx)} />
        </EmptyState>
      ) : null}

      {status === 'error' ? (
        <EmptyState
          icon="cloudOff"
          title={error?.isOffline ? 'You’re offline' : 'Search isn’t available'}
          message={
            error?.isOffline
              ? 'Food search needs a connection. Quick add and Set total work offline.'
              : error?.message ?? 'Please try again in a moment.'
          }
        >
          <Button label="Try again" variant="secondary" size="medium" onPress={() => setAttempt(a => a + 1)} />
          <Button label="Quick add protein" variant="ghost" size="medium" onPress={() => navigation.navigate('QuickAdd', ctx)} />
        </EmptyState>
      ) : null}

      {status === 'idle' && !customMatches.length ? (
        <AppText variant="caption" tone="tertiary" align="center" style={styles.hint}>
          Search for foods like “chicken breast” or “greek yogurt”.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  loading: { paddingVertical: spacing.xxl },
  attribution: { marginTop: spacing.lg },
  hint: { marginTop: spacing.xxl },
});
