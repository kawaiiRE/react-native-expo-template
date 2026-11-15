import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OfflineBanner from '@/components/ui/OfflineBanner';
import { makeStyles } from '@/theme/makeStyles';
import { layout, sizes, spacing } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  /** Renders children directly (for virtualized lists that own scrolling). */
  scroll?: boolean;
  /** Wrap in a KeyboardAvoidingView for screens with inputs. */
  keyboard?: boolean;
  /** Pad for the status bar when the navigator renders no header. */
  safeTop?: boolean;
  /** Pad for the home indicator when no tab bar sits below the screen. */
  safeBottom?: boolean;
  centered?: boolean;
  /** Vertical gap between direct children. */
  gap?: number;
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export default function Screen({
  centered = false,
  children,
  contentContainerStyle,
  footer,
  gap = layout.sectionGap,
  keyboard = false,
  refreshControl,
  safeBottom = false,
  safeTop = false,
  scroll = true,
}: ScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const edgePadding = {
    paddingTop: safeTop ? insets.top : 0,
  };
  const bottomPadding = safeBottom ? insets.bottom : 0;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        centered && styles.centered,
        { paddingBottom: layout.screenPadding + bottomPadding },
        contentContainerStyle,
      ]}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      <View style={[styles.column, { gap }]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentContainerStyle]}>{children}</View>
  );

  const content = (
    <>
      <OfflineBanner />
      {body}
      {footer ? (
        <View
          style={[styles.footer, { paddingBottom: spacing.md + bottomPadding }]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, edgePadding]}>
      {keyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'web' ? undefined : 'padding'}
          style={styles.fill}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.screenPadding,
  },
  centered: {
    justifyContent: 'center',
  },
  column: {
    alignSelf: 'center',
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
  footer: {
    alignSelf: 'center',
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: sizes.borderHairline,
    gap: spacing.sm,
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    width: '100%',
  },
}));
