import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

// Full-screen placeholder shown while a screen's data loads, or when loading failed (with a retry button).
export function LoadState({ error, onRetry, label = 'Loading…', title = "Couldn't load this screen" }: { error?: string | null; onRetry?: () => void; label?: string; title?: string }) {
  return (
    <View style={styles.root}>
      {error ? (
        <>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{error}</Text>
          {onRetry && (
            <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.btnText}>Try again</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.msg}>{label}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  msg: { fontFamily: fontFamily.regular, fontSize: 14, color: '#5E6B79', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  btn: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  btnText: { fontFamily: fontFamily.semibold, fontSize: 14, color: '#fff' },
});
