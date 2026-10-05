import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, layout, radii, spacing } from '../theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
  right?: React.ReactNode;
};

// primary = orange filled CTA, outline = navy border on white (per design).
export function Button({ label, onPress, variant = 'primary', style, right }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.outline,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <AppText variant="button" color={primary ? 'textOnDark' : 'primary'}>
        {label}
      </AppText>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchTarget + 10,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.accent },
  outline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
});
