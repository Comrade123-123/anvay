import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

// Screen 21 of ANVAY_ka_kaam.pdf (Help & Grievance). Static mock data only: submitting adds a row to the local list.
// Sizes follow the PDF's drawing data on its 390pt frame: 36pt header buttons, 40pt quick-action icon discs,
// 44pt inputs, 46pt submit button, 85pt text area, 32pt attach icon, 15pt rating stars.
// The PDF left the quick-action cards and the form card at slightly different widths (gutters 16 vs 15); here every
// card shares one column and one 16px gutter, and the three quick actions share the row equally.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const INK = '#1F2836';
const MUTED = '#5E6B79';
const BORDER = '#E1E4EB';
const FIELD = '#CAD4E1';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const categories = ['Payment not received', 'Document verification', 'Name / details mismatch', 'Application status', 'Other'];
const applications = ['Post-Matric 2026-27 · MOTA/PM/2026/JH/004512'];

type Grv = {
  id: string;
  status: 'progress' | 'resolved';
  title: string;
  sub: string;
  progress?: number;
  due?: string;
};

const initialGrievances: Grv[] = [
  { id: 'GRV/2026/00412', status: 'progress', title: 'Instalment 1 not credited', sub: 'Assigned to District Welfare Officer, Ranchi · 29/09/2026', progress: 0.6, due: 'Resolve by 06/10/2026 · 7 days left' },
  { id: 'GRV/2026/00288', status: 'resolved', title: 'Name mismatch in certificate', sub: 'Resolved in 4 days · 18/09/2026' },
];

type Props = {
  onBack?: () => void;
  onTabSelect?: (key: TabKey) => void;
  onAskJago?: () => void;
  onNotifications?: () => void;
};

export function HelpScreen({ onBack, onTabSelect, onAskJago, onNotifications }: Props) {
  const r = useResponsive();
  const styles = useMemo(() => makeStyles(r), [r.width]);
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState(categories[0]);
  const [openCat, setOpenCat] = useState(false);
  const [openApp, setOpenApp] = useState(false);
  const [application, setApplication] = useState(applications[0]);
  const [desc, setDesc] = useState('');
  const [attached, setAttached] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState<Grv[]>(initialGrievances);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [faq, setFaq] = useState(false);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const submit = () => {
    if (desc.trim().length < 5) {
      setError('Please describe your issue (at least a few words).');
      return;
    }
    setError('');
    const n = 413 + list.length - 2;
    setList((p) => [
      { id: `GRV/2026/00${n}`, status: 'progress', title: category, sub: `Submitted just now · ${application.split(' · ')[0]}`, progress: 0.1, due: 'Resolve by 13/10/2026 · 14 days left' },
      ...p,
    ]);
    setDesc('');
    setAttached(false);
    flash('Grievance submitted. You will get an SMS update.');
  };

  const quick = [
    { icon: 'robot-happy-outline', title: 'Ask JAGO', sub: 'AI Sahayak', onPress: onAskJago },
    { icon: 'phone-outline', title: 'Call helpline', sub: '1800-180-1555', onPress: () => flash('Calling 1800-180-1555 (demo)') },
    { icon: 'help-circle-outline', title: 'FAQs', sub: 'Top queries', onPress: () => setFaq((v) => !v) },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + r.s(16) }]}>
        <View style={styles.tricolor}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>
        <View style={styles.column}>
          <View style={styles.headTop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.circleBtn}>
              <Icon name="arrow-left" size={r.s(22)} color="#fff" />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Help & Grievance</Text>
              <Hi style={styles.titleHi}>सहायता और शिकायत</Hi>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onNotifications} hitSlop={8} style={styles.circleBtn}>
              <Icon name="bell-outline" size={r.s(21)} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.sla}>
            <Icon name="clock-outline" size={r.s(15)} color={ORANGE} />
            <Text style={styles.slaText}>Average resolution time: 6 days</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: r.s(20) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          {/* Quick actions */}
          <View style={styles.quickRow}>
            {quick.map((q) => (
              <Pressable
                key={q.title}
                accessibilityRole="button"
                onPress={q.onPress}
                style={({ pressed }) => [styles.quick, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.quickIcon}>
                  <Icon name={q.icon as any} size={r.s(20)} color={NAVY} />
                </View>
                <Text style={styles.quickTitle} numberOfLines={2}>{q.title}</Text>
                <Text style={styles.quickSub} numberOfLines={2}>{q.sub}</Text>
              </Pressable>
            ))}
          </View>

          {faq && (
            <View style={[styles.card, { marginTop: r.s(12), gap: r.s(8) }]}>
              {['When will my instalment be credited?', 'How do I re-upload a rejected document?', 'How do I link Aadhaar with my bank?'].map((q) => (
                <View key={q} style={styles.faqRow}>
                  <Icon name="chevron-right" size={r.s(16)} color={NAVY} />
                  <Text style={styles.faqText}>{q}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Raise a grievance */}
          <View style={[styles.card, { marginTop: r.s(14) }]}>
            <View style={styles.formHead}>
              <Text style={styles.cardTitle}>
                Raise a grievance <Hi style={styles.cardTitleHi}>शिकायत दर्ज करें</Hi>
              </Text>
              <Icon name="text-box-edit-outline" size={r.s(20)} color={NAVY} />
            </View>
            <View style={styles.rule} />

            <Text style={styles.label}>
              Category <Hi style={styles.labelHi}>/ श्रेणी</Hi>
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Category" onPress={() => { setOpenCat((v) => !v); setOpenApp(false); }} style={styles.select}>
              <Text style={styles.selectText} numberOfLines={1}>{category}</Text>
              <Icon name={openCat ? 'chevron-up' : 'chevron-down'} size={r.s(20)} color="#6B7280" />
            </Pressable>
            {openCat && (
              <View style={styles.menu}>
                {categories.map((c) => (
                  <Pressable key={c} accessibilityRole="button" onPress={() => { setCategory(c); setOpenCat(false); }} style={[styles.menuItem, c === category && { backgroundColor: '#E8EDF6' }]}>
                    <Text style={styles.selectText}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={[styles.label, { marginTop: r.s(14) }]}>
              Application <Hi style={styles.labelHi}>/ छात्रवृत्ति आवेदन</Hi>
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Application" onPress={() => { setOpenApp((v) => !v); setOpenCat(false); }} style={styles.select}>
              <Text style={styles.selectText} numberOfLines={1}>{application}</Text>
              <Icon name={openApp ? 'chevron-up' : 'chevron-down'} size={r.s(20)} color="#6B7280" />
            </Pressable>
            {openApp && (
              <View style={styles.menu}>
                {applications.map((c) => (
                  <Pressable key={c} accessibilityRole="button" onPress={() => { setApplication(c); setOpenApp(false); }} style={[styles.menuItem, { backgroundColor: '#E8EDF6' }]}>
                    <Text style={styles.selectText}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={[styles.label, { marginTop: r.s(14) }]}>
              Describe your issue <Hi style={styles.labelHi}>/ समस्या का विवरण दें</Hi>
            </Text>
            <View style={[styles.area, !!error && { borderColor: '#C62828' }]}>
              <TextInput
                value={desc}
                onChangeText={(t) => { setDesc(t); if (error) setError(''); }}
                multiline
                placeholder="E.g., Second instalment for academic year 2026-27 has not been credited despite institute verification..."
                placeholderTextColor="#93A3B8"
                style={styles.areaInput}
                accessibilityLabel="Describe your issue"
                textAlignVertical="top"
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Speak" onPress={() => flash('Voice input is not available in this demo')} style={styles.mic}>
                <Icon name="microphone" size={r.s(15)} color={NAVY} />
              </Pressable>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable accessibilityRole="button" accessibilityLabel="Attach document" onPress={() => setAttached((v) => !v)} style={styles.attach}>
              <View style={styles.attachIcon}>
                <Icon name={attached ? 'file-check-outline' : 'cloud-upload-outline'} size={r.s(18)} color={attached ? GREEN : NAVY} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.attachTitle}>{attached ? 'bank-passbook.pdf attached' : 'Attach document (optional)'}</Text>
                <Text style={styles.attachSub}>{attached ? 'Tap to remove' : 'PDF, JPG up to 2MB (e.g. Bank passbook, NOC)'}</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.9 }]}>
              <Text style={styles.submitText}>
                Submit grievance / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>शिकायत भेजें</Hi>
              </Text>
              <Icon name="arrow-right" size={r.s(17)} color="#fff" />
            </Pressable>
          </View>

          {/* My grievances */}
          <Text style={styles.sectionTitle}>
            My grievances <Hi style={styles.sectionHi}>मेरी शिकायतें</Hi>
          </Text>
          <View style={{ gap: r.s(12) }}>
            {list.map((g) => {
              const done = g.status === 'resolved';
              return (
                <View key={g.id} style={styles.card}>
                  <View style={styles.grvHead}>
                    <Text style={styles.grvId}>{g.id}</Text>
                    <View style={[styles.status, { backgroundColor: done ? '#E6F4E9' : '#E8EDF6' }]}>
                      <View style={[styles.statusDot, { backgroundColor: done ? GREEN : NAVY }]} />
                      <Text style={[styles.statusText, { color: done ? GREEN : NAVY }]}>{done ? 'Resolved' : 'In progress'}</Text>
                    </View>
                  </View>
                  <Text style={styles.grvTitle}>{g.title}</Text>
                  <Text style={styles.grvSub}>{g.sub}</Text>

                  {!done ? (
                    <>
                      <View style={styles.bar}>
                        <View style={[styles.barFill, { width: `${Math.round((g.progress ?? 0) * 100)}%` }]} />
                      </View>
                      <View style={styles.dueRow}>
                        <Icon name="clock-outline" size={r.s(14)} color={MUTED} />
                        <Text style={styles.dueText}>{g.due}</Text>
                      </View>
                      <View style={styles.rule} />
                      {expanded === g.id && (
                        <Text style={styles.expandText}>Status: with the District Welfare Officer for verification. You will get an SMS on every update.</Text>
                      )}
                      <Pressable accessibilityRole="link" onPress={() => setExpanded((e) => (e === g.id ? null : g.id))} style={styles.viewRow} hitSlop={8}>
                        <Text style={styles.viewText}>
                          View details / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>विवरण देखें</Hi>
                        </Text>
                        <Icon name="arrow-right" size={r.s(15)} color={NAVY} />
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={styles.rule} />
                      <View style={styles.rateRow}>
                        <Text style={styles.rateText}>
                          Rate resolution / <Hi>समाधान का मूल्यांकन करें</Hi>
                        </Text>
                        <View style={styles.stars}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Rate ${n} star${n > 1 ? 's' : ''}`} onPress={() => setRatings((p) => ({ ...p, [g.id]: n }))} hitSlop={4}>
                              <Icon name={(ratings[g.id] ?? 0) >= n ? 'star' : 'star-outline'} size={r.s(19)} color={(ratings[g.id] ?? 0) >= n ? ORANGE : MUTED} />
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {/* SLA note */}
          <View style={styles.note}>
            <View style={styles.noteIcon}>
              <Icon name="shield-check" size={r.s(15)} color={NAVY} />
            </View>
            <Text style={styles.noteText}>If not resolved within SLA, your grievance auto-escalates to the State Nodal Officer.</Text>
          </View>

          <View style={styles.footRule} />
          <Text style={styles.foot}>Digital India  ·  DigiLocker  ·  PFMS Sync</Text>
          <Text style={styles.foot}>Content owned by Ministry of Tribal Affairs, Government of India</Text>
        </View>
      </ScrollView>

      {!!toast && (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: r.s(70) + Math.max(insets.bottom, 0) }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      <BottomTabBar active="home" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const gutter = s(16);
  const card = {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: s(16),
    padding: s(14),
    ...Platform.select({ default: {}, web: { boxShadow: '0 2px 6px rgba(20,30,60,0.06)' } as object }),
  };
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: gutter },

    header: { backgroundColor: DARK, borderBottomLeftRadius: s(24), borderBottomRightRadius: s(24), paddingBottom: s(16), overflow: 'hidden' },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headTop: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
    circleBtn: { width: s(36), height: s(36), borderRadius: s(18), alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(23), color: '#fff' },
    titleHi: { fontSize: fs(12), lineHeight: fs(16), color: '#C9D1E0' },
    sla: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(12) },
    slaText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(13), color: '#fff' },

    quickRow: { flexDirection: 'row', gap: s(10), marginTop: s(16) },
    quick: { ...card, flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: s(6), paddingVertical: s(11), borderRadius: s(14) },
    quickIcon: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center', marginBottom: s(8) },
    quickTitle: { fontFamily: fontFamily.semibold, fontSize: fs(13), lineHeight: fs(17), color: INK, textAlign: 'center' },
    quickSub: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: MUTED, marginTop: s(2), textAlign: 'center' },

    card,
    faqRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
    faqText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: INK },

    formHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
    cardTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(20), color: INK },
    cardTitleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    rule: { height: 1, backgroundColor: '#EFF2F6', marginVertical: s(12) },

    label: { fontFamily: fontFamily.medium, fontSize: fs(12), lineHeight: fs(17), color: INK, marginBottom: s(7) },
    labelHi: { fontSize: fs(11), color: MUTED },
    select: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(8),
      height: s(44),
      borderRadius: s(12),
      borderWidth: 1,
      borderColor: FIELD,
      paddingHorizontal: s(13),
      backgroundColor: '#fff',
    },
    selectText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: INK },
    menu: { marginTop: s(6), borderWidth: 1, borderColor: FIELD, borderRadius: s(12), overflow: 'hidden', backgroundColor: '#fff' },
    menuItem: { paddingHorizontal: s(13), paddingVertical: s(11) },

    area: { minHeight: s(85), borderRadius: s(12), borderWidth: 1, borderColor: FIELD, backgroundColor: '#fff' },
    areaInput: {
      minHeight: s(85),
      paddingHorizontal: s(13),
      paddingTop: s(12),
      paddingBottom: s(36),
      paddingRight: s(44),
      fontFamily: fontFamily.regular,
      fontSize: fs(12),
      lineHeight: fs(19),
      color: INK,
    },
    mic: { position: 'absolute', right: s(6), bottom: s(6), width: s(28), height: s(28), borderRadius: s(14), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    error: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#C62828', marginTop: s(6) },

    attach: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
      marginTop: s(16),
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: FIELD,
      borderRadius: s(12),
      backgroundColor: '#F8F9FB',
      paddingHorizontal: s(14),
      paddingVertical: s(14),
    },
    attachIcon: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    attachTitle: { fontFamily: fontFamily.medium, fontSize: fs(12), lineHeight: fs(16), color: INK },
    attachSub: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: MUTED, marginTop: s(2) },
    submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), height: s(46), borderRadius: s(10), backgroundColor: ORANGE, marginTop: s(16), paddingHorizontal: s(10) },
    submitText: { fontFamily: fontFamily.semibold, fontSize: fs(14), color: '#fff', flexShrink: 1, textAlign: 'center' },

    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), color: INK, marginTop: s(22), marginBottom: s(12), marginLeft: s(2) },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    grvHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
    grvId: { flexShrink: 1, fontFamily: Platform.select({ web: 'monospace', ios: 'Menlo', default: 'monospace' }), fontSize: fs(12), color: MUTED },
    status: { flexDirection: 'row', alignItems: 'center', gap: s(7), borderRadius: s(12), paddingHorizontal: s(10), paddingVertical: s(4) },
    statusDot: { width: s(6), height: s(6), borderRadius: s(3) },
    statusText: { fontFamily: fontFamily.medium, fontSize: fs(11) },
    grvTitle: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(21), color: INK, marginTop: s(12) },
    grvSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginTop: s(4) },
    bar: { height: 4, borderRadius: 2, backgroundColor: '#E2E8EF', marginTop: s(12), overflow: 'hidden' },
    barFill: { height: 4, borderRadius: 2, backgroundColor: NAVY },
    dueRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(10) },
    dueText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: INK },
    expandText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginBottom: s(10) },
    viewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: s(5) },
    viewText: { fontFamily: fontFamily.semibold, fontSize: fs(13), color: NAVY },
    rateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(8) },
    rateText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: MUTED },
    stars: { flexDirection: 'row', gap: s(6) },

    note: { flexDirection: 'row', alignItems: 'center', gap: s(10), backgroundColor: '#E8EDF6', borderWidth: 1, borderColor: '#D4E1EF', borderRadius: s(14), padding: s(13), marginTop: s(16) },
    noteIcon: { width: s(24), height: s(24), borderRadius: s(12), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    noteText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(20), color: NAVY },

    footRule: { height: 2, backgroundColor: BORDER, marginTop: s(24), marginBottom: s(11) },
    foot: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(18), color: MUTED, textAlign: 'center' },

    toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: gutter },
    toast: { backgroundColor: INK, borderRadius: s(10), paddingHorizontal: s(14), paddingVertical: s(10), maxWidth: r.maxContentWidth },
    toastText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: '#fff', textAlign: 'center' },
  });
};
