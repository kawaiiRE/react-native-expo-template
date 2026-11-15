import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

function run(effect: () => Promise<void>) {
  if (!enabled) return;
  effect().catch(() => undefined);
}

/** One haptic per user action, fired with the visual it accompanies. */
export const haptics = {
  selection: () => run(() => Haptics.selectionAsync()),
  success: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  error: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
  warning: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),
  lightImpact: () =>
    run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
};
