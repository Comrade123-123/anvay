import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import type { SubmitResult } from '../api/types';

// Screen 23 of ANVAY_ka_kaam.pdf (Application submitted confirmation). Static mock data only.
// Sizes follow the PDF's drawing data: 22pt title, 17pt Hindi subtitle, 14pt body, 15pt monospace application ID,
// 80pt success circle with a 64pt illustration card, 48pt primary button, 28pt stat icon disc.
// The PDF's illustration was a raster crop; here it is redrawn as vector so it stays sharp at any width. The
// download button's two-line label is centred against its icon, and the three actions share one width.
const NAVY = colors.primary;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const INK = '#1F2836';
const MUTED = '#5E6B79';
const BORDER = '#E1E4EB';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);


function SuccessArt({ size }: { size: number }) {
  // 130 x 88 design box
  return (
    <Svg width={size} height={size * (88 / 130)} viewBox="0 0 130 88">
      <Circle cx={42} cy={44} r={44} fill="#E6F4EB" />
      <Circle cx={42} cy={44} r={40} fill={GREEN} />
      <Path d="M27 45 l11 11 l19 -21" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={60} y={17} width={64} height={64} rx={14} fill="#fff" stroke="#E1E4EB" strokeWidth={1} />
      <Circle cx={92} cy={49} r={26} fill="#E8EDF6" />
      {/* person */}
      <Path d="M72 75 q0 -13 12 -16 h16 q12 3 12 16 z" fill={NAVY} />
      <Rect x={89} y={54} width={6} height={7} fill="#D9822B" />
      <Circle cx={92} cy={48} r={9} fill="#E8892F" />
      <Path d="M83 44 q9 -9 18 0 l0 -3 q-9 -8 -18 0 z" fill={NAVY} />
      <Rect x={82} y={42} width={20} height={3} rx={1.5} fill={ORANGE} />
      <Circle cx={89} cy={49} r={1} fill={INK} />
      <Circle cx={95} cy={49} r={1} fill={INK} />
      <Path d="M89.5 52.5 q2.5 2 5 0" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
      {/* certificate */}
      <Rect x={100} y={52} width={16} height={22} rx={2.5} fill="#fff" stroke={NAVY} strokeWidth={1.2} />
      <Rect x={103} y={56} width={10} height={1.4} fill={NAVY} />
      <Rect x={103} y={60} width={10} height={1.4} fill={NAVY} />
      <Circle cx={109} cy={68} r={2.2} fill={GREEN} />
    </Svg>
  );
}

function Pin({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size * 1.4} viewBox="0 0 8 19">
      <Circle cx={4} cy={3} r={3} fill={color} />
      <Rect x={3.2} y={6} width={1.6} height={5} fill={color} />
      <Rect x={0} y={9} width={8} height={4} fill={color} />
    </Svg>
  );
}

type Props = { result: SubmitResult; onClose?: () => void; onTrack?: () => void; onHome?: () => void };

export function SubmittedScreen({ result, onClose, onTrack, onHome }: Props) {
  const APP_ID = result.applicationNo;
  const r = useResponsive();
  const styles = useMemo(() => makeStyles(r), [r.width]);
  const insets = useSafeAreaInsets();
  const s = r.s;
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const copy = () => {
    try {
      const nav: any = (globalThis as any).navigator;
      // The browser may refuse (page not focused / no permission); the "Copied" state still shows, so swallow it.
      Promise.resolve(nav?.clipboard?.writeText?.(APP_ID)).catch(() => {});
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Ministry strip */}
      <View style={[styles.strip, { paddingTop: insets.top + s(6) }]}>
        <View style={styles.tricolor}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>
        <View style={[styles.column, styles.stripRow]}>
          <Icon name="shield-check" size={s(15)} color="#F49E0A" />
          <Text style={styles.stripText} numberOfLines={1}>Ministry of Tribal Affairs · Government of India</Text>
          <View style={styles.bars}>
            {[6, 9, 5, 9, 7, 9, 5].map((h, i) => (
              <View key={i} style={{ width: 2, height: h, backgroundColor: '#9BB2E0' }} />
            ))}
          </View>
        </View>
      </View>

      {/* Portal header */}
      <View style={styles.portal}>
        <View style={[styles.column, styles.portalRow]}>
          <View style={styles.stBadge}>
            <Text style={styles.stText}>ST</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.portalTitle}>ANVAY 2024-25</Text>
            <Text style={styles.portalSub} numberOfLines={1}>National Scholarship Portal</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={styles.close}>
            <Icon name="close" size={s(20)} color={NAVY} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: s(20) }} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.pinL}><Pin size={s(8)} color="#C3CAD8" /></View>
            <SuccessArt size={Math.min(s(130), 200)} />
            <View style={styles.pinR}><Pin size={s(8)} color="#C3CAD8" /></View>
          </View>
          <Text style={styles.title}>Application submitted!</Text>
          <Hi style={styles.titleHi}>आवेदन सफलता से जमा हो गया!</Hi>
          <Text style={styles.lead}>You will get updates on SMS, app notifications and JAGO scholarship assistant.</Text>

          {/* Details card */}
          <View style={styles.card}>
            <View style={styles.idBox}>
              <View style={styles.idTop}>
                <View style={styles.idLabelRow}>
                  <Icon name="card-account-details" size={s(12)} color={NAVY} />
                  <Text style={styles.idLabel} numberOfLines={1}>
                    APPLICATION ID / <Hi>आवेदन संख्या</Hi>
                  </Text>
                </View>
                <View style={styles.official}>
                  <Text style={styles.officialText}>Official Record</Text>
                </View>
              </View>
              <View style={styles.idBottom}>
                <Text style={styles.idValue}>{APP_ID}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy application ID"
                  onPress={copy}
                  style={({ pressed }) => [styles.copy, pressed && { opacity: 0.85 }]}
                >
                  <Icon name={copied ? 'check' : 'content-copy'} size={s(13)} color={copied ? GREEN : NAVY} />
                  <Text style={[styles.copyText, copied && { color: GREEN }]}>{copied ? 'Copied' : 'Copy'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rule} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                Applied Scheme / <Hi>योजना:</Hi>
              </Text>
              <View style={styles.rowValueWrap}>
                <Text style={styles.rowValue}>{result.scheme.title}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                Submitted on / <Hi>जमा तिथि:</Hi>
              </Text>
              <View style={styles.rowValueWrap}>
                <Text style={styles.rowValue}>{result.submittedAt}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Verification Mode:</Text>
              <View style={[styles.rowValueWrap, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: s(5) }]}>
                <Icon name="lock" size={s(12)} color={GREEN} />
                <Text style={[styles.rowValue, { color: GREEN, fontFamily: fontFamily.medium }]}>Aadhaar e-Signed & Verified</Text>
              </View>
            </View>

            <View style={[styles.rule, { marginTop: s(6) }]} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                Expected decision / <Hi>अपेक्षित निर्णय:</Hi>
              </Text>
              <View style={styles.within}>
                <Text style={styles.withinText}>Within 21 days</Text>
              </View>
            </View>
          </View>

          {/* Reminder */}
          <View style={[styles.card, styles.reminder]}>
            <View style={styles.bell}>
              <Icon name="bell" size={s(14)} color={NAVY} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.remTitle}>Deadline reminders added to your calendar</Text>
              <Text style={styles.remBody}>Institutional nodal officer verification alert set for {result.reminderOn}</Text>
            </View>
            <Icon name="check-circle" size={s(16)} color={GREEN} />
          </View>

          {/* What happens next */}
          <View style={styles.next}>
            <Icon name="information" size={s(18)} color={GREEN} style={{ marginTop: s(2) }} />
            <Text style={styles.nextText}>
              <Text style={{ fontFamily: fontFamily.bold, color: GREEN }}>What happens next?</Text> Your application has been routed directly to your{' '}
              <Text style={{ fontFamily: fontFamily.bold }}>institute's Nodal Desk</Text> for e-endorsement. No physical visits required.{result.switched ? ' Your earlier scholarship will end from its next instalment.' : ''}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.column}>
            <Pressable accessibilityRole="button" onPress={onTrack} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }]}>
              <Icon name="chart-timeline-variant" size={s(18)} color="#fff" />
              <Text style={styles.primaryText}>
                Track application / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>आवेदन ट्रैक करें</Hi>
              </Text>
              <Icon name="arrow-right" size={s(18)} color="#fff" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => flash('Acknowledgement PDF saved (demo).')}
              style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: '#F2F4F9' }]}
            >
              <Icon name="tray-arrow-down" size={s(18)} color={NAVY} />
              <Text style={styles.secondaryText}>
                Download acknowledgement (PDF) / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>रसीद डाउनलोड करें</Hi>
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onHome} hitSlop={8} style={styles.homeLink}>
              <Icon name="home" size={s(17)} color={NAVY} />
              <Text style={styles.homeText}>
                Go to home / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>मुख्य पृष्ठ पर जाएं</Hi>
              </Text>
            </Pressable>
            <View style={styles.footRule} />
            <View style={styles.footRow}>
              <Icon name="lock" size={s(12)} color={GREEN} />
              <Text style={styles.foot}>Digital India & DigiLocker Integrated · MoTA Govt. of India</Text>
            </View>
          </View>
        </View>
        <View style={{ height: Math.max(insets.bottom, 8) }} />
      </ScrollView>

      {!!toast && (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: s(24) + Math.max(insets.bottom, 0) }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const gutter = s(16);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: gutter },

    strip: { backgroundColor: NAVY, paddingBottom: s(9) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    stripRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
    stripText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fs(12), color: '#fff' },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },

    portal: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: s(12) },
    portalRow: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
    stBadge: { width: s(28), height: s(28), borderRadius: s(6), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    stText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },
    portalTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(18), color: NAVY },
    portalSub: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    close: { width: s(36), height: s(36), borderRadius: s(18), borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },

    hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: s(22), gap: s(22) },
    pinL: { opacity: 0.9 },
    pinR: { opacity: 0.9 },
    title: { fontFamily: fontFamily.bold, fontSize: fs(22), lineHeight: fs(29), color: INK, textAlign: 'center', marginTop: s(10) },
    titleHi: { fontFamily: fontFamily.hindiBold, fontSize: fs(17), lineHeight: fs(25), color: NAVY, textAlign: 'center', marginTop: s(2) },
    lead: { fontFamily: fontFamily.regular, fontSize: fs(14), lineHeight: fs(23), color: MUTED, textAlign: 'center', marginTop: s(12), marginBottom: s(20), paddingHorizontal: s(6) },

    card: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: s(18),
      padding: s(16),
      ...Platform.select({ default: {}, web: { boxShadow: '0 2px 6px rgba(20,30,60,0.06)' } as object }),
    },
    idBox: { backgroundColor: '#F2F4F9', borderWidth: 1, borderColor: '#D3D9E3', borderRadius: s(12), padding: s(12) },
    idTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
    idLabelRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), flexShrink: 1 },
    idLabel: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(10), letterSpacing: 0.4, color: MUTED },
    official: { backgroundColor: '#E6F4EB', borderWidth: 1, borderColor: '#C3E8CF', borderRadius: s(10), paddingHorizontal: s(10), paddingVertical: s(3) },
    officialText: { fontFamily: fontFamily.medium, fontSize: fs(10), color: GREEN },
    idBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(8), marginTop: s(8) },
    idValue: {
      flexShrink: 1,
      fontFamily: Platform.select({ web: 'monospace', ios: 'Menlo', default: 'monospace' }),
      fontWeight: '700',
      fontSize: fs(15),
      color: NAVY,
    },
    copy: { flexDirection: 'row', alignItems: 'center', gap: s(6), height: s(30), paddingHorizontal: s(12), borderRadius: s(8), borderWidth: 1, borderColor: '#C8D1DF', backgroundColor: '#fff' },
    copyText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: NAVY },

    rule: { height: 2, backgroundColor: '#EFF2F6', marginVertical: s(12) },
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(6), paddingVertical: s(6) },
    rowLabel: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED },
    rowValueWrap: { flexShrink: 1, alignItems: 'flex-end', marginLeft: 'auto' },
    rowValue: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(17), color: INK, textAlign: 'right' },
    rowValueSub: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: MUTED, textAlign: 'right' },
    within: { backgroundColor: '#E8EDF6', borderWidth: 1, borderColor: '#C8D1DF', borderRadius: s(6), paddingHorizontal: s(10), paddingVertical: s(4), marginLeft: 'auto' },
    withinText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },

    reminder: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(14), paddingVertical: s(14) },
    bell: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    remTitle: { fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(17), color: INK },
    remBody: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: s(2) },

    next: { flexDirection: 'row', gap: s(10), backgroundColor: '#E6F4EB', borderWidth: 1, borderColor: '#C3E8CF', borderRadius: s(16), padding: s(14), marginTop: s(14) },
    nextText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(20), color: INK },

    actions: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: BORDER, marginTop: s(20), paddingTop: s(16), paddingBottom: s(14) },
    primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), minHeight: s(48), borderRadius: s(12), backgroundColor: ORANGE, paddingHorizontal: s(12), paddingVertical: s(8) },
    primaryText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(14), textAlign: 'center', color: '#fff' },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(12),
      minHeight: s(52),
      borderRadius: s(12),
      borderWidth: 2,
      borderColor: NAVY,
      backgroundColor: '#fff',
      paddingHorizontal: s(14),
      paddingVertical: s(8),
      marginTop: s(12),
    },
    secondaryText: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(19), textAlign: 'center', color: NAVY },
    homeLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), marginTop: s(16) },
    homeText: { fontFamily: fontFamily.bold, fontSize: fs(13), color: NAVY, flexShrink: 1, textAlign: 'center' },
    footRule: { height: 1, backgroundColor: '#EFF2F6', marginTop: s(14), marginBottom: s(10) },
    footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6) },
    foot: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(15), color: MUTED, textAlign: 'center' },

    toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: gutter },
    toast: { backgroundColor: INK, borderRadius: s(10), paddingHorizontal: s(14), paddingVertical: s(10), maxWidth: r.maxContentWidth },
    toastText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: '#fff', textAlign: 'center' },
  });
};
