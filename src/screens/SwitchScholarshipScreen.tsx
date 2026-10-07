import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { LoadState } from '../components/LoadState';
import { useToast } from '../components/Toast';
import { useApi } from '../api/useApi';
import type { SchemesData } from '../api/types';

// Screen 15 of ANVAY_ka_kaam.pdf (Switch scholarship). Static mock data only.
// Sizes follow the PDF's drawing data: 32pt compare arrow, 48pt gain badge with a 22pt icon, 16pt row icons,
// 20pt timeline dots and checkbox, 52pt switch button. The switch button stays disabled until the
// acknowledgement box is ticked; nothing is submitted anywhere.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const AMBER = '#896000';
const INK = '#1F2836';
const MUTED = '#5E6B79';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const changes: { icon: IconName; label: string; from: string; to?: string; chip?: string }[] = [
  { icon: 'school', label: 'Tuition fee', from: 'Partial', to: 'Full fee covered' },
  { icon: 'cash-multiple', label: 'Living allowance', from: '₹1,200/month', to: '₹3,000/month' },
  { icon: 'laptop', label: 'Books & laptop', from: 'Not covered', to: '₹45,000 one-time' },
  { icon: 'clock', label: 'Processing time', from: '~45 days', to: '~21 days' },
  { icon: 'autorenew', label: 'Renewal condition', from: 'Pass exam', chip: 'Minimum 60% marks' },
];

const nextSteps = (current: string, target: string) => [
  { title: `${current} continues until its next instalment`, sub: 'No disruption in current financial support' },
  { title: `${target} application gets verified (≈21 days)`, sub: 'Handled online by institute & state nodal officer' },
  { title: 'New scholarship starts from next instalment', sub: 'Credited directly via PFMS' },
];
const shortName = (title: string) => title.replace(/^National /, '').split(/ (Scholarship|Education)/)[0];

type Props = { code: string; onBack?: () => void; onSwitch?: () => Promise<string | null>; onKeep?: () => void };

export function SwitchScholarshipScreen({ code, onBack, onSwitch, onKeep }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [agreed, setAgreed] = useState(true);
  const [busy, setBusy] = useState(false);
  const { data, error, reload } = useApi<SchemesData>('/schemes');

  const confirmSwitch = async () => {
    if (busy || !agreed) return;
    setBusy(true);
    const problem = await onSwitch?.();
    setBusy(false);
    if (problem) toast(problem);
  };

  if (!data) return <LoadState error={error} onRetry={reload} label="Comparing your scholarships…" />;
  const current = data.schemes.find((s) => s.status === 'enrolled');
  const target = data.schemes.find((s) => s.code === code);
  if (!target) return <LoadState error="That scheme could not be found." onRetry={reload} />;
  const curName = current ? shortName(current.title) : 'Your current scholarship';
  const newName = shortName(target.title);
  const gain = Math.max(0, (target.amountValue ?? 0) - (current?.amountValue ?? 0));
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const next = nextSteps(curName, newName);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navy header with the compare card inside it */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 12 }]}>
          <View style={styles.tricolor}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#138708' }} />
          </View>
          <View style={styles.headerInner}>
            <View style={styles.titleRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.backBtn}>
                <Icon name="arrow-left" size={r.s(24)} color="#FFFFFF" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Switch scholarship</Text>
                <Hi style={styles.titleHi}>छात्रवृत्ति बदलें</Hi>
              </View>
            </View>

            <View style={styles.compare}>
              <View style={styles.compareSide}>
                <Text style={styles.compareLabel}>CURRENT</Text>
                <Text style={styles.compareName}>{curName}</Text>
                <Text style={styles.compareAmount}>{current?.amountText ?? '—'}</Text>
              </View>
              <View style={styles.compareArrow}>
                <Icon name="arrow-right" size={r.s(18)} color="#FFFFFF" />
              </View>
              <View style={[styles.compareSide, { alignItems: 'flex-end' }]}>
                <Text style={[styles.compareLabel, { color: ORANGE, fontFamily: fontFamily.bold }]}>NEW</Text>
                <Text style={styles.compareName}>{newName}</Text>
                <Text style={[styles.compareAmount, styles.compareNew]}>{target.amountText}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Gain summary */}
          <View style={styles.gain}>
            <View style={styles.gainBadge}>
              <Icon name="trending-up" size={r.s(24)} color={GREEN} />
            </View>
            <Text style={styles.gainTitle}>{gain > 0 ? `You gain up to ${inr(gain)} per year` : 'Compare the two schemes before you switch'}</Text>
            {gain > 0 && <Hi style={styles.gainHi}>{`आपको हर साल ${inr(gain)} तक अधिक मिलेगा`}</Hi>}
            <Text style={styles.gainSub}>Based on the scheme's total support amount</Text>
          </View>

          {/* What changes */}
          <Text style={styles.sectionTitle}>
            What changes <Hi style={styles.sectionHi}>क्या बदलेगा</Hi>
          </Text>
          <View style={styles.card}>
            {changes.map((c, i) => (
              <View key={c.label} style={[styles.changeRow, i > 0 && styles.changeBorder]}>
                <View style={styles.changeHead}>
                  <Icon name={c.icon} size={r.s(17)} color={NAVY} />
                  <Text style={styles.changeLabel}>{c.label}</Text>
                </View>
                <View style={styles.changeValues}>
                  <Text style={styles.from}>{c.from}</Text>
                  <Icon name="arrow-right" size={r.s(15)} color="#6B7686" />
                  {c.chip ? (
                    <View style={styles.infoChip}>
                      <Icon name="information" size={r.s(14)} color={AMBER} />
                      <Text style={styles.infoChipText}>{c.chip}</Text>
                    </View>
                  ) : (
                    <Text style={styles.to}>{c.to}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* What happens next */}
          <Text style={styles.sectionTitle}>
            What happens next <Hi style={styles.sectionHi}>आगे क्या होगा</Hi>
          </Text>
          <View style={[styles.card, styles.timeline]}>
            {next.map((n, i) => {
              const last = i === next.length - 1;
              return (
                <View key={n.title} style={styles.tlRow}>
                  <View style={styles.tlNodeCol}>
                    <View style={styles.tlNode}>
                      <View style={styles.tlDot} />
                    </View>
                    {!last && <View style={styles.tlLine} />}
                  </View>
                  <View style={[styles.tlBody, !last && { paddingBottom: r.s(18) }]}>
                    <Text style={styles.tlTitle}>{n.title}</Text>
                    <Text style={styles.tlSub}>{n.sub}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <Icon name="information" size={r.s(18)} color={AMBER} />
            <Text style={styles.warningText}>
              You can hold only one scholarship at a time. This switch cannot be undone for AY 2026-27.
            </Text>
          </View>

          {/* Acknowledgement */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => setAgreed(!agreed)}
            style={styles.ack}
          >
            <View style={[styles.checkbox, !agreed && styles.checkboxOff]}>
              {agreed && <Icon name="check" size={r.s(15)} color="#FFFFFF" />}
            </View>
            <Text style={styles.ackText}>
              I understand and want to switch / <Hi style={styles.ackHi}>मैं समझता हूँ</Hi>
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Digital India · DigiLocker · PFMS Direct Benefit Transfer</Text>
            <Text style={styles.footerText}>Ministry of Tribal Affairs, Government of India</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky actions */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomInner}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !agreed }}
            disabled={!agreed}
            onPress={confirmSwitch}
            style={({ pressed }) => [styles.switchBtn, !agreed && styles.switchOff, pressed && agreed && { opacity: 0.9 }]}
          >
            <Text style={styles.switchText}>
              Switch & apply / <Hi style={styles.switchText}>बदलें और आवेदन करें</Hi>
            </Text>
            <Icon name="arrow-right" size={r.s(20)} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onKeep} hitSlop={8} style={styles.keepBtn}>
            <Text style={styles.keepText}>Keep my current scholarship</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(18), borderWidth: 1, borderColor: '#E1E4EB' } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F2F4F9' },
    scroll: { paddingBottom: s(20) },

    // ---- header + compare card (PDF: 18pt title, 92pt compare card inside the navy header)
    header: { backgroundColor: DARK, borderBottomLeftRadius: s(24), borderBottomRightRadius: s(24), paddingBottom: s(16) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(16) },
    backBtn: { width: s(24), alignItems: 'flex-start' },
    title: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(23), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(16), color: '#B7C6E0' },
    compare: { ...card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(14), borderRadius: s(16), paddingHorizontal: s(17), paddingVertical: s(18) },
    compareSide: { flex: 1, minWidth: 0 },
    compareLabel: { fontFamily: fontFamily.medium, fontSize: fs(11), lineHeight: fs(14), letterSpacing: 0.4, color: MUTED },
    compareName: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(20), color: INK, marginTop: 2 },
    compareAmount: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: MUTED, marginTop: 2 },
    compareNew: { fontFamily: fontFamily.bold, color: NAVY },
    compareArrow: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- gain summary (PDF: 377x174)
    gain: { ...card, alignItems: 'center', marginTop: s(16), paddingHorizontal: s(16), paddingVertical: s(20) },
    gainBadge: { width: s(48), height: s(48), borderRadius: s(24), backgroundColor: '#E6F4EB', alignItems: 'center', justifyContent: 'center' },
    gainTitle: { fontFamily: fontFamily.bold, fontSize: fs(19), lineHeight: fs(26), color: INK, textAlign: 'center', marginTop: s(14) },
    gainHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(13), lineHeight: fs(19), color: NAVY, textAlign: 'center', marginTop: 3 },
    gainSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, textAlign: 'center', marginTop: s(6) },

    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK, marginTop: s(22), marginBottom: s(10) },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(10), color: MUTED },
    card: { ...card },

    // ---- what changes (PDF: label row + old -> new row, hairline dividers)
    changeRow: { paddingHorizontal: s(17), paddingVertical: s(13) },
    changeBorder: { borderTopWidth: 1, borderTopColor: '#EEF1F5', marginHorizontal: s(17), paddingHorizontal: 0 },
    changeHead: { flexDirection: 'row', alignItems: 'center', gap: s(7) },
    changeLabel: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: INK },
    changeValues: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: s(8), rowGap: 4, marginTop: s(6), paddingLeft: s(24) },
    from: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: MUTED, textDecorationLine: 'line-through' },
    to: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: GREEN },
    infoChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: s(8), backgroundColor: '#FFF6DF', paddingHorizontal: s(9), paddingVertical: s(5) },
    infoChipText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: AMBER },

    // ---- what happens next (PDF: 20pt dots joined by a light line)
    timeline: { paddingHorizontal: s(17), paddingVertical: s(18) },
    tlRow: { flexDirection: 'row', gap: s(12) },
    tlNodeCol: { width: s(20), alignItems: 'center' },
    tlNode: { width: s(20), height: s(20), borderRadius: s(10), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    tlDot: { width: s(10), height: s(10), borderRadius: s(5), backgroundColor: NAVY },
    tlLine: { flex: 1, width: 2, backgroundColor: '#EEF1F5', marginTop: 2 },
    tlBody: { flex: 1, minWidth: 0 },
    tlTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: INK },
    tlSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 3 },

    warning: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(16), padding: s(14), borderRadius: s(14), backgroundColor: '#FFF6DF' },
    warningText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fs(12), lineHeight: fs(20), color: AMBER },

    ack: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(20), paddingHorizontal: s(4) },
    checkbox: { width: s(22), height: s(22), borderRadius: s(6), backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    checkboxOff: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#CAD4E1' },
    ackText: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(19), color: INK },
    ackHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), color: MUTED },

    footer: { alignItems: 'center', gap: 3, marginTop: s(22), paddingHorizontal: s(4) },
    footerText: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(17), color: MUTED, textAlign: 'center' },

    // ---- sticky actions (PDF: 52pt orange button + text button)
    bottom: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E4EB', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    bottomInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(12) },
    switchBtn: { minHeight: s(52), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), borderRadius: s(14), backgroundColor: ORANGE, paddingHorizontal: s(14), paddingVertical: s(8) },
    switchOff: { backgroundColor: '#CAD4E1' },
    switchText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(15), lineHeight: fs(20), color: '#FFFFFF', textAlign: 'center' },
    keepBtn: { alignItems: 'center', paddingVertical: s(12) },
    keepText: { fontFamily: fontFamily.bold, fontSize: fs(13), color: NAVY },
  });
};
