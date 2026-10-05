import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

// Screen 18 of ANVAY_ka_kaam.pdf (Scholarships hub, "For you" view; the Schemes tab lands here). Static mock data only.
// Sizes follow the PDF's drawing data on its ~412pt frame: 36pt search circle, 48pt stat card, 42pt segmented control,
// 40pt scheme tile, 44pt grid tiles, 8pt eligibility bar, 36pt apply button.
// Alignment fixes vs the reference: the "Recommended for you" heading and its "Automated match" chip were wrapped
// over three lines in the PDF; they now sit on one row with the chip on the right. The four "Other schemes" cards
// use equal-height rows so their footers line up.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const INK = '#1F2836';
const MUTED = '#5E6B79';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const others: {
  icon: IconName;
  title: string;
  hi: string;
  desc: string;
  status: 'Eligible' | 'Not eligible';
  action: string;
  note?: string;
  noteTone?: 'red' | 'grey';
}[] = [
  { icon: 'airplane-takeoff', title: 'National Overseas Scholarship', hi: 'राष्ट्रीय प्रवासी छात्रवृत्ति', desc: 'Masters & PhD abroad', status: 'Eligible', action: 'Details' },
  { icon: 'flask', title: 'National Fellowship (NFST)', hi: 'राष्ट्रीय अध्येतावृत्ति', desc: 'M.Phil & PhD in India', status: 'Not eligible', action: 'Criteria', note: 'Requires PG degree', noteTone: 'red' },
  { icon: 'school', title: 'Pre-Matric Scholarship', hi: 'प्री-मैट्रिक छात्रवृत्ति', desc: 'Class 9–10 ST students', status: 'Not eligible', action: 'Completed', note: 'Age/class criteria passed', noteTone: 'grey' },
];

// Small vector scene for the best-match card: graduate, building and tree (redrawn from a low-res raster).
function BestMatchArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 377 110" preserveAspectRatio="xMaxYMax meet">
      <Path d="M236 110 Q290 84 377 90 L377 110 Z" fill="#D8E4F2" />
      {/* building */}
      <Rect x={205} y={42} width={64} height={46} rx={3} fill="#C7D7EA" />
      {[214, 230, 246, 260].map((x) => (
        <Rect key={x} x={x} y={52} width={6} height={36} fill="#B3CAE4" />
      ))}
      <Circle cx={240} cy={34} r={4} fill={NAVY} />
      {/* tree */}
      <Rect x={346} y={54} width={4} height={40} fill="#9AB5D4" />
      <Ellipse cx={347} cy={34} rx={13} ry={16} fill="#B3CAE4" />
      <Ellipse cx={362} cy={46} rx={9} ry={13} fill="#A1BDDD" />
      <Line x1={348} y1={64} x2={338} y2={52} stroke="#9AB5D4" strokeWidth={2.5} strokeLinecap="round" />
      {/* graduate */}
      <Polygon points="308,90 340,90 332,60 316,60" fill={NAVY} />
      <Line x1={324} y1={60} x2={324} y2={90} stroke={ORANGE} strokeWidth={2} strokeDasharray="2 3" />
      <Circle cx={324} cy={50} r={8} fill="#D6A17B" />
      <Polygon points="312,42 324,36 336,42 324,48" fill={DARK} />
      <Rect x={319} y={40} width={10} height={4} fill={DARK} />
      <Path d="M334 41 L337 52" stroke={ORANGE} strokeWidth={2} strokeLinecap="round" />
      <Rect x={304} y={70} width={5} height={16} rx={2} fill="#FFFFFF" transform="rotate(-25 306 78)" />
    </Svg>
  );
}

type Props = {
  onTabSelect?: (key: TabKey) => void;
  onOpenDirectory?: () => void;
  onDetails?: () => void;
  onApply?: () => void;
  onCurrent?: () => void;
  onOpenChat?: () => void;
};

export function ScholarshipsScreen({ onTabSelect, onOpenDirectory, onDetails, onApply, onCurrent, onOpenChat }: Props) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'hi' | 'en'>('en');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navy header with the stats card */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 10 }]}>
          <View style={styles.tricolor}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#138708' }} />
          </View>
          <View style={styles.headerInner}>
            <View style={styles.topRow}>
              <View style={styles.ministry}>
                <Icon name="bank" size={r.s(13)} color="#FF9933" />
                <Text style={styles.ministryText} numberOfLines={1}>
                  MoTA · Government of India / <Hi style={styles.ministryText}>भारत सरकार</Hi>
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change language" hitSlop={10}
                onPress={() => setLang(lang === 'en' ? 'hi' : 'en')}
                style={styles.langBtn}
              >
                <Hi style={styles.langText}>अ</Hi>
                <Text style={styles.langText}> / A</Text>
              </Pressable>
            </View>
            <View style={styles.headerRule} />
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  Scholarships / <Hi style={styles.titleHi}>छात्रवृत्तियाँ</Hi>
                </Text>
                <Text style={styles.subtitle}>5 schemes by Ministry of Tribal Affairs</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Search schemes" onPress={onOpenDirectory} style={styles.searchBtn}>
                <Icon name="magnify" size={r.s(20)} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.stats}>
              {[
                { n: '1', en: 'Active', hi: 'सक्रिय', dot: GREEN, ring: '#D1F9E4', color: INK },
                { n: '2', en: 'Eligible', hi: 'योग्य', dot: NAVY, ring: '#DBE9FD', color: NAVY },
                { n: '2', en: 'Ineligible', hi: 'अपात्र', dot: '#9CA3AF', ring: '#F0F4F9', color: MUTED },
              ].map((st, i) => (
                <View key={st.en} style={[styles.stat, i > 0 && styles.statBorder]}>
                  <View style={[styles.statRing, { backgroundColor: st.ring }]}>
                    <View style={[styles.statDot, { backgroundColor: st.dot }]} />
                  </View>
                  <View>
                    <Text style={[styles.statNum, { color: st.color }]}>
                      {st.n} {st.en}
                    </Text>
                    <Hi style={styles.statHi}>{st.hi}</Hi>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* For you / All schemes */}
          <View style={styles.segment}>
            <View style={[styles.seg, styles.segActive]}>
              <Text style={styles.segActiveText}>
                For you / <Hi style={styles.segActiveText}>आपके लिए</Hi>
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onOpenDirectory} style={styles.seg}>
              <Text style={styles.segText}>
                All schemes / <Hi style={styles.segText}>सभी योजनाएं</Hi>
              </Text>
            </Pressable>
          </View>

          {/* Recommended */}
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Icon name="check-decagram" size={r.s(18)} color={ORANGE} />
              <Text style={styles.sectionTitle}>
                Recommended for you <Hi style={styles.sectionHi}>/{' '}आपके{' '}लिए{' '}सुझाव</Hi>
              </Text>
            </View>
            <View style={styles.autoChip}>
              <Text style={styles.autoChipText}>Automated match</Text>
            </View>
          </View>

          <View style={styles.best}>
            <View style={styles.bestTop}>
              <View style={styles.bestArt}>
                <BestMatchArt />
              </View>
              <View style={styles.bestTopText}>
                <View style={styles.bestPill}>
                  <Icon name="star-circle" size={r.s(15)} color="#FFFFFF" />
                  <Text style={styles.bestPillText}>
                    Best match · <Hi style={styles.bestPillText}>सर्वश्रेष्ठ</Hi>
                  </Text>
                </View>
                <Text style={styles.bestKind}>National Level Direct Disbursal</Text>
                <View style={styles.bestInst}>
                  <Icon name="bank" size={r.s(14)} color="#037756" />
                  <Text style={styles.bestInstText}>Institute of National Importance (INI)</Text>
                </View>
              </View>
            </View>

            <View style={styles.bestBody}>
              <Text style={styles.bestTitle}>Top Class Education Scholarship</Text>
              <Hi style={styles.bestHi}>टॉप क्लास शिक्षा छात्रवृत्ति (ST विद्यार्थी)</Hi>

              <View style={styles.tiles}>
                <View style={styles.tile}>
                  <View style={styles.tileHead}>
                    <Icon name="currency-inr" size={r.s(14)} color={NAVY} />
                    <Text style={styles.tileLabel}>Amount</Text>
                  </View>
                  <Text style={styles.tileValue}>Up to ₹2L/yr</Text>
                </View>
                <View style={styles.tile}>
                  <View style={styles.tileHead}>
                    <Icon name="school" size={r.s(14)} color="#037756" />
                    <Text style={styles.tileLabel}>Tuition</Text>
                  </View>
                  <Text style={styles.tileValue}>Full tuition</Text>
                </View>
                <View style={[styles.tile, styles.tileAmber]}>
                  <View style={styles.tileHead}>
                    <Icon name="calendar-check" size={r.s(14)} color="#D87705" />
                    <Text style={[styles.tileLabel, { color: '#913F0E' }]}>Deadline</Text>
                  </View>
                  <Text style={[styles.tileValue, { color: '#77340F' }]}>31/10/2026</Text>
                </View>
              </View>

              <View style={styles.match}>
                <View style={styles.matchTop}>
                  <View style={styles.matchLeft}>
                    <Icon name="check-circle" size={r.s(16)} color={GREEN} />
                    <Text style={styles.matchTitle}>Eligibility match 4/4</Text>
                  </View>
                  <View style={styles.qualified}>
                    <Text style={styles.qualifiedText}>100% Qualified</Text>
                  </View>
                </View>
                <View style={styles.bar}>
                  <View style={styles.barFill} />
                </View>
                <View style={styles.matchFoot}>
                  <Text style={styles.matchNote}>Income &lt; ₹8L · ST verified · IIT Kharagpur · 86.4% XII</Text>
                  <Text style={styles.autoFilled}>Auto-filled</Text>
                </View>
              </View>

              <View style={styles.bestActions}>
                <Pressable accessibilityRole="button" onPress={onDetails} hitSlop={6} style={styles.viewDetails}>
                  <Text style={styles.viewDetailsText}>
                    View details / <Hi style={styles.viewDetailsHi}>विवरण</Hi>
                  </Text>
                  <Icon name="chevron-right" size={r.s(16)} color={NAVY} />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onApply} style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.applyText}>
                    Apply now / <Hi style={styles.applyText}>आवेदन करें</Hi>
                  </Text>
                  <Icon name="arrow-right" size={r.s(16)} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Current scholarship */}
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Icon name="shield-check" size={r.s(18)} color={GREEN} />
              <Text style={styles.sectionTitle}>
                Your current scholarship <Hi style={styles.sectionHi}>/ वर्तमान छात्रवृत्ति</Hi>
              </Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={onCurrent} style={styles.current}>
            <View style={styles.currentBar} />
            <View style={styles.currentTile}>
              <Icon name="school" size={r.s(20)} color={GREEN} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.currentTitleRow}>
                <Text style={styles.currentTitle}>Post-Matric Scholarship</Text>
                <View style={styles.activeChip}>
                  <Text style={styles.activeChipText}>Active</Text>
                </View>
              </View>
              <Text style={styles.currentSub}>₹18,500 · AY 2026-27 · In review at Nodal Desk</Text>
            </View>
            <Icon name="chevron-right" size={r.s(20)} color="#6B7686" />
          </Pressable>

          {/* Other schemes */}
          <View style={[styles.sectionRow, { marginTop: r.s(20) }]}>
            <View style={styles.sectionLeft}>
              <Icon name="view-grid" size={r.s(17)} color={NAVY} />
              <Text style={styles.sectionTitle}>
                Other schemes <Hi style={styles.sectionHi}>/ अन्य योजनाएं</Hi>
              </Text>
            </View>
            <Text style={styles.portfolio}>MoTA ST Portfolio</Text>
          </View>
          <View style={styles.grid}>
            {others.map((o) => {
              const eligible = o.status === 'Eligible';
              return (
                <View key={o.title} style={styles.gridCard}>
                  <View style={styles.gridTile}>
                    <Icon name={o.icon} size={r.s(20)} color={NAVY} />
                  </View>
                  <Text style={styles.gridTitle}>{o.title}</Text>
                  <Hi style={styles.gridHi}>{o.hi}</Hi>
                  <Text style={styles.gridDesc}>{o.desc}</Text>
                  <View style={{ flex: 1 }} />
                  <View style={styles.gridRule} />
                  <View style={styles.gridFoot}>
                    <View style={[styles.statusChip, !eligible && { backgroundColor: '#F0F4F9' }]}>
                      <View style={[styles.statusDot, { backgroundColor: eligible ? NAVY : '#9CA3AF' }]} />
                      <Text style={[styles.statusText, !eligible && { color: MUTED }]}>{o.status}</Text>
                    </View>
                    {eligible ? (
                      <Pressable accessibilityRole="button" hitSlop={6} onPress={onDetails} style={styles.detailsLink}>
                        <Text style={styles.detailsLinkText}>{o.action}</Text>
                        <Icon name="arrow-right" size={r.s(14)} color={NAVY} />
                      </Pressable>
                    ) : (
                      <Text style={styles.actionMuted}>{o.action}</Text>
                    )}
                  </View>
                  {o.note ? (
                    <Text style={[styles.gridNote, { color: o.noteTone === 'red' ? '#DB2626' : MUTED }]}>{o.note}</Text>
                  ) : (
                    // reserves the note line so footers line up across the row
                    <View style={styles.gridNoteSlot} />
                  )}
                </View>
              );
            })}

            {/* Not sure what fits */}
            <View style={[styles.gridCard, styles.dashed]}>
              <View style={[styles.gridTile, { backgroundColor: '#E1E6EE' }]}>
                <Icon name="help-box-multiple" size={r.s(22)} color={NAVY} />
              </View>
              <Text style={styles.gridTitle}>Not sure what fits?</Text>
              <Text style={[styles.gridDesc, { marginTop: 4 }]}>Check your eligibility in 1 minute using Aadhaar profile</Text>
              <View style={{ flex: 1 }} />
              <Pressable accessibilityRole="button" onPress={onOpenChat} style={styles.startCheck}>
                <Text style={styles.startCheckText}>Start check</Text>
                <Icon name="arrow-right" size={r.s(18)} color={NAVY} />
              </Pressable>
            </View>
          </View>

          {/* Single scheme norm */}
          <View style={styles.norm}>
            <View style={styles.normHead}>
              <Icon name="information" size={r.s(18)} color={NAVY} />
              <Text style={styles.normText}>
                Single Scheme Norm: Only one scholarship can be availed at a time. Compare entitlements before switching.
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onApply} style={styles.normLink}>
              <Text style={styles.normLinkText}>Compare Top Class vs Post-Matric</Text>
              <Icon name="open-in-new" size={r.s(14)} color={NAVY} />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Icon name="lock" size={r.s(13)} color="#037756" />
              <Text style={styles.footerText}>Secured via DigiLocker · PFMS Direct Benefit Transfer (DBT)</Text>
            </View>
            <Text style={styles.footerText}>Content owned by Ministry of Tribal Affairs, Government of India</Text>
            <Text style={styles.footerSmall}>Designed for National Scholarship Portal (NSP) · Version 3.4.2</Text>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="schemes" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(18), borderWidth: 1, borderColor: '#E1E4EB' } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F2F4F9' },
    scroll: { paddingBottom: s(24) },

    header: { backgroundColor: DARK, borderBottomLeftRadius: s(26), borderBottomRightRadius: s(26), paddingBottom: s(16) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10) },
    ministry: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
    ministryText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), color: '#C9D6EC' },
    langBtn: { flexDirection: 'row', alignItems: 'center', height: s(21), paddingHorizontal: s(9), borderRadius: s(6), backgroundColor: 'rgba(255,255,255,0.12)' },
    langText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: '#C9D6EC' },
    headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: s(10) },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(12) },
    title: { fontFamily: fontFamily.bold, fontSize: fs(20), lineHeight: fs(27), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(20), color: '#E2E9F5' },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: '#B7C6E0', marginTop: 1 },
    searchBtn: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
    stats: { ...card, flexDirection: 'row', alignItems: 'center', marginTop: s(14), borderRadius: s(16), paddingVertical: s(8) },
    stat: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), paddingHorizontal: s(4) },
    statBorder: { borderLeftWidth: 1, borderLeftColor: '#E1E4EB' },
    statRing: { width: s(12), height: s(12), borderRadius: s(6), alignItems: 'center', justifyContent: 'center' },
    statDot: { width: s(8), height: s(8), borderRadius: s(4) },
    statNum: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(17) },
    statHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(10), lineHeight: fs(13), color: MUTED },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- segmented control (PDF: 377x42 pill, navy active segment)
    segment: { ...card, flexDirection: 'row', alignItems: 'center', height: s(42), marginTop: s(16), padding: s(5), borderRadius: s(21) },
    seg: { flex: 1, height: '100%', borderRadius: s(16), alignItems: 'center', justifyContent: 'center' },
    segActive: { backgroundColor: NAVY },
    segActiveText: { fontFamily: fontFamily.semibold, fontSize: fs(13), color: '#FFFFFF' },
    segText: { fontFamily: fontFamily.medium, fontSize: fs(13), color: MUTED },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(20), marginBottom: s(10) },
    sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
    sectionTitle: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: DARK },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(13), color: MUTED },
    autoChip: { borderRadius: s(13), backgroundColor: '#E8EDF6', paddingHorizontal: s(10), paddingVertical: s(5) },
    autoChipText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },

    // ---- best match card (PDF: 377x396, illustrated header band, 3 stat tiles, eligibility box)
    best: { ...card, borderRadius: s(22), overflow: 'hidden' },
    bestTop: { backgroundColor: '#E8EDF6', minHeight: s(110), padding: s(15), justifyContent: 'center' },
    bestArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    bestTopText: { maxWidth: '68%', gap: s(8) },
    bestPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, height: s(21), paddingHorizontal: s(9), borderRadius: s(11), backgroundColor: ORANGE },
    bestPillText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: '#FFFFFF' },
    bestKind: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    bestInst: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    bestInstText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(11), lineHeight: fs(16), color: DARK },
    bestBody: { padding: s(15) },
    bestTitle: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(23), color: INK },
    bestHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(13), lineHeight: fs(19), color: NAVY, marginTop: 2 },
    tiles: { flexDirection: 'row', gap: s(8), marginTop: s(14) },
    tile: { flex: 1, minWidth: 0, borderRadius: s(12), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#F2F4F9', paddingHorizontal: s(10), paddingVertical: s(9) },
    tileAmber: { backgroundColor: '#FFFBEB', borderColor: '#FDE689' },
    tileHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tileLabel: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    tileValue: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(17), color: DARK, marginTop: 4 },
    match: { marginTop: s(12), padding: s(11), borderRadius: s(14), borderWidth: 1.5, borderColor: '#A7F2CF', backgroundColor: '#EBFDF4' },
    matchTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
    matchLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    matchTitle: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#054D3B' },
    qualified: { borderRadius: s(11), backgroundColor: '#D1F9E4', paddingHorizontal: s(10), paddingVertical: s(4) },
    qualifiedText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: '#055E46' },
    bar: { height: s(8), borderRadius: s(4), backgroundColor: '#A7F2CF', marginTop: s(10), overflow: 'hidden' },
    barFill: { width: '100%', height: '100%', backgroundColor: GREEN },
    matchFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(8), rowGap: 2, marginTop: s(8) },
    matchNote: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(15), color: '#055E46' },
    autoFilled: { fontFamily: fontFamily.medium, fontSize: fs(10.5), color: '#012B21' },
    bestActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(14) },
    viewDetails: { flexDirection: 'row', alignItems: 'center' },
    viewDetailsText: { fontFamily: fontFamily.bold, fontSize: fs(12.5), color: NAVY },
    viewDetailsHi: { fontFamily: fontFamily.hindiSemibold, fontSize: fs(11), color: NAVY },
    applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: s(36), paddingHorizontal: s(11), borderRadius: s(10), backgroundColor: ORANGE },
    applyText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },

    // ---- current scholarship (PDF: 4pt green left bar)
    current: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(12), overflow: 'hidden', paddingVertical: s(12), paddingRight: s(14), paddingLeft: s(16), minHeight: s(66) },
    currentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: GREEN },
    currentTile: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: '#D1F9E4', alignItems: 'center', justifyContent: 'center' },
    currentTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 },
    currentTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    activeChip: { borderRadius: s(10), backgroundColor: '#D1F9E4', paddingHorizontal: s(9), paddingVertical: s(2) },
    activeChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: GREEN },
    currentSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginTop: 3 },

    // ---- other schemes (equal-height 2-column cards)
    portfolio: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s(9) },
    gridCard: { ...card, flexBasis: '47%', flexGrow: 1, padding: s(13), minHeight: s(190) },
    gridTile: { width: s(44), height: s(44), borderRadius: s(10), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    gridTitle: { fontFamily: fontFamily.bold, fontSize: fs(13.5), lineHeight: fs(17), color: INK, marginTop: s(10) },
    gridHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(16), color: NAVY, marginTop: 2 },
    gridDesc: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 2 },
    gridRule: { height: 1, backgroundColor: '#EEF1F5', marginVertical: s(9) },
    gridFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: s(11), backgroundColor: '#E8EDF6', paddingHorizontal: s(9), paddingVertical: s(4) },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontFamily: fontFamily.bold, fontSize: fs(10.5), color: NAVY },
    detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailsLinkText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },
    actionMuted: { fontFamily: fontFamily.regular, fontSize: fs(10), color: MUTED },
    gridNote: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), marginTop: 6 },
    gridNoteSlot: { height: fs(14), marginTop: 6 },
    dashed: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#9AA9C0', backgroundColor: '#FBFBFD' },
    startCheck: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    startCheckText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY, textDecorationLine: 'underline' },

    norm: { marginTop: s(16), padding: s(15), borderRadius: s(16), borderWidth: 1, borderColor: '#BFDBFD', backgroundColor: '#E8EDF6' },
    normHead: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10) },
    normText: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(19), color: INK },
    normLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: s(9), marginLeft: s(28) },
    normLinkText: { fontFamily: fontFamily.bold, fontSize: fs(11.5), color: NAVY },

    footer: { alignItems: 'center', gap: 4, marginTop: s(20) },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    footerText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, textAlign: 'center' },
    footerSmall: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(15), color: '#7A889B', textAlign: 'center' },
  });
};
