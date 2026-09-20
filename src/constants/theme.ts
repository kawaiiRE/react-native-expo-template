import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'DMSans_400Regular',
};

export const appPalette = {
  ink: '#152033',
  inkMuted: '#627084',
  paper: '#FBFCF8',
  porcelain: '#F1F5EF',
  surface: '#FFFFFF',
  line: '#DCE4EE',
  lineStrong: '#C5D0DE',
  cobalt: '#2457D6',
  cobaltStrong: '#173A94',
  cobaltSoft: '#EAF0FF',
  emerald: '#158264',
  emeraldSoft: '#E5F6EE',
  coral: '#D94D5F',
  coralSoft: '#FFF0F2',
  saffron: '#C88918',
  saffronSoft: '#FFF8E6',
  violet: '#7257D8',
  violetSoft: '#F0ECFF',
  cyan: '#1488A6',
  shadow: '#172235',
} as const;

export const appFonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  extraBold: 'DMSans_800ExtraBold',
} as const;

export const chartColors = [
  appPalette.cobalt,
  appPalette.emerald,
  appPalette.saffron,
  appPalette.coral,
  appPalette.violet,
  appPalette.cyan,
] as const;

export const appLightTheme = {
  ...MD3LightTheme,
  roundness: 8,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: appPalette.cobalt,
    onPrimary: appPalette.surface,
    primaryContainer: appPalette.cobaltSoft,
    onPrimaryContainer: appPalette.cobaltStrong,
    secondary: appPalette.emerald,
    onSecondary: appPalette.surface,
    secondaryContainer: appPalette.emeraldSoft,
    onSecondaryContainer: '#0D4E3C',
    tertiary: appPalette.saffron,
    tertiaryContainer: appPalette.saffronSoft,
    background: appPalette.paper,
    surface: appPalette.surface,
    surfaceVariant: appPalette.porcelain,
    outline: appPalette.line,
    outlineVariant: appPalette.lineStrong,
    error: appPalette.coral,
    errorContainer: appPalette.coralSoft,
    onSurface: appPalette.ink,
    onSurfaceVariant: appPalette.inkMuted,
    shadow: appPalette.shadow,
  },
};

export const appTheme = appLightTheme;
