import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';
import { LoadState } from '../components/LoadState';
import { useApi } from '../api/useApi';
import type { CalendarData } from '../api/types';

// Screen 19 of ANVAY_ka_kaam.pdf (Calendar & Deadlines). The dates come from /api/calendar.
// Sizes follow the PDF's drawing data on its 390pt frame: 38pt header circle, 32pt month tile, 30pt month arrows,
// 32pt day circles, 33pt filter chips, 20pt date numbers, 23pt "days" pills, 36 x 20 toggle.
// The PDF render had overlapping layers (the list heading and filter chips drawn over the calendar, the priority
// card wider than the page), so the order here follows the data: header + priority card, month, filters, list, reminders.
// The month grid is real (any month, Monday first); "today" is the server's date in India.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const RED = '#C62828';
const AMBER = '#F4B300';
const BROWN = '#896000';
const INK = '#1F2836';
const MUTED = '#5E6B79';
const GREY = '#9CA3AF';


type Kind = 'action' | 'deadline' | 'renewal' | 'payment';
const kindColor: Record<Kind, string> = { action: RED, deadline: AMBER, renewal: NAVY, payment: GREEN };

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const monthEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const key = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

type Ev = {
  id: string;
  date: [number, number, number]; // y, m (0-based), d
  kind: Kind;
  group: 'This week' | 'This month' | 'Later';
  label: { d: string; mon: string };
  title: string;
  sub: string;
  pill: string;
  link?: 'apply' | 'wallet' | 'dbt';
  fill?: boolean; // calendar cell drawn as a filled amber day
};

const monShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const toEvent = (i: CalendarData['items'][number]): Ev => {
  const [y, m, d] = i.date.split('-').map(Number);
  return {
    id: i.id,
    date: [y, m - 1, d],
    kind: i.kind,
    group: i.group,
    label: { d: String(d).padStart(2, '0'), mon: monShort[m - 1] },
    title: i.title,
    sub: i.subtitle,
    pill: i.pill,
    link: i.linkTo === 'scheme' ? 'apply' : i.linkTo === 'wallet' ? 'wallet' : i.linkTo === 'dbt' ? 'dbt' : undefined,
    fill: i.kind === 'deadline' && i.linkTo === 'scheme',
  };
};

const pillStyle: Record<Kind, { bg: string; fg: string }> = {
  action: { bg: '#FDEBEB', fg: RED },
  deadline: { bg: '#FDF6DF', fg: BROWN },
  renewal: { bg: '#E8EDF6', fg: NAVY },
  payment: { bg: '#E6F4E9', fg: GREEN },
};
const dateColor: Record<Kind, string> = { action: RED, deadline: BROWN, renewal: NAVY, payment: GREEN };

const filters: { k: 'all' | Kind; label: string; dot?: string }[] = [
  { k: 'all', label: 'All' },
  { k: 'action', label: 'Actions', dot: RED },
  { k: 'deadline', label: 'Deadlines', dot: AMBER },
  { k: 'renewal', label: 'Renewals', dot: NAVY },
  { k: 'payment', label: 'Payments', dot: GREEN },
];

const groups: { g: Ev['group']; hi: string }[] = [
  { g: 'This week', hi: 'इस सप्ताह' },
  { g: 'This month', hi: 'इस महीने' },
  { g: 'Later', hi: 'बाद में' },
];

type Cell = { y: number; m: number; d: number; other: boolean };

function buildMonth(y: number, m: number): Cell[][] {
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const total = Math.ceil((offset + days) / 7) * 7;
  const cells: Cell[] = [];
  for (let i = 0; i < total; i++) {
    const dt = new Date(y, m, 1 - offset + i);
    cells.push({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), other: dt.getMonth() !== m });
  }
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const r = useResponsive();
  const w = r.s(38);
  const h = r.s(22);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: value ? NAVY : '#D1D4DB', justifyContent: 'center' }}
    >
      <View
        style={{
          width: h - 6,
          height: h - 6,
          borderRadius: (h - 6) / 2,
          backgroundColor: '#FFFFFF',
          marginLeft: value ? w - h + 3 : 3,
        }}
      />
    </Pressable>
  );
}

type Props = {
  onBack?: () => void;
  onTabSelect?: (key: TabKey) => void;
  onDoItNow?: () => void;
  onApply?: () => void;
};

export function CalendarScreen({ onBack, onTabSelect, onDoItNow, onApply }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data, error, reload } = useApi<CalendarData>('/calendar');
  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [sms, setSms] = useState(true);

  const events = useMemo(() => (data?.items ?? []).map(toEvent), [data]);
  const todayParts = (data?.today ?? '2000-01-01').split('-').map(Number);
  const TODAY = { y: todayParts[0], m: todayParts[1] - 1, d: todayParts[2] };
  const shown = month ?? { y: TODAY.y, m: TODAY.m };
  const rows = useMemo(() => buildMonth(shown.y, shown.m), [shown.y, shown.m]);
  const byDate = useMemo(() => {
    const map: Record<string, Ev> = {};
    events.forEach((e) => {
      // payments and renewals are not marked on the grid, they only appear in the list
      if (e.kind === 'action' || e.kind === 'deadline') map[key(...e.date)] = e;
    });
    return map;
  }, [events]);

  if (!data) return <LoadState error={error} onRetry={reload} label="Loading your calendar…" />;

  const shift = (delta: number) =>
    setMonth(() => {
      const dt = new Date(shown.y, shown.m + delta, 1);
      return { y: dt.getFullYear(), m: dt.getMonth() };
    });

  const visible = events.filter((e) => filter === 'all' || e.kind === filter);

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
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Calendar & Deadlines</Text>
                <Hi style={styles.titleHi}>कैलेंडर और तिथियाँ</Hi>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Sync calendar" onPress={async () => { await reload(); toast('Calendar refreshed'); }} style={styles.syncBtn}>
                <Icon name="sync" size={r.s(18)} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.headerRule} />
            <View style={styles.ministryRow}>
              <Icon name="bank" size={r.s(13)} color="#FF9933" />
              <Text style={styles.ministry} numberOfLines={1}>Ministry of Tribal Affairs · Govt. of India</Text>
              <View style={styles.ayPill}>
                <Text style={styles.ayText}>AY 2026-27</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Priority card overlapping the header */}
          {data.priority && (
            <View style={styles.priority}>
              <View style={styles.daysCol}>
                <Text style={styles.daysNum}>{String(Math.max(0, data.priority.daysLeft)).padStart(2, '0')}</Text>
                <Text style={styles.daysEn}>days left</Text>
                <Hi style={styles.daysHi}>दिन बाकी</Hi>
              </View>
              <View style={styles.priorityDivider} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.priorityTitle}>{data.priority.title}</Text>
                <Text style={styles.prioritySub}>
                  {data.priority.subtitle.replace(/ · Action needed$/, '')} · <Text style={{ color: RED }}>Due {data.priority.date.split('-').reverse().join('/')}</Text>
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={data.priority.linkTo === 'scheme' ? onApply : onDoItNow}
                  style={({ pressed }) => [styles.doNow, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.doNowText}>{data.priority.linkTo === 'scheme' ? 'Apply now' : 'Do it now'}</Text>
                  <Icon name="arrow-right" size={r.s(16)} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Month */}
          <View style={styles.month}>
            <View style={styles.monthHead}>
              <View style={styles.monthTile}>
                <Icon name="calendar-blank-outline" size={r.s(18)} color={NAVY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.monthTitle}>
                  {monthEn[shown.m]} {shown.y}
                </Text>
                <Hi style={styles.monthHi}>
                  {monthHi[shown.m]} {shown.y}
                </Hi>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} style={styles.arrow}>
                <Icon name="chevron-left" size={r.s(20)} color={MUTED} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} style={styles.arrow}>
                <Icon name="chevron-right" size={r.s(20)} color={MUTED} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdays.map((w, i) => (
                <Text key={w} style={[styles.weekday, i === 6 && { color: RED }]}>{w}</Text>
              ))}
            </View>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.dayRow}>
                {row.map((c, ci) => {
                  const ev = byDate[key(c.y, c.m, c.d)];
                  const isToday = c.y === TODAY.y && c.m === TODAY.m && c.d === TODAY.d;
                  const sunday = ci === 6;
                  const baseColor = c.other ? GREY : sunday ? RED : INK;
                  const action = !c.other && ev?.kind === 'action';
                  const fill = !c.other && ev?.fill;
                  return (
                    <View key={ci} style={styles.dayCell}>
                      <View
                        style={[
                          styles.dayCircle,
                          isToday && styles.today,
                          action && { backgroundColor: '#FDEBEB' },
                          fill && { backgroundColor: AMBER },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: action ? RED : fill ? INK : baseColor },
                            (isToday || (ev && !c.other)) && { fontFamily: fontFamily.bold },
                          ]}
                        >
                          {c.d}
                        </Text>
                      </View>
                      {ev && !c.other && !fill && <View style={[styles.evDot, { backgroundColor: kindColor[ev.kind] }]} />}
                    </View>
                  );
                })}
              </View>
            ))}

            <View style={styles.legend}>
              {(['action', 'deadline', 'renewal', 'payment'] as Kind[]).map((k) => (
                <View key={k} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: kindColor[k] }]} />
                  <Text style={styles.legendText}>{k === 'action' ? 'Action' : k === 'deadline' ? 'Deadline' : k === 'renewal' ? 'Renewal' : 'Payment'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
        >
          {filters.map((f) => {
            const active = filter === f.k;
            return (
              <Pressable
                key={f.k}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(f.k)}
                style={[styles.chip, active && styles.chipActive]}
              >
                {f.k === 'all' ? (
                  <Icon name="check" size={r.s(15)} color={active ? '#FFFFFF' : INK} />
                ) : (
                  <View style={[styles.chipDot, { backgroundColor: f.dot }]} />
                )}
                <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.column}>
          <View style={styles.listHead}>
            <Text style={styles.listTitle}>
              Upcoming deadlines / <Hi style={styles.listTitleHi}>आगामी तिथियाँ</Hi>
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{visible.length} {visible.length === 1 ? 'item' : 'items'}</Text>
            </View>
          </View>

          {groups.map(({ g, hi }) => {
            const rowsG = visible.filter((e) => e.group === g);
            if (rowsG.length === 0) return null;
            return (
              <View key={g}>
                <Text style={styles.groupTitle}>
                  {g} <Hi style={styles.groupHi}>/ {hi}</Hi>
                </Text>
                {rowsG.map((e) => (
                  <View key={e.id} style={styles.item}>
                    <View style={styles.dateCol}>
                      <Text style={[styles.dateNum, { color: dateColor[e.kind] }]}>{e.label.d}</Text>
                      <Text style={[styles.dateMon, { color: dateColor[e.kind] }]}>{e.label.mon}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.itemTitle}>{e.title}</Text>
                      <Text style={styles.itemSub}>
                        {e.kind === 'action' ? e.sub.replace(/ · Action needed$/, ' · ') : e.sub}
                        {e.kind === 'action' && <Text style={{ color: RED }}>Action needed</Text>}
                      </Text>
                      {e.link && e.kind !== 'action' && (
                        <Pressable accessibilityRole="button" onPress={e.link === 'apply' ? onApply : onDoItNow} hitSlop={6} style={styles.applyLink}>
                          <Text style={styles.applyLinkText}>{e.link === 'apply' ? 'Apply now' : e.link === 'dbt' ? 'View payments' : 'Open'}</Text>
                          <Icon name="arrow-right" size={r.s(14)} color={NAVY} />
                        </Pressable>
                      )}
                    </View>
                    <View style={[styles.itemPill, { backgroundColor: pillStyle[e.kind].bg }]}>
                      <Text style={[styles.itemPillText, { color: pillStyle[e.kind].fg }]}>{e.pill}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          {visible.length === 0 && (
            <View style={styles.empty}>
              <Icon name="calendar-check-outline" size={r.s(28)} color={GREY} />
              <Text style={styles.emptyText}>Nothing scheduled here</Text>
            </View>
          )}

          {/* Reminders */}
          <View style={styles.remind}>
            <View style={styles.remindTop}>
              <View style={styles.remindIcon}>
                <Icon name="bell-outline" size={r.s(18)} color={NAVY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.remindTitle}>Remind me 7 days and 1 day before</Text>
                <Hi style={styles.remindHi}>7 दिन और 1 दिन पहले</Hi>
              </View>
              <Icon name="chevron-right" size={r.s(20)} color={MUTED} />
            </View>
            <View style={styles.remindRule} />
            <View style={styles.smsRow}>
              <Text style={styles.smsTitle}>Also via SMS alerts</Text>
              <Toggle value={sms} onChange={setSms} label="Also via SMS alerts" />
            </View>
            <Text style={styles.smsSub}>{sms ? 'Reminders are on for all deadlines' : 'Reminders show in the app only'}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Icon name="shield-check" size={r.s(14)} color={NAVY} />
              <Text style={styles.footerText}>Digital India · DigiLocker · PFMS Sync</Text>
            </View>
            <Text style={styles.footerText}>Content owned by Ministry of Tribal Affairs, Government of India</Text>
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

    header: { backgroundColor: DARK, borderBottomLeftRadius: s(26), borderBottomRightRadius: s(26), paddingBottom: s(58) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    backBtn: { width: s(24), alignItems: 'flex-start' },
    title: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(23), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(16), color: '#B7C6E0' },
    syncBtn: { width: s(38), height: s(38), borderRadius: s(19), borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: s(12) },
    ministryRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: s(12) },
    ministry: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), color: '#C9D6EC' },
    ayPill: { height: s(23), justifyContent: 'center', paddingHorizontal: s(11), borderRadius: s(12), borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)' },
    ayText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: '#FFFFFF' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- priority card (PDF: big red "05", divider, action button)
    priority: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(14), marginTop: -s(44), borderRadius: s(20), paddingHorizontal: s(16), paddingVertical: s(16) },
    daysCol: { alignItems: 'center', minWidth: s(56) },
    daysNum: { fontFamily: fontFamily.bold, fontSize: fs(32), lineHeight: fs(38), color: RED },
    daysEn: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    daysHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(10), color: MUTED },
    priorityDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#E1E4EB' },
    priorityTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    prioritySub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 3 },
    doNow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, height: s(28), paddingHorizontal: s(12), marginTop: s(10), borderRadius: s(8), backgroundColor: ORANGE },
    doNowText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },

    // ---- month (PDF: 358 wide card, 32pt tile, 30pt arrows, 44pt rows)
    month: { ...card, marginTop: s(16), paddingHorizontal: s(12), paddingTop: s(16), paddingBottom: s(14) },
    monthHead: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingHorizontal: s(6) },
    monthTile: { width: s(32), height: s(32), borderRadius: s(9), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    monthTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: INK },
    monthHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    arrow: { width: s(30), height: s(30), borderRadius: s(8), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    weekRow: { flexDirection: 'row', marginTop: s(16), marginBottom: s(4) },
    weekday: { flex: 1, textAlign: 'center', fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    dayRow: { flexDirection: 'row' },
    dayCell: { flex: 1, height: s(44), alignItems: 'center', justifyContent: 'center' },
    dayCircle: { width: s(32), height: s(32), borderRadius: s(16), alignItems: 'center', justifyContent: 'center' },
    today: { borderWidth: 2, borderColor: NAVY },
    dayText: { fontFamily: fontFamily.regular, fontSize: fs(13) },
    evDot: { position: 'absolute', bottom: s(1), width: 6, height: 6, borderRadius: 3 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: s(14), rowGap: 6, marginTop: s(10), paddingTop: s(12), borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },

    chipsScroll: { flexGrow: 0, marginTop: s(16) },
    chipsContent: { paddingHorizontal: pad, gap: s(8) },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: s(33), paddingHorizontal: s(15), borderRadius: s(17), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#FFFFFF' },
    chipActive: { backgroundColor: NAVY, borderColor: NAVY },
    chipDot: { width: 8, height: 8, borderRadius: 4 },
    chipText: { fontFamily: fontFamily.medium, fontSize: fs(13), color: INK },

    // ---- deadline list (PDF: 358x61 rows, 20pt date numbers, 23pt pills)
    listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(20) },
    listTitle: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    listTitleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(13), color: MUTED },
    countPill: { height: s(23), justifyContent: 'center', paddingHorizontal: s(11), borderRadius: s(12), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#FFFFFF' },
    countText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: MUTED },
    groupTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: INK, marginTop: s(16), marginBottom: s(9) },
    groupHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    item: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(12), minHeight: s(61), marginBottom: s(9), paddingHorizontal: s(14), paddingVertical: s(11), borderRadius: s(16) },
    dateCol: { width: s(46), alignItems: 'center' },
    dateNum: { fontFamily: fontFamily.bold, fontSize: fs(20), lineHeight: fs(25) },
    dateMon: { fontFamily: fontFamily.bold, fontSize: fs(11), letterSpacing: 0.6, lineHeight: fs(14) },
    dateMonBig: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(20) },
    dateYear: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(14) },
    itemTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    itemSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginTop: 2 },
    applyLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: s(6) },
    applyLinkText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY },
    itemPill: { minHeight: s(23), justifyContent: 'center', paddingHorizontal: s(10), borderRadius: s(12) },
    itemPillText: { fontFamily: fontFamily.semibold, fontSize: fs(11) },
    empty: { alignItems: 'center', gap: 6, paddingVertical: s(32) },
    emptyText: { fontFamily: fontFamily.medium, fontSize: fs(13), color: MUTED },

    // ---- reminders (PDF: blue-tinted card with a white bell circle and a toggle)
    remind: { marginTop: s(18), padding: s(15), borderRadius: s(18), borderWidth: 1, borderColor: '#D4E1EF', backgroundColor: '#E8EDF6' },
    remindTop: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
    remindIcon: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    remindTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: INK },
    remindHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: MUTED },
    remindRule: { height: 1, backgroundColor: '#D4E1EF', marginVertical: s(12) },
    smsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10) },
    smsTitle: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: INK },
    smsSub: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED, marginTop: 4 },

    footer: { alignItems: 'center', gap: 4, marginTop: s(22) },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    footerText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, textAlign: 'center' },
  });
};
