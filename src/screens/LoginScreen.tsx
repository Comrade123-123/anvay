import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { api, ApiError } from '../api/client';
import { useAuth } from '../state/AuthContext';
import type { OtpKind, SignInResult } from '../api/types';
import { OtpInput, OtpInputHandle } from '../components/OtpInput';

// Screen 4 of ANVAY_ka_kaam.pdf (login). Layout is fluid (see theme/responsive) and the form
// behaves like a real one on the client only: no network, the OTP is never actually checked.
const NAVY = colors.primary;
const HEADER_NAVY = colors.primaryDark;
const ORANGE = colors.accent;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type Props = { onBack?: () => void; onVerified?: () => void };
type Tab = 'mobile' | 'aadhaar';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const group = (digits: string, sizes: number[]) => {
  const parts: string[] = [];
  let i = 0;
  for (const n of sizes) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + n));
    i += n;
  }
  return parts.join(' ');
};
const onlyDigits = (t: string) => t.replace(/\D/g, '');
const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export function LoginScreen({ onBack, onVerified }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps

  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [tab, setTab] = useState<Tab>('mobile');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [fieldFocused, setFieldFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState('');
  const [otpError, setOtpError] = useState('');
  const { signIn } = useAuth();

  const otpRef = useRef<OtpInputHandle>(null);
  const scrollRef = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobile = tab === 'mobile';
  const digits = isMobile ? mobile : aadhaar;
  const valid = isMobile ? /^[6-9]\d{9}$/.test(mobile) : aadhaar.length === 12;
  const showError = touched && !fieldFocused && digits.length > 0 && !valid;
  const canSend = valid && agreed && !otpSent;

  // Resend countdown
  useEffect(() => {
    if (!otpSent || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [otpSent, seconds]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const masked = isMobile
    ? `+91 ${mobile.slice(0, 2)}XXX X${mobile.slice(6)}`
    : `XXXX XXXX ${aadhaar.slice(8)}`;

  const identifier = (): { kind: OtpKind; value: string } => ({ kind: isMobile ? 'mobile' : 'aadhaar', value: isMobile ? mobile : aadhaar });

  const requestOtp = async (): Promise<boolean> => {
    setSending(true);
    setOtpError('');
    try {
      const res = await api.post<{ hint?: string }>('/auth/send-otp', identifier());
      setHint(res.hint ?? '');
      return true;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not send the OTP. Please try again.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendOtp = async () => {
    if (!canSend || sending) return;
    if (!(await requestOtp())) return;
    setOtpSent(true);
    setCode('');
    setSeconds(RESEND_SECONDS);
    setVerified(false);
    setTimeout(() => {
      otpRef.current?.focus();
      scrollRef.current?.scrollTo({ y: r.s(200), animated: true });
    }, 100);
  };
  const resend = async () => {
    if (seconds > 0 || sending) return;
    if (!(await requestOtp())) return;
    setCode('');
    setSeconds(RESEND_SECONDS);
    otpRef.current?.focus();
  };
  const changeNumber = () => {
    setOtpSent(false);
    setCode('');
    setVerified(false);
    setVerifying(false);
    setSeconds(0);
    setOtpError('');
    setHint('');
  };
  const verify = async () => {
    if (code.length !== OTP_LENGTH || verifying || verified) return;
    setVerifying(true);
    setOtpError('');
    try {
      const result = await api.post<SignInResult>('/auth/verify-otp', { ...identifier(), code });
      await signIn(result);
      setVerifying(false);
      setVerified(true);
      onVerified?.();
    } catch (e) {
      setVerifying(false);
      setCode('');
      setOtpError(e instanceof ApiError ? e.message : 'Could not verify the OTP. Please try again.');
      otpRef.current?.focus();
    }
  };

  const onChangeField = (t: string) => {
    const d = onlyDigits(t);
    if (isMobile) setMobile(d.slice(0, 10));
    else setAadhaar(d.slice(0, 12));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Navy header (full-bleed, content centred) */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 40) + 3 }]}>
            <View style={styles.tricolor}>
              <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
              <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
              <View style={{ flex: 1, backgroundColor: '#138708' }} />
            </View>

            <View style={styles.headerInner}>
              <View style={styles.topRow}>
                <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
                  <Icon name="arrow-left" size={r.s(20)} color="#FFFFFF" />
                </Pressable>
                <View style={styles.toggle}>
                  <Pressable onPress={() => setLang('en')} style={[styles.toggleItem, lang === 'en' && styles.toggleActive]}>
                    <Text style={[styles.toggleText, lang === 'en' && { color: HEADER_NAVY }]}>EN</Text>
                  </Pressable>
                  <Pressable onPress={() => setLang('hi')} style={[styles.toggleItem, lang === 'hi' && styles.toggleActive]}>
                    <Hi style={[styles.toggleText, lang === 'hi' && { color: HEADER_NAVY }]}>हि</Hi>
                  </Pressable>
                </View>
              </View>

              <View style={styles.logo}>
                <Icon name="leaf" size={r.s(22)} color={NAVY} />
              </View>
              <Text style={styles.brand}>ANVAY</Text>
              <Text style={styles.brandSub}>Ministry of Tribal Affairs, Government of India</Text>
              <Hi style={styles.brandHi}>जनजातीय कार्य मंत्रालय, भारत सरकार</Hi>
            </View>
          </View>

          <View style={styles.body}>
            {/* Login card */}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>
                  Login / <Hi style={styles.cardTitleHi}>लॉग इन</Hi>
                </Text>
                <Text style={styles.cardSub}>
                  {isMobile ? 'Use your Aadhaar-linked mobile number' : 'Enter your 12-digit Aadhaar number'}
                </Text>

                <View style={styles.tabs} accessibilityRole="tablist">
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isMobile }}
                    onPress={() => { setTab('mobile'); changeNumber(); }}
                    style={[styles.tab, isMobile && styles.tabActive]}
                  >
                    <Icon name="cellphone" size={r.s(16)} color={isMobile ? '#FFFFFF' : colors.textSecondary} />
                    <Text numberOfLines={1} style={[styles.tabText, isMobile && { color: '#FFFFFF' }]}>Mobile Number</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: !isMobile }}
                    onPress={() => { setTab('aadhaar'); changeNumber(); }}
                    style={[styles.tab, !isMobile && styles.tabActive]}
                  >
                    <Icon name="card-account-details-outline" size={r.s(17)} color={!isMobile ? '#FFFFFF' : colors.textSecondary} />
                    <Text numberOfLines={1} style={[styles.tabText, !isMobile && { color: '#FFFFFF' }]}>Aadhaar Number</Text>
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.field,
                    fieldFocused && styles.fieldFocused,
                    showError && styles.fieldError,
                    otpSent && styles.fieldLocked,
                  ]}
                >
                  {isMobile ? (
                    <View style={styles.country}>
                      <Text style={styles.flag}>🇮🇳</Text>
                      <Text style={styles.countryCode}>+91</Text>
                    </View>
                  ) : (
                    <View style={[styles.country, { width: r.s(52) }]}>
                      <Icon name="card-account-details-outline" size={r.s(20)} color={colors.textSecondary} />
                    </View>
                  )}
                  <TextInput
                    value={isMobile ? group(mobile, [5, 5]) : group(aadhaar, [4, 4, 4])}
                    onChangeText={onChangeField}
                    onFocus={() => setFieldFocused(true)}
                    onBlur={() => { setFieldFocused(false); setTouched(true); }}
                    editable={!otpSent}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={isMobile ? 11 : 14}
                    placeholder={isMobile ? '00000 00000' : '0000 0000 0000'}
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={isMobile ? 'Mobile number' : 'Aadhaar number'}
                    autoComplete={isMobile ? 'tel' : 'off'}
                    returnKeyType="done"
                    onSubmitEditing={sendOtp}
                    style={styles.input}
                  />
                  <View style={styles.valid}>
                    {valid && <Icon name="check-circle" size={r.s(18)} color={colors.indiaGreen} />}
                  </View>
                </View>
                {showError && (
                  <Text style={styles.errorText}>
                    {isMobile ? 'Enter a valid 10-digit mobile number' : 'Enter a valid 12-digit Aadhaar number'}
                  </Text>
                )}

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                  style={styles.consent}
                  onPress={() => setAgreed(!agreed)}
                >
                  <View style={[styles.checkbox, !agreed && styles.checkboxOff]}>
                    {agreed && <Icon name="check" size={r.s(13)} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.consentText}>
                    I agree to share my details from DigiLocker for scholarship verification{' '}
                    <Text style={styles.terms}>Terms</Text>
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSend }}
                  disabled={!canSend}
                  onPress={sendOtp}
                  style={({ pressed }) => [styles.sendBtn, !canSend && styles.btnDisabled, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.sendText}>
                    {otpSent ? 'OTP Sent / ' : 'Send OTP / '}
                    <Hi style={styles.sendText}>{otpSent ? 'OTP भेजा गया' : 'OTP भेजें'}</Hi>
                  </Text>
                  <Icon name={otpSent ? 'check' : 'arrow-right'} size={r.s(16)} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* OTP section: appears once an OTP has been "sent" */}
              {otpSent && (
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>
                    Enter OTP sent to <Text style={styles.otpLabelStrong}>{masked}</Text>
                  </Text>
                  <View style={styles.otpRow}>
                    <OtpInput ref={otpRef} value={code} onChange={(v) => { setCode(v); if (otpError) setOtpError(''); }} length={OTP_LENGTH} />
                  </View>
                  {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}
                  {!otpError && !!hint && <Text style={styles.hintText}>{hint}</Text>}

                  <View style={styles.resendRow}>
                    {seconds > 0 ? (
                      <View style={styles.resendLeft}>
                        <Icon name="clock" size={r.s(13)} color={colors.textSecondary} />
                        <Text style={styles.resendText}>
                          Resend OTP in <Text style={styles.resendTime}>{mmss(seconds)}</Text>
                        </Text>
                      </View>
                    ) : (
                      <Pressable accessibilityRole="button" onPress={resend} hitSlop={8}>
                        <Text style={styles.changeNumber}>Resend OTP</Text>
                      </Pressable>
                    )}
                    <Pressable accessibilityRole="button" onPress={changeNumber} hitSlop={8}>
                      <Text style={styles.changeNumber}>Change number</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: code.length !== OTP_LENGTH }}
                    disabled={code.length !== OTP_LENGTH || verifying || verified}
                    onPress={verify}
                    style={({ pressed }) => [
                      styles.verifyBtn,
                      code.length !== OTP_LENGTH && styles.btnDisabled,
                      verified && { backgroundColor: colors.success },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Icon name="check-decagram" size={r.s(17)} color="#FFFFFF" />
                    <Text style={styles.verifyText}>
                      {verified ? 'Verified / ' : verifying ? 'Verifying… / ' : 'Verify & Continue / '}
                      <Hi style={styles.verifyText}>{verified ? 'सत्यापित' : 'सत्यापित करें'}</Hi>
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* OR divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <View style={styles.orBox}>
                <Text style={styles.orText}>
                  OR /{'\n'}
                  <Hi style={styles.orText}>या</Hi>
                </Text>
              </View>
            </View>

            {/* Alternative logins */}
            <Pressable accessibilityRole="button" onPress={() => toast('DigiLocker sign-in is not available in this demo')} style={styles.altCard}>
              <View style={styles.altIcon}>
                <Icon name="folder-account" size={r.s(22)} color={NAVY} />
              </View>
              <View style={styles.altBody}>
                <Text style={styles.altTitle}>Login with DigiLocker</Text>
                <Text style={styles.altSub}>
                  Fetch authenticated credentials instantly / <Hi style={styles.altSub}>डिजिलॉकर</Hi>
                </Text>
              </View>
              <Icon name="chevron-right" size={r.s(20)} color={colors.textSecondary} />
            </Pressable>

            <Pressable accessibilityRole="button" onPress={() => toast('Parent login is not available in this demo')} style={[styles.altCard, { marginTop: r.s(9) }]}>
              <View style={styles.altIcon}>
                <Icon name="human-male-female-child" size={r.s(24)} color={NAVY} />
              </View>
              <View style={styles.altBody}>
                <Text style={styles.altTitle}>
                  Parent Login / <Hi style={styles.altTitle}>अभिभावक लॉग इन</Hi>
                </Text>
                <Text style={styles.altSub}>
                  Manage your children's scholarships / <Hi style={styles.altSub}>परिवार प्रबंधन</Hi>
                </Text>
              </View>
              <Icon name="chevron-right" size={r.s(20)} color={colors.textSecondary} />
            </Pressable>

            {/* Trust strip: wraps on narrow phones */}
            <View style={styles.trust}>
              <View style={styles.trustItem}>
                <Icon name="shield-check" size={r.s(14)} color={colors.indiaGreen} />
                <Text style={styles.trustText}>Aadhaar e-KYC</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Icon name="bank" size={r.s(14)} color={NAVY} />
                <Text style={styles.trustText}>Direct DBT Bridge</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Icon name="sync" size={r.s(14)} color={ORANGE} />
                <Text style={styles.trustText}>NSP 3.0 Synced</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <Icon name="lock" size={r.s(13)} color={colors.indiaGreen} />
                <Text style={[styles.footerText, { flexShrink: 1 }]}>
                  Your data is protected under Government of India guidelines
                </Text>
              </View>
              <Text style={[styles.footerText, { textAlign: 'center', marginTop: 5 }]}>
                Need help? Call <Text style={styles.phone}>1800-180-1555</Text> (toll free) · National Informatics
                Centre (NIC)
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: s(24) },

    header: {
      backgroundColor: HEADER_NAVY,
      borderBottomLeftRadius: s(28),
      borderBottomRightRadius: s(28),
      paddingBottom: s(56),
    },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', alignItems: 'center' },
    topRow: {
      alignSelf: 'stretch',
      height: s(32),
      paddingHorizontal: pad,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    back: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      width: s(74),
      height: s(30),
      borderRadius: s(15),
      padding: 2,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    toggleItem: { flex: 1, height: s(24), borderRadius: s(12), alignItems: 'center', justifyContent: 'center' },
    toggleActive: { backgroundColor: '#FFFFFF' },
    toggleText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: '#FFFFFF' },
    logo: { width: s(44), height: s(44), borderRadius: s(22), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: s(10) },
    brand: { fontFamily: fontFamily.bold, fontSize: fs(22), lineHeight: fs(27), color: '#FFFFFF', marginTop: s(8) },
    brandSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(15), color: 'rgba(255,255,255,0.82)', marginTop: 3, textAlign: 'center', paddingHorizontal: pad },
    brandHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(14), color: 'rgba(255,255,255,0.62)', marginTop: 3, textAlign: 'center', paddingHorizontal: pad },

    body: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center' },

    card: {
      marginHorizontal: pad,
      marginTop: -s(32),
      backgroundColor: '#FFFFFF',
      borderRadius: s(20),
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardTop: { paddingHorizontal: s(20), paddingTop: s(20), paddingBottom: s(15) },
    cardTitle: { fontFamily: fontFamily.semibold, fontSize: fs(20), lineHeight: fs(26), color: colors.textPrimary },
    cardTitleHi: { fontFamily: fontFamily.hindiSemibold, fontSize: fs(18) },
    cardSub: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: colors.textSecondary, marginTop: 3 },

    tabs: {
      flexDirection: 'row',
      marginTop: s(18),
      minHeight: s(46),
      padding: 5,
      borderRadius: s(12),
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: { flex: 1, borderRadius: s(9), paddingVertical: s(8), paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6) },
    tabActive: { backgroundColor: NAVY },
    tabText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(13), color: colors.textSecondary },

    field: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: s(14),
      height: s(54),
      borderRadius: s(12),
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
    },
    fieldFocused: { borderColor: NAVY },
    fieldError: { borderColor: colors.danger },
    fieldLocked: { backgroundColor: colors.background },
    country: { width: s(84), backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), borderRightWidth: 1, borderRightColor: colors.border },
    flag: { fontSize: fs(14) },
    countryCode: { fontFamily: fontFamily.medium, fontSize: fs(14), color: colors.textPrimary },
    input: {
      flex: 1,
      paddingHorizontal: s(12),
      fontFamily: fontFamily.regular,
      fontSize: fs(14),
      color: colors.textPrimary,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    valid: { width: s(32), alignItems: 'center', justifyContent: 'center' },
    hintText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: colors.textSecondary, marginTop: 6 },
    errorText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: colors.danger, marginTop: 6 },

    consent: { flexDirection: 'row', marginTop: s(14), gap: s(7) },
    checkbox: { width: s(18), height: s(18), borderRadius: 4, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    checkboxOff: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.borderStrong },
    consentText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: colors.textSecondary },
    terms: { fontFamily: fontFamily.bold, color: NAVY, textDecorationLine: 'underline' },

    sendBtn: {
      marginTop: s(11),
      minHeight: s(52),
      borderRadius: s(14),
      backgroundColor: ORANGE,
      paddingHorizontal: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
    },
    btnDisabled: { opacity: 0.5 },
    sendText: { fontFamily: fontFamily.semibold, fontSize: fs(15), color: '#FFFFFF' },

    otpSection: {
      backgroundColor: '#F8F9FB',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: s(20),
      paddingTop: s(19),
      paddingBottom: s(20),
    },
    otpLabel: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: colors.textSecondary },
    otpLabelStrong: { fontFamily: fontFamily.medium, color: colors.textPrimary },
    otpRow: { marginTop: s(14) },

    resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: s(14) },
    resendLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    resendText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(15), color: colors.textSecondary },
    resendTime: { fontFamily: fontFamily.medium, color: colors.textPrimary },
    changeNumber: { fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(15), color: NAVY },

    verifyBtn: {
      marginTop: s(13),
      minHeight: s(50),
      borderRadius: s(14),
      backgroundColor: NAVY,
      paddingHorizontal: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
    },
    verifyText: { fontFamily: fontFamily.semibold, fontSize: fs(14), color: '#FFFFFF' },

    orRow: { flexDirection: 'row', alignItems: 'center', marginTop: s(16), height: s(36) },
    orLine: { flex: 1, height: 2, backgroundColor: colors.border, marginLeft: pad },
    orBox: { width: s(60), height: s(36), paddingLeft: s(12), justifyContent: 'center', backgroundColor: colors.background },
    orText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: colors.textSecondary },

    altCard: {
      marginHorizontal: pad,
      marginTop: s(15),
      minHeight: s(91),
      borderRadius: s(16),
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: s(15),
      paddingRight: s(14),
      paddingVertical: s(20),
      flexDirection: 'row',
      alignItems: 'center',
    },
    altIcon: { width: s(48), height: s(48), borderRadius: s(12), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    altBody: { flex: 1, marginLeft: s(12), marginRight: s(8) },
    altTitle: { fontFamily: fontFamily.semibold, fontSize: fs(14), lineHeight: fs(20), color: colors.textPrimary },
    altSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: colors.textSecondary, marginTop: 2 },

    trust: {
      marginHorizontal: pad,
      marginTop: s(18),
      minHeight: s(37),
      paddingVertical: s(9),
      paddingHorizontal: s(10),
      borderRadius: s(12),
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: s(8),
      rowGap: 6,
    },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trustText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: colors.textPrimary },
    trustDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.borderStrong },

    footer: { marginTop: s(18), paddingHorizontal: s(20), alignItems: 'center' },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    footerText: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: colors.textSecondary },
    phone: { fontFamily: fontFamily.medium, color: NAVY, textDecorationLine: 'underline' },
  });
};
