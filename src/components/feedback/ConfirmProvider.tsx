import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { useAppTheme } from '@/theme/theme';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Hide the cancel button for purely informational dialogs. */
  hideCancel?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    resolver.current?.(false);
    setOptions(next);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setVisible(false);
  }, []);

  const api = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Portal>
        <Dialog dismissable onDismiss={() => settle(false)} visible={visible}>
          {options ? (
            <>
              <Dialog.Title accessibilityRole="header">
                {options.title}
              </Dialog.Title>
              {options.message ? (
                <Dialog.Content>
                  <Text variant="bodyMedium">{options.message}</Text>
                </Dialog.Content>
              ) : null}
              <Dialog.Actions>
                {options.hideCancel ? null : (
                  <Button onPress={() => settle(false)}>
                    {options.cancelLabel ?? t('common.cancel')}
                  </Button>
                )}
                <Button
                  onPress={() => settle(true)}
                  textColor={
                    options.destructive ? theme.colors.error : undefined
                  }
                >
                  {options.confirmLabel ?? t('common.ok')}
                </Button>
              </Dialog.Actions>
            </>
          ) : null}
        </Dialog>
      </Portal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error('useConfirm must be used inside ConfirmProvider.');
  }

  return confirm;
}
