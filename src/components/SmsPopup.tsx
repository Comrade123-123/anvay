import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { fontFamily, useResponsive } from '../theme';

// A phone-notification style card that shows the OTP while the app is in demo mode (no real SMS is sent yet).
// Tapping it fills the code in; it also hides itself after a few seconds.
type Props = { otp: string | null; onUse: (otp: string) => void; onClose: () => void; showForMs?: number };

export function SmsPopup({ otp, onUse, onClose, showForMs = 12000 }: Props) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!otp) return;
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
    const id = setTimeout(onClose, showForMs);
    return () => clearTimeout(id);
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!otp) return null;
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: Math.max(insets.top, 8) + 6, transform: [{ translateY }], opacity: slide }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`New message: ${otp} is your ANVAY login OTP. Tap to fill it in`}
        onPress={() => onUse(otp)}
        style={[styles.card, { maxWidth: Math.min(r.contentWidth, 420) }]}
      >
        <View style={styles.icon}>
          <Icon name="message-text" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.head}>
            <Text style={styles.app}>MESSAGES</Text>
            <Text style={styles.time}>now</Text>
          </View>
          <Text style={styles.sender}>VM-ANVAYO</Text>
          <Text style={styles.body}>
            <Text style={styles.code}>{otp}</Text> is your ANVAY login OTP. Valid for 5 minutes. Do not share it with anyone.
          </Text>
          <Text style={styles.demo}>Demo message. Tap to fill in the code</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10} onPress={onClose} style={styles.close}>
          <Icon name="close" size={16} color="#6B7280" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50, paddingHorizontal: 12 },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E4EB',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(10,20,50,0.22)' } as object,
      default: { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
    }),
  },
  icon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  app: { fontFamily: fontFamily.semibold, fontSize: 10, letterSpacing: 0.6, color: '#6B7280' },
  time: { fontFamily: fontFamily.regular, fontSize: 11, color: '#6B7280' },
  sender: { fontFamily: fontFamily.bold, fontSize: 13, color: '#1F2836', marginTop: 1 },
  body: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18, color: '#1F2836', marginTop: 1 },
  code: { fontFamily: fontFamily.bold, letterSpacing: 1 },
  demo: { fontFamily: fontFamily.regular, fontSize: 10, color: '#8A94A6', marginTop: 4 },
  close: { padding: 2 },
});
