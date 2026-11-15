import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useAppTheme, type AppTheme } from './theme';

type NamedStyles<T> = StyleSheet.NamedStyles<T>;

export function makeStyles<T extends NamedStyles<T>>(
  factory: (theme: AppTheme) => T,
) {
  return function useStyles() {
    const theme = useAppTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
