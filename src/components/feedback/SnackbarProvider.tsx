import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Portal, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/services/platform/haptics';
import { spacing } from '@/theme/tokens';

export type SnackbarTone = 'neutral' | 'success' | 'error';

export type SnackbarOptions = {
  message: string;
  tone?: SnackbarTone;
  actionLabel?: string;
  onAction?: () => void;
  /** Fire the matching notification haptic with the message. */
  haptic?: boolean;
};

type SnackbarApi = {
  show: (options: SnackbarOptions) => void;
};

type QueuedSnackbar = SnackbarOptions & { id: number };

const SnackbarContext = createContext<SnackbarApi | null>(null);

const DURATION_MS = 4000;

export function SnackbarProvider({ children }: PropsWithChildren) {
  const [current, setCurrent] = useState<QueuedSnackbar | null>(null);
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const show = useCallback((options: SnackbarOptions) => {
    if (options.haptic) {
      if (options.tone === 'error') haptics.error();
      else if (options.tone === 'success') haptics.success();
    }
    setCurrent({ ...options, id: Date.now() });
    setVisible(true);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <SnackbarContext.Provider value={api}>
      {children}
      <Portal>
        <Snackbar
          action={
            current?.actionLabel && current.onAction
              ? { label: current.actionLabel, onPress: current.onAction }
              : undefined
          }
          duration={DURATION_MS}
          onDismiss={() => setVisible(false)}
          visible={visible}
          wrapperStyle={{ paddingBottom: insets.bottom + spacing.sm }}
        >
          {current?.message ?? ''}
        </Snackbar>
      </Portal>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const api = useContext(SnackbarContext);

  if (!api) {
    throw new Error('useSnackbar must be used inside SnackbarProvider.');
  }

  return api;
}
