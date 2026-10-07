import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { LoadState } from '../components/LoadState';
import { useApi } from '../api/useApi';
import { useAuth } from '../state/AuthContext';
import type { Student } from '../api/types';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

// Screen 6 of ANVAY_ka_kaam.pdf (My Profile). Static mock data only.
// Alignment fixes vs. the reference: the stray "#1E8E3E" in the Approved chip is gone, status chips and
// chevrons sit in their own fixed columns so long titles wrap instead of pushing them, and everything
// shares one 16pt gutter and one card style.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = colors.success;
const PHOTO = require('../assets/images/profile-photo.png');

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const children = [
  { initials: 'PM', name: 'Pooja Munda', chip: 'Approved', tone: 'green', meta: 'Class 9 · Pre-Matric Scheme · Reg: 20/07/2025' },
  { initials: 'AM', name: 'Amit Munda', chip: 'Eligible', tone: 'gold', meta: 'Class 6 · Vidyanjali Merit · Verified 05/01/2026' },
] as const;

const settings: {
  icon: IconName;
  title: string;
  sub: string;
  hi: string;
  badge?: { text: string; tone: 'green' | 'orange' };
}[] = [
  { icon: 'bank', title: 'Bank & Aadhaar Seeding (DBT)', hi: 'बैंक एवं आधार सीडिंग', sub: 'SBI •••• 4417 (NPCI active)', badge: { text: 'Linked / लिंक है ✓', tone: 'green' } },
  { icon: 'school-outline', title: 'Academic Records & DigiLocker', hi: 'शैक्षणिक रिकॉर्ड', sub: 'Marksheets, bonafide & roll numbers' },
  { icon: 'headset', title: 'Grievance Redressal (CPGRAMS)', hi: 'शिकायत निवारण', sub: 'Ticket #GRV-2026-118 in review', badge: { text: '1 Open', tone: 'orange' } },
  { icon: 'sync', title: 'Offline Data & Background Sync', hi: 'ऑफ़लाइन डेटा सिंक', sub: '12 cached docs · Last synced today' },
  { icon: 'web', title: 'Language & Accessibility', hi: 'भाषा और सुगमता', sub: 'English / हिन्दी / संथाली / मुंडारी' },
];

type Props = { onTabSelect?: (key: TabKey) => void; onLogout?: () => void; onOpenOffline?: () => void; onOpenHelp?: () => void; onOpenSeeding?: () => void };

export function ProfileScreen({ onTabSelect, onLogout, onOpenOffline, onOpenHelp, onOpenSeeding }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [copied, setCopied] = useState(false);

  const { data: me, error, reload } = useApi<Student>('/me');
  const { signOut } = useAuth();

  const copyId = () => {
    try {
      // The browser may refuse (page not focused); the "copied" tick still shows, so a refusal is ignored.
      Promise.resolve((globalThis as any).navigator?.clipboard?.writeText?.(me?.apaarId ?? '')).catch(() => {});
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const logout = async () => {
    await signOut();
    onLogout?.();
  };

  if (!me) return <LoadState error={error} onRetry={reload} label="Loading your profile…" />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navy header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 8 }]}>
          <View style={styles.tricolor}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#138708' }} />
          </View>
          <View style={styles.headerInner}>
            <View style={styles.nspRow}>
              <View style={styles.nsp}>
                <Text style={styles.nspText}>NSP 3.0</Text>
              </View>
            </View>
            <View style={styles.headerRule} />
            <View style={styles.titleRow}>
              <View style={styles.emblem}>
                <Icon name="bank" size={r.s(18)} color="#F2C14D" />
              </View>
              <View style={styles.titleCol}>
                <Text style={styles.title}>
                  My Profile / <Hi style={styles.title}>मेरी प्रोफ़ाइल</Hi>
                </Text>
                <Text style={styles.titleSub} numberOfLines={2}>
                  Ministry of Tribal Affairs · <Hi style={styles.titleSub}>भारत सरकार</Hi>
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change language" hitSlop={10}
                onPress={() => setLang(lang === 'en' ? 'hi' : 'en')}
                style={styles.langBtn}
              >
                <Icon name="translate" size={r.s(16)} color="#FFFFFF" />
                <Text style={styles.langText}>
                  {lang === 'en' ? 'EN' : <Hi style={styles.langText}>हि</Hi>}
                  {' | '}
                  {lang === 'en' ? <Hi style={styles.langText}>हि</Hi> : 'EN'}
                </Text>
              </Pressable>
              <View style={styles.verifiedBtn}>
                <Icon name="check-decagram" size={r.s(20)} color="#3DBB5A" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Identity card */}
          <View style={styles.card}>
            <View style={styles.identity}>
              <View style={styles.photoWrap}>
                <Image source={PHOTO} style={styles.photo} accessibilityLabel="Profile photo" />
                <View style={styles.photoBadge}>
                  <Icon name="check" size={r.s(12)} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.identityCol}>
                <Text style={styles.name}>{me.name}</Text>
                <Text style={styles.college}>{[me.institute, me.course].filter(Boolean).join(' · ')}</Text>
                <View style={styles.tribeChip}>
                  <Icon name="shape-outline" size={r.s(16)} color={ORANGE} />
                  <Text style={styles.tribeText}>{`${me.category} · ${[me.district, me.state].filter(Boolean).join(', ')}`}</Text>
                </View>
              </View>
            </View>
            <View style={styles.dobRow}>
              <Icon name="calendar-blank-outline" size={r.s(15)} color={colors.textSecondary} />
              <Text style={styles.dobText}>{`DOB: ${me.dob}`}{me.ekycDone ? ' · e-KYC validated' : ''}</Text>
            </View>

            <View style={styles.rule} />

            <View style={styles.apaar}>
              <View style={styles.apaarIcon}>
                <Icon name="card-account-details-outline" size={r.s(20)} color={NAVY} />
              </View>
              <View style={styles.apaarCol}>
                <Text style={styles.apaarLabel}>MOTA BENEFICIARY / APAAR ID</Text>
                <Text style={styles.apaarId}>{me.apaarId ?? '—'}</Text>
                <View style={styles.dlChip}>
                  <Icon name="check-decagram" size={r.s(14)} color={GREEN} />
                  <Text style={styles.dlText}>DigiLocker</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Copy APAAR ID" onPress={copyId} hitSlop={8}>
                <Icon name={copied ? 'check' : 'content-copy'} size={r.s(18)} color={copied ? GREEN : colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.tiles}>
              <View style={[styles.tile, styles.tileGreen]}>
                <View style={[styles.tileDot, { backgroundColor: GREEN }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileLabel}>Aadhaar KYC</Text>
                  <Text style={[styles.tileValue, { color: GREEN }]}>
                    Verified / <Hi style={[styles.tileValue, { color: GREEN }]}>सत्यापित</Hi> ✓
                  </Text>
                </View>
              </View>
              <View style={[styles.tile, styles.tileBlue]}>
                <View style={[styles.tileDot, { backgroundColor: NAVY }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileLabel}>Scholarship Portal</Text>
                  <Text style={[styles.tileValue, { color: DARK }]}>NSP 3.0 Synced</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Manage family */}
          <View style={styles.card}>
            <View style={styles.familyHead}>
              <View style={styles.familyIcon}>
                <Icon name="human-male-female-child" size={r.s(22)} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Manage Family / <Hi style={styles.cardTitle}>परिवार प्रबंधन</Hi>
                </Text>
                <Text style={styles.cardSub}>Manage siblings & dependents scholarship portfolios</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>2 Active</Text>
              </View>
            </View>
            <View style={styles.rule} />

            {children.map((c) => {
              const green = c.tone === 'green';
              return (
                <Pressable key={c.name} accessibilityRole="button" onPress={() => toast(`${c.name}: profile view is not available in this demo`)} style={styles.childRow}>
                  <View style={[styles.childAvatar, !green && styles.childAvatarGold]}>
                    <Text style={[styles.childInitials, !green && { color: '#B07A00' }]}>{c.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.childNameRow}>
                      <Text style={styles.childName}>{c.name}</Text>
                      <View style={[styles.chip, green ? styles.chipGreen : styles.chipGold]}>
                        <Text style={[styles.chipText, { color: green ? GREEN : '#B07A00' }]}>{c.chip}</Text>
                      </View>
                    </View>
                    <Text style={styles.childMeta}>{c.meta}</Text>
                  </View>
                  <Icon name="chevron-right" size={r.s(20)} color={colors.textMuted} />
                </Pressable>
              );
            })}

            <Pressable accessibilityRole="button" onPress={() => toast('Adding a family member is not available in this demo')} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
              <Icon name="account-plus-outline" size={r.s(18)} color={ORANGE} />
              <Text style={styles.addText}>
                + Add Child / Sibling / <Hi style={styles.addText}>बच्चा / भाई-बहन जोड़ें</Hi>
              </Text>
            </Pressable>
          </View>

          {/* Settings list */}
          <View style={[styles.card, styles.listCard]}>
            {settings.map((item, i) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                onPress={() => {
                  if (item.title.startsWith('Offline Data')) onOpenOffline?.();
                  else if (item.title.startsWith('Grievance')) onOpenHelp?.();
                  else if (item.title.startsWith('Bank')) onOpenSeeding?.();
                  else if (item.title.startsWith('Academic')) onTabSelect?.('wallet');
                  else toast(`${item.title} is not available in this demo`);
                }}
                style={[styles.listRow, i > 0 && styles.listRowBorder]}
              >
                <View style={styles.listIcon}>
                  <Icon name={item.icon} size={r.s(20)} color={DARK} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listSub}>
                    <Hi style={styles.listSub}>{item.hi}</Hi> · {item.sub}
                  </Text>
                </View>
                {item.badge && (
                  <View style={[styles.badge, item.badge.tone === 'green' ? styles.chipGreen : styles.badgeOrange]}>
                    <Text style={[styles.badgeText, { color: item.badge.tone === 'green' ? GREEN : '#B26A00' }]}>
                      {item.badge.text}
                    </Text>
                  </View>
                )}
                <Icon name="chevron-right" size={r.s(20)} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* Log out */}
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]}
          >
            <Icon name="logout" size={r.s(20)} color={colors.danger} />
            <Text style={styles.logoutText}>
              Log out of all devices / <Hi style={styles.logoutText}>सभी उपकरणों से लॉग आउट करें</Hi>
            </Text>
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRule} />
            <Hi style={styles.footerHi}>जनजातीय कार्य मंत्रालय, भारत सरकार</Hi>
            <Text style={styles.footerLine}>Ministry of Tribal Affairs, Government of India</Text>
            <Text style={styles.footerLine}>National Scholarship Portal (NSP 3.0) · Anvay Mobile Gateway v2.4.1</Text>
            <View style={styles.badges}>
              <Text style={styles.badgeItem}>Empowering Tribal Scholars</Text>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeItem}>DigiLocker Certified</Text>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeItem}>UMANG Integrated</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="profile" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
  const cardBase = { backgroundColor: '#FFFFFF', borderRadius: s(18), borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: s(24) },

    header: { backgroundColor: DARK, paddingBottom: s(18) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    nspRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    nsp: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: s(5) },
    nspText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 },
    headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: s(10) },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginTop: s(12) },
    emblem: { width: s(34), height: s(34), borderRadius: s(17), backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(23), color: '#FFFFFF' },
    titleSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: 'rgba(255,255,255,0.7)' },
    langBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: s(32), paddingHorizontal: s(10), borderRadius: s(8), borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.1)' },
    langText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: '#FFFFFF' },
    verifiedBtn: { width: s(32), height: s(32), borderRadius: s(8), borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    card: { ...cardBase, padding: s(16), marginTop: s(14) },
    rule: { height: 1, backgroundColor: colors.border, marginVertical: s(12) },

    identity: { flexDirection: 'row', gap: s(14) },
    photoWrap: { width: s(80), height: s(80) },
    photo: { width: '100%', height: '100%', borderRadius: s(14), borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceTint },
    photoBadge: { position: 'absolute', right: -6, bottom: -6, width: s(22), height: s(22), borderRadius: s(11), backgroundColor: GREEN, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    identityCol: { flex: 1, minWidth: 0 },
    name: { fontFamily: fontFamily.bold, fontSize: fs(20), lineHeight: fs(26), color: DARK },
    college: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(19), color: colors.textSecondary, marginTop: 2 },
    tribeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: s(10), backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: '#D4E1EF', borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: s(7) },
    tribeText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fs(13), lineHeight: fs(18), color: DARK },
    dobRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s(12) },
    dobText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: colors.textSecondary },

    apaar: { flexDirection: 'row', alignItems: 'center', gap: s(10), backgroundColor: '#F8F9FB', borderWidth: 1, borderColor: colors.border, borderRadius: s(12), padding: s(10) },
    apaarIcon: { width: s(40), height: s(40), borderRadius: s(8), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    apaarCol: { flex: 1, minWidth: 0 },
    apaarLabel: { fontFamily: fontFamily.regular, fontSize: fs(10.5), letterSpacing: 0.5, color: colors.textSecondary },
    apaarId: { fontFamily: mono, fontWeight: '700', fontSize: fs(14), lineHeight: fs(20), color: DARK },
    dlChip: { alignSelf: 'flex-start', marginTop: s(6), flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#B9E0C3', borderRadius: s(8), paddingHorizontal: s(8), paddingVertical: s(5) },
    dlText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: GREEN },

    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10), marginTop: s(12) },
    tile: { flexGrow: 1, flexBasis: s(140), flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: s(12), borderWidth: 1, paddingHorizontal: s(12), paddingVertical: s(10) },
    tileGreen: { backgroundColor: '#E6F4E9', borderColor: '#B9E0C3' },
    tileBlue: { backgroundColor: colors.surfaceTint, borderColor: '#D4E1EF' },
    tileDot: { width: 8, height: 8, borderRadius: 4 },
    tileLabel: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: colors.textSecondary },
    tileValue: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18) },

    familyHead: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
    familyIcon: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: '#FDEBE0', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(23), color: DARK },
    cardSub: { fontFamily: fontFamily.regular, fontSize: fs(12.5), lineHeight: fs(18), color: colors.textSecondary, marginTop: 2 },
    activePill: { backgroundColor: colors.surfaceTint, borderRadius: s(16), paddingHorizontal: s(12), paddingVertical: s(8), alignItems: 'center' },
    activePillText: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(16), color: DARK },

    childRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), backgroundColor: '#F8F9FB', borderWidth: 1, borderColor: colors.border, borderRadius: s(12), padding: s(12), marginBottom: s(10) },
    childAvatar: { width: s(44), height: s(44), borderRadius: s(10), backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: '#D4E1EF', alignItems: 'center', justifyContent: 'center' },
    childAvatarGold: { backgroundColor: '#FFF3CD', borderColor: '#F7DE96' },
    childInitials: { fontFamily: fontFamily.bold, fontSize: fs(15), color: DARK },
    childNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 },
    childName: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(20), color: DARK },
    childMeta: { fontFamily: fontFamily.regular, fontSize: fs(12.5), lineHeight: fs(18), color: colors.textSecondary, marginTop: 2 },
    chip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
    chipGreen: { backgroundColor: colors.successBg, borderColor: '#B9E0C3' },
    chipGold: { backgroundColor: '#FFF6D9', borderColor: '#F2D98A' },
    chipText: { fontFamily: fontFamily.bold, fontSize: fs(11.5) },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: s(46), borderRadius: s(12), borderWidth: 1.5, borderColor: ORANGE, backgroundColor: '#FFF9F5', paddingHorizontal: s(12), paddingVertical: s(8) },
    addText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(13.5), color: ORANGE, textAlign: 'center' },

    listCard: { paddingVertical: s(4), paddingHorizontal: s(12) },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingVertical: s(14) },
    listRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    listIcon: { width: s(42), height: s(42), borderRadius: s(10), backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: '#D4E1EF', alignItems: 'center', justifyContent: 'center' },
    listTitle: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(21), color: DARK },
    listSub: { fontFamily: fontFamily.regular, fontSize: fs(12.5), lineHeight: fs(18), color: colors.textSecondary, marginTop: 2 },
    badge: { borderRadius: s(8), borderWidth: 1, paddingHorizontal: s(9), paddingVertical: s(5), maxWidth: '30%' },
    badgeOrange: { backgroundColor: '#FFF1DE', borderColor: '#F7D9AE' },
    badgeText: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(16), textAlign: 'center' },

    logout: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(16), minHeight: s(52), borderRadius: s(14), borderWidth: 1.5, borderColor: colors.danger, backgroundColor: '#FFFFFF', paddingHorizontal: s(16), paddingVertical: s(10) },
    logoutText: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(21), color: colors.danger, textAlign: 'center' },

    footer: { alignItems: 'center', marginTop: s(18), paddingBottom: s(8) },
    footerRule: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginBottom: s(14) },
    footerHi: { fontFamily: fontFamily.hindiBold, fontSize: fs(13), lineHeight: fs(19), color: DARK },
    footerLine: { fontFamily: fontFamily.regular, fontSize: fs(12.5), lineHeight: fs(18), color: colors.textSecondary, textAlign: 'center' },
    badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: s(10), rowGap: 6, marginTop: s(14) },
    badgeItem: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: colors.textMuted, textAlign: 'center' },
    badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  });
};
