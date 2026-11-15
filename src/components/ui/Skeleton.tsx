import type { DimensionValue } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { makeStyles } from '@/theme/makeStyles';
import { radii } from '@/theme/tokens';

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
};

const pulse = {
  from: { opacity: 1 },
  to: { opacity: 0.45 },
};

/** Placeholder block with a gentle opacity pulse (static under reduced motion). */
export default function Skeleton({
  height,
  radius = radii.sm,
  width = '100%',
}: SkeletonProps) {
  const styles = useStyles();
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      style={[
        styles.block,
        { borderRadius: radius, height, width },
        reducedMotion
          ? null
          : {
              animationDirection: 'alternate',
              animationDuration: 900,
              animationIterationCount: 'infinite',
              animationName: pulse,
              animationTimingFunction: 'ease-in-out',
            },
      ]}
    />
  );
}

const useStyles = makeStyles((theme) => ({
  block: {
    backgroundColor: theme.colors.surfaceVariant,
  },
}));
