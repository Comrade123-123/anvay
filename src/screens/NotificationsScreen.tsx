import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

// Screen 14 of ANVAY_ka_kaam.pdf (Notifications). Static mock data only.
// Sizes follow the PDF's drawing data on its 390pt frame: 40pt icon circles with 18-20pt icons, 36pt header
// button, 30pt filter chips, 7pt unread dots, 358pt cards with 18pt radius.
// Alignment fixes vs the reference: titles used to be cut off by the time label ("Institute verified your applica"),
// now the title wraps in its own column and the time and unread dot keep fixed columns on the right.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const MUTED = '#5E6B79';
const INK = '#1F2836';

type IconName = React.ComponentProps<typeof Icon>['name'];
type Category = 'applications' | 'payments' | 'deadlines' | 'ministry';
type Group = 'Today' | 'Yesterday' | 'This week';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

type Item = {
  id: string;
  group: Group;
  cat: Category;
  icon: IconName;
  tone: 'green' | 'blue' | 'amber' | 'grey';
  title: string;
  time: string;
  body: string;
  link?: { label: string; to: 'dbt' | 'schemes' };
  unread: boolean;
};

const initial: Item[] = [
  { id: 'n1', group: 'Today', cat: 'payments', icon: 'cash-multiple', tone: 'green', title: '₹9,250 credited', time: '10:12 AM', body: 'Post-Matric instalment credited to SBI ••••4417', link: { label: 'View payment', to: 'dbt' }, unread: true },
  { id: 'n2', group: 'Today', cat: 'applications', icon: 'check-decagram-outline', tone: 'blue', title: 'Institute verified your application', time: '9:05 AM', body: 'Ranchi University confirmed your enrollment for 2026-27', unread: true },
  { id: 'n3', group: 'Yesterday', cat: 'deadlines', icon: 'calendar-check', tone: 'amber', title: 'Top Class application closes in 32 days', time: '6:30 PM', body: 'Deadline 31/10/2026. You are eligible.', link: { label: 'Apply now', to: 'schemes' }, unread: true },
  { id: 'n4', group: 'Yesterday', cat: 'applications', icon: 'cloud-check-outline', tone: 'grey', title: 'Offline draft uploaded', time: '11:20 AM', body: 'Your saved documents were submitted when you came online', unread: false },
  { id: 'n5', group: 'This week', cat: 'ministry', icon: 'bullhorn-outline', tone: 'blue', title: 'New from Ministry of Tribal Affairs', time: 'Mon', body: 'NFST 2026-27 applications are now open', unread: false },
  { id: 'n6', group: 'This week', cat: 'applications', icon: 'forum-outline', tone: 'blue', title: 'JAGO replied to your question', time: 'Sun', body: 'Your documents list for Top Class is ready', unread: false },
];

const groupHi: Record<Group, string> = { Today: 'आज', Yesterday: 'कल', 'This week': 'इस सप्ताह' };
const groups: Group[] = ['Today', 'Yesterday', 'This week'];

const chips: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applications', label: 'Applications' },
  { key: 'payments', label: 'Payments' },
  { key: 'deadlines', label: 'Deadlines' },
  { key: 'ministry', label: 'Ministry' },
];

const tones = {
  green: { bg: '#E6F4E9', fg: '#1D8E3D' },
  blue: { bg: '#E8EDF6', fg: NAVY },
  amber: { bg: '#FDF6DF', fg: '#896000' },
  grey: { bg: '#F0F2F4', fg: MUTED },
};

type Props = {
  onBack?: () => void;
  onTabSelect?: (key: TabKey) => void;
  onNavigate?: (to: 'dbt' | 'schemes' | 'wallet') => void;
};

export function NotificationsScreen({ onBack, onTabSelect, onNavigate }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [items, setItems] = useState<Item[]>(initial);
  const [cat, setCat] = useState<'all' | Category>('all');

  const unread = items.filter((i) => i.unread).length;
  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
  const markRead = (id: string) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)));

  const visible = items.filter((i) => cat === 'all' || i.cat === cat);
  const showAlert = cat === 'all' || cat === 'deadlines';

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
            <View style={styles.titleRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.backBtn}>
                <Icon name="arrow-left" size={r.s(24)} color="#FFFFFF" />
              </Pressable>
              <View style={styles.titleCol}>
                <Text style={styles.title}>Notifications</Text>
                <Hi style={styles.titleHi}>सूचनाएं</Hi>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Notification settings" onPress={() => toast('Notification settings are not available in this demo')} style={styles.roundBtn}>
                <Icon name="tune-variant" size={r.s(18)} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.unreadRow}>
              <Text style={styles.unreadText}>
                {unread > 0 ? `${unread} unread` : 'All caught up'} · Updates also sent on SMS
              </Text>
              <Pressable accessibilityRole="button" onPress={markAllRead} hitSlop={8} disabled={unread === 0}>
                <Text style={[styles.markAll, unread === 0 && { opacity: 0.5 }]}>Mark all read</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Priority alert */}
          {showAlert && (
            <View style={styles.alert}>
              <View style={styles.alertTop}>
                <View style={styles.alertIcon}>
                  <Icon name="alert" size={r.s(20)} color="#C62828" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Income certificate is unclear</Text>
                  <Text style={styles.alertBody}>Re-upload before 05/10/2026 to avoid delay in your Post-Matric payment.</Text>
                </View>
              </View>
              <View style={styles.alertActions}>
                <View style={styles.daysPill}>
                  <Text style={styles.daysText}>5 days left</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onNavigate?.('wallet')}
                  style={({ pressed }) => [styles.reupload, pressed && { opacity: 0.85 }]}
                >
                  <Icon name="upload" size={r.s(16)} color="#FFFFFF" />
                  <Text style={styles.reuploadText}>Re-upload now</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
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
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.column}>
          {groups.map((g) => {
            const rows = visible.filter((i) => i.group === g);
            if (rows.length === 0) return null;
            return (
              <View key={g}>
                <Text style={styles.groupTitle}>
                  {g} <Hi style={styles.groupHi}>/ {groupHi[g]}</Hi>
                </Text>
                <View style={styles.groupCard}>
                  {rows.map((n, idx) => {
                    const t = tones[n.tone];
                    return (
                      <Pressable
                        key={n.id}
                        onPress={() => markRead(n.id)}
                        style={[styles.row, idx > 0 && styles.rowBorder]}
                      >
                        <View style={[styles.circle, { backgroundColor: t.bg }]}>
                          <Icon name={n.icon} size={r.s(20)} color={t.fg} />
                        </View>
                        <View style={styles.rowBody}>
                          <View style={styles.rowHead}>
                            <Text style={[styles.rowTitle, !n.unread && styles.rowTitleRead]}>{n.title}</Text>
                            <Text style={styles.time}>{n.time}</Text>
                          </View>
                          <Text style={styles.rowText}>{n.body}</Text>
                          {n.link && (
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => onNavigate?.(n.link!.to)}
                              hitSlop={6}
                              style={styles.link}
                            >
                              <Text style={styles.linkText}>{n.link.label}</Text>
                              <Icon name="arrow-right" size={r.s(14)} color={NAVY} />
                            </Pressable>
                          )}
                        </View>
                        <View style={styles.dotCol}>{n.unread && <View style={styles.dot} />}</View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {visible.length === 0 && (
            <View style={styles.empty}>
              <Icon name="bell-check-outline" size={r.s(28)} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
            </View>
          )}

          {/* All caught up */}
          <View style={styles.caughtUp}>
            <Svg width={r.s(120)} height={r.s(60)} viewBox="0 0 120 60">
              {[24, 96].map((x, i) => (
                <G key={x} transform={i === 1 ? 'translate(120 0) scale(-1 1) translate(0 0)' : undefined}>
                  <Circle cx={24} cy={10} r={4.6} fill="#41608F" />
                  <Polygon points="24,16 18,28 30,28" fill="#41608F" />
                  <Polygon points="24,28 18,42 30,42" fill="#41608F" />
                  <Path d="M22 42 L19 55 M26 42 L29 55" stroke="#41608F" strokeWidth={1.6} strokeLinecap="round" fill="none" />
                  <Path d="M24 19 L11 14" stroke="#41608F" strokeWidth={1.6} strokeLinecap="round" fill="none" />
                  <Path d="M24 19 L36 22" stroke="#41608F" strokeWidth={1.6} strokeLinecap="round" fill="none" />
                </G>
              ))}
              <Line x1={36} y1={22} x2={84} y2={22} stroke="#8593A8" strokeWidth={1.2} strokeDasharray="3 2.5" />
              <Circle cx={60} cy={25} r={2} fill="#8593A8" />
            </Svg>
            <Text style={styles.caughtTitle}>
              You're all caught up / <Hi style={styles.caughtTitle}>सब देख लिया</Hi>
            </Text>
            <Text style={styles.caughtSub}>Ministry of Tribal Affairs · Government of India</Text>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="home" onSelect={onTabSelect} />
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

    // ---- header (PDF: 18pt title, rounded bottom corners, 36pt round button)
    header: { backgroundColor: DARK, borderBottomLeftRadius: s(22), borderBottomRightRadius: s(22), paddingBottom: s(16) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    backBtn: { width: s(24), alignItems: 'flex-start' },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(23), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(16), color: '#B7C6E0' },
    roundBtn: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    unreadRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(10), rowGap: 4, marginTop: s(12) },
    unreadText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: '#FFFFFF' },
    markAll: { fontFamily: fontFamily.regular, fontSize: fs(12), color: '#FFFFFF', textDecorationLine: 'underline' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- priority alert (PDF: 358x140)
    alert: { ...card, marginTop: s(16), padding: s(16) },
    alertTop: { flexDirection: 'row', alignItems: 'flex-start', gap: s(12) },
    alertIcon: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#FDEBEB', alignItems: 'center', justifyContent: 'center' },
    alertTitle: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(21), color: INK },
    alertBody: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(19), color: MUTED, marginTop: 3 },
    alertActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: s(10), marginTop: s(14) },
    daysPill: { height: s(26), justifyContent: 'center', paddingHorizontal: s(12), borderRadius: s(13), borderWidth: 1, borderColor: '#F8D6DA', backgroundColor: '#FDEBEB' },
    daysText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: '#C62828' },
    reupload: { flexDirection: 'row', alignItems: 'center', gap: 6, height: s(30), paddingHorizontal: s(14), borderRadius: s(9), backgroundColor: ORANGE },
    reuploadText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },

    // ---- filter chips (PDF: 30pt pills, 12pt medium labels)
    chipsScroll: { flexGrow: 0, marginTop: s(16) },
    chipsContent: { paddingHorizontal: pad, gap: s(8) },
    chip: { height: s(30), justifyContent: 'center', paddingHorizontal: s(16), borderRadius: s(15), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#FFFFFF' },
    chipActive: { backgroundColor: NAVY, borderColor: NAVY },
    chipText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: INK },

    // ---- grouped notifications
    groupTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: INK, marginTop: s(20), marginBottom: s(9) },
    groupHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    groupCard: { ...card, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: s(12), paddingHorizontal: s(13), paddingVertical: s(13) },
    rowBorder: { borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    circle: { width: s(40), height: s(40), borderRadius: s(20), alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1, minWidth: 0 },
    rowHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(8) },
    rowTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    rowTitleRead: { fontFamily: fontFamily.semibold, color: MUTED },
    time: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(19), color: MUTED },
    rowText: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: MUTED, marginTop: 2 },
    link: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: s(8) },
    linkText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY },
    dotCol: { width: s(8), paddingTop: s(7), alignItems: 'center' },
    dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: NAVY },

    empty: { alignItems: 'center', gap: 6, paddingVertical: s(36) },
    emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fs(14), color: MUTED },

    caughtUp: { alignItems: 'center', marginTop: s(36), paddingBottom: s(8) },
    caughtTitle: { fontFamily: fontFamily.semibold, fontSize: fs(13), color: MUTED, marginTop: s(10), textAlign: 'center' },
    caughtSub: { fontFamily: fontFamily.regular, fontSize: fs(10), color: '#7A889B', marginTop: 4, textAlign: 'center' },
  });
};
