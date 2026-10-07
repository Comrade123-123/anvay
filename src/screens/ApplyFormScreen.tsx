import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { LoadState } from '../components/LoadState';
import { useToast } from '../components/Toast';
import { api, ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import type { ApplicationDraft } from '../api/types';

// Screen 12 of ANVAY_ka_kaam.pdf (Apply: Top Class Education, step 1 "Details"). Static mock data only.
// Sizes follow the PDF's drawing data on its 388pt frame: 32pt section tiles with 14-17pt icons, 43pt inputs
// (10pt radius), 21-23pt source chips, 52pt continue button. The hostel dropdown is functional: in the reference
// its caret overlapped the option text, here the caret has its own column and the text wraps.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const DEEP_GREEN = '#0F5031';
const LABEL = '#5E6B79';
const INK = '#1F2836';
const INPUT_BG = '#F8F9FF';
const INPUT_BORDER = '#E1E4EB';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const steps = [
  { n: 1, en: 'Details /', hi: 'विवरण', active: true },
  { n: 2, en: 'Docs /', hi: 'दस्तावेज', active: false },
  { n: 3, en: 'Review /', hi: 'समीक्षा', active: false },
];

const sources = ['DigiLocker', 'APAAR ID', 'UDISE+', 'AISHE'];

const residency = [
  { key: 'hostel', en: 'Hostel', hi: 'छात्रावास', note: '(Eligible for allowance ₹12,000/mo)', verified: 'Verified hosteller certificate mapped via IIT Kharagpur ERP' },
  { key: 'day', en: 'Day scholar', hi: 'डे-स्कॉलर', note: '(No hostel allowance)', verified: 'Day scholar status recorded from institute records' },
];

type Props = { applicationId: string; onBack?: () => void; onContinue?: () => void };

export function ApplyFormScreen({ applicationId, onBack, onContinue }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [draftSaved, setDraftSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>('hostel');
  const [busy, setBusy] = useState(false);
  const { data: draft, error, reload } = useApi<ApplicationDraft>(`/applications/${applicationId}`);
  useEffect(() => {
    if (draft?.residency) setChoice(draft.residency);
  }, [draft]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Saves the residency choice to the draft on the server.
  const persist = async (): Promise<boolean> => {
    try {
      await api.patch(`/applications/${applicationId}`, { residency: choice });
      return true;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save your draft. Please try again.');
      return false;
    }
  };

  const saveDraft = async () => {
    if (!(await persist())) return;
    setDraftSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDraftSaved(false), 1600);
  };

  const goContinue = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await persist();
    setBusy(false);
    if (ok) onContinue?.();
  };

  const current = residency.find((o) => o.key === choice)!;
  const student = draft?.student;
  const inr = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-IN'));

  // Small building blocks so every field shares one alignment.
  const Chip = ({ text }: { text: string }) => (
    <View style={styles.srcChip}>
      <Text style={styles.srcChipText}>{text}</Text>
    </View>
  );
  const Label = ({ en, hi, chip, compact }: { en: string; hi: string; chip?: string; compact?: boolean }) => (
    <View style={styles.labelRow}>
      <Text style={compact ? styles.labelCompact : styles.label}>
        {en} / <Hi style={compact ? styles.labelCompact : styles.label}>{hi}</Hi>
      </Text>
      {chip ? <Chip text={chip} /> : null}
    </View>
  );
  const SectionHead = ({ icon, title, hi, right }: { icon: IconName; title: string; hi: string; right: React.ReactNode }) => (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTile}>
        <Icon name={icon} size={r.s(17)} color={NAVY} />
      </View>
      <View style={styles.sectionTitleCol}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Hi style={styles.sectionHi}>{hi}</Hi>
      </View>
      {right}
    </View>
  );
  if (!draft || !student) return <LoadState error={error} onRetry={reload} label="Preparing your application…" />;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: '#FFFFFF' }} />
      <View style={styles.tricolor}>
        <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
        <View style={{ flex: 1, backgroundColor: '#138708' }} />
      </View>

      {/* Light header + stepper */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.titleRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8}>
              <Icon name="arrow-left" size={r.s(24)} color={NAVY} />
            </Pressable>
            <View style={styles.titleCol}>
              <Text style={styles.title}>Apply: Top Class Education</Text>
              <Hi style={styles.titleHi}>आवेदन: शीर्ष श्रेणी शिक्षा</Hi>
            </View>
            <Pressable accessibilityRole="button" onPress={saveDraft} hitSlop={8} style={styles.draft}>
              <Icon name={draftSaved ? 'check' : 'bookmark-outline'} size={r.s(16)} color={draftSaved ? GREEN : NAVY} />
              <Text style={[styles.draftText, draftSaved && { color: GREEN }]}>
                {draftSaved ? 'Saved / ' : 'Save draft / '}
                <Hi style={[styles.draftText, draftSaved && { color: GREEN }]}>{draftSaved ? 'सहेजा गया' : 'सहेजें'}</Hi>
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.stepper}>
          <View style={styles.stepperInner}>
            {steps.map((st) => (
              <View key={st.n} style={[styles.step, st.active && styles.stepActive]}>
                <View style={[styles.stepNum, st.active && styles.stepNumActive]}>
                  <Text style={[styles.stepNumText, st.active && { color: '#FFFFFF' }]}>{st.n}</Text>
                </View>
                <Text style={[styles.stepLabel, st.active && styles.stepLabelActive]}>
                  {st.en}
                  {'\n'}
                  <Hi style={[styles.stepLabel, st.active && styles.stepLabelActive]}>{st.hi}</Hi>
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          {/* Auto-fill banner */}
          <View style={styles.banner}>
            <View style={styles.bannerTop}>
              <Icon name="shield-check" size={r.s(20)} color={GREEN} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Details auto-filled from DigiLocker, APAAR & UDISE+</Text>
                <Hi style={styles.bannerHi}>विवरण स्वतः प्रमाणित स्रोतों से भरे गए हैं</Hi>
              </View>
            </View>
            <View style={styles.bannerChips}>
              {sources.map((s) => (
                <View key={s} style={styles.bannerChip}>
                  <Text style={styles.bannerChipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Personal details */}
          <View style={styles.card}>
            <SectionHead
              icon="account-outline"
              title="Personal details"
              hi="व्यक्तिगत विवरण"
              right={
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Verified ✓</Text>
                </View>
              }
            />
            <View style={styles.cardBody}>
              <Label en="Full Name" hi="पूरा नाम" chip="DigiLocker" />
              <View style={styles.input}>
                <Text style={styles.inputText}>{student.name}</Text>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Label en="DOB" hi="जन्म तिथि" chip="DigiLocker" compact />
                  <View style={styles.input}>
                    <Text style={styles.inputTextSm}>{student.dob}</Text>
                  </View>
                </View>
                <View style={styles.col}>
                  <Label en="Gender" hi="लिंग" compact />
                  <View style={styles.input}>
                    <Text style={styles.inputTextSm}>
                      {student.gender ?? '—'}
                      {student.gender === 'Male' ? <> / <Hi style={styles.inputTextSm}>पुरुष</Hi></> : student.gender === 'Female' ? <> / <Hi style={styles.inputTextSm}>महिला</Hi></> : null}
                    </Text>
                  </View>
                </View>
              </View>

              <Label en="Social Category" hi="श्रेणी" chip="Caste Cert #JH/ST/2024" />
              <View style={styles.input}>
                <Text style={[styles.inputTextSm, { flex: 1 }]}>
                  {student.category}{student.category === 'ST' ? <> / <Hi style={styles.inputTextSm}>अनुसूचित जनजाति</Hi></> : null}
                </Text>
                <Icon name="check-circle" size={r.s(17)} color={GREEN} />
              </View>

              <Label en="Aadhaar Verification" hi="आधार प्रमाणीकरण" />
              <View style={styles.input}>
                <Icon name="check-decagram" size={r.s(19)} color={GREEN} />
                <Text style={styles.mono}>XXXX XXXX {student.bank.last4 ?? '----'}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.authChip}>
                  <Text style={styles.authChipText}>UIDAI Authenticated</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Academic details */}
          <View style={styles.card}>
            <SectionHead
              icon="school"
              title="Academic details"
              hi="शैक्षणिक विवरण"
              right={
                <View style={styles.navyChip}>
                  <Text style={styles.navyChipText}>AISHE & APAAR</Text>
                </View>
              }
            />
            <View style={styles.cardBody}>
              <Label en="Recognized Institute" hi="संस्थान" chip="AISHE: U-0570" />
              <View style={[styles.input, styles.inputTall]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputText}>{student.institute}</Text>
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Label en="Course" hi="पाठ्यक्रम" />
                  <View style={styles.input}>
                    <Text style={styles.inputTextSm} numberOfLines={2}>{student.course}</Text>
                  </View>
                </View>
                <View style={styles.col}>
                  <Label en="Academic Year" hi="सत्र" />
                  <View style={styles.input}>
                    <Text style={styles.inputTextSm}>1st Year (2026-27)</Text>
                  </View>
                </View>
              </View>

              <Label en="Qualifying Score" hi="पूर्व योग्यता अंक" chip="APAAR / CBSE NAD" />
              <View style={styles.input}>
                <Text style={styles.inputText}>86.4%</Text>
                <Text style={styles.scoreNote}>(Class XII Senior Secondary)</Text>
                <View style={{ flex: 1 }} />
                <Icon name="check-circle" size={r.s(17)} color={GREEN} />
              </View>
            </View>
          </View>

          {/* Family & bank */}
          <View style={styles.card}>
            <SectionHead
              icon="bank"
              title="Family & bank"
              hi="परिवार व बैंक विवरण"
              right={
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Validated</Text>
                </View>
              }
            />
            <View style={styles.cardBody}>
              <Label en="Annual Family Income" hi="वार्षिक पारिवारिक आय" chip="e-District JH" />
              <View style={[styles.input, styles.inputCol]}>
                <View style={styles.incomeRow}>
                  <Text style={styles.income}>₹ {inr(student.incomeAnnual)}</Text>
                  <View style={styles.limitChip}>
                    <Text style={styles.limitText}>Within ₹8.00 Lakh Limit</Text>
                  </View>
                </View>
                <Text style={styles.cert}>Cert: #JH/INC/2026/8841 (Issued: Circle Officer Khunti)</Text>
              </View>

              <Label en="DBT Disbursal Account" hi="प्रत्यक्ष लाभ अंतरण खाता" />
              <View style={[styles.input, styles.inputCol, { alignItems: 'stretch' }]}>
                <View style={styles.bankRow}>
                  <Icon name="wallet-outline" size={r.s(18)} color={NAVY} />
                  <Text style={styles.bankName}>{student.bank.name} ••••{student.bank.last4}</Text>
                </View>
                <View style={styles.bankRule} />
                <View style={styles.mapperRow}>
                  <Text style={styles.mapperLabel}>NPCI Aadhaar Mapper:</Text>
                  <View style={styles.seeded}>
                    <View style={styles.statusDot} />
                    <Text style={styles.seededText}>
                      {student.bank.aadhaarSeeded && student.bank.npciMapped ? 'Aadhaar seeded ✓ / ' : 'Seeding pending / '}
                      <Hi style={styles.seededText}>{student.bank.aadhaarSeeded && student.bank.npciMapped ? 'आधार सीडेड' : 'सीडिंग लंबित'}</Hi>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Hostel / day scholar (required selection) */}
          <View style={styles.hostelCard}>
            <View style={styles.hostelHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hostelTitle}>
                  Hostel / Day scholar status / <Hi style={styles.hostelTitle}>छात्रावास या डे-स्कॉलर</Hi>{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.requiredChip}>
                <Text style={styles.requiredText}>Required selection / <Hi style={styles.requiredText}>आवश्यक</Hi></Text>
              </View>
            </View>
            <Text style={styles.hostelSub}>Select your residency status at the institute campus</Text>

            <Pressable
              accessibilityRole="combobox"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpen(!open)}
              style={[styles.select, open && styles.selectOpen]}
            >
              <Text style={styles.selectText}>
                {current.en} / <Hi style={styles.selectText}>{current.hi}</Hi> {current.note}
              </Text>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={r.s(20)} color={DARK} />
            </Pressable>
            {open && (
              <View style={styles.options}>
                {residency.map((o) => {
                  const selected = o.key === choice;
                  return (
                    <Pressable
                      key={o.key}
                      accessibilityRole="menuitem"
                      onPress={() => {
                        setChoice(o.key);
                        setOpen(false);
                      }}
                      style={[styles.option, selected && styles.optionSelected]}
                    >
                      <Text style={[styles.optionText, selected && { fontFamily: fontFamily.bold }]}>
                        {o.en} / <Hi style={[styles.optionText, selected && { fontFamily: fontFamily.hindiBold }]}>{o.hi}</Hi> {o.note}
                      </Text>
                      {selected && <Icon name="check" size={r.s(18)} color={GREEN} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.verifiedRow}>
              <Icon name="check" size={r.s(15)} color={GREEN} />
              <Text style={styles.verifiedText}>{current.verified}</Text>
            </View>
          </View>

          {/* Help note */}
          <View style={styles.help}>
            <Icon name="information-outline" size={r.s(18)} color={NAVY} />
            <View style={{ flex: 1 }}>
              <Text style={styles.helpText}>
                Something wrong? Tap any auto-filled field to request correction or upload an updated certificate.
              </Text>
              <Hi style={styles.helpHi}>कोई विसंगति? सुधार अनुरोध या नया प्रमाण पत्र अपलोड करने हेतु टैप करें।</Hi>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky progress + continue */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomInner}>
          <View style={styles.progressRow}>
            <View style={styles.progressLeft}>
              <View style={styles.progressDot} />
              <Text style={styles.progressText}>Step 1 of 3: Details verified</Text>
            </View>
            <Text style={styles.progressPct}>100% Complete</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={goContinue}
            disabled={busy}
            style={({ pressed }) => [styles.continueBtn, (pressed || busy) && { opacity: 0.8 }]}
          >
            <Text style={styles.continueText}>
              Continue / <Hi style={styles.continueText}>आगे बढ़ें</Hi>
            </Text>
            <Icon name="arrow-right" size={r.s(20)} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(18), borderWidth: 1, borderColor: '#E1E4EB' } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F2F4F9' },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row', zIndex: 2 },

    // ---- light header (PDF: 16pt title, 13pt save-draft, 3 step pills)
    header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E1E4EB' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(14), paddingBottom: s(10) },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: NAVY },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: LABEL },
    draft: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '38%' },
    draftText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: NAVY, textAlign: 'center' },
    stepper: { borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    stepperInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: pad, paddingVertical: s(10), gap: s(6) },
    step: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(8), minHeight: s(46), paddingHorizontal: s(10), borderRadius: s(23), borderWidth: 1, borderColor: 'transparent' },
    stepActive: { backgroundColor: '#E8EDF6', borderColor: NAVY, borderWidth: 1.5 },
    stepNum: { width: s(22), height: s(22), borderRadius: s(11), borderWidth: 1.5, borderColor: '#CAD4E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    stepNumActive: { backgroundColor: NAVY, borderColor: NAVY },
    stepNumText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: LABEL },
    stepLabel: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(12), lineHeight: fs(17), color: LABEL },
    stepLabelActive: { fontFamily: fontFamily.bold, color: NAVY },

    scroll: { paddingBottom: s(20) },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- auto-fill banner (PDF: 358x111 mint card, 21pt source chips)
    banner: { marginTop: s(12), backgroundColor: '#E6F4EB', borderRadius: s(16), borderWidth: 1.5, borderColor: '#B6E1CD', padding: s(15) },
    bannerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10) },
    bannerTitle: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(17), color: DEEP_GREEN },
    bannerHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(16), color: GREEN, marginTop: 2 },
    bannerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginTop: s(10) },
    bannerChip: { height: s(23), justifyContent: 'center', paddingHorizontal: s(10), borderRadius: s(7), borderWidth: 1, borderColor: '#B6E1CD', backgroundColor: '#FFFFFF' },
    bannerChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: DEEP_GREEN },

    // ---- section cards (PDF: 356 wide, 65pt header with 32pt tile)
    card: { ...card, marginTop: s(12), overflow: 'hidden' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: s(10), minHeight: s(65), paddingHorizontal: s(16), paddingVertical: s(12), borderBottomWidth: 1, borderBottomColor: '#EEF1F5' },
    sectionTile: { width: s(34), height: s(34), borderRadius: s(9), backgroundColor: '#E8EDF6', borderWidth: 1, borderColor: '#D4E1EF', alignItems: 'center', justifyContent: 'center' },
    sectionTitleCol: { flex: 1, minWidth: 0 },
    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: DARK },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: LABEL },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: s(21), paddingHorizontal: s(11), borderRadius: s(11), backgroundColor: '#E6F4E9' },
    statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: GREEN },
    statusPillText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: GREEN },
    navyChip: { height: s(23), justifyContent: 'center', paddingHorizontal: s(9), borderRadius: s(7), borderWidth: 1, borderColor: '#D4E1EF', backgroundColor: '#E8EDF6' },
    navyChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: NAVY },
    cardBody: { paddingHorizontal: s(16), paddingTop: s(4), paddingBottom: s(16) },

    // ---- labels + inputs (PDF: 12pt labels, 43pt inputs, radius 10, fill #F8F9FF)
    labelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(8), rowGap: 4, marginTop: s(12), marginBottom: s(6) },
    label: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: LABEL },
    srcChip: { height: s(21), justifyContent: 'center', paddingHorizontal: s(8), borderRadius: s(6), borderWidth: 1, borderColor: '#D4E1EF', backgroundColor: '#E8EDF6' },
    srcChipText: { fontFamily: fontFamily.bold, fontSize: fs(10), color: NAVY },
    input: { flexDirection: 'row', alignItems: 'center', gap: s(10), minHeight: s(43), paddingHorizontal: s(11), paddingVertical: s(8), borderRadius: s(10), borderWidth: 1, borderColor: INPUT_BORDER, backgroundColor: INPUT_BG },
    inputTall: { minHeight: s(59), alignItems: 'center' },
    inputCol: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
    inputText: { fontFamily: fontFamily.semibold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    inputTextSm: { fontFamily: fontFamily.semibold, fontSize: fs(13), lineHeight: fs(18), color: INK },
    inputSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: LABEL },
    // Bottom-aligned so both inputs share one baseline even when a label + chip wraps on narrow phones.
    twoCol: { flexDirection: 'row', alignItems: 'flex-end', gap: s(11) },
    col: { flex: 1, minWidth: 0 },
    labelCompact: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: LABEL },
    mono: { fontFamily: mono, fontWeight: '600', fontSize: fs(13), letterSpacing: 1, color: INK },
    authChip: { borderRadius: s(6), backgroundColor: '#E6F4E9', paddingHorizontal: s(8), paddingVertical: s(5) },
    authChipText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: GREEN },
    scoreNote: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: LABEL },

    incomeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', columnGap: s(10), rowGap: 4 },
    income: { fontFamily: fontFamily.bold, fontSize: fs(15), lineHeight: fs(21), color: INK },
    limitChip: { borderRadius: s(6), backgroundColor: '#E6F4EB', paddingHorizontal: s(9), paddingVertical: s(4) },
    limitText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: DEEP_GREEN },
    cert: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: LABEL },
    bankRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
    bankName: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fs(13), color: INK },
    bankRule: { height: 1, backgroundColor: INPUT_BORDER, marginVertical: s(8) },
    mapperRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(10), rowGap: 6 },
    mapperLabel: { fontFamily: fontFamily.regular, fontSize: fs(11), color: LABEL },
    seeded: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, borderRadius: s(16), backgroundColor: '#E6F4E9', paddingHorizontal: s(12), paddingVertical: s(7) },
    seededText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: GREEN },

    // ---- required hostel selection (PDF: 2pt navy border, orange "required" chip)
    hostelCard: { marginTop: s(12), backgroundColor: '#FFFFFF', borderRadius: s(18), borderWidth: 2, borderColor: NAVY, padding: s(16) },
    hostelHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(10) },
    hostelTitle: { fontFamily: fontFamily.bold, fontSize: fs(13.5), lineHeight: fs(20), color: DARK },
    required: { fontFamily: fontFamily.bold, color: '#BA1A1A' },
    requiredChip: { maxWidth: '38%', borderRadius: s(7), borderWidth: 1, borderColor: '#FF9F63', backgroundColor: '#FFEBE0', paddingHorizontal: s(9), paddingVertical: s(6) },
    requiredText: { fontFamily: fontFamily.bold, fontSize: fs(10), lineHeight: fs(15), color: '#9C4400' },
    hostelSub: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: LABEL, marginTop: s(8) },
    select: { flexDirection: 'row', alignItems: 'center', gap: s(10), minHeight: s(48), marginTop: s(12), paddingHorizontal: s(14), paddingVertical: s(10), borderRadius: s(12), borderWidth: 2, borderColor: NAVY, backgroundColor: '#FFFFFF' },
    selectOpen: { borderBottomLeftRadius: s(4), borderBottomRightRadius: s(4) },
    selectText: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(18), color: INK },
    options: { borderWidth: 2, borderTopWidth: 0, borderColor: NAVY, borderBottomLeftRadius: s(12), borderBottomRightRadius: s(12), overflow: 'hidden', backgroundColor: '#FFFFFF' },
    option: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingHorizontal: s(14), paddingVertical: s(12) },
    optionSelected: { backgroundColor: '#E6F4E9' },
    optionText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(18), color: INK },
    verifiedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: s(12) },
    verifiedText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: GREEN },

    help: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(12), padding: s(15), borderRadius: s(14), borderWidth: 1, borderColor: '#D4E1EF', backgroundColor: '#E8EDF6' },
    helpText: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(18), color: LABEL },
    helpHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(17), color: LABEL, marginTop: 2 },

    // ---- sticky bottom (PDF: 104pt tall, 52pt continue button)
    bottom: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E4EB', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    bottomInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(12) },
    progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginBottom: s(10) },
    progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
    progressText: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), color: LABEL },
    progressPct: { fontFamily: fontFamily.bold, fontSize: fs(11), color: NAVY },
    continueBtn: { minHeight: s(52), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), borderRadius: s(16), backgroundColor: ORANGE, paddingHorizontal: s(16), shadowColor: ORANGE, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    continueText: { fontFamily: fontFamily.bold, fontSize: fs(16), color: '#FFFFFF' },
  });
};
