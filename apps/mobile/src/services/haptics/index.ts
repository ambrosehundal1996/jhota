import { NativeModules, Platform, Vibration } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'error';

interface NativeHaptics {
  impact(style: string): Promise<void>;
}

const native = NativeModules.JotaHaptics as NativeHaptics | undefined;

/** No-op on web and the simulator still "succeeds"; only a physical device plays the tap. */
export function haptic(kind: HapticKind): void {
  if (native) {
    void native.impact(kind);
    return;
  }
  if (Platform.OS === 'android') {
    Vibration.vibrate(kind === 'error' ? 36 : kind === 'medium' || kind === 'success' ? 18 : 10);
  }
}
