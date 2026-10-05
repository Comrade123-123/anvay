import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { OnboardingIllustration } from '../components/OnboardingIllustration';

// Screen 3 of ANVAY_ka_kaam.pdf (welcome / pre-login). Designed on a 390pt-wide frame;
// sizes scale with the window (see theme/responsive) and the content column is capped on wide screens.
const NAVY = colors.primary;
const ORANGE = colors.accent;

type Props = { onGetStarted?: () => void; onLogin?: () => void };

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const features = [
  { icon: 'school', en: '5 schemes, one app', hi: '5 योजनाएं, एक ऐप' },
  { icon: 'shield-check', en: 'Auto-verified documents', hi: 'स्वतः सत्यापित दस्तावेज़' },
  { icon: 'wifi-off', en: 'Works offline', hi: 'बिना इंटरनेट भी' },
] as const;

export function WelcomeScreen({ onGetStarted, onLogin }: Props) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: '#FFFFFF' }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tricolor}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>
        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="star" size={r.s(18)} color="#F8F9FB" />
            <View style={styles.logoDot} />
          </View>
          <View style={styles.brandCol}>
            <Text style={styles.brand}>ANVAY</Text>
            <Text style={styles.brandSub} numberOfLines={2}>
              Ministry of Tribal Affairs, Government of India
            </Text>
          </View>
          <View style={styles.toggle}>
            <Pressable onPress={() => setLang('en')} style={[styles.toggleItem, lang === 'en' && styles.toggleActive]}>
              <Text style={[styles.toggleText, lang === 'en' && { color: '#FFFFFF' }]}>EN</Text>
            </Pressable>
            <Pressable onPress={() => setLang('hi')} style={[styles.toggleItem, lang === 'hi' && styles.toggleActive]}>
              <Hi style={[styles.toggleText, lang === 'hi' && { color: '#FFFFFF' }]}>हि</Hi>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          {/* Illustration keeps its proportions at any width */}
          <View style={styles.hero}>
            <OnboardingIllustration />
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>Your scholarship, simplified</Text>
            <Hi style={styles.titleHi}>आपकी छात्रवृत्ति, अब आसान</Hi>
            <Text style={styles.copy}>
              Apply, track and receive all 5 MoTA scholarships in one place — with documents fetched directly from
              DigiLocker.
            </Text>

            <View style={styles.features}>
              {features.map((f) => (
                <View key={f.en} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons name={f.icon} size={r.s(20)} color={NAVY} />
                  </View>
                  <Text style={styles.featureText}>
                    {f.en} <Text style={styles.featureHi}>/ <Hi>{f.hi}</Hi></Text>
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.dots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <Pressable accessibilityRole="button" onPress={onGetStarted} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.primaryText}>
                Get Started / <Hi style={styles.primaryText}>शुरू करें</Hi>
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={r.s(18)} color="#FFFFFF" />
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onLogin} style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.outlineText}>
                I already have an account / <Hi style={styles.outlineText}>लॉग इन करें</Hi>
              </Text>
            </Pressable>

            <View style={styles.secure}>
              <MaterialCommunityIcons name="lock" size={r.s(13)} color={colors.textSecondary} />
              <Text style={styles.secureText}>Secured by Aadhaar</Text>
              <Text style={styles.secureText}>·</Text>
              <MaterialCommunityIcons name="check-decagram" size={r.s(14)} color={colors.textSecondary} />
              <Text style={styles.secureText}>DigiLocker enabled</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: colors.border },
    tricolor: { height: 2 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      maxWidth: r.maxContentWidth,
      alignSelf: 'center',
      paddingLeft: s(17),
      paddingRight: s(16),
      minHeight: s(59),
      paddingVertical: 6,
    },
    logo: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    logoDot: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: NAVY },
    brandCol: { flex: 1, marginLeft: s(10), marginRight: 3 },
    brand: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(22), color: NAVY },
    brandSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(14), color: colors.textSecondary },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      width: s(68),
      height: s(29),
      borderRadius: s(15),
      padding: 3,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleItem: { flex: 1, height: s(21), borderRadius: s(11), alignItems: 'center', justifyContent: 'center' },
    toggleActive: { backgroundColor: NAVY },
    toggleText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: colors.textSecondary },

    scroll: { flexGrow: 1, paddingTop: s(12), paddingBottom: s(12) },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center' },
    hero: {
      marginHorizontal: s(17),
      aspectRatio: 356 / 250,
      borderRadius: s(20),
      overflow: 'hidden',
      backgroundColor: colors.surfaceTint,
      borderWidth: 1,
      borderColor: colors.border,
    },
    body: { paddingHorizontal: s(25) },
    title: { fontFamily: fontFamily.semibold, fontSize: fs(22), lineHeight: fs(29), color: colors.textPrimary, marginTop: s(10) },
    titleHi: { fontFamily: fontFamily.hindiSemibold, fontSize: fs(16), lineHeight: fs(21), color: NAVY, marginTop: 2 },
    copy: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(21), color: colors.textSecondary, marginTop: s(10) },

    features: { marginTop: s(10) },
    featureRow: { flexDirection: 'row', alignItems: 'center', minHeight: s(36), marginTop: s(8) },
    featureIcon: { width: s(36), height: s(36), borderRadius: s(10), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    featureText: { flex: 1, marginLeft: s(12), fontFamily: fontFamily.medium, fontSize: fs(13), lineHeight: fs(18), color: colors.textPrimary },
    featureHi: { fontFamily: fontFamily.regular, fontSize: fs(11), color: colors.textSecondary },

    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: s(12), height: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderStrong },
    dotActive: { width: 24, backgroundColor: NAVY },

    primaryBtn: {
      marginTop: s(12),
      minHeight: s(49),
      borderRadius: s(14),
      backgroundColor: ORANGE,
      paddingHorizontal: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
    },
    primaryText: { fontFamily: fontFamily.semibold, fontSize: fs(15), color: '#FFFFFF' },
    outlineBtn: {
      marginTop: s(10),
      minHeight: s(50),
      borderRadius: s(14),
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: NAVY,
      paddingHorizontal: s(12),
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineText: { fontFamily: fontFamily.semibold, fontSize: fs(14), color: NAVY, textAlign: 'center' },

    secure: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 5, rowGap: 2, marginTop: s(10) },
    secureText: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(14), color: colors.textSecondary },
  });
};
