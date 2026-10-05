import { TextStyle } from 'react-native';

// Noto Sans covers both Latin and Devanagari (Hindi) in the design.
export const fontFamily = {
  regular: 'NotoSans_400Regular',
  medium: 'NotoSans_500Medium',
  semibold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
  hindiRegular: 'NotoSansDevanagari_400Regular',
  hindiMedium: 'NotoSansDevanagari_500Medium',
  hindiSemibold: 'NotoSansDevanagari_600SemiBold',
  hindiBold: 'NotoSansDevanagari_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.regular, fontSize: 41, lineHeight: 50 },
  title: { fontFamily: fontFamily.semibold, fontSize: 26, lineHeight: 34 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 28 },
  subheading: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  bodyStrong: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 17 },
  label: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 15, letterSpacing: 0.6 },
  button: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
