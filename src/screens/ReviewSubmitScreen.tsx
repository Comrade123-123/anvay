import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { LoadState } from '../components/LoadState';
import { api, ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import type { ApplicationDraft, SubmitResult } from '../api/types';

// Screen 22 of ANVAY_ka_kaam.pdf (Review & Submit, step 3 of the apply flow). Static mock data only: "verification"
// results are fixed text and Submit only flips a local "submitted" state.
// Sizes follow the PDF's drawing data on its 390pt frame: 28pt stepper dots (36pt ring on the current step), 28pt
// verification icon, 32pt Save-draft button, 18pt checkboxes, 48pt sticky Submit button.
// The PDF stacked the stepper labels on uneven baselines (Review's Hindi label was bold, the others regular) and let the
// "Needs review" pill hug the edge; here the labels share one style and the rows wrap on narrow screens.
const NAVY = colors.primary;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const INK = '#1F2836';
const MUTED = '#5E6B79';
const BORDER = '#E1E4EB';
const AMBER_BG = '#FDF8E6';
const AMBER_LINE = '#F49E0A';
const AMBER_TEXT = '#77340F';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const checks = [
  { title: 'Identity & Biometric', source: 'UIDAI', note: '', ok: true },
  { title: 'ST Category Status', source: 'e-District Jharkhand', note: '', ok: true },
  { title: 'Family Annual Income', source: 'e-District Jharkhand', note: '', ok: true },
  { title: 'Institute Accreditation', source: 'AISHE', note: ' (IIT Ranchi)', ok: true },
  { title: 'Academic Record', source: 'APAAR / ABC ID', note: '', ok: false },
];

const steps = [
  { en: 'Details', hi: 'विवरण', done: true },
  { en: 'Documents', hi: 'दस्तावेज़', done: true },
  { en: 'Review', hi: 'समीक्षा', done: false },
];

type Props = { applicationId: string; onBack?: () => void; onSubmitted?: (result: SubmitResult) => void };

// Visual only: the surrounding row is the tappable checkbox.
function Check({ on, size }: { on: boolean; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: on ? NAVY : '#fff',
        borderWidth: on ? 0 : 1.5,
        borderColor: '#93A3B8',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
      }}
    >
      {on && <Icon name="check" size={size * 0.75} color="#fff" />}
    </View>
  );
}

export function ReviewSubmitScreen({ applicationId, onBack, onSubmitted }: Props) {
  const r = useResponsive();
  const styles = useMemo(() => makeStyles(r), [r.width]);
  const insets = useSafeAreaInsets();
  const [agree, setAgree] = useState(true);
  const [declare, setDeclare] = useState(true);
  const [toast, setToast] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { data: draft, error, reload } = useApi<ApplicationDraft>(`/applications/${applicationId}`);
  const needsSwitchConsent = Boolean(draft?.switchFrom);
  const ready = (agree || !needsSwitchConsent) && declare && !submitted && Boolean(draft?.ready);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const submit = async () => {
    if (!ready) return;
    setSubmitted(true);
    try {
      const result = await api.post<SubmitResult>(`/applications/${applicationId}/submit`);
      flash('Application submitted.');
      setTimeout(() => onSubmitted?.(result), 900);
    } catch (e) {
      setSubmitted(false);
      flash(e instanceof ApiError ? e.message : 'Could not submit your application. Please try again.');
    }
  };

  const s = r.s;
  if (!draft) return <LoadState error={error} onRetry={reload} label="Preparing your review…" />;
  const student = draft.student;
  const shortName = draft.scheme.title.replace(/^National /, '').split(/ (Scholarship|Education)/)[0];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* White header with tricolor strip */}
      <View style={[styles.header, { paddingTop: insets.top + s(14) }]}>
        <View style={styles.tricolor}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>
        <View style={styles.column}>
          <View style={styles.headTop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={10} style={styles.back}>
              <Icon name="arrow-left" size={s(22)} color={NAVY} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Review & Submit</Text>
              <Hi style={styles.titleHi}>समीक्षा व जमा करें</Hi>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => flash('Draft saved. You can continue later.')}
              style={({ pressed }) => [styles.draft, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.draftText} numberOfLines={1}>
                Save draft / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>सहेजें</Hi>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.portalBar}>
        <View style={[styles.column, styles.portalRow]}>
          <Icon name="shield-check-outline" size={s(15)} color="#fff" />
          <Text style={styles.portalText} numberOfLines={1}>MoTA National Scholarship Portal</Text>
          <Text style={styles.portalYear}>ANVAY 2024-25</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: s(24), paddingTop: s(16) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          {/* Stepper */}
          <View style={styles.card}>
            <View style={styles.stepper}>
              {/* connector line sits behind the dots */}
              <View pointerEvents="none" style={styles.connectors}>
                <View style={styles.line} />
              </View>
              {steps.map((st, i) => (
                <View key={st.en} style={[styles.step, i === 0 && { alignItems: 'flex-start' }, i === steps.length - 1 && { alignItems: 'flex-end' }]}>
                  <View style={styles.stepDotRow}>
                    <View style={[styles.stepDot, st.done ? { backgroundColor: GREEN } : { backgroundColor: NAVY }]}>
                      {st.done ? (
                        <Icon name="check" size={s(16)} color="#fff" />
                      ) : (
                        <Text style={styles.stepNum}>3</Text>
                      )}
                    </View>
                    {!st.done && <View style={styles.stepRing} />}
                  </View>
                  <Text style={[styles.stepEn, !st.done && { color: NAVY }]}>{st.en}</Text>
                  <Hi style={[styles.stepHi, !st.done && { color: NAVY, fontFamily: fontFamily.hindiBold }]}>{st.hi}</Hi>
                </View>
              ))}
            </View>
          </View>

          {/* Instant verification */}
          <View style={[styles.card, { marginTop: s(14) }]}>
            <View style={styles.vHead}>
              <View style={styles.vIcon}>
                <Icon name="check-circle" size={s(16)} color={GREEN} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.vTitle}>Instant verification</Text>
                <Text style={styles.vSub}>
                  <Hi>त्वरित सत्यापन</Hi> · Government API Gateways
                </Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countText}>5 Checks</Text>
              </View>
            </View>
            <View style={styles.ruleStrong} />

            {checks.map((c, i) => (
              <View key={c.title} style={[styles.checkRow, i > 0 && styles.checkRowBorder]}>
                <View style={{ flex: 1, minWidth: r.s(130) }}>
                  <Text style={styles.checkTitle}>{c.title}</Text>
                  <Text style={styles.checkSrc}>
                    Source: <Text style={{ color: NAVY, fontFamily: fontFamily.medium }}>{c.source}</Text>
                    {c.title === 'Institute Accreditation' ? ` (${student.institute ?? 'your institute'})` : c.note}
                  </Text>
                </View>
                {c.ok ? (
                  <View style={[styles.badge, { backgroundColor: '#E6F4EB', borderColor: '#C3E8CF' }]}>
                    <Text style={[styles.badgeText, { color: GREEN }]}>
                      Matched / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>सुमेलित</Hi>
                    </Text>
                    <Icon name="check" size={s(13)} color={GREEN} />
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: AMBER_BG, borderColor: AMBER_LINE }]}>
                    <Text style={[styles.badgeText, { color: '#913F0E' }]}>
                      Needs review / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>समीक्षाधीन</Hi>
                    </Text>
                    <Icon name="clock-outline" size={s(13)} color="#913F0E" />
                  </View>
                )}
              </View>
            ))}

            <View style={styles.amberNote}>
              <Icon name="information-outline" size={s(16)} color="#B35208" style={{ marginTop: s(1) }} />
              <Text style={styles.amberNoteText}>
                Sent to desk officer · Your application will not be blocked / <Hi>अधिकारी को प्रेषित, आवेदन रुकेगा नहीं</Hi>
              </Text>
            </View>
          </View>

          {/* Application summary */}
          <View style={[styles.card, { marginTop: s(14) }]}>
            <View style={styles.sumHead}>
              <View style={{ flex: 1, minWidth: s(130) }}>
                <Text style={styles.sumTitle}>Application Summary</Text>
                <Hi style={styles.sumHi}>आवेदन सारांश</Hi>
              </View>
              <View style={styles.schemePill}>
                <Text style={styles.schemePillText}>{shortName} {student.category}</Text>
              </View>
            </View>
            <View style={styles.ruleStrong} />

            <Text style={styles.cap}>TARGET SCHEME</Text>
            <Text style={styles.value}>{draft.scheme.title}</Text>

            <View style={styles.entitle}>
              <Text style={styles.cap}>ENTITLEMENT AMOUNT</Text>
              <Text style={styles.amount}>{draft.scheme.amountText}</Text>
              <Text style={styles.amountSub}>Application No. {draft.applicationNo}</Text>
            </View>

            <Text style={[styles.cap, { marginTop: s(16) }]}>DOCUMENTS ATTACHED</Text>
            <View style={styles.docLine}>
              <Icon name="check-circle-outline" size={s(15)} color={GREEN} />
              <Text style={styles.docTitle}>{draft.documents.filter((d) => d.status === 'verified').length} verified documents</Text>
            </View>
            <Text style={styles.docSub}>{draft.documents.map((d) => d.name).join(', ')}</Text>

            <Text style={[styles.cap, { marginTop: s(16) }]}>DIRECT BENEFIT DISBURSAL BANK (DBT)</Text>
            <View style={styles.bank}>
              <Icon name="bank-outline" size={s(20)} color={NAVY} />
              <View style={{ flex: 1, minWidth: s(110) }}>
                <Text style={styles.bankName}>{student.bank.name}</Text>
                <Text style={styles.bankAcc}>A/C ••••{student.bank.last4}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#E6F4EB', borderColor: '#C3E8CF' }]}>
                <Text style={[styles.badgeText, { color: GREEN }]}>{student.bank.aadhaarSeeded ? 'Aadhaar seeded' : 'Seeding pending'}</Text>
                <Icon name="check" size={s(13)} color={GREEN} />
              </View>
            </View>
          </View>

          {/* Single-scholarship notice */}
          {needsSwitchConsent && (
          <View style={styles.notice}>
            <View style={styles.noticeHead}>
              <View style={styles.warnIcon}>
                <Icon name="alert" size={s(16)} color="#913F0E" />
              </View>
              <Text style={styles.noticeTitle}>Single-Scholarship Norms Notice</Text>
            </View>
            <Text style={styles.noticeBody}>
              Submitting will end your current scholarship from next instalment as per Single-Scholarship Norms /{' '}
              <Hi>एकल छात्रवृत्ति नियम के अनुसार वर्तमान छात्रवृत्ति अगली किस्त से समाप्त होगी</Hi>
            </Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agree }} onPress={() => setAgree((v) => !v)} style={styles.agreeRow}>
              <Check on={agree} size={s(20)} />
              <Text style={styles.agreeText}>
                I understand and agree to switch / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>मैं समझता हूँ और सहमत हूँ</Hi>
              </Text>
            </Pressable>
          </View>
          )}

          {/* Undertaking */}
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: declare }} onPress={() => setDeclare((v) => !v)} style={[styles.card, styles.declare, { marginTop: s(14) }]}>
            <Check on={declare} size={s(20)} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.declTitle}>Undertaking & Legal Declaration</Text>
              <Text style={styles.declBody}>
                I declare that the information given above is true and correct to the best of my knowledge. Any discrepancy will lead to cancellation as per MoTA guidelines. /{' '}
                <Hi>मैं प्रमाणित करता हूँ कि दी गई जानकारी पूर्णतः सत्य है।</Hi>
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {!!toast && (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: s(140) + Math.max(insets.bottom, 0) }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      {/* Sticky submit */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.column}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            onPress={submit}
            style={({ pressed }) => [styles.submit, !ready && { opacity: 0.5 }, pressed && ready && { opacity: 0.9 }]}
          >
            <Text style={styles.submitText}>
              {submitted ? 'Submitted ' : 'Submit application / '}
              {!submitted && <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>आवेदन जमा करें</Hi>}
            </Text>
            <Icon name={submitted ? 'check' : 'arrow-right'} size={s(18)} color="#fff" />
          </Pressable>
          <View style={styles.signRow}>
            <Icon name="lock" size={s(13)} color={GREEN} />
            <Text style={styles.signText}>Digitally signed via Aadhaar e-Sign</Text>
          </View>
          <View style={styles.footRule} />
          <Text style={styles.ministry}>MINISTRY OF TRIBAL AFFAIRS · GOVERNMENT OF INDIA</Text>
        </View>
      </View>
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
    padding: s(16),
    ...Platform.select({ default: {}, web: { boxShadow: '0 2px 6px rgba(20,30,60,0.06)' } as object }),
  };
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: gutter },

    header: { backgroundColor: '#fff', paddingBottom: s(14), borderBottomWidth: 1, borderBottomColor: BORDER },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headTop: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    back: { width: s(24), alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: NAVY },
    titleHi: { fontSize: fs(11), lineHeight: fs(15), color: MUTED },
    draft: { height: s(32), borderRadius: s(10), borderWidth: 1, borderColor: '#C8D1DF', paddingHorizontal: s(12), justifyContent: 'center' },
    draftText: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: NAVY },

    portalBar: { backgroundColor: NAVY, height: s(29), justifyContent: 'center' },
    portalRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
    portalText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fs(11), color: '#fff' },
    portalYear: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.5, color: '#D6E2FF' },

    card,

    stepper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: s(0) },
    step: { flex: 1, alignItems: 'center' },
    stepDotRow: { width: s(36), height: s(36), alignItems: 'center', justifyContent: 'center', marginBottom: s(6) },
    stepDot: { width: s(28), height: s(28), borderRadius: s(14), alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    stepRing: { position: 'absolute', width: s(36), height: s(36), borderRadius: s(18), backgroundColor: '#E8EDF6', zIndex: 1 },
    stepNum: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#fff' },
    stepEn: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: INK },
    stepHi: { fontSize: fs(9.5), lineHeight: fs(13), color: MUTED },
    connectors: { position: 'absolute', top: s(18) - 1.25, left: 0, right: 0, height: 2.5 },
    line: { position: 'absolute', left: s(18), right: s(18), height: 2.5, backgroundColor: GREEN },

    vHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s(10) },
    vIcon: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: '#E6F4EB', alignItems: 'center', justifyContent: 'center' },
    vTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: NAVY },
    vSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: MUTED, marginTop: s(2) },
    countPill: { backgroundColor: '#E8EDF6', borderWidth: 1, borderColor: '#D4E1EF', borderRadius: s(6), paddingHorizontal: s(9), paddingVertical: s(4) },
    countText: { fontFamily: fontFamily.semibold, fontSize: fs(10), color: NAVY },
    ruleStrong: { height: 2, backgroundColor: BORDER, marginVertical: s(14) },

    checkRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: s(8), paddingVertical: s(11) },
    checkRowBorder: { borderTopWidth: 2, borderTopColor: '#EFF2F6' },
    checkTitle: { fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(17), color: INK },
    checkSrc: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: MUTED, marginTop: s(2) },
    badge: { flexDirection: 'row', alignItems: 'center', gap: s(5), borderRadius: s(12), borderWidth: 1, paddingHorizontal: s(10), height: s(23) },
    badgeText: { fontFamily: fontFamily.semibold, fontSize: fs(11) },
    amberNote: { flexDirection: 'row', gap: s(9), backgroundColor: AMBER_BG, borderWidth: 1, borderColor: '#FDE689', borderRadius: s(10), padding: s(11), marginTop: s(6) },
    amberNoteText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(15), color: AMBER_TEXT },

    sumHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s(10) },
    sumTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: NAVY },
    sumHi: { fontSize: fs(11), lineHeight: fs(15), color: MUTED },
    schemePill: { backgroundColor: '#E8EDF6', borderWidth: 1, borderColor: '#C8D1DF', borderRadius: s(6), paddingHorizontal: s(11), paddingVertical: s(5) },
    schemePillText: { fontFamily: fontFamily.semibold, fontSize: fs(10.5), color: NAVY },
    cap: { fontFamily: fontFamily.medium, fontSize: fs(11), letterSpacing: 0.8, color: MUTED },
    value: { fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(17), color: INK, marginTop: s(5) },
    entitle: { backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: BORDER, borderRadius: s(12), padding: s(12), marginTop: s(14) },
    amount: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: NAVY, marginTop: s(5) },
    amountSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: MUTED, marginTop: s(3) },
    docLine: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(6) },
    docTitle: { fontFamily: fontFamily.medium, fontSize: fs(12), color: INK },
    docSub: { fontFamily: fontFamily.regular, fontSize: fs(10.5), lineHeight: fs(15), color: MUTED, marginTop: s(3), marginLeft: s(20) },
    bank: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: s(9),
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: s(12),
      paddingHorizontal: s(10),
      paddingVertical: s(11),
      marginTop: s(8),
    },
    bankName: { fontFamily: fontFamily.semibold, fontSize: fs(12), color: INK },
    bankAcc: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED, marginTop: s(2) },

    notice: { backgroundColor: AMBER_BG, borderWidth: 1.5, borderColor: AMBER_LINE, borderRadius: s(16), padding: s(14), marginTop: s(14) },
    noticeHead: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    warnIcon: { width: s(24), height: s(24), borderRadius: s(12), backgroundColor: '#FDE689', alignItems: 'center', justifyContent: 'center' },
    noticeTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: AMBER_TEXT },
    noticeBody: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: AMBER_TEXT, marginTop: s(10) },
    agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(14) },
    agreeText: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fs(11.5), lineHeight: fs(16), color: AMBER_TEXT },

    declare: { flexDirection: 'row', alignItems: 'flex-start', gap: s(12) },
    declTitle: { fontFamily: fontFamily.semibold, fontSize: fs(11.5), lineHeight: fs(16), color: NAVY },
    declBody: { fontFamily: fontFamily.regular, fontSize: fs(11.5), lineHeight: fs(17), color: INK, marginTop: s(3) },

    footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: s(12) },
    submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), height: s(48), borderRadius: s(12), backgroundColor: ORANGE, paddingHorizontal: s(10) },
    submitText: { fontFamily: fontFamily.bold, fontSize: fs(15), color: '#fff', flexShrink: 1, textAlign: 'center' },
    signRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), marginTop: s(10) },
    signText: { fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    footRule: { height: 2, backgroundColor: '#EFF2F6', marginTop: s(8), marginBottom: s(8) },
    ministry: { fontFamily: fontFamily.semibold, fontSize: fs(10), letterSpacing: 0.3, color: NAVY, textAlign: 'center' },

    toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: gutter },
    toast: { backgroundColor: INK, borderRadius: s(10), paddingHorizontal: s(14), paddingVertical: s(10), maxWidth: r.maxContentWidth },
    toastText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: '#fff', textAlign: 'center' },
  });
};
