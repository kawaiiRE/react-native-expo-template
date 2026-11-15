import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';

import Screen from '@/components/ui/Screen';
import { usePreferences } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { EASE_OUT, EASE_OUT_CSS, durations } from '@/theme/motion';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

import GuestSessionButton from './GuestSessionButton';

const SLIDES = [
  { key: 'capture', icon: 'lightning-bolt-outline' },
  { key: 'organize', icon: 'archive-arrow-down-outline' },
  { key: 'secure', icon: 'shield-lock-outline' },
] as const;

const SLIDE_ENTER = FadeIn.duration(durations.enter).easing(EASE_OUT);

/** First-run onboarding. Skippable; completion is persisted in preferences. */
export default function WelcomeScreen() {
  const preferences = usePreferences();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function next() {
    if (isLast) preferences.completeOnboarding();
    else setIndex(index + 1);
  }

  return (
    <Screen
      footer={
        <>
          <View style={styles.actions}>
            <Button
              contentStyle={styles.buttonContent}
              onPress={preferences.completeOnboarding}
            >
              {t('welcome.skip')}
            </Button>
            <Button
              contentStyle={styles.buttonContent}
              mode="contained"
              onPress={next}
            >
              {isLast ? t('welcome.getStarted') : t('welcome.next')}
            </Button>
          </View>
          <GuestSessionButton onStarted={preferences.completeOnboarding} />
        </>
      }
      safeBottom
      safeTop
      scroll
      centered
    >
      <Animated.View
        entering={SLIDE_ENTER}
        key={slide.key}
        style={styles.slide}
      >
        <View style={styles.illustration}>
          <Icon
            color={theme.colors.onPrimaryContainer}
            size={56}
            source={slide.icon}
          />
        </View>
        <Text
          accessibilityRole="header"
          style={styles.title}
          variant="headlineMedium"
        >
          {t(`welcome.slides.${slide.key}.title`)}
        </Text>
        <Text style={styles.body} variant="bodyLarge">
          {t(`welcome.slides.${slide.key}.body`)}
        </Text>
      </Animated.View>

      <View
        accessibilityLabel={t('welcome.progress', {
          current: index + 1,
          total: SLIDES.length,
        })}
        accessibilityRole="progressbar"
        style={styles.dots}
      >
        {SLIDES.map((item, dotIndex) => (
          <Animated.View
            key={item.key}
            style={[styles.dot, dotIndex === index && styles.dotActive]}
          />
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((theme) => ({
  slide: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.huge,
  },
  illustration: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: radii.xl * 2,
    height: 128,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 128,
  },
  title: {
    color: theme.colors.onBackground,
    fontFamily: theme.fontFamilies.semiBold,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.onSurfaceVariant,
    maxWidth: 420,
    textAlign: 'center',
  },
  dots: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    backgroundColor: theme.colors.primary,
    borderRadius: radii.full,
    height: 8,
    opacity: 0.3,
    transform: [{ scale: 0.8 }],
    transitionDuration: durations.small,
    transitionProperty: ['opacity', 'transform'],
    transitionTimingFunction: EASE_OUT_CSS,
    width: 8,
  },
  dotActive: {
    opacity: 1,
    transform: [{ scale: 1.25 }],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  buttonContent: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
}));
