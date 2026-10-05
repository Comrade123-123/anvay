import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout } from '../theme';

type Props = {
  children?: React.ReactNode;
  scroll?: boolean;
  background?: string;
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, scroll, background = colors.background, padded = true, style }: Props) {
  const pad = padded ? { paddingHorizontal: layout.screenPadding } : null;
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, style]}>{children}</ScrollView>
      ) : (
        <View style={[styles.root, pad, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
