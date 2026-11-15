import {
  Platform,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { isRtlLayout } from '@/services/platform/layoutDirection';
import { useAppTheme } from '@/theme/theme';

export type SegmentedOption<T extends string> = {
  value: T;
  label?: string;
  icon?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  density?: 'regular' | 'small' | 'medium' | 'high';
  style?: StyleProp<ViewStyle>;
};

/**
 * Typed single-choice wrapper around Paper's `SegmentedButtons`. Paper rounds
 * the outer corners with physical left/right radii: native RTL swaps them,
 * the web does not, so the web build mirrors the order inside an LTR box.
 */
export default function SegmentedControl<T extends string>({
  density,
  onValueChange,
  options,
  style,
  value,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();
  const mirrorOnWeb = Platform.OS === 'web' && isRtlLayout(theme.language);

  const control = (
    <SegmentedButtons
      buttons={mirrorOnWeb ? [...options].reverse() : [...options]}
      density={density}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);
        if (option && option.value !== value) onValueChange(option.value);
      }}
      style={style}
      value={value}
    />
  );

  return mirrorOnWeb ? <View dir="ltr">{control}</View> : control;
}
