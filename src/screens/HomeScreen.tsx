import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { OnboardingIllustration } from '../components/OnboardingIllustration';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';
import { LoadState } from '../components/LoadState';
import { useApi } from '../api/useApi';
import type { HomeData, SchemesData } from '../api/types';

// Screen 5 of ANVAY_ka_kaam.pdf (home dashboard). Everything on it comes from /api/home and /api/schemes.
// Alignment fixes vs. the reference: real logo in the header, one shared 16pt gutter,
// equal-width quick actions, a swipeable scheme carousel, the tab bar on one baseline, and the
// chat button floating above the tab bar instead of covering content.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = colors.success;

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const quickActions: { icon: IconName; en: string; hi: string }[] = [
  { icon: 'file-document-edit-outline', en: 'Apply Scheme', hi: 'आवेदन करें' },
  { icon: 'bank', en: 'DBT Status', hi: 'डीबीटी स्थिति' },
  { icon: 'folder-account', en: 'DigiLocker', hi: 'प्रमाण पत्र' },
  { icon: 'headset', en: 'Grievance', hi: 'शिकायत निवारण' },
];

const categoryTag: Record<string, string> = {
  pre: 'Classes 9 & 10',
  post: 'Class 11 onwards',
  higher: 'Top institutes',
  fellowship: 'M.Phil / PhD',
  overseas: 'Overseas study',
};

const statusChip = {
  enrolled: { label: 'Enrolled', tone: 'green' },
  eligible: { label: 'Eligible', tone: 'gold' },
  not_eligible: { label: 'Not eligible', tone: 'grey' },
} as const;

type Props = {
  onTabSelect?: (key: TabKey) => void;
  onOpenDbt?: () => void;
  onOpenJourney?: () => void;
  onOpenSchemes?: () => void;
  onOpenWallet?: () => void;
  onOpenNotifications?: () => void;
  onOpenCalendar?: () => void;
  onOpenChat?: () => void;
  onOpenHelp?: () => void;
  onOpenSeeding?: () => void;
  onOpenScheme?: (code: string) => void;
};

export function HomeScreen({
  onTabSelect,
  onOpenDbt,
  onOpenJourney,
  onOpenSchemes,
  onOpenWallet,
  onOpenNotifications,
  onOpenCalendar,
  onOpenChat,
  onOpenHelp,
  onOpenSeeding,
  onOpenScheme,
}: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const cardWidth = Math.min(r.contentWidth * 0.82, r.s(330));
  const { data, error, reload } = useApi<HomeData>('/home');
  const sch = useApi<SchemesData>('/schemes');

  if (!data) return <LoadState error={error} onRetry={reload} label="Loading your dashboard…" />;
  const { student, application: app } = data;
  const schemes = sch.data?.schemes ?? [];
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

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
            <View style={styles.onlineRow}>
              <View style={styles.online}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>
                  Online / <Hi style={styles.onlineText}>सिंक सक्रिय</Hi>
                </Text>
              </View>
            </View>

            <View style={styles.brandRow}>
              <View style={styles.emblem}>
                <Icon name="leaf" size={r.s(22)} color="#FFFFFF" />
              </View>
              <View style={styles.brandCol}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brand}>ANVAY</Text>
                  <View style={styles.brandChip}>
                    <Hi style={styles.brandChipText}>अन्वय</Hi>
                  </View>
                </View>
                <Text style={styles.brandSub} numberOfLines={2}>
                  Ministry of Tribal Affairs, Govt. of India
                </Text>
                <Hi style={styles.brandHi}>जनजातीय कार्य मंत्रालय, भारत सरकार</Hi>
              </View>
              <View style={styles.toggle}>
                <Pressable onPress={() => setLang('en')} style={[styles.toggleItem, lang === 'en' && styles.toggleActive]}>
                  <Text style={[styles.toggleText, lang === 'en' && { color: DARK }]}>EN</Text>
                </Pressable>
                <Pressable onPress={() => setLang('hi')} style={[styles.toggleItem, lang === 'hi' && styles.toggleActive]}>
                  <Hi style={[styles.toggleText, lang === 'hi' && { color: DARK }]}>हिं</Hi>
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onOpenNotifications} style={styles.bell}>
                <Icon name="bell-outline" size={r.s(18)} color="#FFFFFF" />
                {data.unreadCount > 0 && <View style={styles.bellDot} />}
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Profile strip */}
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{student.initials}</Text>
            </View>
            <View style={styles.profileCol}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>{student.name}</Text>
                <View style={styles.stChip}>
                  <Text style={styles.stText}>{student.category}</Text>
                </View>
              </View>
              <Text style={styles.apaar} numberOfLines={1}>
                APAAR/ID: <Text style={styles.apaarId}>{student.apaarId ?? '—'}</Text>
              </Text>
              <Text style={styles.place} numberOfLines={1}>
                {[student.district, student.state].filter(Boolean).join(', ')}
                {student.districtHi && student.stateHi ? <> / <Hi style={styles.place}>{`${student.districtHi}, ${student.stateHi}`}</Hi></> : null}
              </Text>
            </View>
            {student.ekycDone && (
              <View style={styles.kyc}>
                <Icon name="check-decagram-outline" size={r.s(14)} color={GREEN} />
                <Text style={styles.kycText}>e-KYC Done</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            {/* Banner */}
            <View style={styles.banner}>
              <OnboardingIllustration />
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={DARK} stopOpacity={0.88} />
                    <Stop offset="0.6" stopColor={DARK} stopOpacity={0.35} />
                    <Stop offset="1" stopColor={DARK} stopOpacity={0.05} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
              </Svg>
              <View style={styles.bannerText}>
                <View style={styles.bannerChip}>
                  <Text style={styles.bannerChipText}>DBT DIRECT PAY</Text>
                </View>
                <Text style={styles.bannerTitle}>Unified Tribal Scholarships</Text>
                <Hi style={styles.bannerSub}>सशक्त जनजातीय युवा, विकसित भारत</Hi>
              </View>
            </View>

            {/* Quick actions: four equal columns */}
            <View style={styles.actions}>
              {quickActions.map((a) => (
                <Pressable
                  key={a.en}
                  accessibilityRole="button"
                  onPress={
                    a.en === 'DBT Status'
                      ? onOpenDbt
                      : a.en === 'Apply Scheme'
                        ? onOpenSchemes
                        : a.en === 'DigiLocker'
                          ? onOpenWallet
                          : a.en === 'Grievance'
                            ? onOpenHelp
                            : undefined
                  }
                  style={styles.action}
                >
                  <View style={styles.actionIcon}>
                    <Icon name={a.icon} size={r.s(22)} color={NAVY} />
                  </View>
                  <Text style={styles.actionEn}>{a.en}</Text>
                  <Hi style={styles.actionHi}>{a.hi}</Hi>
                </Pressable>
              ))}
            </View>

            {/* Active application */}
            {app ? (
            <View style={styles.card}>
              <View style={styles.appHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appLabel}>
                    ACTIVE APPLICATION / <Hi style={styles.appLabel}>सक्रिय आवेदन</Hi>
                  </Text>
                  <Text style={styles.appPortal}>MoTA DBT Portal • 2026-27</Text>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{app.statusLabel}</Text>
                </View>
              </View>
              <View style={styles.rule} />

              <Text style={styles.appScheme}>Centrally Sponsored Scheme (Ministry of Tribal Affairs)</Text>
              <View style={styles.appTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appTitle}>{app.title}</Text>
                  {!!app.titleHi && <Hi style={styles.appTitleHi}>{app.titleHi}</Hi>}
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amount}>{app.amount != null ? inr(app.amount) : '—'}</Text>
                  <Text style={styles.amountSub}>DBT Entitlement</Text>
                </View>
              </View>

              {/* Stepper: 4 equal columns, connector lines sit between circle centres */}
              <View style={styles.stepper}>
                {app.steps.map((st, i, all) => (
                  <View key={st.key} style={styles.step}>
                    <View style={styles.stepTrack}>
                      <View style={[styles.line, styles.lineL, i === 0 && styles.lineHidden, i > 0 && all[i - 1].state === 'done' && styles.lineDone]} />
                      <View style={[styles.line, styles.lineR, i === all.length - 1 && styles.lineHidden, st.state === 'done' && styles.lineDone, st.state === 'current' && styles.lineHalf]} />
                      {st.state === 'done' && (
                        <View style={[styles.node, styles.nodeDone]}>
                          <Icon name="check" size={r.s(15)} color="#FFFFFF" />
                        </View>
                      )}
                      {st.state === 'current' && (
                        <View style={styles.halo}>
                          <View style={[styles.node, styles.nodeCurrent]}>
                            <Icon name="shield-check-outline" size={r.s(16)} color="#FFFFFF" />
                          </View>
                        </View>
                      )}
                      {st.state === 'todo' && (
                        <View style={[styles.node, styles.nodeTodo]}>
                          {st.key === 'sanctioned' ? (
                            <View style={styles.pendingDot} />
                          ) : (
                            <Icon name="bank-outline" size={r.s(15)} color={colors.textSecondary} />
                          )}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.stepLabel, st.state === 'current' && styles.stepLabelCurrent, st.state === 'todo' && styles.stepLabelTodo]}>
                      {st.label}
                    </Text>
                    <Text style={[styles.stepSub, st.state === 'current' && styles.stepSubCurrent]}>{st.sub}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.rule} />
              <View style={styles.trackRow}>
                <Pressable accessibilityRole="button" onPress={onOpenJourney} hitSlop={10} style={styles.trackLink}>
                  <Text style={styles.trackText}>
                    Track Status / <Hi style={styles.trackText}>स्थिति जांचें</Hi>
                  </Text>
                  <Icon name="arrow-right" size={r.s(15)} color={NAVY} />
                </Pressable>
                <View style={styles.aadhaarChip}>
                  <Text style={styles.aadhaarChipText}>Aadhaar DBT •••• {student.bank.last4 ?? '----'}</Text>
                </View>
              </View>
            </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.appLabel}>
                  ACTIVE APPLICATION / <Hi style={styles.appLabel}>सक्रिय आवेदन</Hi>
                </Text>
                <Text style={styles.appPortal}>You have no active application yet. Start one from Apply Scheme.</Text>
              </View>
            )}

            {/* Action needed */}
            {data.alert && (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <Icon name="alert-circle-outline" size={r.s(20)} color={colors.danger} />
                </View>
                <View style={styles.alertBody}>
                  <View style={styles.alertTitleRow}>
                    <Text style={styles.alertTitle}>
                      Action Needed / <Hi style={styles.alertTitle}>आवश्यक कार्रवाई</Hi>
                    </Text>
                    {data.alert.due && (
                      <View style={styles.dueChip}>
                        <Text style={styles.dueText}>Due {data.alert.due}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.alertCopy}>{data.alert.body}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={data.alert.linkTo === 'wallet' ? onOpenWallet : onOpenSeeding} style={({ pressed }) => [styles.fixBtn, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.fixText}>Fix Now</Text>
                  <Icon name="arrow-right" size={r.s(14)} color="#FFFFFF" />
                </Pressable>
              </View>
            )}

            {/* Deadline */}
            {data.nextDeadline && (
              <Pressable accessibilityRole="button" onPress={onOpenCalendar} style={styles.deadline}>
                <View style={styles.deadlineIcon}>
                  <Icon name="calendar-check" size={r.s(20)} color={NAVY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deadlineTitle}>
                    {data.nextDeadline.title} in <Text style={{ color: ORANGE }}>{data.nextDeadline.daysLeft} {data.nextDeadline.daysLeft === 1 ? 'day' : 'days'}</Text>
                  </Text>
                  <Text style={styles.deadlineSub}>
                    {data.nextDeadline.subtitle ? `${data.nextDeadline.subtitle} · ` : ''}Last date: {data.nextDeadline.date}
                  </Text>
                </View>
                <Icon name="chevron-right" size={r.s(20)} color={colors.textSecondary} />
              </Pressable>
            )}

            {/* Eligibility */}
            <View style={styles.sectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Your Eligibility / <Hi style={styles.sectionTitle}>पात्रता योजनाएं</Hi>
                </Text>
                <Text style={styles.sectionSub}>{sch.data ? `${sch.data.summary.eligible} eligible · ${sch.data.summary.active} enrolled · ${sch.data.summary.total} schemes` : 'Matching schemes to your APAAR profile…'}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={onOpenSchemes} hitSlop={10} style={styles.viewAll}>
                <Text style={styles.viewAllText}>
                  View All <Hi style={styles.viewAllText}>(सभी)</Hi>
                </Text>
                <Icon name="chevron-right" size={r.s(16)} color={NAVY} />
              </Pressable>
            </View>
          </View>

          {/* Full-bleed carousel, aligned to the page gutter at the start */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + r.s(12)}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: r.s(16), gap: r.s(12) }}
            style={styles.carousel}
          >
            {schemes.map((sc) => (
              <View key={sc.code} style={[styles.schemeCard, { width: cardWidth }]}>
                <View style={styles.schemeChips}>
                  <View style={styles.tagChip}>
                    <Text style={styles.tagText}>{categoryTag[sc.category] ?? sc.category}</Text>
                  </View>
                  <View style={[styles.statusChip, statusChip[sc.status].tone === 'green' ? styles.chipGreen : styles.chipGold, statusChip[sc.status].tone === 'grey' && { backgroundColor: '#F0F2F4', borderColor: '#D5DAE1' }]}>
                    <Text style={[styles.statusChipText, { color: statusChip[sc.status].tone === 'green' ? GREEN : statusChip[sc.status].tone === 'grey' ? '#5E6B79' : colors.warning }]}>{statusChip[sc.status].label}</Text>
                  </View>
                </View>
                <Text style={styles.schemeTitle}>{sc.title}</Text>
                <Text style={styles.schemeDesc}>{sc.summary ?? ''}</Text>
                <View style={styles.rule} />
                <View style={styles.schemeFoot}>
                  <View>
                    <Text style={styles.entLabel}>ENTITLEMENT</Text>
                    <Text style={styles.entAmount}>{sc.amountText}</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => onOpenScheme?.(sc.code)} style={({ pressed }) => [styles.detailsBtn, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.detailsText}>Details</Text>
                    <Icon name="arrow-right" size={r.s(14)} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.content}>
            {/* Linked services */}
            <View style={styles.linked}>
              <View style={styles.linkedIcon}>
                <Icon name="check-decagram-outline" size={r.s(22)} color={NAVY} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.linkedTitleRow}>
                  <Text style={styles.linkedTitle}>DigiLocker & PFMS Linked</Text>
                  <View style={styles.activeRow}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.linkedSub}>NPCI Aadhaar Bridge: State Bank of India (••• 4291)</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Refresh link status" hitSlop={8} onPress={() => toast('Link status refreshed')}>
                <Icon name="sync" size={r.s(20)} color={NAVY} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Chat assistant floats above the tab bar, on the right gutter */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        <Pressable accessibilityRole="button" onPress={onOpenChat} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}>
          <Icon name="message-text-outline" size={r.s(18)} color={ORANGE} />
          <Text style={styles.fabText}>MoTA Sahayak</Text>
          <View style={styles.fabDot} />
        </Pressable>
      </View>

      <BottomTabBar active="home" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(16), borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: s(96) },

    header: { backgroundColor: DARK, paddingBottom: s(16) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    onlineRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    online: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: s(5) },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DBB5A' },
    onlineText: { fontFamily: fontFamily.regular, fontSize: fs(11), color: 'rgba(255,255,255,0.9)' },
    brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: s(12), gap: s(10) },
    emblem: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
    brandCol: { flex: 1, minWidth: 0 },
    brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    brand: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(21), color: '#FFFFFF' },
    brandChip: { backgroundColor: ORANGE, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    brandChipText: { fontFamily: fontFamily.hindiBold, fontSize: fs(10), color: '#FFFFFF' },
    brandSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(14), color: 'rgba(255,255,255,0.82)' },
    brandHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(9.5), lineHeight: fs(13), color: 'rgba(255,255,255,0.6)' },
    toggle: { flexDirection: 'row', alignItems: 'center', width: s(68), height: s(28), borderRadius: s(8), padding: 2, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
    toggleItem: { flex: 1, height: s(22), borderRadius: s(6), alignItems: 'center', justifyContent: 'center' },
    toggleActive: { backgroundColor: '#FFFFFF' },
    toggleText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: '#FFFFFF' },
    bell: { width: s(32), height: s(32), borderRadius: s(16), borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    bellDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center' },
    content: { paddingHorizontal: pad },

    profile: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingHorizontal: pad, paddingVertical: s(12), backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fontFamily.bold, fontSize: fs(15), color: NAVY },
    profileCol: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(20), color: NAVY },
    stChip: { backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
    stText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: NAVY },
    apaar: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: colors.textSecondary },
    apaarId: { fontFamily: fontFamily.medium, color: NAVY },
    place: { fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(14), color: colors.textSecondary },
    kyc: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#B9E0C3', borderRadius: s(14), paddingHorizontal: s(9), paddingVertical: s(5), alignSelf: 'flex-start' },
    kycText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: GREEN },

    banner: { marginTop: s(12), aspectRatio: 3.2, minHeight: s(112), borderRadius: s(16), overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTint },
    bannerText: { position: 'absolute', left: s(14), right: s(14), top: 0, bottom: 0, justifyContent: 'center', gap: 4 },
    bannerChip: { alignSelf: 'flex-start', backgroundColor: ORANGE, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
    bannerChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.8, color: '#FFFFFF' },
    bannerTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: '#FFFFFF' },
    bannerSub: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: 'rgba(255,255,255,0.92)' },

    actions: { flexDirection: 'row', gap: s(9), marginTop: s(14) },
    action: { ...card, flex: 1, alignItems: 'center', paddingVertical: s(12), paddingHorizontal: 4 },
    actionIcon: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center', marginBottom: s(8) },
    actionEn: { fontFamily: fontFamily.semibold, fontSize: fs(11), lineHeight: fs(14), color: NAVY, textAlign: 'center' },
    actionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(9.5), lineHeight: fs(13), color: colors.textSecondary, textAlign: 'center' },

    card: { ...card, marginTop: s(14), padding: s(16) },
    appHead: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    appLabel: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(16), letterSpacing: 0.6, color: NAVY },
    appPortal: { fontFamily: fontFamily.regular, fontSize: fs(10.5), color: colors.textSecondary, marginTop: 4 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '48%', backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#A9D8B5', borderRadius: s(16), paddingHorizontal: s(12), paddingVertical: s(7) },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
    statusText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: GREEN },
    rule: { height: 1, backgroundColor: colors.border, marginVertical: s(12) },

    appScheme: { fontFamily: fontFamily.regular, fontSize: fs(10.5), color: colors.textSecondary },
    appTitleRow: { flexDirection: 'row', gap: s(10), marginTop: 4 },
    appTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: NAVY },
    appTitleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(17), color: colors.textPrimary, marginTop: 2 },
    amountCol: { alignItems: 'flex-end' },
    amount: { fontFamily: fontFamily.bold, fontSize: fs(20), lineHeight: fs(26), color: NAVY },
    amountSub: { fontFamily: fontFamily.regular, fontSize: fs(10), color: colors.textSecondary, marginTop: 2 },

    stepper: { flexDirection: 'row', marginTop: s(18) },
    step: { flex: 1, alignItems: 'center' },
    stepTrack: { height: s(34), width: '100%', alignItems: 'center', justifyContent: 'center' },
    line: { position: 'absolute', top: '50%', height: 2, marginTop: -1, backgroundColor: colors.border },
    lineL: { left: 0, width: '50%' },
    lineR: { right: 0, width: '50%' },
    lineHidden: { opacity: 0 },
    lineDone: { backgroundColor: GREEN },
    lineHalf: { backgroundColor: colors.border },
    node: { width: s(32), height: s(32), borderRadius: s(16), alignItems: 'center', justifyContent: 'center' },
    nodeDone: { backgroundColor: GREEN },
    halo: { width: s(38), height: s(38), borderRadius: s(19), backgroundColor: 'rgba(26,58,107,0.1)', alignItems: 'center', justifyContent: 'center' },
    nodeCurrent: { backgroundColor: NAVY },
    nodeTodo: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.borderStrong },
    pendingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textMuted },
    stepLabel: { fontFamily: fontFamily.medium, fontSize: fs(11), lineHeight: fs(15), color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
    stepLabelCurrent: { fontFamily: fontFamily.bold, color: NAVY },
    stepLabelTodo: { color: colors.textSecondary },
    stepSub: { fontFamily: fontFamily.regular, fontSize: fs(9.5), lineHeight: fs(13), color: colors.textSecondary, textAlign: 'center' },
    stepSubCurrent: { fontFamily: fontFamily.bold, color: GREEN },

    trackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: s(8) },
    trackLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    trackText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY },
    aadhaarChip: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: s(10), paddingVertical: s(5) },
    aadhaarChipText: { fontFamily: fontFamily.regular, fontSize: fs(11), color: colors.textPrimary },

    alert: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginTop: s(14), padding: s(14), backgroundColor: '#FEF6F6', borderRadius: s(16), borderWidth: 1, borderColor: '#F0C2C2' },
    alertIcon: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: '#FBE3E3', borderWidth: 1, borderColor: '#F0B8B8', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
    alertBody: { flex: 1, minWidth: 0 },
    alertTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 },
    alertTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: NAVY },
    dueChip: { backgroundColor: colors.danger, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    dueText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: '#FFFFFF' },
    alertCopy: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: '#5E6267', marginTop: 4 },
    fixBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ORANGE, borderRadius: s(8), paddingHorizontal: s(12), paddingVertical: s(9), alignSelf: 'center' },
    fixText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },

    deadline: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(12), padding: s(12), borderRadius: s(14) },
    deadlineIcon: { width: s(32), height: s(32), borderRadius: s(8), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    deadlineTitle: { fontFamily: fontFamily.semibold, fontSize: fs(12.5), lineHeight: fs(17), color: NAVY },
    deadlineSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: colors.textSecondary },

    sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(18), marginBottom: s(10) },
    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(23), color: NAVY },
    sectionSub: { fontFamily: fontFamily.regular, fontSize: fs(11.5), lineHeight: fs(16), color: colors.textSecondary, marginTop: 2 },
    viewAll: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
    viewAllText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY },

    carousel: { flexGrow: 0 },
    schemeCard: { ...card, padding: s(14) },
    schemeChips: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    tagChip: { flexShrink: 1, backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    tagText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: NAVY },
    statusChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
    chipGreen: { backgroundColor: colors.successBg, borderColor: '#B9E0C3' },
    chipGold: { backgroundColor: '#FFF6D9', borderColor: '#F2D98A' },
    statusChipText: { fontFamily: fontFamily.bold, fontSize: fs(11) },
    schemeTitle: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(20), color: NAVY, marginTop: s(12) },
    schemeDesc: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: colors.textSecondary, marginTop: 4, minHeight: fs(34) },
    schemeFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    entLabel: { fontFamily: fontFamily.regular, fontSize: fs(10.5), letterSpacing: 0.4, color: colors.textSecondary },
    entAmount: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(22), color: NAVY },
    entYr: { fontFamily: fontFamily.regular, fontSize: fs(11), color: colors.textSecondary },
    detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: NAVY, borderRadius: s(8), paddingHorizontal: s(14), paddingVertical: s(9) },
    detailsText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: '#FFFFFF' },

    linked: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(14), padding: s(14), borderRadius: s(14) },
    linkedIcon: { width: s(44), height: s(44), borderRadius: s(10), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    linkedTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8 },
    linkedTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: NAVY },
    activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    activeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: GREEN },
    activeText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: GREEN },
    linkedSub: { fontFamily: fontFamily.regular, fontSize: fs(11.5), lineHeight: fs(16), color: colors.textSecondary, marginTop: 2 },

    fabWrap: { position: 'absolute', left: 0, right: 0, bottom: s(72) + 0, alignItems: 'center' },
    fab: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end', width: undefined, marginRight: Math.max((r.width - r.maxContentWidth) / 2, 0) + pad, backgroundColor: NAVY, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: s(26), paddingHorizontal: s(16), paddingVertical: s(11), shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
    fabText: { fontFamily: fontFamily.bold, fontSize: fs(13), color: '#FFFFFF' },
    fabDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3DBB5A' },
  });
};
