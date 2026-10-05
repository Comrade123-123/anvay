import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { SchemeHeroIllustration } from '../components/SchemeHeroIllustration';

// Screen 11 of ANVAY_ka_kaam.pdf (Scheme Details for Top Class Education, opened from the Schemes Directory).
// Static mock data only. Sizes and icon sizes follow the PDF's drawing data on its 388pt frame: 36pt back
// circle, 32pt bookmark/share circles, 28pt icon tiles with 14-16pt icons, 12pt bullet ticks, 66pt apply button.
// Alignment fixes vs the reference: the two info cards share one height, and the 2x2 entitlement grid rows
// are equal height so the footers line up.
const NAVY = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#138708';
const DEEP_GREEN = '#0E5B1C';
const MUTED = '#606770';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const breakdown: { icon: IconName; title: string; desc: string; foot: string; chip?: boolean }[] = [
  { icon: 'bank', title: 'Full Tuition Fee', desc: 'Non-refundable institute fees covered in full', foot: 'Direct to Institute', chip: true },
  { icon: 'home-outline', title: 'Living Allowance', desc: 'Hostel & boarding maintenance support', foot: '₹3,000 / month' },
  { icon: 'laptop', title: 'IT Infrastructure', desc: 'Computer, laptop & accessories grant', foot: 'Up to ₹45,000' },
  { icon: 'book-open-variant', title: 'Books & Supplies', desc: 'Annual study equipment allowance', foot: '₹5,000 / year' },
];

const paperless: { icon: IconName; title: string; sub: string; chipIcon: IconName; chip: string }[] = [
  { icon: 'badge-account-outline', title: 'ST Caste Certificate', sub: 'State Tribal Welfare Dept · Verified', chipIcon: 'check-decagram', chip: 'DigiLocker' },
  { icon: 'script-text-outline', title: 'Income Certificate 2025‑26', sub: 'Annual Family Income: ₹3,40,000', chipIcon: 'check-decagram', chip: 'DigiLocker' },
  { icon: 'school', title: 'Admission Confirmation', sub: 'IIT Bombay · Seat Allocation (JoSAA)', chipIcon: 'card-account-details', chip: 'APAAR ID' },
  { icon: 'wallet-outline', title: 'Aadhaar Seeded Bank Account', sub: 'State Bank of India (***3492)', chipIcon: 'check-all', chip: 'NPCI Active' },
];

type Props = { onBack?: () => void; onApply?: () => void };

export function SchemeDetailScreen({ onBack, onApply }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [saved, setSaved] = useState(false);

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
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.backBtn}>
              <Icon name="arrow-left" size={r.s(20)} color="#FFFFFF" />
            </Pressable>
            <View style={styles.titleCol}>
              <Text style={styles.title}>Scheme Details</Text>
              <Hi style={styles.titleHi}>योजना विवरण</Hi>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Remove bookmark' : 'Bookmark scheme'}
              accessibilityState={{ selected: saved }}
              onPress={() => setSaved(!saved)}
              style={styles.roundBtn}
            >
              <Icon name={saved ? 'bookmark' : 'bookmark-outline'} size={r.s(18)} color={saved ? '#FFB868' : '#FFFFFF'} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Share scheme" onPress={() => toast('Scheme link copied (demo)')} style={styles.roundBtn}>
              <Icon name="share-variant-outline" size={r.s(18)} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.wide}>
          {/* Hero */}
          <View style={styles.hero}>
            <SchemeHeroIllustration />
            <View style={styles.heroTag}>
              <View style={styles.heroTagDot} />
              <Text style={styles.heroTagText}>CENTRALLY SPONSORED SCHEME</Text>
            </View>
            <View style={styles.codeTag}>
              <Text style={styles.codeTagText}>ST-TOP-01</Text>
            </View>
          </View>

          {/* Ministry strip */}
          <View style={styles.strip}>
            <View style={styles.stripLeft}>
              <Icon name="bank" size={r.s(15)} color={NAVY} />
              <Text style={styles.stripText} numberOfLines={2}>
                Ministry of Tribal Affairs / <Hi style={styles.stripText}>जनजातीय कार्य मंत्रालय</Hi>
              </Text>
            </View>
            <View style={styles.active}>
              <Icon name="check-decagram-outline" size={r.s(12)} color={GREEN} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Title card */}
          <View style={styles.card}>
            <Text style={styles.schemeTitle}>Top Class Education Scheme for ST Students</Text>
            <Hi style={styles.schemeHi}>अनुसूचित जनजाति हेतु शीर्ष श्रेणी शिक्षा योजना</Hi>
            <Text style={styles.schemeDesc}>
              Full financial support for meritorious Scheduled Tribe students gaining admission to notified premier
              institutes (IITs, IIMs, AIIMS, NITs, and NLUs).
            </Text>
          </View>

          {/* Support + deadline: equal-height cards */}
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <View style={styles.infoHead}>
                <View style={styles.infoTile}>
                  <Icon name="cash-multiple" size={r.s(16)} color={NAVY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Total Support</Text>
                  <Hi style={styles.infoHi}>कुल सहायता</Hi>
                </View>
              </View>
              <View style={styles.infoRule} />
              <Text style={styles.infoValue}>
                ₹2.00 Lakh<Text style={styles.infoUnit}>/yr</Text>
              </Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoHead}>
                <View style={[styles.infoTile, { backgroundColor: '#FFEBD6' }]}>
                  <Icon name="calendar-check" size={r.s(16)} color={ORANGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Application Deadline</Text>
                  <Hi style={styles.infoHi}>अंतिम तिथि</Hi>
                </View>
              </View>
              <View style={styles.infoRule} />
              <Text style={styles.infoValue}>31/10/2026</Text>
            </View>
          </View>

          {/* Eligibility */}
          <View style={styles.eligible}>
            <View style={styles.eligibleHead}>
              <View style={styles.tick}>
                <Icon name="check" size={r.s(15)} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eligibleTitle}>
                  You are Eligible / <Hi style={styles.eligibleTitle}>आप पात्र हैं</Hi>
                </Text>
                <Text style={styles.eligibleSub}>Automatic Pre-Screening Match (100%)</Text>
              </View>
              <View style={styles.dlChip}>
                <Icon name="shield-check" size={r.s(12)} color={GREEN} />
                <Text style={styles.dlChipText}>DigiLocker</Text>
              </View>
            </View>
            <View style={styles.eligibleRule} />
            {[
              <>
                Admission confirmed at <Text style={styles.bold}>IIT Bombay</Text> (B.Tech Computer Science)
              </>,
              <>
                Income within <Text style={styles.bold}>₹6.0 Lakh ceiling</Text> (Revenue Dept Verified)
              </>,
              <>
                ST Certificate verified via <Text style={styles.bold}>State Tribal Registry</Text>
              </>,
            ].map((line, i) => (
              <View key={i} style={styles.bulletRow}>
                <Icon name="check-circle" size={r.s(15)} color={GREEN} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>

          {/* Transition notice */}
          <View style={styles.notice}>
            <Icon name="swap-horizontal-circle-outline" size={r.s(18)} color={ORANGE} />
            <Text style={styles.noticeText}>
              Applying will transition your scholarship from <Text style={styles.noticeBold}>Post-Matric (ST)</Text>{' '}
              seamlessly without any interruption in DBT disbursements.
            </Text>
          </View>

          {/* Entitlement breakdown */}
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Entitlement Breakdown</Text>
              <Hi style={styles.sectionHi}>देय छात्रवृत्ति घटक एवं सहायता</Hi>
            </View>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>4 Components</Text>
            </View>
          </View>
          <View style={styles.grid}>
            {breakdown.map((b) => (
              <View key={b.title} style={styles.gridCard}>
                <View style={styles.gridTile}>
                  <Icon name={b.icon} size={r.s(16)} color={NAVY} />
                </View>
                <Text style={styles.gridTitle}>{b.title}</Text>
                <Text style={styles.gridDesc}>{b.desc}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.gridRule} />
                {b.chip ? (
                  <View style={styles.gridChip}>
                    <Text style={styles.gridChipText}>{b.foot}</Text>
                  </View>
                ) : (
                  <Text style={styles.gridFoot}>{b.foot}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Paperless verification */}
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Paperless Verification</Text>
              <Hi style={styles.sectionHi}>डिजिटल प्रमाण-पत्र सत्यापन</Hi>
            </View>
            <View style={styles.fetched}>
              <Icon name="check-circle-outline" size={r.s(13)} color={GREEN} />
              <Text style={styles.fetchedText}>4/4 Auto-Fetched</Text>
            </View>
          </View>
          <View style={styles.paperCard}>
            {paperless.map((p) => (
              <View key={p.title} style={styles.paperRow}>
                <View style={styles.paperTile}>
                  <Icon name={p.icon} size={r.s(16)} color={NAVY} />
                </View>
                <View style={styles.paperBody}>
                  <Text style={styles.paperTitle}>{p.title}</Text>
                  <Text style={styles.paperSub}>{p.sub}</Text>
                </View>
                <View style={styles.paperChip}>
                  <Icon name={p.chipIcon} size={r.s(12)} color={GREEN} />
                  <Text style={styles.paperChipText}>{p.chip}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Helpline */}
          <View style={styles.helpline}>
            <Icon name="headset" size={r.s(16)} color={NAVY} />
            <Text style={styles.helpText}>
              Tribal Student Toll-Free: <Text style={styles.helpBold}>1800-11-7788</Text>
            </Text>
            <Text style={styles.helpDesk}>24x7 Helpdesk</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerMain}>Content owned by Ministry of Tribal Affairs, Government of India</Text>
            <Text style={styles.footerSub}>
              Designed for Scheduled Tribe Meritorious Students (Top Class Education Scheme)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky apply bar */}
      <View style={[styles.applyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.applyInner}>
          <Pressable
            accessibilityRole="button"
            onPress={onApply}
            style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.applyText}>
              <Text style={styles.applyTitle}>Apply with Auto-Filled Details</Text>
              <Hi style={styles.applyHi}>आवेदन प्रस्तुत करें</Hi>
            </View>
            <Icon name="arrow-right" size={r.s(18)} color="#FFFFFF" style={styles.applyArrow} />
          </Pressable>
          <View style={styles.applyNote}>
            <Icon name="check-decagram-outline" size={r.s(14)} color={GREEN} />
            <Text style={styles.applyNoteText}>DigiLocker paperless verification · Zero physical visits</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(14);
  const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(18), borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F9' },
    scroll: { paddingBottom: s(20) },

    // ---- header
    header: { backgroundColor: NAVY, paddingBottom: s(14) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, flexDirection: 'row', alignItems: 'center', gap: s(10) },
    backBtn: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(20), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: '#B7C6E0' },
    roundBtn: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginLeft: s(-4) },

    // ---- hero (PDF: 388x185 illustration with a navy tag top-left and a code tag top-right)
    wide: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center' },
    hero: { aspectRatio: 388 / 185, backgroundColor: '#E1EDFB', overflow: 'hidden' },
    heroTag: { position: 'absolute', left: pad, top: s(10), flexDirection: 'row', alignItems: 'center', gap: 6, height: s(19), paddingHorizontal: s(10), borderRadius: s(10), backgroundColor: NAVY },
    heroTagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
    heroTagText: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.6, color: '#FFFFFF' },
    codeTag: { position: 'absolute', right: pad, top: s(16), height: s(19), paddingHorizontal: s(9), borderRadius: s(6), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: NAVY, justifyContent: 'center' },
    codeTagText: { fontFamily: mono, fontWeight: '700', fontSize: fs(10), color: NAVY },
    strip: { minHeight: s(39), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), paddingHorizontal: pad, paddingVertical: s(6), backgroundColor: '#F0F4F9', borderBottomWidth: 1, borderBottomColor: '#DCE3EE' },
    stripLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
    stripText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(11), lineHeight: fs(15), color: NAVY },
    active: { flexDirection: 'row', alignItems: 'center', gap: 5, height: s(21), paddingHorizontal: s(9), borderRadius: s(6), borderWidth: 1, borderColor: GREEN, backgroundColor: '#E9F4EB' },
    activeText: { fontFamily: fontFamily.semibold, fontSize: fs(10), color: GREEN },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- title card (PDF: 360x165, 17pt title)
    card: { ...card, marginTop: s(14), padding: s(15) },
    schemeTitle: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(24), color: NAVY },
    schemeHi: { fontFamily: fontFamily.hindiSemibold, fontSize: fs(13), lineHeight: fs(19), color: '#44464F', marginTop: 3 },
    schemeDesc: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(19.5), color: '#545964', marginTop: s(8) },

    // ---- info cards (PDF: 175 wide each; here forced to the same height)
    infoRow: { flexDirection: 'row', gap: s(10), marginTop: s(14), alignItems: 'stretch' },
    infoCard: { ...card, flex: 1, borderRadius: s(16), padding: s(13) },
    infoHead: { flexDirection: 'row', alignItems: 'center', gap: s(8), minHeight: s(38) },
    infoTile: { width: s(28), height: s(28), borderRadius: s(8), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    infoTitle: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: NAVY },
    infoHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(9), lineHeight: fs(13), color: MUTED },
    infoRule: { height: 1, backgroundColor: '#EEF1F5', marginVertical: s(9) },
    infoValue: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(22), color: NAVY },
    infoUnit: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#64748A' },

    // ---- eligibility (PDF: 360x189, green tint, 24pt tick, 12pt bullets)
    eligible: { marginTop: s(14), backgroundColor: '#E9F4EB', borderRadius: s(16), borderWidth: 1.5, borderColor: '#A9D6B2', padding: s(15) },
    eligibleHead: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    tick: { width: s(24), height: s(24), borderRadius: s(12), backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
    eligibleTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: DEEP_GREEN },
    eligibleSub: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: '#1D7231', marginTop: 2 },
    dlChip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: s(21), paddingHorizontal: s(9), borderRadius: s(11), borderWidth: 1, borderColor: GREEN, backgroundColor: '#FFFFFF' },
    dlChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: DEEP_GREEN },
    eligibleRule: { height: 1, backgroundColor: '#B6D8BD', marginVertical: s(12) },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8), marginBottom: s(9) },
    bulletText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: DEEP_GREEN },
    bold: { fontFamily: fontFamily.bold },

    // ---- transition notice (PDF: amber tint)
    notice: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(14), backgroundColor: '#FFF8E6', borderRadius: s(14), borderWidth: 1.5, borderColor: '#F2C79A', padding: s(14) },
    noticeText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: '#793D00' },
    noticeBold: { fontFamily: fontFamily.bold },

    sectionHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(10), marginTop: s(18), marginBottom: s(10) },
    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: NAVY },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(10), lineHeight: fs(14), color: MUTED },
    countChip: { borderRadius: s(6), backgroundColor: '#E1E5EC', paddingHorizontal: s(9), paddingVertical: s(5) },
    countChipText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },

    // ---- 2x2 entitlement grid (equal-height cards so footers align)
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
    gridCard: { ...card, flexBasis: '46%', flexGrow: 1, borderRadius: s(16), padding: s(13), minHeight: s(150) },
    gridTile: { width: s(28), height: s(28), borderRadius: s(8), backgroundColor: '#E8EBEF', alignItems: 'center', justifyContent: 'center' },
    gridTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: NAVY, marginTop: s(10) },
    gridDesc: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: MUTED, marginTop: 3 },
    gridRule: { height: 1, backgroundColor: '#EEF1F5', marginVertical: s(9) },
    gridChip: { alignSelf: 'flex-start', borderRadius: 6, backgroundColor: '#E9F4EB', paddingHorizontal: s(7), paddingVertical: s(3) },
    gridChipText: { fontFamily: fontFamily.semibold, fontSize: fs(10), color: GREEN },
    gridFoot: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(17), color: NAVY },

    // ---- paperless verification list
    fetched: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: s(6), borderWidth: 1, borderColor: GREEN, backgroundColor: '#E9F4EB', paddingHorizontal: s(9), paddingVertical: s(5) },
    fetchedText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: GREEN },
    paperCard: { ...card, borderRadius: s(16), padding: s(11), gap: s(8) },
    paperRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), minHeight: s(47), backgroundColor: '#F8F9FB', borderRadius: s(10), borderWidth: 1, borderColor: '#F0F4F9', paddingHorizontal: s(10), paddingVertical: s(8) },
    paperTile: { width: s(28), height: s(28), borderRadius: s(8), backgroundColor: '#E8EBEF', alignItems: 'center', justifyContent: 'center' },
    paperBody: { flex: 1, minWidth: 0 },
    paperTitle: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(16), color: NAVY },
    paperSub: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: MUTED },
    paperChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, backgroundColor: '#E9F4EB', paddingHorizontal: s(8), paddingVertical: s(4) },
    paperChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: GREEN },

    helpline: { ...card, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s(8), marginTop: s(14), borderRadius: s(14), paddingHorizontal: s(13), paddingVertical: s(12) },
    helpText: { flexShrink: 1, flexGrow: 1, fontFamily: fontFamily.regular, fontSize: fs(11), color: '#44464F' },
    helpBold: { fontFamily: fontFamily.bold, color: NAVY },
    helpDesk: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },

    footer: { alignItems: 'center', gap: 3, marginTop: s(16), paddingHorizontal: s(4) },
    footerMain: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: MUTED, textAlign: 'center' },
    footerSub: { fontFamily: fontFamily.regular, fontSize: fs(9), lineHeight: fs(13), color: '#747780', textAlign: 'center' },

    // ---- sticky apply bar (PDF: 358x66 orange button, 10pt caption below)
    applyBar: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: colors.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    applyInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(12) },
    applyBtn: { minHeight: s(66), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: s(18), backgroundColor: ORANGE, paddingHorizontal: s(44), paddingVertical: s(8), shadowColor: ORANGE, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    applyText: { alignItems: 'center' },
    applyTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(20), color: '#FFFFFF', textAlign: 'center' },
    applyHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(16), color: '#FFFFFF' },
    applyArrow: { position: 'absolute', right: s(16) },
    applyNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: s(9) },
    applyNoteText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(10), color: MUTED, textAlign: 'center' },
  });
};
