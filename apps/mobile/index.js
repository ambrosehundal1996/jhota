import 'react-native-get-random-values';
import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Taps on reminders are routed by the navigation linking config; nothing to do in background.
notifee.onBackgroundEvent(async () => {});

AppRegistry.registerComponent(appName, () => App);
