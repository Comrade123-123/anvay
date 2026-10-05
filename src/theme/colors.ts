// Values sampled from the ANVAY design PDF (ANVAY_ka_kaam.pdf).
export const colors = {
  primary: '#1A3A6B',
  primaryDark: '#13284B',
  accent: '#E8772D',
  accentSoft: '#F2C14D',

  saffron: '#FF9933',
  indiaGreen: '#138708',

  success: '#1D8E3D',
  successBg: '#E6F4E9',
  danger: '#C62828',
  warning: '#896000',

  textPrimary: '#1F2836',
  textSecondary: '#5E6B79',
  textMuted: '#9CA3AF',
  textOnDark: '#FFFFFF',

  background: '#F2F4F9',
  surface: '#FFFFFF',
  surfaceTint: '#E8EDF6',
  border: '#E1E4EB',
  borderStrong: '#CAD4E1',
} as const;

export type ColorName = keyof typeof colors;
