import { AppRegistry } from 'react-native';
import appJson from './app.json';
import AnalysisPreviewApp from './src/screens/log/AnalysisPreviewApp';
import WidgetPreviewApp from './src/screens/today/WidgetPreviewApp';

const appName = appJson.name;
const rootTag = document.getElementById('root');
const path = typeof window !== 'undefined' ? window.location.pathname : '';
const Root = path.includes('widget-preview') ? WidgetPreviewApp : AnalysisPreviewApp;

try {
  AppRegistry.registerComponent(appName, () => Root);
  AppRegistry.runApplication(appName, { rootTag });
} catch (error) {
  if (rootTag) rootTag.textContent = error && error.stack ? error.stack : String(error);
}
