import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamily, useResponsive } from '../theme';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
};

export type OtpInputHandle = { focus: () => void };

// One hidden TextInput receives the keystrokes (so paste and SMS autofill work);
// the boxes are drawn from its value and share the row width equally.
export const OtpInput = forwardRef<OtpInputHandle, Props>(function OtpInput({ value, onChange, length = 6 }, ref) {
  const { s, fs } = useResponsive();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  const active = focused ? Math.min(value.length, length - 1) : -1;

  return (
    <View>
      <Pressable
        accessibilityLabel={`Enter ${length} digit OTP`}
        onPress={() => input.current?.focus()}
        style={{ flexDirection: 'row', gap: s(8) }}
      >
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const isActive = i === active;
          return (
            <View key={i} style={[styles.ring, { borderRadius: s(12) }, isActive && styles.ringActive]}>
              <View
                style={[
                  styles.box,
                  { height: s(48), borderRadius: s(10) },
                  digit ? styles.boxFilled : isActive ? styles.boxActive : styles.boxEmpty,
                ]}
              >
                {digit ? (
                  <Text style={[styles.digit, { fontSize: fs(19) }]}>{digit}</Text>
                ) : isActive ? (
                  <Animated.View style={[styles.cursor, { height: s(20), opacity: blink }]} />
                ) : null}
              </View>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={input}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        style={styles.hidden}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  ring: { flex: 1, padding: 2, margin: -2, borderWidth: 2, borderColor: 'transparent' },
  ringActive: { borderColor: 'rgba(26,58,107,0.25)' },
  box: { borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: colors.primary },
  boxActive: { borderColor: colors.primary, borderWidth: 2 },
  boxEmpty: { borderColor: colors.border },
  digit: { fontFamily: fontFamily.semibold, color: colors.textPrimary },
  cursor: { width: 2, backgroundColor: colors.primary },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
