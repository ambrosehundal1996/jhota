import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnalysisPreviewScreen } from './AnalysisPreviewScreen';

/** Standalone web mount so /analysis-preview never loads camera, billing, or the rest of the app. */
export default function AnalysisPreviewApp() {
  return (
    <SafeAreaProvider>
      <View style={styles.fill}>
        <AnalysisPreviewScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
