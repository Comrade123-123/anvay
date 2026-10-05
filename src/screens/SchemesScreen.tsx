import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

// Screen 10 of ANVAY_ka_kaam.pdf (Schemes Directory). Static mock data only.
// Sizes and icon sizes follow the PDF's drawing data on its 390pt frame: 44pt scheme tiles with 22pt icons,
// 44pt search field with a 20pt magnifier, 30pt filter chips, 22pt back / help icons, 20pt chevrons.
// The search box and category chips really filter the mock list.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const INK = '#0E1C2D';
const GREY = '#44464F';
const CODE = '#747780';

type IconName = React.ComponentProps<typeof Icon>['name'];
type Category = 'pre' | 'post' | 'higher' | 'fellowship' | 'overseas';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

type Scheme = {
  code: string;
  cat: Category;
  icon: IconName;
  amount: string;
  status: 'Enrolled' | 'Eligible' | 'Active';
  statusHi: string;
  title: string;
  hi: string;
  desc: string;
  amountChipWide?: boolean;
};

const schemes: Scheme[] = [
  { code: 'PMS-ST-2026', cat: 'post', icon: 'school-outline', amount: '₹18,500/yr', status: 'Enrolled', statusHi: 'नामांकित', title: 'Post-Matric Scholarship for ST', hi: 'पोस्ट-मैट्रिक छात्रवृत्ति योजना', desc: 'Class 11 to PhD · Family income up to ₹2,50,000' },
  { code: 'PRE-ST-0910', cat: 'pre', icon: 'book-open-variant', amount: '₹3,500/yr', status: 'Eligible', statusHi: 'पात्र', title: 'Pre-Matric Scholarship for ST', hi: 'प्री-मैट्रिक छात्रवृत्ति योजना', desc: 'Class 9 & 10 in Govt schools · Family income up to ₹2.5 Lakh' },
  { code: 'TC-ST-HE', cat: 'higher', icon: 'bank', amount: '₹1,25,000/yr', status: 'Eligible', statusHi: 'पात्र', title: 'National Top Class Education', hi: 'राष्ट्रीय शीर्ष श्रेणी शिक्षा छात्रवृत्ति', desc: 'Top 250 institutes (IIT, IIM, AIIMS) · Full Tuition + Living' },
  { code: 'NFST-PHD', cat: 'fellowship', icon: 'microscope', amount: '₹38,000/mo', status: 'Eligible', statusHi: 'पात्र', title: 'National Fellowship (NFST)', hi: 'राष्ट्रीय जनजातीय अध्येतावृत्ति योजना', desc: 'M.Phil & Ph.D Scholars · NET qualified or direct selection' },
  { code: 'NOS-ST-INTL', cat: 'overseas', icon: 'airplane-takeoff', amount: '100% Tuition + Living', status: 'Active', statusHi: 'सक्रिय', title: 'National Overseas Scholarship', hi: 'राष्ट्रीय प्रवासी छात्रवृत्ति योजना', desc: 'Masters & Ph.D abroad in top 500 QS universities · 100% Funded' },
];

const chips: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'All Schemes' },
  { key: 'pre', label: 'Pre-Matric' },
  { key: 'post', label: 'Post-Matric' },
  { key: 'higher', label: 'Higher Education' },
  { key: 'fellowship', label: 'Fellowship' },
  { key: 'overseas', label: 'Overseas' },
];

type Props = { onBack?: () => void; onTabSelect?: (key: TabKey) => void; onOpenScheme?: (code: string) => void; onOpenChat?: () => void; onOpenHelp?: () => void };

// Only Top Class Education has a details page in the design, so only its card opens one.
const HAS_DETAILS = ['TC-ST-HE'];

export function SchemesScreen({ onBack, onTabSelect, onOpenScheme, onOpenChat, onOpenHelp }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'hi' | 'en'>('en');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<'all' | Category>('all');
  const [searchFocused, setSearchFocused] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schemes.filter(
      (sc) =>
        (cat === 'all' || sc.cat === cat) &&
        (!q || [sc.code, sc.title, sc.desc, sc.hi].some((t) => t.toLowerCase().includes(q))),
    );
  }, [query, cat]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Navy header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 12 }]}>
          <View style={styles.tricolor}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#138708' }} />
          </View>
          <View style={styles.headerInner}>
            <View style={styles.titleRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.backBtn}>
                <Icon name="arrow-left" size={r.s(22)} color="#FFFFFF" />
              </Pressable>
              <View style={styles.titleCol}>
                <Text style={styles.title} numberOfLines={2}>
                  Schemes Directory <Hi style={styles.titleHi}>/{' '}योजना{' '}निर्देशिका</Hi>
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  <Hi style={styles.subtitle}>जनजातीय कार्य मंत्रालय</Hi> | MoTA (Govt. of India)
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
              <Pressable accessibilityRole="button" accessibilityLabel="Help" hitSlop={8} onPress={onOpenHelp}>
                <Icon name="help-circle-outline" size={r.s(24)} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
          <View style={styles.gateway}>
            <View style={styles.gatewayInner}>
              <View style={styles.gatewayLeft}>
                <View style={styles.gatewayDot} />
                <Text style={styles.gatewayText}>
                  DBT Gateway: <Text style={styles.gatewayActive}>Active</Text>
                </Text>
              </View>
              <Text style={styles.gatewayUpdated}>Updated: May 2026</Text>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Single scheme norm notice */}
          <View style={styles.notice}>
            <View style={styles.noticeBar} />
            <View style={styles.noticeContent}>
              <Icon name="shield-check-outline" size={r.s(20)} color={NAVY} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>
                  SINGLE SCHEME NORM / <Hi style={styles.noticeTitle}>एकल योजना नियम</Hi>
                </Text>
                <Text style={styles.noticeBody}>
                  As per Ministry of Tribal Affairs (MoTA) guidelines, ST beneficiaries may draw benefit under{' '}
                  <Text style={styles.noticeBold}>only one primary scholarship scheme</Text> simultaneously. Duplicate
                  applications are auto-flagged via Aadhaar DBT.
                </Text>
              </View>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.search, searchFocused && styles.searchFocused]}>
            <Icon name="magnify" size={r.s(20)} color="#5E6267" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search scheme, code or keyword / खोजें"
              placeholderTextColor="#747780"
              accessibilityLabel="Search schemes"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
                <Icon name="close-circle" size={r.s(18)} color="#5E6267" />
              </Pressable>
            ) : (
              <Icon name="tune-variant" size={r.s(18)} color="#5E6267" />
            )}
          </View>
        </View>

        {/* Filter chips: full-bleed horizontal scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {chips.map((c) => {
            const active = cat === c.key;
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setCat(c.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{c.label}</Text>
                {c.key === 'all' && (
                  <View style={[styles.chipCount, active && styles.chipCountActive]}>
                    <Text style={[styles.chipCountText, active && { color: '#FFFFFF' }]}>{schemes.length}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.column}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>AVAILABLE MOTA SCHEMES ({list.length})</Text>
            <Text style={styles.ay}>AY 2026-27</Text>
          </View>

          {list.length === 0 && (
            <View style={styles.empty}>
              <Icon name="magnify" size={r.s(28)} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No schemes found</Text>
              <Text style={styles.emptyBody}>Try a different keyword or clear the filter.</Text>
            </View>
          )}

          {list.map((sc) => {
            const statusColor = sc.status === 'Eligible' ? NAVY : colors.indiaGreen;
            return (
              <Pressable
                key={sc.code}
                accessibilityRole="button"
                onPress={HAS_DETAILS.includes(sc.code) ? () => onOpenScheme?.(sc.code) : () => toast('Scheme details are not available in this demo')}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.tile}>
                  <Icon name={sc.icon} size={r.s(22)} color={NAVY} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    <View style={styles.codeRow}>
                      <Text style={styles.code}>{sc.code}</Text>
                      <View style={styles.amountChip}>
                        <Text style={styles.amountText}>{sc.amount}</Text>
                      </View>
                    </View>
                    <View style={styles.statusChip}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {sc.status} / <Hi style={[styles.statusText, { color: statusColor }]}>{sc.statusHi}</Hi>
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{sc.title}</Text>
                  <Hi style={styles.cardHi}>{sc.hi}</Hi>
                  <View style={styles.descRow}>
                    <Text style={styles.desc}>{sc.desc}</Text>
                    <Icon name="chevron-right" size={r.s(20)} color="#747780" />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Portal footer band */}
        <View style={styles.portal}>
          <Text style={styles.portalTitle}>National Scholarship Portal | Ministry of Tribal Affairs</Text>
          <Text style={styles.portalLine}>
            Designed, developed and hosted by <Text style={styles.portalBold}>National Informatics Centre (NIC)</Text>
          </Text>
          <Text style={styles.portalSmall}>
            Government of India | <Hi style={styles.portalSmall}>भारत सरकार</Hi> · All Rights Reserved 2026
          </Text>
        </View>
      </ScrollView>

      {/* Assistant button floats above the tab bar */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        <Pressable accessibilityRole="button" onPress={onOpenChat} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}>
          <View style={styles.fabDot} />
          <Icon name="robot-outline" size={r.s(20)} color="#FF9933" />
          <Text style={styles.fabText}>MoTA Sahayak / JAGO AI</Text>
        </Pressable>
      </View>

      <BottomTabBar active="schemes" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const fabRight = Math.max((r.width - r.maxContentWidth) / 2, 0) + pad;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F9' },
    scroll: { paddingBottom: s(96) },

    // ---- header (PDF: 15pt title, 10pt subtitle, 28pt lang pill, gateway strip 30pt)
    header: { backgroundColor: DARK },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingBottom: s(10) },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    backBtn: { width: s(24), alignItems: 'flex-start' },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.semibold, fontSize: fs(15), lineHeight: fs(21), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(15), color: '#C9D6EC' },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: '#C9D6EC' },
    langBtn: { flexDirection: 'row', alignItems: 'center', height: s(23), paddingHorizontal: s(9), borderRadius: s(6), borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)' },
    langText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: '#FFFFFF' },
    gateway: { backgroundColor: '#0C1C36' },
    gatewayInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, minHeight: s(30), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), paddingVertical: s(5) },
    gatewayLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    gatewayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#138708' },
    gatewayText: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#FFFFFF' },
    gatewayActive: { fontFamily: fontFamily.semibold, color: '#6EE6B6' },
    gatewayUpdated: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#9AA6B8' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- single scheme notice (PDF: 358x118, blue-tinted, left accent bar)
    notice: { flexDirection: 'row', marginTop: s(13), backgroundColor: '#EDF4F9', borderRadius: s(12), borderWidth: 1, borderColor: '#D3DFED', overflow: 'hidden' },
    noticeBar: { width: 4, backgroundColor: '#C7D8EC' },
    noticeContent: { flex: 1, flexDirection: 'row', gap: s(10), padding: s(14) },
    noticeTitle: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(17), letterSpacing: 0.2, color: DARK },
    noticeBody: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(18), color: '#233142', marginTop: 3 },
    noticeBold: { fontFamily: fontFamily.bold },

    // ---- search (PDF: 358x44, 14pt radius, border #CCD1DD)
    search: { flexDirection: 'row', alignItems: 'center', gap: s(10), height: s(44), marginTop: s(14), paddingHorizontal: s(16), borderRadius: s(14), borderWidth: 1.5, borderColor: '#CCD1DD', backgroundColor: '#FFFFFF' },
    searchFocused: { borderColor: NAVY },
    searchInput: {
      flex: 1,
      height: '100%',
      fontFamily: fontFamily.regular,
      fontSize: fs(13),
      color: colors.textPrimary,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },

    // ---- filter chips (PDF: 30pt tall pills)
    chipsScroll: { flexGrow: 0, marginTop: s(12) },
    chipsContent: { paddingHorizontal: pad, gap: s(8) },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: s(32), paddingHorizontal: s(14), borderRadius: s(16), borderWidth: 1, borderColor: '#CCD1DD', backgroundColor: '#FFFFFF' },
    chipActive: { backgroundColor: DARK, borderColor: DARK },
    chipText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: DARK },
    chipCount: { minWidth: s(18), height: s(18), borderRadius: s(9), alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: '#E1E4EB' },
    chipCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
    chipCountText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: DARK },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(18), marginBottom: s(9) },
    sectionLabel: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(11), letterSpacing: 0.7, color: DARK },
    ay: { fontFamily: fontFamily.regular, fontSize: fs(12), color: '#44464F' },

    // ---- scheme cards (PDF: 358 wide, padding 15, 44pt tile, text column starts 12pt after the tile)
    card: { flexDirection: 'row', gap: s(12), marginBottom: s(10), padding: s(15), backgroundColor: '#FFFFFF', borderRadius: s(16), borderWidth: 1, borderColor: colors.border },
    tile: { width: s(44), height: s(44), borderRadius: s(10), backgroundColor: '#EDF4F9', alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, minWidth: 0 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(8), rowGap: s(6) },
    codeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: s(8), rowGap: s(4), flexShrink: 1 },
    code: { fontFamily: fontFamily.semibold, fontSize: fs(10), letterSpacing: 0.5, color: CODE },
    amountChip: { borderRadius: 6, backgroundColor: '#EDF4F9', paddingHorizontal: s(8), paddingVertical: s(3) },
    amountText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: '#1A3A6B' },
    statusChip: { borderRadius: s(11), backgroundColor: '#E8EFFD', paddingHorizontal: s(8), paddingVertical: s(4) },
    statusText: { fontFamily: fontFamily.bold, fontSize: fs(11) },
    cardTitle: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(21), color: INK, marginTop: s(8) },
    cardHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(13), lineHeight: fs(19), color: '#1A3A6B' },
    descRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: s(8), marginTop: 4 },
    desc: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(15.5), color: GREY },

    empty: { alignItems: 'center', gap: 4, paddingVertical: s(32) },
    emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fs(14), color: DARK },
    emptyBody: { fontFamily: fontFamily.regular, fontSize: fs(12), color: GREY },

    portal: { alignItems: 'center', gap: 4, marginTop: s(8), paddingVertical: s(16), paddingHorizontal: s(20), backgroundColor: '#E9EDF4' },
    portalTitle: { fontFamily: fontFamily.bold, fontSize: fs(11.5), lineHeight: fs(16), color: DARK, textAlign: 'center' },
    portalLine: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: '#5E6267', textAlign: 'center' },
    portalBold: { fontFamily: fontFamily.bold, color: DARK },
    portalSmall: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(15), color: '#747780', textAlign: 'center' },

    // ---- assistant pill (PDF: 213x42, navy with a light ring)
    fabWrap: { position: 'absolute', left: 0, right: 0, bottom: s(72), alignItems: 'flex-end' },
    fab: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginRight: fabRight, height: s(42), paddingHorizontal: s(16), borderRadius: s(21), backgroundColor: DARK, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
    fabDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#138708' },
    fabText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },
  });
};
