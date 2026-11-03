import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WidgetPreviewScreen } from './WidgetPreviewScreen';

/** Standalone web mount so /widget-preview never loads camera, billing, or the rest of the app. */
export default function WidgetPreviewApp() {
  return (
    <SafeAreaProvider>
      <View style={styles.fill}>
        <WidgetPreviewScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
