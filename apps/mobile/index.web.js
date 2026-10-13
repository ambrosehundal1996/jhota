import { Alert, AppRegistry } from 'react-native';
import App from './App';
import appJson from './app.json';

const appName = appJson.name;

// react-native-web's Alert is a no-op; map it to browser dialogs so prompts still work.
Alert.alert = (title, message, buttons) => {
  const text = [title, message].filter(Boolean).join('\n\n');
  const actions = buttons ?? [];
  if (actions.length <= 1) {
    window.alert(text);
    actions[0]?.onPress?.();
    return;
  }
  const cancel = actions.find(b => b.style === 'cancel');
  const primary = actions.filter(b => b !== cancel).pop();
  if (window.confirm(text)) primary?.onPress?.();
  else cancel?.onPress?.();
};

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, { rootTag: document.getElementById('root') });
