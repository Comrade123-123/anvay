import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, ColorName, typography, TypographyVariant } from '../theme';

type Props = TextProps & { variant?: TypographyVariant; color?: ColorName };

export function AppText({ variant = 'body', color = 'textPrimary', style, ...rest }: Props) {
  return <Text style={[typography[variant], { color: colors[color] }, style]} {...rest} />;
}
