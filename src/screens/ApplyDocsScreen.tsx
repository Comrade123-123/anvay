import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';

// Screen 13 of ANVAY_ka_kaam.pdf (Apply: Documents, step 2). Static mock data only.
// Sizes follow the PDF's drawing data on its 390pt frame: 40pt document tiles with 16-20pt icons, 28pt stepper
// circles, 21pt status pills, 8pt progress bar, 44pt action buttons, 96x128 scan preview.
// The failing document can be fixed: Retake photo / From wallet run a mock re-check, after which the card turns
// verified, progress becomes 5 of 5 and Continue unlocks. Nothing is uploaded or checked anywhere.
const NAVY = colors.primary;
const DARK = '#002352';
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const RED = '#C62828';
const MUTED = '#5E6B79';
const INK = '#1F2836';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const docs: { icon: IconName; title: string; hi: string; source: string; digilocker?: boolean }[] = [
  { icon: 'fingerprint', title: 'Aadhaar Card', hi: 'आधार कार्ड', source: 'From wallet' },
  { icon: 'check-decagram-outline', title: 'ST Certificate', hi: 'अनुसूचित जनजाति प्रमाण पत्र', source: 'From DigiLocker', digilocker: true },
  { icon: 'cash-multiple', title: 'Income Certificate', hi: 'आय प्रमाण पत्र', source: 'From DigiLocker', digilocker: true },
  { icon: 'school', title: 'Class 12 Marksheet', hi: 'कक्षा 12 अंकपत्र', source: 'From wallet' },
];

type Admission = 'failed' | 'scanning' | 'ok';
type Props = { onBack?: () => void; onContinue?: () => void };

// Remembers the mock "document fixed" state while the student moves Docs > Review > back, so Continue does not lock
// again. App.tsx calls resetDocsProgress() when a new application starts.
const saved: { admission: Admission; source: string } = { admission: 'failed', source: 'Camera scan · 0.8 MB' };
export const resetDocsProgress = () => {
  saved.admission = 'failed';
  saved.source = 'Camera scan · 0.8 MB';
};

export function ApplyDocsScreen({ onBack, onContinue }: Props) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [admission, setAdmission] = useState<Admission>(saved.admission);
  const [source, setSource] = useState(saved.source);
  const [draftSaved, setDraftSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // Mock re-check: no image is captured or analysed.
  const fix = (newSource: string) => {
    if (admission !== 'failed') return;
    setAdmission('scanning');
    later(() => {
      setSource(newSource);
      setAdmission('ok');
      saved.admission = 'ok';
      saved.source = newSource;
    }, 1400);
  };

  const saveDraft = () => {
    setDraftSaved(true);
    later(() => setDraftSaved(false), 1600);
  };

  const ready = 4 + (admission === 'ok' ? 1 : 0);
  const pct = ready * 20;
  const allReady = ready === 5;

  const VerifiedPill = () => (
    <View style={styles.verified}>
      <Icon name="check-circle" size={r.s(14)} color={GREEN} />
      <Text style={styles.verifiedText}>Verified</Text>
    </View>
  );

  const Source = ({ text, blue }: { text: string; blue?: boolean }) => (
    <View style={[styles.source, blue && styles.sourceBlue]}>
      <Text style={[styles.sourceText, blue && { color: '#0A57CA' }]}>{text}</Text>
    </View>
  );

  const DocRow = ({ icon, title, hi, src, blue }: { icon: IconName; title: string; hi: string; src: string; blue?: boolean }) => (
    <View style={styles.docCard}>
      <View style={styles.docTile}>
        <Icon name={icon} size={r.s(20)} color={NAVY} />
      </View>
      <View style={styles.docBody}>
        <Text style={styles.docTitle}>{title}</Text>
        <View style={styles.docMeta}>
          <Hi style={styles.docHi}>{hi}</Hi>
          <View style={styles.dot} />
          <Source text={src} blue={blue} />
        </View>
      </View>
      <VerifiedPill />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: '#FFFFFF' }} />
      <View style={styles.tricolor}>
        <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
        <View style={{ flex: 1, backgroundColor: '#138708' }} />
      </View>

      {/* Header + stepper */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.titleRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8}>
              <Icon name="arrow-left" size={r.s(24)} color="#0E1C2D" />
            </Pressable>
            <View style={styles.titleCol}>
              <Text style={styles.title}>Apply: Documents</Text>
              <Hi style={styles.titleHi}>दस्तावेज़ सत्यापन</Hi>
            </View>
            <Pressable accessibilityRole="button" onPress={saveDraft} hitSlop={8} style={styles.draft}>
              <Text style={[styles.draftEn, draftSaved && { color: GREEN }]}>{draftSaved ? 'Saved' : 'Save draft'}</Text>
              <Hi style={styles.draftHi}>{draftSaved ? 'सहेजा गया' : 'सहेजें'}</Hi>
            </Pressable>
          </View>
        </View>
        <View style={styles.stepperWrap}>
          <View style={styles.stepper}>
            {/* connector lines sit behind the circles */}
            <View style={styles.lineTrack} pointerEvents="none">
              <View style={[styles.line, { backgroundColor: GREEN }]} />
              <View style={[styles.line, { backgroundColor: '#E2E8EF' }]} />
            </View>
            <View style={styles.stepCol}>
              <View style={[styles.stepCircle, { backgroundColor: GREEN }]}>
                <Icon name="check" size={r.s(17)} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepEn, { color: GREEN }]}>Details</Text>
              <Hi style={styles.stepHi}>विवरण</Hi>
            </View>
            <View style={styles.stepCol}>
              <View style={styles.halo}>
                <View style={[styles.stepCircle, { backgroundColor: NAVY }]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
              </View>
              <Text style={[styles.stepEn, { color: NAVY }]}>Documents</Text>
              <Hi style={[styles.stepHi, { color: NAVY }]}>दस्तावेज़</Hi>
            </View>
            <View style={styles.stepCol}>
              <View style={[styles.stepCircle, styles.stepOutline]}>
                <Text style={[styles.stepNum, { color: '#93A3B8' }]}>3</Text>
              </View>
              <Text style={[styles.stepEn, { color: '#93A3B8' }]}>Review</Text>
              <Hi style={[styles.stepHi, { color: '#93A3B8' }]}>समीक्षा</Hi>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          {/* Offline banner */}
          <View style={styles.offline}>
            <Icon name="cloud-off-outline" size={r.s(16)} color="#64748A" />
            <Text style={styles.offlineText}>Offline · Saved on phone, will upload when online</Text>
            <View style={styles.offlineDot} />
          </View>

          {/* Progress */}
          <View style={styles.progress}>
            <View style={styles.progressTop}>
              <Text style={styles.progressText} numberOfLines={2}>
                <Text style={styles.progressStrong}>{ready} of 5 documents ready</Text>
                {!allReady && (
                  <Text>
                    {'  '}· 1 <Hi style={styles.progressHi}>कार्रवाई आवश्यक</Hi>
                  </Text>
                )}
              </Text>
              <Text style={[styles.pct, allReady && { color: GREEN }]}>{pct}% Ready</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
              {!allReady && <View style={[styles.barRest, { width: `${100 - pct}%` }]} />}
            </View>
          </View>

          {/* Verified documents */}
          {docs.map((d) => (
            <DocRow key={d.title} icon={d.icon} title={d.title} hi={d.hi} src={d.source} blue={d.digilocker} />
          ))}

          {/* Admission letter: failing card, becomes a normal verified row once fixed */}
          {admission === 'ok' ? (
            <DocRow icon="clipboard-text-outline" title="Admission Letter (IIT Kharagpur)" hi="प्रवेश पत्र" src={source} />
          ) : (
            <View style={styles.failCard}>
              <View style={styles.failTop}>
                <View style={styles.failTile}>
                  <Icon name="clipboard-text-outline" size={r.s(20)} color={RED} />
                </View>
                <View style={styles.docBody}>
                  <Text style={styles.docTitle}>Admission Letter (IIT Kharagpur)</Text>
                  <Text style={styles.failMeta}>
                    <Hi style={styles.docHi}>प्रवेश पत्र</Hi> · {source}
                  </Text>
                </View>
                <View style={styles.actionChip}>
                  <Icon name="alert-circle-outline" size={r.s(14)} color={RED} />
                  <Text style={styles.actionChipText}>Action{'\n'}required</Text>
                </View>
              </View>

              <View style={styles.failBody}>
                <View style={styles.failHeadRow}>
                  <Icon name="alert" size={r.s(20)} color={RED} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.failTitle}>
                      Quality check failed / <Hi style={styles.failTitle}>गुणवत्ता जाँच विफल</Hi>
                    </Text>
                    <Text style={styles.failDesc}>Automated scan detected readability and verification mismatches.</Text>
                  </View>
                </View>

                <View style={styles.checkRow}>
                  <View style={styles.preview}>
                    <View style={styles.previewHead}>
                      <View style={styles.previewBlock} />
                      <View style={styles.previewCircle} />
                    </View>
                    <View style={[styles.previewLine, { backgroundColor: '#CAD4E1' }]} />
                    <View style={[styles.previewLine, { backgroundColor: '#FBA5A5', width: '80%' }]} />
                    <View style={[styles.previewLine, { backgroundColor: '#CAD4E1', width: '58%' }]} />
                    <View style={[styles.previewLine, { backgroundColor: '#CAD4E1' }]} />
                    <View style={[styles.previewLine, { backgroundColor: '#F47070', width: '70%' }]} />
                    <View style={{ flex: 1 }} />
                    <View style={styles.blurBadge}>
                      <Text style={styles.blurText}>BLURRED</Text>
                    </View>
                  </View>
                  <View style={styles.checks}>
                    <View style={styles.check}>
                      <Icon name="close-circle-outline" size={r.s(17)} color={RED} />
                      <Text style={[styles.checkText, { color: RED }]}>Image is blurry — retake in good light</Text>
                    </View>
                    <View style={styles.check}>
                      <Icon name="close-circle-outline" size={r.s(17)} color={RED} />
                      <Text style={[styles.checkText, { color: RED }]}>
                        Name doesn't match Aadhaar: <Text style={styles.bold}>'Ramesh Munda'</Text> vs{' '}
                        <Text style={styles.bold}>'Ramesh Kumar Munda'</Text>
                      </Text>
                    </View>
                    <View style={styles.check}>
                      <Icon name="check-circle" size={r.s(17)} color={GREEN} />
                      <Text style={[styles.checkText, { color: GREEN }]}>Document date is valid (12/07/2026)</Text>
                    </View>
                    <View style={styles.check}>
                      <Icon name="check-circle" size={r.s(17)} color={GREEN} />
                      <Text style={[styles.checkText, { color: GREEN }]}>All 4 corners visible</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={admission === 'scanning'}
                    onPress={() => fix('Camera scan · 1.1 MB')}
                    style={({ pressed }) => [styles.retake, pressed && { opacity: 0.85 }]}
                  >
                    {admission === 'scanning' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Icon name="camera-outline" size={r.s(20)} color="#FFFFFF" />
                    )}
                    <Text style={styles.retakeText}>{admission === 'scanning' ? 'Checking…' : 'Retake photo'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={admission === 'scanning'}
                    onPress={() => fix('From wallet')}
                    style={({ pressed }) => [styles.wallet, pressed && { opacity: 0.85 }]}
                  >
                    <Icon name="wallet-outline" size={r.s(20)} color={NAVY} />
                    <Text style={styles.walletText}>From wallet</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Tip */}
          <View style={styles.tip}>
            <Icon name="lightbulb-on-outline" size={r.s(20)} color={NAVY} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tip:</Text> Place the document on a flat dark surface, avoid reflections and
              shadows for instant automated verification.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomInner}>
          <View style={styles.bottomStatus}>
            <View style={[styles.statusDot, allReady && { backgroundColor: GREEN }]} />
            <Text style={[styles.statusText, allReady && { color: GREEN }]}>
              {allReady ? 'All 5 documents verified / ' : 'Fix 1 document to continue / '}
              <Hi style={[styles.statusText, allReady && { color: GREEN }]}>
                {allReady ? 'सभी 5 दस्तावेज़ सत्यापित' : 'आगे बढ़ने के लिए 1 दस्तावेज़ ठीक करें'}
              </Hi>
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !allReady }}
            disabled={!allReady}
            onPress={onContinue}
            style={({ pressed }) => [styles.continueBtn, allReady && styles.continueOn, pressed && allReady && { opacity: 0.9 }]}
          >
            <Text style={[styles.continueText, allReady && { color: '#FFFFFF' }]}>
              Continue / <Hi style={[styles.continueText, allReady && { color: '#FFFFFF' }]}>आगे बढ़ें</Hi>
            </Text>
            <Icon name="arrow-right" size={r.s(18)} color={allReady ? '#FFFFFF' : '#64748A'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(16), borderWidth: 1, borderColor: '#E1E4EB' } as const;
  const circle = s(28);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F2F4F9' },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row', zIndex: 2 },

    // ---- header + stepper
    header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8ECF2' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(14), paddingBottom: s(10) },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(21), color: DARK },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(15), color: MUTED },
    draft: { alignItems: 'flex-end' },
    draftEn: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(16), color: NAVY },
    draftHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(10), lineHeight: fs(14), color: MUTED },
    stepperWrap: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingBottom: s(12) },
    stepper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: s(6), paddingTop: s(4) },
    // the track spans centre-to-centre of the first and last circle
    lineTrack: { position: 'absolute', top: s(4) + s(18) - 1, left: s(6) + s(36), right: s(6) + s(36), height: 2, flexDirection: 'row' },
    line: { flex: 1, height: 2 },
    stepCol: { alignItems: 'center', width: s(76) },
    stepCircle: { width: circle, height: circle, borderRadius: circle / 2, alignItems: 'center', justifyContent: 'center' },
    stepOutline: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#CAD4E1' },
    halo: { width: circle + s(8), height: circle + s(8), borderRadius: (circle + s(8)) / 2, backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center', marginVertical: -s(4) },
    stepNum: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },
    stepEn: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), marginTop: s(9) },
    stepHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(10), lineHeight: fs(14), color: MUTED },

    scroll: { paddingBottom: s(20) },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- offline + progress (PDF: 27pt banner, 57pt progress card, 8pt bar)
    offline: { flexDirection: 'row', alignItems: 'center', gap: s(10), minHeight: s(27), marginTop: s(12), paddingHorizontal: s(13), paddingVertical: s(6), borderRadius: s(10), borderWidth: 1, borderColor: '#E2E8EF', backgroundColor: '#F0F4F9' },
    offlineText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: MUTED },
    offlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F49E0A' },
    progress: { ...card, marginTop: s(8), paddingHorizontal: s(14), paddingTop: s(13), paddingBottom: s(14) },
    progressTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(10) },
    progressText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: MUTED },
    progressStrong: { fontFamily: fontFamily.bold, fontSize: fs(12), color: INK },
    progressHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    pct: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: RED },
    bar: { flexDirection: 'row', height: s(8), marginTop: s(10), borderRadius: s(4), overflow: 'hidden', backgroundColor: '#F0F4F9' },
    barFill: { height: '100%', backgroundColor: GREEN },
    barRest: { height: '100%', backgroundColor: '#FBA5A5' },

    // ---- document rows (PDF: 358 wide, 74pt tall, 40pt tile)
    docCard: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(12), minHeight: s(74), marginTop: s(10), paddingHorizontal: s(15), paddingVertical: s(12) },
    docTile: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: '#E8EDF6', borderWidth: 1, borderColor: '#D4E1EF', alignItems: 'center', justifyContent: 'center' },
    docBody: { flex: 1, minWidth: 0 },
    docTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(20), color: INK },
    docMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: s(8), rowGap: 4, marginTop: 3 },
    docHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), lineHeight: fs(16), color: MUTED },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CAD4E1' },
    source: { borderRadius: 6, backgroundColor: '#F0F4F9', paddingHorizontal: s(7), paddingVertical: s(3) },
    sourceBlue: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFD' },
    sourceText: { fontFamily: fontFamily.semibold, fontSize: fs(10), color: NAVY },
    verified: { flexDirection: 'row', alignItems: 'center', gap: 5, height: s(21), paddingHorizontal: s(8), borderRadius: s(8), backgroundColor: '#E6F4E9' },
    verifiedText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: GREEN },

    // ---- failing document (PDF: 2pt #FBA5A5 border, pink lower section, 96x128 dashed preview)
    failCard: { marginTop: s(10), borderRadius: s(18), borderWidth: 2, borderColor: '#FBA5A5', backgroundColor: '#FFFFFF', overflow: 'hidden' },
    failTop: { flexDirection: 'row', alignItems: 'center', gap: s(12), padding: s(15) },
    failTile: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: '#FDF2F2', borderWidth: 1, borderColor: '#FDCACA', alignItems: 'center', justifyContent: 'center' },
    failMeta: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 3 },
    actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: s(10), backgroundColor: '#FDE2E2', paddingHorizontal: s(10), paddingVertical: s(7) },
    actionChipText: { fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: RED },
    failBody: { backgroundColor: '#FFF4F4', borderTopWidth: 1, borderTopColor: '#FCDADA', padding: s(15) },
    failHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10) },
    failTitle: { fontFamily: fontFamily.bold, fontSize: fs(12), lineHeight: fs(17), color: RED },
    failDesc: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: '#465469', marginTop: 2 },
    checkRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: s(14), marginTop: s(14) },
    preview: { width: s(100), height: s(128), padding: s(8), borderRadius: s(10), borderWidth: 2, borderStyle: 'dashed', borderColor: '#F87070', backgroundColor: '#FFFFFF', gap: s(7) },
    previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewBlock: { width: s(16), height: s(8), backgroundColor: '#CAD4E1' },
    previewCircle: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#CAD4E1' },
    previewLine: { height: s(4), borderRadius: 2 },
    blurBadge: { height: s(20), alignItems: 'center', justifyContent: 'center', borderRadius: s(6), borderWidth: 1, borderColor: '#FDCACA', backgroundColor: '#FDF2F2' },
    blurText: { fontFamily: fontFamily.bold, fontSize: fs(9), color: RED },
    checks: { flex: 1, flexBasis: s(150), gap: s(8) },
    check: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8) },
    checkText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(14), color: INK },
    bold: { fontFamily: fontFamily.bold },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(14) },
    retake: { flexGrow: 1, flexBasis: s(140), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), minHeight: s(44), borderRadius: s(10), backgroundColor: ORANGE },
    retakeText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: '#FFFFFF' },
    wallet: { flexGrow: 1, flexBasis: s(140), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), minHeight: s(44), borderRadius: s(10), borderWidth: 1.5, borderColor: NAVY, backgroundColor: '#FFFFFF' },
    walletText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: NAVY },

    tip: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginTop: s(12), padding: s(14), borderRadius: s(14), borderWidth: 1, borderColor: '#CFDDEF', backgroundColor: '#E8EDF6' },
    tipText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(18), color: INK },
    tipBold: { fontFamily: fontFamily.bold, color: NAVY },

    // ---- sticky bottom (PDF: status line + 48pt continue button)
    bottom: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E4EB', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    bottomInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(12) },
    bottomStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: s(10) },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
    statusText: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(11), lineHeight: fs(15), color: RED, textAlign: 'center' },
    continueBtn: { minHeight: s(48), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), borderRadius: s(14), backgroundColor: '#CAD4E1' },
    continueOn: { backgroundColor: ORANGE, shadowColor: ORANGE, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    continueText: { fontFamily: fontFamily.bold, fontSize: fs(14), color: '#64748A' },
  });
};
