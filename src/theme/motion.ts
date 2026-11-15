import { Easing } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export const EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const durations = {
  press: 120,
  small: 180,
  enter: 220,
  exit: 180,
} as const;

export const pressScale = 0.97;
