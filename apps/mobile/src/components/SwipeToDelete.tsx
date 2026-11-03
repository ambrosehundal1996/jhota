import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { haptic } from '../services/haptics';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';

const ACTION = 88;
const OPEN_THRESHOLD = 48;
const FULL_FRACTION = 0.42;

interface Props {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  enabled?: boolean;
}

export function SwipeToDelete({ children, open, onOpenChange, onDelete, enabled = true }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const currentX = useRef(0);
  const widthRef = useRef(0);
  const dragging = useRef(false);
  const openRef = useRef(open);
  const enabledRef = useRef(enabled);
  const onOpenChangeRef = useRef(onOpenChange);
  const onDeleteRef = useRef(onDelete);
  openRef.current = open;
  enabledRef.current = enabled;
  onOpenChangeRef.current = onOpenChange;
  onDeleteRef.current = onDelete;

  const snap = (to: number) => {
    currentX.current = to;
    Animated.spring(translateX, { toValue: to, useNativeDriver: true, bounciness: 0, speed: 22 }).start();
  };

  const commitDelete = () => {
    haptic('medium');
    const w = Math.max(widthRef.current, ACTION * 2);
    currentX.current = -w;
    Animated.timing(translateX, { toValue: -w, duration: 160, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onDeleteRef.current();
    });
  };

  const commitDeleteRef = useRef(commitDelete);
  const snapRef = useRef(snap);
  commitDeleteRef.current = commitDelete;
  snapRef.current = snap;

  useEffect(() => {
    if (dragging.current) return;
    snap(open ? -ACTION : 0);
  }, [open]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        enabledRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderTerminationRequest: () => !dragging.current,
      onPanResponderGrant: () => {
        dragging.current = true;
        translateX.stopAnimation(value => {
          startX.current = typeof value === 'number' ? value : currentX.current;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-(widthRef.current || ACTION), startX.current + g.dx));
        currentX.current = next;
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        dragging.current = false;
        const x = currentX.current;
        const w = widthRef.current || 1;
        if (g.vx < -1.1 || -x > w * FULL_FRACTION) {
          onOpenChangeRef.current(false);
          commitDeleteRef.current();
          return;
        }
        if (-x > OPEN_THRESHOLD) {
          haptic('selection');
          onOpenChangeRef.current(true);
          snapRef.current(-ACTION);
        } else {
          onOpenChangeRef.current(false);
          snapRef.current(0);
        }
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        snapRef.current(openRef.current ? -ACTION : 0);
      },
    }),
  ).current;

  if (!enabled) return <>{children}</>;

  return (
    <View
      style={styles.clip}
      onLayout={e => {
        widthRef.current = e.nativeEvent.layout.width;
      }}
      accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'delete') onDelete();
      }}
    >
      <View style={styles.action} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={commitDelete} style={styles.actionHit}>
          <AppText variant="bodyStrong" tone="onAccent">
            Delete
          </AppText>
        </Pressable>
      </View>
      <Animated.View style={[styles.front, { transform: [{ translateX }] }]} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  action: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.destructive,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionHit: {
    minWidth: ACTION,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  front: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
});
