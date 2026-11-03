import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { mealPhotoSignedUrl } from '../services/ai/photoAnalysis';
import { colors, radii } from '../theme';

interface Props {
  localUri?: string | null;
  storagePath?: string | null;
  size?: number;
  accessibilityLabel?: string;
}

export function MealPhotoThumb({ localUri, storagePath, size = 48, accessibilityLabel = 'Meal photo' }: Props) {
  const [remote, setRemote] = useState<string | null>(null);
  const [localFailed, setLocalFailed] = useState(false);

  useEffect(() => {
    setLocalFailed(false);
    if (localUri || !storagePath) return;
    let cancelled = false;
    void mealPhotoSignedUrl(storagePath).then(url => {
      if (!cancelled) setRemote(url);
    });
    return () => {
      cancelled = true;
    };
  }, [localUri, storagePath]);

  const uri = (!localFailed && localUri) || remote;
  if (!uri) return null;
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: Math.max(radii.sm, size / 4) }]}>
      <Image
        source={{ uri }}
        style={styles.image}
        accessibilityLabel={accessibilityLabel}
        accessibilityIgnoresInvertColors
        onError={() => {
          setLocalFailed(true);
          if (storagePath && !remote) void mealPhotoSignedUrl(storagePath).then(setRemote);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.surfacePressed },
  image: { width: '100%', height: '100%' },
});
