export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 999,
} as const;

export const sizes = {
  touchTarget: 48,
  iconSm: 18,
  iconMd: 24,
  iconLg: 32,
  avatarSm: 40,
  avatarMd: 48,
  avatarLg: 72,
  contentMaxWidth: 640,
  drawerWidth: 304,
  borderHairline: 1,
} as const;

/** Material 3 window size classes (dp). */
export const breakpoints = {
  medium: 600,
  expanded: 840,
} as const;

export const layout = {
  screenPadding: spacing.lg,
  sectionGap: spacing.xxl,
  fabClearance: 96,
} as const;
