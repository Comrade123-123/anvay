import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';
import { LoadState } from '../components/LoadState';
import { api, ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import type { DbtData, DbtPayment } from '../api/types';

// Screen 7 of ANVAY_ka_kaam.pdf (DBT & Direct Payments), opened from Home > DBT Status. Data comes from /api/dbt.
// Sizes below are the PDF's real point sizes on its 390pt frame (measured from the drawing data), scaled by
// the shared responsive helper. Ledger cards use one structure: icon | text column | amount + status column,
// then a footer row; long titles wrap inside their own column and never push the status chip around.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = colors.success;
const RED = '#C62828';
const MUTED = '#606B7C';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const iconFor = (p: DbtPayment): IconName => (/book|equipment/i.test(p.label) ? 'book-open-page-variant' : /maintenance|allowance/i.test(p.label) ? 'cash-multiple' : 'school');

const STATUS = {
  credited: { icon: 'check-circle' as IconName, hi: 'खाते में जमा', en: '(Credited)', color: GREEN, bg: '#E6F4E9', border: '#A8DAB5' },
  processing: { icon: 'sync' as IconName, hi: 'प्रक्रियाधीन', en: '(Processing)', color: '#AF6000', bg: '#FDF6DF', border: '#F9D685' },
  failed: { icon: 'close-circle' as IconName, hi: 'विफल', en: '(Action Needed)', color: RED, bg: '#FBE8E6', border: '#F4C1C6' },
};

type Props = { onBack?: () => void; onTabSelect?: (key: TabKey) => void; onFixSeeding?: () => void; onNotifications?: () => void };

export function DbtScreen({ onBack, onTabSelect, onFixSeeding, onNotifications }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'hi' | 'en'>('en');
  const [fy, setFy] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, reload } = useApi<DbtData>(fy ? `/dbt?fy=${fy}` : '/dbt');

  if (!data) return <LoadState error={error} onRetry={reload} label="Loading your payments…" />;
  const bank = `${data.bank.name ?? 'Bank account'} (•••• ${data.bank.last4 ?? '----'})`;

  const nextFy = () => {
    if (data.fys.length < 2) return toast(`Only FY ${data.fy} has payments in this demo`);
    setFy(data.fys[(data.fys.indexOf(data.fy) + 1) % data.fys.length]);
  };

  const reinitiate = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await api.post(`/payments/${id}/retry`);
      toast('Re-initiation request sent to PFMS. Payment is processing.');
      await reload();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SEEDING_REQUIRED') {
        toast('Aadhaar seeding is needed first.');
        onFixSeeding?.();
      } else toast(e instanceof ApiError ? e.message : 'Could not re-initiate this payment.');
    } finally {
      setBusyId(null);
    }
  };

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
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.sqBtn}>
                <Icon name="arrow-left" size={r.s(18)} color="#FFFFFF" />
              </Pressable>
              <View style={styles.titleCol}>
                <Text style={styles.title} numberOfLines={1}>DBT & Direct Payments</Text>
                <Text style={styles.titleHi} numberOfLines={1}>डीबीटी एवं प्रत्यक्ष लाभ भुगतान</Text>
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
              <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onNotifications} style={styles.sqBtn}>
                <Icon name="bell-outline" size={r.s(18)} color="#FFFFFF" />
                <View style={styles.bellDot} />
              </Pressable>
            </View>
            <View style={styles.headerRule} />
            <View style={styles.ministryRow}>
              <Icon name="bank" size={r.s(13)} color="#FFAF70" />
              <Text style={styles.ministry} numberOfLines={1}>
                <Hi style={styles.ministry}>जनजातीय कार्य मंत्रालय</Hi> | MoTA (Govt. of India)
              </Text>
              <View style={styles.live}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>PFMS Live</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Direct Benefit Transfer balance card */}
          <View style={styles.hero}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <Pattern id="stripes" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                  <Line x1="0" y1="0" x2="0" y2="12" stroke="#FFFFFF" strokeOpacity={0.04} strokeWidth={5} />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#stripes)" />
              <Circle cx="93%" cy="105%" r="64" fill="#FFFFFF" fillOpacity={0.05} />
            </Svg>

            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Icon name="bank" size={r.s(18)} color="#FFCF99" />
              </View>
              <View style={styles.heroLabel}>
                <Text style={styles.heroKind}>DIRECT BENEFIT TRANSFER</Text>
                <Hi style={styles.heroKindHi}>समेकित सहायता राशि</Hi>
              </View>
              <View style={styles.seeded}>
                <Icon name={data.bank.seeded ? 'check-decagram' : 'alert-circle-outline'} size={r.s(12)} color={data.bank.seeded ? '#6BEB83' : '#FFAF70'} />
                <Text style={styles.seededText}>{data.bank.seeded ? 'NPCI Seeded' : 'Seeding pending'}</Text>
              </View>
            </View>

            <View style={styles.heroMid}>
              <View style={styles.heroAmountCol}>
                <Text style={styles.heroAmount}>{inr(data.totalDisbursed)}</Text>
                <Text style={styles.heroCaption}>
                  Total Grants Disbursed (<Hi style={styles.heroCaption}>समेकित डीबीटी अनुदान</Hi>)
                </Text>
              </View>
              <View style={styles.aadhaarBox}>
                <Text style={styles.aadhaarBoxText}>100% Aadhaar{'\n'}DBT</Text>
              </View>
            </View>

            <View style={styles.heroRule} />

            <View style={styles.idRow}>
              <View style={styles.idTile}>
                <Text style={styles.idLabel}>
                  SCHOLAR ID (<Hi style={styles.idLabel}>छात्र पहचान</Hi>)
                </Text>
                <Text style={styles.idValue} numberOfLines={1}>{data.scholarId ?? '—'}</Text>
              </View>
              <View style={styles.idTile}>
                <Text style={styles.idLabel}>PFMS SCHOLAR ID</Text>
                <Text style={styles.idValue} numberOfLines={1}>{data.pfmsId ?? '—'}</Text>
              </View>
            </View>

            <View style={styles.bankRow}>
              <View style={styles.bankLeft}>
                <Icon name="wallet-outline" size={r.s(12)} color="#D4E2F6" />
                <Text style={styles.bankName}>{bank}</Text>
              </View>
              <Text style={styles.ifsc}>IFSC: {data.bank.ifsc ?? '—'}</Text>
            </View>
          </View>

          {/* Urgent alert: icon column + content column, everything under the title lines up with it */}
          {data.alert && (
          <View style={styles.alert}>
            <View style={styles.alertIcon}>
              <Icon name="alert" size={r.s(20)} color={RED} />
            </View>
            <View style={styles.alertCol}>
              <View style={styles.alertTitleRow}>
                <Text style={styles.alertTitle}>
                  Aadhaar Seeding Pending / <Hi style={styles.alertTitle}>आधार सीडिंग लंबित</Hi>
                </Text>
                <View style={styles.urgent}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              </View>
              <Text style={styles.alertBody}>
                {data.alert.text}. Failed payments cannot be released until the mapping with{' '}
                <Text style={styles.alertBold}>NPCI DBT Mapper</Text> is complete.
              </Text>
              <View style={styles.alertActions}>
                <Pressable accessibilityRole="button" onPress={onFixSeeding} style={({ pressed }) => [styles.fixBtn, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.fixText}>
                    Fix via NPCI / <Hi style={styles.fixText}>आधार लिंक करें</Hi>
                    {'\n'}(3 Steps)
                  </Text>
                  <Icon name="open-in-new" size={r.s(14)} color="#FFFFFF" />
                </Pressable>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={async () => { await reload(); toast('Payment status refreshed from PFMS'); }}>
                  <Text style={styles.checkStatus}>Check{'\n'}Status</Text>
                </Pressable>
              </View>
            </View>
          </View>
          )}

          {/* Ledger heading */}
          <View style={styles.ledgerHead}>
            <View style={styles.ledgerHeadText}>
              <Text style={styles.ledgerTitle}>DBT Transaction Ledger</Text>
              <Text style={styles.ledgerSub}>
                <Hi style={styles.ledgerSub}>भुगतान विवरणी</Hi> · Public Financial Management System
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Filter by financial year" onPress={nextFy} style={styles.filter}>
              <Text style={styles.filterText}>FY {data.fy.replace('-', '\u2011')}</Text>
              <Icon name="tune-variant" size={r.s(14)} color={MUTED} />
            </Pressable>
          </View>

          {/* Transactions */}
          {data.payments.length === 0 && <Text style={[styles.ledgerSub, { textAlign: 'center', marginVertical: r.s(20) }]}>No payments in this financial year.</Text>}
          {data.payments.map((t) => {
            const st = STATUS[t.status];
            const failed = t.status === 'failed';
            const credit = !failed;
            return (
              <View key={t.id} style={[styles.txn, failed && styles.txnFailed]}>
                <View style={styles.txnTop}>
                  <View style={[styles.txnIcon, failed && styles.txnIconFailed]}>
                    <Icon name={iconFor(t)} size={r.s(18)} color={failed ? RED : NAVY} />
                  </View>
                  <View style={styles.txnText}>
                    <Text style={[styles.txnKind, failed && { color: RED }]}>{t.source.toUpperCase()}</Text>
                    <Text style={styles.txnTitle}>{t.label}</Text>
                    <Text style={styles.txnDate}>Date: {t.date}</Text>
                  </View>
                  <View style={styles.txnRight}>
                    <Text style={[styles.txnAmount, failed && { color: RED }]}>
                      {credit ? '+ ' : ''}
                      {inr(t.amount)}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: st.bg, borderColor: st.border }]}>
                      <Icon name={st.icon} size={r.s(11)} color={st.color} />
                      <Text style={[styles.statusText, { color: st.color }]} numberOfLines={1}>
                        <Hi style={[styles.statusText, { color: st.color }]}>{st.hi}</Hi> {st.en}
                      </Text>
                    </View>
                  </View>
                </View>

                {failed ? (
                  <View style={styles.errorBox}>
                    <View style={styles.errorRow}>
                      <Icon name="alert-circle-outline" size={r.s(13)} color={RED} />
                      <Text style={styles.errorText}>
                        <Hi style={styles.errorText}>विफल: आधार सीडिंग आवश्यक</Hi> {t.failureReason ? `(${t.failureReason})` : ''}
                      </Text>
                    </View>
                    <View style={styles.errorRule} />
                    <View style={styles.errorFoot}>
                      <Text style={styles.mono}>{t.failureRef ? `ERR-REF: ${t.failureRef}` : ''}</Text>
                      <Pressable accessibilityRole="button" hitSlop={10} onPress={() => reinitiate(t.id)} style={styles.reinit}>
                        <Text style={styles.reinitText}>{busyId === t.id ? 'Sending…' : 'Re-Initiate Disbursal'}</Text>
                        <Icon name="chevron-right" size={r.s(14)} color={ORANGE} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.rule} />
                    <View style={styles.txnFoot}>
                      {t.status === 'processing' ? (
                        <View style={styles.noteRow}>
                          <Icon name="timer-sand" size={r.s(12)} color="#855B00" />
                          <Text style={styles.noteText}>State Treasury Sanctioned · RBI NACH Batch</Text>
                        </View>
                      ) : (
                        <Text style={[styles.mono, styles.footLeft]}>{t.reference ?? ''}</Text>
                      )}
                      <Text style={styles.txnBank}>{bank}</Text>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          {/* Safeguard */}
          <View style={styles.safeguard}>
            <View style={styles.safeIcon}>
              <Icon name="shield-check-outline" size={r.s(16)} color={NAVY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safeTitle}>DIRECT BENEFIT TRANSFER (DBT) MISSION SAFEGUARD</Text>
              <Text style={styles.safeBody}>
                Payments comply with RBI DBT guidelines and Public Financial Management System (PFMS). No
                administrative deductions allowed.
              </Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => toast('Certificate download started (demo)')} style={({ pressed }) => [styles.download, pressed && { opacity: 0.85 }]}>
            <Icon name="download-circle-outline" size={r.s(16)} color={ORANGE} />
            <Text style={styles.downloadText}>Download PFMS Annual DBT Certificate (Form 16)</Text>
          </Pressable>

          <Text style={styles.footer}>
            <Hi style={styles.footer}>भारत सरकार</Hi> • Government of India • National Informatics Centre (NIC)
          </Text>
        </View>
      </ScrollView>

      <BottomTabBar active="home" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(16), borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: s(24) },

    // ---- header (PDF: 17/11/12/10pt, 32pt buttons, 29pt pill)
    header: { backgroundColor: DARK, paddingBottom: s(12) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    sqBtn: { width: s(32), height: s(32), borderRadius: s(8), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    bellDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE, borderWidth: 1, borderColor: DARK },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.semibold, fontSize: fs(17), lineHeight: fs(22), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: '#A5C3E9' },
    langBtn: { flexDirection: 'row', alignItems: 'center', height: s(29), paddingHorizontal: s(11), borderRadius: s(15), borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.06)' },
    langText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: '#FFFFFF' },
    headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: s(10) },
    ministryRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(10) },
    ministry: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: '#CFDFF2' },
    live: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(15,184,128,0.2)', borderRadius: s(6), paddingHorizontal: s(9), paddingVertical: s(3) },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6EE6B6' },
    liveText: { fontFamily: fontFamily.medium, fontSize: fs(10), color: '#6EE6B6' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- balance card (PDF: 358x259, radius ~20)
    hero: { marginTop: s(12), backgroundColor: '#1A3A6B', borderRadius: s(20), borderWidth: 1, borderColor: '#2D528E', padding: s(16), overflow: 'hidden' },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    heroIcon: { width: s(36), height: s(36), borderRadius: s(10), backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
    heroLabel: { flex: 1, minWidth: 0 },
    heroKind: { fontFamily: fontFamily.medium, fontSize: fs(11), lineHeight: fs(14), letterSpacing: 0.9, color: '#B8D3F8' },
    heroKindHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: '#FFFFFF' },
    seeded: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: s(12), borderWidth: 1, borderColor: '#48B85B', backgroundColor: 'rgba(19,135,8,0.5)', paddingHorizontal: s(9), paddingVertical: s(4) },
    seededText: { fontFamily: fontFamily.semibold, fontSize: fs(10), color: '#6BEB83' },
    heroMid: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(12), marginTop: s(14) },
    heroAmountCol: { flex: 1, minWidth: 0 },
    heroAmount: { fontFamily: fontFamily.bold, fontSize: fs(30), lineHeight: fs(38), color: '#FFFFFF' },
    heroCaption: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: '#A5C4ED' },
    aadhaarBox: { borderRadius: s(8), borderWidth: 1, borderColor: 'rgba(255,175,112,0.55)', backgroundColor: 'rgba(255,175,112,0.14)', paddingHorizontal: s(10), paddingVertical: s(6), marginTop: s(2) },
    aadhaarBoxText: { fontFamily: fontFamily.semibold, fontSize: fs(11), lineHeight: fs(16), color: '#FFAF70', textAlign: 'right' },
    heroRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: s(12) },
    idRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6) },
    idTile: { flexGrow: 1, flexBasis: s(150), borderRadius: s(10), borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.16)', paddingHorizontal: s(9), paddingVertical: s(8) },
    idLabel: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), letterSpacing: 0.4, color: '#A5C3E9' },
    idValue: { fontFamily: mono, fontWeight: '700', fontSize: fs(10.5), lineHeight: fs(17), color: '#FFFFFF', marginTop: 2 },
    bankRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(8), rowGap: 4, marginTop: s(12) },
    bankLeft: { flexDirection: 'row', alignItems: 'center', gap: s(8), flexShrink: 1 },
    bankName: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#D4E2F6' },
    ifsc: { fontFamily: mono, fontSize: fs(10), color: 'rgba(255,255,255,0.6)' },

    // ---- urgent alert (PDF: 358x191, radius 16, border #C62828)
    alert: { flexDirection: 'row', gap: s(12), marginTop: s(14), backgroundColor: '#FFF4F2', borderRadius: s(16), borderWidth: 1.5, borderColor: RED, padding: s(15) },
    alertIcon: { width: s(36), height: s(36), borderRadius: s(10), backgroundColor: '#FFCDD1', alignItems: 'center', justifyContent: 'center' },
    alertCol: { flex: 1, minWidth: 0 },
    alertTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(8) },
    alertTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: '#900000' },
    urgent: { backgroundColor: RED, borderRadius: 4, paddingHorizontal: s(8), paddingVertical: s(3), marginTop: 1 },
    urgentText: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.3, color: '#FFFFFF' },
    alertBody: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: '#5B1A1A', marginTop: s(6) },
    alertBold: { fontFamily: fontFamily.bold },
    alertActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s(14), marginTop: s(12) },
    fixBtn: { flexGrow: 1, flexShrink: 1, flexBasis: s(170), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), minHeight: s(48), borderRadius: s(10), backgroundColor: ORANGE, paddingHorizontal: s(12), paddingVertical: s(6) },
    fixText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(18), color: '#FFFFFF', textAlign: 'center' },
    checkStatus: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(18), color: DARK, textDecorationLine: 'underline', textAlign: 'center' },

    // ---- ledger heading + filter (PDF: 16/11pt; filter kept on one line)
    ledgerHead: { flexDirection: 'row', alignItems: 'flex-start', gap: s(12), marginTop: s(18), marginBottom: s(11) },
    ledgerHeadText: { flex: 1, minWidth: 0 },
    ledgerTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: DARK },
    ledgerSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 2 },
    filter: { flexDirection: 'row', alignItems: 'center', gap: s(8), ...card, borderRadius: s(10), paddingHorizontal: s(11), paddingVertical: s(8) },
    filterText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: DARK },

    // ---- transaction cards (PDF: padding 15, 36pt icon tile, 15pt amount, 10pt status chip)
    txn: { ...card, marginBottom: s(10), padding: s(15) },
    txnFailed: { backgroundColor: '#FFF8F6', borderColor: '#FFCDD1' },
    txnTop: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10) },
    txnIcon: { width: s(36), height: s(36), borderRadius: s(10), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    txnIconFailed: { backgroundColor: '#FFEBED' },
    txnText: { flex: 1, minWidth: s(96) },
    txnKind: { fontFamily: fontFamily.bold, fontSize: fs(10), lineHeight: fs(14), letterSpacing: 0.6, color: MUTED },
    txnTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: DARK, marginTop: 2 },
    txnDate: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 4 },
    txnRight: { alignItems: 'flex-end', flexShrink: 0, gap: s(5) },
    txnAmount: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(19), color: DARK },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: s(8), borderWidth: 1, paddingHorizontal: s(8), paddingVertical: s(4) },
    statusText: { fontFamily: fontFamily.bold, fontSize: fs(10) },
    rule: { height: 1, backgroundColor: colors.border, marginVertical: s(12) },
    txnFoot: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(12) },
    footLeft: { flexShrink: 1 },
    mono: { fontFamily: mono, fontSize: fs(10.5), lineHeight: fs(16), color: MUTED },
    txnBank: { flexShrink: 1, textAlign: 'right', fontFamily: fontFamily.medium, fontSize: fs(11), lineHeight: fs(16), color: DARK },
    noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, flex: 1 },
    noteText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: '#855B00' },

    errorBox: { marginTop: s(12), backgroundColor: '#FFFFFF', borderRadius: s(10), borderWidth: 1, borderColor: '#FFCDD1', paddingHorizontal: s(10), paddingVertical: s(9) },
    errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
    errorText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: RED },
    errorRule: { height: 1, backgroundColor: '#FBDCDF', marginVertical: s(8) },
    errorFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 8, rowGap: 4 },
    reinit: { flexDirection: 'row', alignItems: 'center' },
    reinitText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: ORANGE },

    // ---- safeguard note + certificate button + footer
    safeguard: { ...card, flexDirection: 'row', alignItems: 'flex-start', gap: s(10), padding: s(14), marginTop: s(4) },
    safeIcon: { width: s(32), height: s(32), borderRadius: s(8), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    safeTitle: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(16), color: DARK },
    safeBody: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(18), color: MUTED, marginTop: 4 },
    download: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), minHeight: s(40), marginTop: s(8), borderRadius: s(12), borderWidth: 1, borderColor: NAVY, backgroundColor: '#FFFFFF', paddingHorizontal: s(12), paddingVertical: s(8) },
    downloadText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(17), color: NAVY, textAlign: 'center' },
    footer: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(15), color: MUTED, textAlign: 'center', marginTop: s(14) },
  });
};
