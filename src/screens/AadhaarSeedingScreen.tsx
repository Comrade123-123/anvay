import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { BankMitraIllustration } from '../components/BankMitraIllustration';
import { LoadState } from '../components/LoadState';
import { api, ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import type { DbtData } from '../api/types';

// Screen 16 of ANVAY_ka_kaam.pdf (Aadhaar seeding help, opened from DBT > "Fix via NPCI"). Status comes from /api/dbt;
// "Check status again" calls /api/dbt/fix-seeding (simulated NPCI re-check), which re-sends the failed payments.
// Sizes follow the PDF's drawing data: 36pt header circles, 48pt status badge, 28pt step circles, 40pt place tiles,
// 22pt status pills, 48pt sticky button.
// Alignment fixes vs the reference: the step descriptions wrapped in a narrow column ("seeding / NPCI / mapper")
// and now use the full card width; the status pills and Directions links sit in fixed right columns.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const RED = '#C62828';
const AMBER = '#896000';
const INK = '#1F2836';
const MUTED = '#5E6B79';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const places: { icon: IconName; name: string; dist: string; open: string }[] = [
  { icon: 'bank', name: 'Bank of India, Khunti Branch', dist: '2.3 km away', open: 'Open till 4 PM' },
  { icon: 'storefront', name: 'Bank Mitra, Murhu CSC', dist: '800 m away', open: 'Open now' },
];

type Props = { onBack?: () => void; onOpenHelp?: () => void };

export function AadhaarSeedingScreen({ onBack, onOpenHelp }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [checking, setChecking] = useState(false);
  const { data, error, reload } = useApi<DbtData>('/dbt');

  // Pending means the bank is not seeded, or a payment already failed because of it.
  const pending = !!data && (!data.bank.seeded || !!data.alert);

  const recheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await api.post<{ seeded: boolean; retried: number }>('/dbt/fix-seeding');
      await reload();
      toast(res.retried ? `Seeding verified. ${res.retried} failed payment(s) sent again.` : 'Seeding verified. Nothing is pending.');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not check the status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  if (!data) return <LoadState error={error} onRetry={reload} label="Checking your bank seeding…" />;
  const bankLine = `${data.bank.name ?? 'Bank'} ••••${data.bank.last4 ?? '----'}`;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navy header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 12 }]}>
          <View style={styles.tricolor}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#138708' }} />
          </View>
          <View style={styles.headerInner}>
            <View style={styles.topRow}>
              <View style={styles.ministry}>
                <Icon name="bank" size={r.s(13)} color="#FF9933" />
                <Text style={styles.ministryText} numberOfLines={1}>Ministry of Tribal Affairs · Govt. of India</Text>
              </View>
              <Text style={styles.brand}>ANVAY • <Hi style={styles.brand}>अन्वय</Hi></Text>
            </View>
            <View style={styles.titleRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.circleBtn}>
                <Icon name="arrow-left" size={r.s(20)} color="#FFFFFF" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Aadhaar seeding</Text>
                <Hi style={styles.titleHi}>आधार सीडिंग</Hi>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Help" onPress={onOpenHelp} style={styles.circleBtn}>
                <Icon name="help-circle-outline" size={r.s(22)} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Status card overlapping the header */}
          <View style={styles.status}>
            <View style={styles.statusTop}>
              <View style={[styles.statusBadge, !pending && { backgroundColor: '#E6F4EB' }]}>
                <Icon name={pending ? 'link-off' : 'link-variant'} size={r.s(24)} color={pending ? RED : GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, !pending && { color: GREEN }]}>{pending ? 'Bank account not Aadhaar\u2011seeded' : 'Bank account is Aadhaar\u2011seeded'}</Text>
                <Text style={styles.statusSub}>
                  {bankLine} · Checked via NPCI just now
                </Text>
              </View>
            </View>
            <View style={styles.rule} />
            <View style={styles.checkRow}>
              <Icon name="check-decagram" size={r.s(17)} color={GREEN} />
              <Text style={styles.checkText}>Aadhaar linked to mobile</Text>
              <View style={[styles.pill, { backgroundColor: '#E6F4EB' }]}>
                <Text style={[styles.pillText, { color: GREEN }]}>Linked ✓</Text>
              </View>
            </View>
            <View style={styles.checkRow}>
              <Icon name={pending ? 'close-circle' : 'check-decagram'} size={r.s(17)} color={pending ? RED : GREEN} />
              <Text style={styles.checkText}>Aadhaar seeded with bank</Text>
              <View style={[styles.pill, { backgroundColor: pending ? '#FDEBEB' : '#E6F4EB' }]}>
                <Text style={[styles.pillText, { color: pending ? RED : GREEN }]}>{pending ? 'Not Seeded ×' : 'Seeded ✓'}</Text>
              </View>
            </View>
            <View style={styles.notice}>
              <Icon name="information" size={r.s(17)} color={AMBER} />
              <Text style={styles.noticeText}>
                {pending
                  ? 'Without seeding, scholarship payments (DBT) may fail or be rejected by the treasury.'
                  : 'All set. Your scholarship payments will reach this account.'}
              </Text>
            </View>
          </View>

          {/* Illustration */}
          <View style={styles.scene}>
            <BankMitraIllustration />
          </View>

          {/* Steps */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Fix in 3 steps</Text>
            <Hi style={styles.sectionHi}>3 आसान चरण</Hi>
          </View>
          <View style={styles.stepsCard}>
            {[
              {
                n: 1,
                title: 'Visit your bank or Bank Mitra',
                body: 'Carry your physical Aadhaar card and bank passbook',
                chip: 'Physical biometric authentication needed',
              },
              {
                n: 2,
                title: 'Submit the seeding consent form',
                body: 'Ask specifically for the "Aadhaar seeding / NPCI mapper" form',
                note: '* Note: Bank linking is not same as NPCI DBT seeding.',
              },
              { n: 3, title: 'Check status in ANVAY', body: 'Usually updated in 2–3 working days after bank approves' },
            ].map((st, i, arr) => {
              const last = i === arr.length - 1;
              return (
                <View key={st.n} style={styles.stepRow}>
                  <View style={styles.stepCol}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNum}>{st.n}</Text>
                    </View>
                    {!last && <View style={styles.stepLine} />}
                  </View>
                  <View style={[styles.stepBody, !last && { paddingBottom: r.s(18) }]}>
                    <Text style={styles.stepTitle}>{st.title}</Text>
                    <Text style={styles.stepText}>{st.body}</Text>
                    {st.chip && (
                      <View style={styles.stepChip}>
                        <Icon name="card-account-details" size={r.s(15)} color={NAVY} />
                        <Text style={styles.stepChipText}>{st.chip}</Text>
                      </View>
                    )}
                    {st.note && <Text style={styles.stepNote}>{st.note}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Nearest options */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Nearest options</Text>
            <Hi style={styles.sectionHi}>नज़दीकी विकल्प</Hi>
          </View>
          <View style={styles.placesCard}>
            {places.map((p, i) => (
              <View key={p.name} style={[styles.placeRow, i > 0 && styles.placeBorder]}>
                <View style={styles.placeTile}>
                  <Icon name={p.icon} size={r.s(20)} color={NAVY} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.placeName}>{p.name}</Text>
                  <View style={styles.placeMeta}>
                    <Icon name="navigation-variant" size={r.s(13)} color="#6B7686" />
                    <Text style={styles.placeDist}>{p.dist}</Text>
                    <Text style={styles.placeDist}>·</Text>
                    <Text style={styles.placeOpen}>{p.open}</Text>
                  </View>
                </View>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => toast('Opening directions in Maps (demo)')} style={styles.directions}>
                  <Text style={styles.directionsText}>Directions</Text>
                  <Icon name="chevron-right" size={r.s(16)} color={NAVY} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Change account */}
          <View style={styles.change}>
            <View style={styles.changeHead}>
              <View style={styles.changeIcon}>
                <Icon name="swap-horizontal" size={r.s(14)} color="#FFFFFF" />
              </View>
              <Text style={styles.changeText}>Already seeded another account? You can use that account instead.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => toast('Choose another bank account (demo)')} style={styles.changeLink}>
              <Text style={styles.changeLinkText}>
                Change account / <Hi style={styles.changeLinkText}>खाता बदलें</Hi>
              </Text>
              <Icon name="arrow-right" size={r.s(14)} color={NAVY} />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Digital India • NPCI Aadhaar Mapper • PFMS Portal</Text>
            <Text style={styles.footerText}>Ministry of Tribal Affairs, Government of India</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky action */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomInner}>
          <Pressable
            accessibilityRole="button"
            disabled={checking}
            onPress={recheck}
            style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.9 }]}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="sync" size={r.s(20)} color="#FFFFFF" />
            )}
            <Text style={styles.checkBtnText}>
              {checking ? 'Checking… / ' : 'Check status again / '}
              <Hi style={styles.checkBtnText}>{checking ? 'जाँच जारी है' : 'स्थिति जाँचें'}</Hi>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(20), borderWidth: 1, borderColor: '#E1E4EB' } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F2F4F9' },
    scroll: { paddingBottom: s(24) },

    header: { backgroundColor: DARK, borderBottomLeftRadius: s(26), borderBottomRightRadius: s(26), paddingBottom: s(46) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10) },
    ministry: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
    ministryText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), color: '#C9D6EC' },
    brand: { fontFamily: fontFamily.medium, fontSize: fs(10), letterSpacing: 0.6, color: '#A9B7CE' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(12) },
    circleBtn: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(23), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(16), color: '#B7C6E0' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- status card (PDF: 377x251, overlaps the header by ~24pt)
    status: { ...card, marginTop: -s(30), padding: s(17), borderRadius: s(22) },
    statusTop: { flexDirection: 'row', alignItems: 'flex-start', gap: s(14) },
    statusBadge: { width: s(48), height: s(48), borderRadius: s(24), backgroundColor: '#FDEBEB', alignItems: 'center', justifyContent: 'center' },
    statusTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(22), color: RED },
    statusSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginTop: 3 },
    rule: { height: 1, backgroundColor: '#EEF1F5', marginVertical: s(14) },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: s(9), minHeight: s(30), marginBottom: s(6) },
    checkText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: INK },
    pill: { height: s(22), justifyContent: 'center', paddingHorizontal: s(12), borderRadius: s(11) },
    pillText: { fontFamily: fontFamily.bold, fontSize: fs(12) },
    notice: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(8), padding: s(13), borderRadius: s(12), backgroundColor: '#FFF6DF' },
    noticeText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: AMBER },

    scene: { height: s(140), marginTop: s(16), borderRadius: s(18), borderWidth: 1, borderColor: '#D4E1EF', overflow: 'hidden', backgroundColor: '#E8EDF6' },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(20), marginBottom: s(10) },
    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },

    // ---- steps (PDF: 28pt navy circles joined by a light line)
    stepsCard: { ...card, paddingHorizontal: s(17), paddingVertical: s(17) },
    stepRow: { flexDirection: 'row', gap: s(14) },
    stepCol: { width: s(28), alignItems: 'center' },
    stepCircle: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    stepNum: { fontFamily: fontFamily.bold, fontSize: fs(13), color: '#FFFFFF' },
    stepLine: { flex: 1, width: 2, backgroundColor: '#E6EAF0', marginTop: 4 },
    stepBody: { flex: 1, minWidth: 0 },
    stepTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(20), color: INK, marginTop: 3 },
    stepText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: MUTED, marginTop: 3 },
    stepChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginTop: s(10), borderRadius: s(9), backgroundColor: '#E8EDF6', paddingHorizontal: s(10), paddingVertical: s(7) },
    stepChipText: { flexShrink: 1, fontFamily: fontFamily.medium, fontSize: fs(11), lineHeight: fs(15), color: NAVY },
    stepNote: { fontFamily: fontFamily.regular, fontStyle: 'italic', fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 6 },

    // ---- nearest options
    placesCard: { ...card, paddingHorizontal: s(15) },
    placeRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingVertical: s(15) },
    placeBorder: { borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    placeTile: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    placeName: { fontFamily: fontFamily.bold, fontSize: fs(13.5), lineHeight: fs(19), color: INK },
    placeMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 5, rowGap: 2, marginTop: 3 },
    placeDist: { fontFamily: fontFamily.regular, fontSize: fs(12), color: MUTED },
    placeOpen: { fontFamily: fontFamily.medium, fontSize: fs(12), color: GREEN },
    directions: { flexDirection: 'row', alignItems: 'center' },
    directionsText: { fontFamily: fontFamily.bold, fontSize: fs(13), color: NAVY },

    change: { marginTop: s(16), padding: s(15), borderRadius: s(16), backgroundColor: '#E8EDF6' },
    changeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: s(11) },
    changeIcon: { width: s(20), height: s(20), borderRadius: s(10), backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    changeText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: INK },
    changeLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: s(9), marginLeft: s(31) },
    changeLinkText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY },

    footer: { alignItems: 'center', gap: 2, marginTop: s(20) },
    footerText: { fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(16), color: MUTED, textAlign: 'center' },

    bottom: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E4EB', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    bottomInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(12) },
    checkBtn: { minHeight: s(48), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), borderRadius: s(14), backgroundColor: ORANGE, paddingHorizontal: s(14), paddingVertical: s(8) },
    checkBtnText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(15), lineHeight: fs(20), color: '#FFFFFF', textAlign: 'center' },
  });
};
