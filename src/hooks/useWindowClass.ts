import { useWindowDimensions } from 'react-native';

import { breakpoints } from '@/theme/tokens';

export type WindowClass = 'compact' | 'medium' | 'expanded';

/** Material 3 window size class for the current window width. */
export function useWindowClass(): WindowClass {
  const { width } = useWindowDimensions();
  if (width >= breakpoints.expanded) return 'expanded';
  if (width >= breakpoints.medium) return 'medium';
  return 'compact';
}
