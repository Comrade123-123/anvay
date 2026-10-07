import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { LoadState } from '../components/LoadState';
import { api, ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import type { JourneyData, JourneyStep } from '../api/types';
import { useToast } from '../components/Toast';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

// Screen 8 of ANVAY_ka_kaam.pdf (Application Status / Journey). Static mock data only.
// Layout notes: the reference overlapped the Copy button on the ID box; here the ID box and the Copy
// button sit in one wrapping row. Each milestone is one row (node column + content column) so the
// connector line always spans exactly from one node to the next, at any width or text length.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = colors.success;

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

type Step = JourneyStep;

type Props = { onBack?: () => void; onTabSelect?: (key: TabKey) => void; onRaiseGrievance?: () => void; onNotifications?: () => void };

export function JourneyScreen({ onBack, onTabSelect, onRaiseGrievance, onNotifications }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [copied, setCopied] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const { data, error, reload } = useApi<JourneyData>('/journey');
  const app = data?.application ?? null;

  const copyId = () => {
    try {
      Promise.resolve((globalThis as any).navigator?.clipboard?.writeText?.(app?.applicationNo ?? '')).catch(() => {});
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Demo only: stands in for the officers so the status can be shown changing.
  const advance = async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      const res = await api.post<{ completedStage: number | null; nextStage: number | null; finished: boolean; settledPayments?: number }>('/demo/advance');
      if (res.completedStage == null) toast(res.settledPayments ? `${res.settledPayments} payment(s) settled.` : 'Everything is already complete.');
      else toast(res.finished ? 'Final stage complete. Scholarship credited.' : `Stage ${res.completedStage} complete. Now at stage ${res.nextStage}.`);
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not move the application forward.');
    } finally {
      setAdvancing(false);
    }
  };

  const nodeSize = r.s(30);

  const renderNode = (st: Step) => {
    if (st.state === 'done')
      return (
        <View style={[styles.node, styles.nodeDone]}>
          <Icon name="check" size={r.s(17)} color="#FFFFFF" />
        </View>
      );
    if (st.state === 'current')
      return (
        <View style={styles.halo}>
          <View style={styles.ring}>
            <View style={styles.ringDot} />
          </View>
        </View>
      );
    return (
      <View style={[styles.node, styles.nodeTodo]}>
        {st.state === 'final' ? (
          <Icon name="wallet-outline" size={r.s(16)} color={colors.textMuted} />
        ) : (
          <Text style={styles.nodeNum}>{st.n}</Text>
        )}
      </View>
    );
  };

  const renderContent = (st: Step) => {
    const done = st.state === 'done';
    const current = st.state === 'current';
    const dim = st.state === 'upcoming' || st.state === 'final';
    const badgeStyle = done ? styles.badgeGreen : current ? styles.badgeNavy : styles.badgeGrey;
    const badgeText = done ? { color: GREEN } : current ? { color: '#FFFFFF' } : { color: colors.textMuted };
    return (
      <>
        <View style={styles.stepHead}>
          <Text style={[styles.stepTitle, dim && { color: '#4B5563', fontFamily: fontFamily.medium }]}>
            {st.n}. {st.title} {st.hi ? <Hi style={[styles.stepTitle, dim && { color: '#4B5563' }]}>{st.hi}</Hi> : null}
          </Text>
          <View style={[styles.badge, badgeStyle]}>
            <Text style={[styles.badgeText, badgeText]}>{st.badge}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Icon name={st.icon as IconName} size={r.s(16)} color={current ? ORANGE : dim ? colors.textMuted : NAVY} />
          <Text style={[styles.metaText, dim && { color: colors.textMuted }, current && { fontFamily: fontFamily.bold }]}>{st.meta}</Text>
        </View>
        <Text style={[styles.stepDesc, dim && { color: colors.textMuted }]}>{st.desc}</Text>
        {current && (
          <>
            <View style={styles.cardRule} />
            <View style={styles.deskRow}>
              <View style={styles.deskLeft}>
                <Icon name="badge-account-outline" size={r.s(16)} color={colors.textSecondary} />
                <Text style={styles.deskText}>{st.desk}</Text>
              </View>
              <View style={styles.eta}>
                <Text style={styles.etaText}>{st.eta}</Text>
              </View>
            </View>
          </>
        )}
      </>
    );
  };

  if (!data) return <LoadState error={error} onRetry={reload} label="Loading your application status…" />;
  if (!app)
    return (
      <View style={{ flex: 1 }}>
        <LoadState error="You have no active application yet. Apply for a scheme and you can follow it here." title="Nothing to track yet" />
        <BottomTabBar active="journey" onSelect={onTabSelect} />
      </View>
    );
  const inr = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')}`);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navy header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 10 }]}>
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
              <Text style={styles.title} numberOfLines={2}>
                Application Status <Hi style={styles.titleHi}>/ आवेदन स्थिति</Hi>
              </Text>
              <View style={styles.langBtn}>
                <Hi style={styles.langText}>अ</Hi>
                <Text style={styles.langText}> / A</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onNotifications} hitSlop={8} style={styles.bell}>
                <Icon name="bell-outline" size={r.s(22)} color="#FFFFFF" />
                <View style={styles.bellDot} />
              </Pressable>
            </View>
            <View style={styles.headerRule} />
            <View style={styles.ministryRow}>
              <Icon name="check-decagram-outline" size={r.s(18)} color={ORANGE} />
              <Text style={styles.ministry} numberOfLines={2}>
                <Hi style={styles.ministry}>जनजातीय कार्य मंत्रालय</Hi> | MoTA (Govt. of India)
              </Text>
              <View style={styles.live}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE PFMS</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Application summary */}
          <View style={styles.card}>
            <View style={styles.idRow}>
              <View style={styles.idBox}>
                <Text style={styles.idLabel}>
                  APPLICATION ID / <Hi style={styles.idLabel}>आवेदन संख्या</Hi>
                </Text>
                <Text style={styles.idValue}>{app.applicationNo}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={copyId} style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}>
                <Icon name={copied ? 'check' : 'content-copy'} size={r.s(18)} color={copied ? GREEN : NAVY} />
                <Text style={[styles.copyText, copied && { color: GREEN }]}>
                  {copied ? 'Copied / ' : 'Copy / '}
                  <Hi style={[styles.copyText, copied && { color: GREEN }]}>{copied ? 'कॉपी हुआ' : 'कॉपी'}</Hi>
                </Text>
              </Pressable>
            </View>

            <View style={styles.schemeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheme}>{app.title}</Text>
                <Text style={styles.beneficiary}>
                  Beneficiary: <Text style={styles.beneficiaryName}>{data.beneficiary}</Text>
                </Text>
              </View>
              <View style={styles.bankTile}>
                <Icon name="bank" size={r.s(24)} color={DARK} />
              </View>
            </View>

            <View style={styles.rule} />

            <View style={styles.chips}>
              <View style={[styles.chip, styles.chipGrey]}>
                <Icon name="calendar-month-outline" size={r.s(17)} color={DARK} />
                <Text style={[styles.chipText, { color: DARK }]}>AY {app.academicYear}</Text>
              </View>
              <View style={[styles.chip, styles.chipGreen]}>
                <Text style={[styles.chipText, { color: GREEN, fontFamily: fontFamily.bold }]}>{inr(app.amount)} DBT</Text>
              </View>
              <View style={[styles.chip, styles.chipBlue]}>
                <Icon name="shield-outline" size={r.s(16)} color={DARK} />
                <Text style={[styles.chipText, { color: DARK }]}>
                  ST Quota / <Hi style={[styles.chipText, { color: DARK }]}>अनुसूचित जनजाति</Hi>
                </Text>
              </View>
            </View>
          </View>

          {/* Milestones */}
          <View style={styles.card}>
            <View style={styles.msHead}>
              <Icon name="clipboard-check-outline" size={r.s(26)} color={DARK} />
              <Text style={styles.msTitle}>
                Verification Milestones / <Hi style={styles.msTitle}>सत्यापन स्थिति</Hi>
              </Text>
              <View style={styles.stage}>
                <Text style={styles.stageText}>{app.finished ? 'Completed' : `Stage ${app.currentStage} of 6`}</Text>
              </View>
            </View>
            <View style={styles.rule} />

            {app.steps.map((st, i) => {
              const last = i === app.steps.length - 1;
              const done = st.state === 'done';
              const current = st.state === 'current';
              return (
                <View key={st.n} style={styles.stepRow}>
                  <View style={[styles.nodeCol, { width: nodeSize + r.s(6) }]}>
                    {renderNode(st)}
                    {!last &&
                      (done ? (
                        <View style={styles.lineSolid} />
                      ) : (
                        <View style={styles.lineDashedWrap}>
                          <Svg width={2} height="100%">
                            <Line x1={1} y1={0} x2={1} y2="100%" stroke="#CBD5E3" strokeWidth={2} strokeDasharray="5 5" />
                          </Svg>
                        </View>
                      ))}
                  </View>
                  {current ? (
                    <View style={[styles.stepBody, styles.currentCard]}>{renderContent(st)}</View>
                  ) : (
                    <View style={[styles.stepBody, !last && { paddingBottom: r.s(20) }]}>{renderContent(st)}</View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Expected payment */}
          <View style={styles.expected}>
            <View style={styles.expectedIcon}>
              <Icon name="calendar-arrow-right" size={r.s(24)} color="#8A4B00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expectedTitle}>
                {app.finished ? 'Scholarship credited / ' : `Expected payment in ~${app.expected.days} days / `}
                <Hi style={styles.expectedTitle}>{app.finished ? 'भुगतान हो गया' : 'संभावित भुगतान'}</Hi>
              </Text>
              <Text style={styles.expectedBody}>
                {app.finished ? 'The amount has been credited to your bank account.' : `Disbursement scheduled for ${app.expected.date} upon final approval and treasury seal.`}
              </Text>
            </View>
          </View>

          {/* Designated account */}
          <View style={styles.card}>
            <View style={styles.acctTop}>
              <View style={styles.acctIcon}>
                <Icon name="bank" size={r.s(22)} color={DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.acctLabel}>DESIGNATED DBT ACCOUNT</Text>
                <Text style={styles.acctValue}>{data.bank.name} •••• {data.bank.last4}</Text>
              </View>
              <View style={styles.seeded}>
                <Icon name="check-circle-outline" size={r.s(18)} color={GREEN} />
                <Text style={styles.seededText}>
                  {data.bank.seeded ? 'NPCI Seeded / ' : 'Seeding pending / '}
                  <Hi style={styles.seededText}>{data.bank.seeded ? 'आधार लिंक है' : 'लिंक लंबित'}</Hi>{data.bank.seeded ? ' ✓' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.acctBox}>
              <View style={styles.acctLine}>
                <Text style={styles.acctKey}>
                  Beneficiary / <Hi style={styles.acctKey}>लाभार्थी:</Hi>
                </Text>
                <Text style={styles.acctVal}>{data.beneficiary}</Text>
              </View>
              <View style={styles.acctLine}>
                <Text style={styles.acctKey}>Validation Status:</Text>
                <View style={styles.validRow}>
                  <View style={styles.validDot} />
                  <Text style={styles.validText}>{data.bank.seeded ? 'NPCI Active · PFMS Validated' : 'Seeding pending'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.lockRow}>
              <Icon name="lock-outline" size={r.s(18)} color={DARK} />
              <Text style={styles.lockText}>
                Direct benefit is protected by Aadhaar OTP validation. Zero intermediary deductions.
              </Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => toast('Acknowledgement PDF saved (demo)')} style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="download" size={r.s(22)} color="#FFFFFF" />
            <Text style={styles.downloadText}>Download Official Acknowledgement (PDF)</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onRaiseGrievance} style={({ pressed }) => [styles.grievanceBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="flag-outline" size={r.s(20)} color={ORANGE} />
            <Text style={styles.grievanceText}>
              Raise Grievance / CPGRAMS <Hi style={styles.grievanceText}>शिकायत दर्ज करें</Hi>
            </Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={advance} disabled={advancing} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: r.s(12) }}>
            <Text style={{ fontFamily: fontFamily.medium, fontSize: r.fs(12), color: colors.textSecondary, textDecorationLine: 'underline' }}>
              {advancing ? 'Updating…' : 'Demo control: move application to the next stage'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerStrong}>
              National Informatics Centre (NIC) <Text style={styles.footerLight}>• NSP 3.0</Text>
            </Text>
            <Text style={styles.footerLine}>
              Ministry of Tribal Affairs · Government of India / <Hi style={styles.footerLine}>भारत सरकार</Hi>
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="journey" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
  const cardBase = { backgroundColor: '#FFFFFF', borderRadius: s(20), borderWidth: 1, borderColor: colors.border } as const;
  const node = s(30);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: s(24) },

    header: { backgroundColor: DARK, paddingBottom: s(14) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    backBtn: { paddingRight: s(4) },
    title: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fs(17), lineHeight: fs(23), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), color: '#B9CBEA' },
    langBtn: { flexDirection: 'row', alignItems: 'center', height: s(32), paddingHorizontal: s(12), borderRadius: s(10), borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)' },
    langText: { fontFamily: fontFamily.bold, fontSize: fs(11.5), color: '#FFFFFF' },
    bell: { width: s(30), height: s(30), alignItems: 'center', justifyContent: 'center' },
    bellDot: { position: 'absolute', top: 2, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
    headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: s(12) },
    ministryRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(12) },
    ministry: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11.5), lineHeight: fs(16), color: 'rgba(255,255,255,0.88)' },
    live: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: s(16), borderWidth: 1, borderColor: 'rgba(61,220,132,0.45)', backgroundColor: 'rgba(29,142,61,0.2)', paddingHorizontal: s(12), paddingVertical: s(6) },
    liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#3DDC84' },
    liveText: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.5, color: '#7CF0B0' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    card: { ...cardBase, padding: s(18), marginTop: s(14) },
    rule: { height: 1, backgroundColor: colors.border, marginVertical: s(14) },

    idRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: s(10) },
    idBox: { flexGrow: 1, flexBasis: s(200), backgroundColor: '#F0F2F7', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: s(14), paddingHorizontal: s(14), paddingVertical: s(12) },
    idLabel: { fontFamily: fontFamily.regular, fontSize: fs(11), letterSpacing: 0.8, color: colors.textSecondary },
    idValue: { fontFamily: mono, fontWeight: '700', fontSize: fs(15), lineHeight: fs(22), color: DARK, marginTop: 4 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: s(12), borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', paddingHorizontal: s(14), paddingVertical: s(10) },
    copyText: { fontFamily: fontFamily.semibold, fontSize: fs(11.5), color: NAVY },

    schemeRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(18) },
    scheme: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(24), color: DARK },
    beneficiary: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: colors.textSecondary, marginTop: 4 },
    beneficiaryName: { fontFamily: fontFamily.bold, color: colors.textPrimary },
    bankTile: { width: s(46), height: s(46), borderRadius: s(12), backgroundColor: '#F0F2F7', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: s(10), borderWidth: 1, paddingHorizontal: s(12), paddingVertical: s(8) },
    chipGrey: { backgroundColor: '#F0F2F7', borderColor: colors.border },
    chipGreen: { backgroundColor: '#E9FAF0', borderColor: '#A8E6C1' },
    chipBlue: { backgroundColor: '#EAF3FF', borderColor: '#BBD6F7' },
    chipText: { fontFamily: fontFamily.medium, fontSize: fs(12), lineHeight: fs(17) },

    msHead: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    msTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(21), color: DARK },
    stage: { backgroundColor: '#F0F2F7', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: s(10), paddingHorizontal: s(10), paddingVertical: s(6) },
    stageText: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: DARK, textAlign: 'center' },

    stepRow: { flexDirection: 'row', gap: s(12) },
    nodeCol: { alignItems: 'center' },
    node: { width: node, height: node, borderRadius: node / 2, alignItems: 'center', justifyContent: 'center' },
    nodeDone: { backgroundColor: GREEN },
    nodeTodo: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D5DCE8' },
    nodeNum: { fontFamily: fontFamily.bold, fontSize: fs(11), color: colors.textMuted },
    halo: { width: node + s(10), height: node + s(10), borderRadius: (node + s(10)) / 2, backgroundColor: '#E8F0FD', alignItems: 'center', justifyContent: 'center' },
    ring: { width: node - s(2), height: node - s(2), borderRadius: (node - s(2)) / 2, borderWidth: s(4), borderColor: DARK, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    ringDot: { width: s(9), height: s(9), borderRadius: s(5), backgroundColor: DARK },
    lineSolid: { flex: 1, width: 3, backgroundColor: GREEN, marginTop: 4 },
    lineDashedWrap: { flex: 1, width: 2, marginTop: 4 },

    stepBody: { flex: 1, minWidth: 0 },
    currentCard: { backgroundColor: '#F0F4F9', borderWidth: 2, borderColor: '#B6C2D6', borderRadius: s(16), padding: s(14), marginBottom: s(20) },
    stepHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: s(10), rowGap: 6 },
    stepTitle: { flexGrow: 1, flexShrink: 1, flexBasis: s(140), fontFamily: fontFamily.bold, fontSize: fs(13.5), lineHeight: fs(19), color: '#1F2836' },
    badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: s(9), paddingVertical: s(4) },
    badgeGreen: { backgroundColor: '#E9FAF0', borderColor: '#A8E6C1' },
    badgeNavy: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
    badgeGrey: { backgroundColor: '#F1F3F7', borderColor: '#E1E4EB' },
    badgeText: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.4, textAlign: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: s(8) },
    metaText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fs(12), lineHeight: fs(17), color: NAVY },
    stepDesc: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: colors.textSecondary, marginTop: 6 },
    cardRule: { height: 1, backgroundColor: colors.border, marginVertical: s(12) },
    deskRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(10) },
    deskLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    deskText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: colors.textSecondary },
    eta: { backgroundColor: '#EAF3FF', borderWidth: 1, borderColor: '#BBD6F7', borderRadius: s(8), paddingHorizontal: s(12), paddingVertical: s(6) },
    etaText: { fontFamily: fontFamily.bold, fontSize: fs(11.5), color: DARK },

    expected: { flexDirection: 'row', gap: s(14), marginTop: s(14), backgroundColor: '#FBF7EC', borderWidth: 1.5, borderColor: '#F3E2A3', borderRadius: s(18), padding: s(16) },
    expectedIcon: { width: s(46), height: s(46), borderRadius: s(12), backgroundColor: '#FBE8BE', alignItems: 'center', justifyContent: 'center' },
    expectedTitle: { fontFamily: fontFamily.bold, fontSize: fs(13.5), lineHeight: fs(19), color: '#8A4B00' },
    expectedBody: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(19), color: '#7A4200', marginTop: 4 },

    acctTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s(12) },
    acctIcon: { width: s(44), height: s(44), borderRadius: s(12), backgroundColor: '#F0F2F7', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    acctLabel: { fontFamily: fontFamily.bold, fontSize: fs(10.5), letterSpacing: 0.8, color: colors.textSecondary },
    acctValue: { fontFamily: fontFamily.bold, fontSize: fs(17), lineHeight: fs(22), color: DARK },
    seeded: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, maxWidth: '48%', borderRadius: s(22), borderWidth: 1.5, borderColor: '#7EE0AE', backgroundColor: '#E9FAF0', paddingHorizontal: s(14), paddingVertical: s(8) },
    seededText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: GREEN },
    acctBox: { marginTop: s(14), backgroundColor: '#F0F2F7', borderWidth: 1, borderColor: colors.border, borderRadius: s(14), padding: s(14), gap: s(8) },
    acctLine: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', columnGap: s(10), rowGap: 2 },
    acctKey: { fontFamily: fontFamily.regular, fontSize: fs(12), color: colors.textSecondary },
    acctVal: { fontFamily: fontFamily.bold, fontSize: fs(12), color: colors.textPrimary },
    validRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    validDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
    validText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: GREEN },
    lockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: s(14) },
    lockText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11.5), lineHeight: fs(17), color: colors.textSecondary },

    downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), minHeight: s(56), marginTop: s(18), borderRadius: s(14), backgroundColor: ORANGE, paddingHorizontal: s(14), paddingVertical: s(10) },
    downloadText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: '#FFFFFF', textAlign: 'center' },
    grievanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), minHeight: s(54), marginTop: s(12), borderRadius: s(14), borderWidth: 1.5, borderColor: DARK, backgroundColor: '#FFFFFF', paddingHorizontal: s(14), paddingVertical: s(10) },
    grievanceText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(12.5), lineHeight: fs(18), color: DARK, textAlign: 'center' },

    footer: { alignItems: 'center', marginTop: s(22), gap: 4 },
    footerStrong: { fontFamily: fontFamily.bold, fontSize: fs(12), color: DARK, textAlign: 'center' },
    footerLight: { fontFamily: fontFamily.regular, color: colors.textSecondary },
    footerLine: { fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(15), color: colors.textSecondary, textAlign: 'center' },
  });
};
