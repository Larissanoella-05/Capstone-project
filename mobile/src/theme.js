// Design tokens from the Umuriro design artifact, copied from frontend/src/index.css so the app and the web look like one product.

export const colors = {
  ink: '#0b0b0c',
  muted: '#6b6b76',
  line: '#e2e2ea',
  ash: '#8a8a94',
  steel: '#6b6b76',
  paper: '#f3f3f9',
  accent: '#e30613',
  onAccent: '#ffffff',
  tint: '#fdecee',
  danger: '#d62828',
  ok: '#17623a',
  warn: '#6b4a00',
  blue: '#10345f',
  white: '#ffffff',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heading: 'PlusJakartaSans_700Bold',
  black: 'PlusJakartaSans_800ExtraBold',
  // The design has no monospace: these render Inter, as the web's font-mono classes do
  mono: 'Inter_400Regular',
  monoMedium: 'Inter_500Medium',
};

/** 4 px on cards, buttons, chips, inputs and tags. */
export const radius = 4;

/** Soft card shadow: 0 8px 28px rgba(20,20,40,.06) on the web. */
export const shadow = {
  shadowColor: '#141428',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 2,
};

export const border = 1;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
