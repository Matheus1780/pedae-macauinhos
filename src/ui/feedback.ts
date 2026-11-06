import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
export function feedback(kind: 'selection' | 'success' | 'error' = 'selection') {
  if (Platform.OS === 'web') return;
  void AccessibilityInfo.isReduceMotionEnabled()
    .then((reduced) => {
      if (reduced) return;
      if (kind === 'selection') return Haptics.selectionAsync();
      return Haptics.notificationAsync(
        kind === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    })
    .catch(() => {});
}
