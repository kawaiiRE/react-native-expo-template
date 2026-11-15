import { useState, type PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { EASE_OUT_CSS, durations, pressScale } from '@/theme/motion';

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, 'style' | 'children'> & {
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
  }
>;

/**
 * Press feedback for custom tappable surfaces: a 3% scale on press-in over
 * 120ms (opacity only under reduced motion). Commit still happens on release.
 */
export default function PressableScale({
  children,
  contentStyle,
  hitSlop = 8,
  onPressIn,
  onPressOut,
  pressRetentionOffset = 16,
  style,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      pressRetentionOffset={pressRetentionOffset}
      style={style}
      {...rest}
    >
      <Animated.View
        style={[
          styles.content,
          contentStyle,
          pressed && (reducedMotion ? styles.pressedReduced : styles.pressed),
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    opacity: 1,
    transform: [{ scale: 1 }],
    transitionDuration: durations.press,
    transitionProperty: ['transform', 'opacity'],
    transitionTimingFunction: EASE_OUT_CSS,
  },
  pressed: {
    transform: [{ scale: pressScale }],
  },
  pressedReduced: {
    opacity: 0.86,
  },
});
