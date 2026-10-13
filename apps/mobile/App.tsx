import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrap } from './src/app/bootstrap';
import { ToastHost } from './src/components';
import { linking } from './src/navigation/linking';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const theme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  useEffect(() => bootstrap(), []);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer theme={theme} linking={linking}>
        <RootNavigator />
      </NavigationContainer>
      <ToastHost />
    </SafeAreaProvider>
  );
}
