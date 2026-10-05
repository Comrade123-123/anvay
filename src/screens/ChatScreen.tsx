import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';

// Screen 20 of ANVAY_ka_kaam.pdf (JAGO – Scholarship Sahayak chat). Static mock data only: replies are canned
// client-side text, there is no AI / API behind this screen.
// Sizes follow the PDF's drawing data on its 390pt frame: 36pt header avatar, 26pt chat avatars, 28pt timeline dots,
// 40pt mic/send buttons, 27pt quick-reply chips, 32pt document rows, 14/12/11.5pt text.
// The PDF render clipped the quick-reply row at the page edge and squeezed the composer hint; here the chips scroll
// sideways and the composer uses a fluid input with fixed 40pt round buttons.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const RED = '#C62828';
const INK = '#1F2836';
const MUTED = '#5E6B79';
const BORDER = '#E1E4EB';

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

type Msg =
  | { id: string; from: 'bot'; kind: 'greeting'; time: string }
  | { id: string; from: 'bot'; kind: 'status'; time: string }
  | { id: string; from: 'bot'; kind: 'docs'; time: string }
  | { id: string; from: 'bot'; kind: 'text'; text: string; time: string }
  | { id: string; from: 'user'; text: string; time: string; hindi?: boolean };

const initial: Msg[] = [
  { id: 'm1', from: 'bot', kind: 'greeting', time: '10:42 AM' },
  { id: 'm2', from: 'user', text: 'मेरा पैसा कब आएगा?', time: '10:43 AM · Read', hindi: true },
  { id: 'm3', from: 'bot', kind: 'status', time: '10:43 AM' },
  { id: 'm4', from: 'user', text: 'Top Class ke liye kaunse documents chahiye?', time: '10:44 AM · Read' },
  { id: 'm5', from: 'bot', kind: 'docs', time: '10:45 AM' },
];

const chips: { icon: string; en: string; hi: string; reply: string }[] = [
  { icon: 'format-list-checks', en: 'Check status', hi: 'स्थिति जांचें', reply: 'Your Post-Matric application is Sanctioned. Expected payment of ₹18,500 in about 12 days.' },
  { icon: 'account-check-outline', en: 'Am I eligible?', hi: 'क्या मैं योग्य हूँ?', reply: 'Based on your saved profile you look eligible for Post-Matric and Top Class. Open Schemes to compare them.' },
  { icon: 'file-document-outline', en: 'My documents', hi: 'मेरे दस्तावेज़', reply: '3 of 4 documents are verified via DigiLocker. Only the admission letter is pending.' },
  { icon: 'calendar-clock-outline', en: 'Deadlines', hi: 'अंतिम तिथियाँ', reply: 'Top Class applications close on 31 Oct 2026. Your income certificate expires on 20 Oct.' },
];

const now = () => {
  const d = new Date();
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
};

type Props = {
  onBack?: () => void;
  onOpenDetails?: () => void;
  onUpload?: () => void;
};

const steps = [
  { label: 'Submitted', state: 'done' },
  { label: 'Verified', state: 'done' },
  { label: 'Sanctioned', state: 'current' },
  { label: 'Credited', state: 'todo' },
] as const;

const docs = [
  { n: '1. Aadhaar Card', ok: true },
  { n: '2. ST Caste Certificate', ok: true },
  { n: '3. Income Certificate (< ₹8L)', ok: true },
  { n: '4. Admission Letter (IIT Kharagpur)', ok: false },
];

export function ChatScreen({ onBack, onOpenDetails, onUpload }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const styles = useMemo(() => makeStyles(r), [r.width]);
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const push = (m: Msg) => setMessages((prev) => [...prev, m]);

  const ask = (q: string, reply: string, hindi = false) => {
    push({ id: `u${Date.now()}`, from: 'user', text: q, time: `${now()} · Read`, hindi });
    setTyping(true);
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        push({ id: `b${Date.now()}`, from: 'bot', kind: 'text', text: reply, time: now() });
      }, 700),
    );
  };

  const send = () => {
    const q = text.trim();
    if (!q) return;
    setText('');
    ask(q, 'Thanks for your question. I am a demo assistant, so for now I can help with status, eligibility, documents and deadlines — tap a quick reply below.');
  };

  const Avatar = () => (
    <View style={styles.botAvatar}>
      <Icon name="robot-happy-outline" size={r.s(15)} color={NAVY} />
    </View>
  );

  const Bot = ({ children, time, wide }: { children: React.ReactNode; time: string; wide?: boolean }) => (
    <View style={styles.botRow}>
      <Avatar />
      <View style={[styles.botCol, wide && { flex: 1 }]}>
        {children}
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );

  const renderMsg = (m: Msg) => {
    if (m.from === 'user') {
      return (
        <View key={m.id} style={styles.userRow}>
          <View style={styles.userBubble}>
            {m.hindi ? <Hi style={styles.userText}>{m.text}</Hi> : <Text style={styles.userText}>{m.text}</Text>}
          </View>
          <View style={styles.readRow}>
            <Text style={styles.time}>{m.time}</Text>
            <Icon name="check-all" size={r.s(13)} color={GREEN} />
          </View>
        </View>
      );
    }
    if (m.kind === 'greeting') {
      return (
        <Bot key={m.id} time={m.time}>
          <View style={styles.bubble}>
            <Hi style={styles.botText}>
              नमस्ते रमेश! मैं <Text style={{ fontFamily: fontFamily.hindiBold, color: DARK }}>JAGO</Text> हूँ, आपका छात्रवृत्ति सहायक। मैं आपकी छात्रवृत्ति में कैसे मदद करूँ?
            </Hi>
          </View>
        </Bot>
      );
    }
    if (m.kind === 'text') {
      return (
        <Bot key={m.id} time={m.time}>
          <View style={styles.bubble}>
            <Text style={styles.botTextEn}>{m.text}</Text>
          </View>
        </Bot>
      );
    }
    if (m.kind === 'status') {
      return (
        <Bot key={m.id} time={m.time} wide>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1, minWidth: r.s(130) }}>
                <Text style={styles.cardTitle}>Post-Matric{'\n'}Scholarship 2026-27</Text>
                <Text style={styles.cardId}>ID: MoTA-ST-2026-88941</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  In Review / <Hi>समीक्षाधीन</Hi>
                </Text>
              </View>
            </View>
            <View style={styles.rule} />

            <View style={styles.stepper}>
              {steps.map((s, i) => (
                <View key={s.label} style={styles.step}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.stepLine,
                        { backgroundColor: s.state === 'done' || s.state === 'current' ? GREEN : '#E1E4EB' },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.dot,
                      s.state === 'done' && { backgroundColor: GREEN },
                      s.state === 'current' && { backgroundColor: NAVY, borderWidth: r.s(2), borderColor: '#B7C2D8' },
                      s.state === 'todo' && { backgroundColor: '#fff', borderWidth: r.s(2), borderColor: '#BAC3D1' },
                    ]}
                  >
                    {s.state === 'done' && <Icon name="check" size={r.s(16)} color="#fff" />}
                    {s.state === 'current' && <View style={styles.dotCore} />}
                    {s.state === 'todo' && <View style={[styles.dotCore, { backgroundColor: '#BAC3D1', width: r.s(6), height: r.s(6), borderRadius: r.s(3) }]} />}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      s.state === 'done' && { color: GREEN },
                      s.state === 'current' && { color: NAVY, fontFamily: fontFamily.bold },
                    ]}
                    numberOfLines={1}
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.info}>
              <Icon name="information-outline" size={r.s(18)} color={NAVY} style={{ marginTop: r.s(1) }} />
              <Text style={styles.infoText}>
                <Text style={{ fontFamily: fontFamily.bold, color: DARK }}>District review pending.</Text> Expected payment of{' '}
                <Text style={{ fontFamily: fontFamily.bold, color: DARK }}>₹18,500</Text> in about 12 days to your Aadhaar-linked SBI bank account.
              </Text>
            </View>

            <Pressable accessibilityRole="link" onPress={onOpenDetails} style={styles.detailsLink} hitSlop={8}>
              <Text style={styles.detailsText}>
                View details / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>विवरण देखें</Hi>
              </Text>
              <Icon name="arrow-right" size={r.s(15)} color={NAVY} />
            </Pressable>
          </View>
        </Bot>
      );
    }
    // docs
    return (
      <Bot key={m.id} time={m.time} wide>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Class Scholarship · Required Documents</Text>
          <View style={styles.verifiedLine}>
            <Icon name="check-decagram-outline" size={r.s(14)} color={GREEN} />
            <Text style={styles.verifiedText}>3 of 4 documents auto-verified via DigiLocker</Text>
          </View>
          <View style={styles.rule} />
          <View style={{ gap: r.s(8) }}>
            {docs.map((d) => (
              <View key={d.n} style={[styles.docRow, !d.ok && styles.docRowBad]}>
                <Text style={styles.docName}>{d.n}</Text>
                <View style={styles.docStatus}>
                  <Icon name={d.ok ? 'check-circle-outline' : 'close-circle-outline'} size={r.s(16)} color={d.ok ? GREEN : RED} />
                  <Text style={[styles.docStatusText, { color: d.ok ? GREEN : RED }]}>{d.ok ? 'Verified' : 'Upload\nneeded'}</Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onUpload}
            style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.9 }]}
          >
            <Icon name="file-upload-outline" size={r.s(17)} color="#fff" />
            <Text style={styles.uploadText}>
              Upload admission letter now / <Hi style={{ fontFamily: fontFamily.hindiSemibold }}>अभी अपलोड करें</Hi> →
            </Text>
          </Pressable>
        </View>
      </Bot>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + r.s(14) }]}>
        <View style={styles.tricolor}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>
        <View style={styles.column}>
          <View style={styles.headTop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={10} style={styles.back}>
              <Icon name="arrow-left" size={r.s(24)} color="#fff" />
            </Pressable>
            <View style={styles.headAvatar}>
              <Icon name="robot-happy-outline" size={r.s(20)} color={DARK} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headTitle}>JAGO – Scholarship Sahayak</Text>
              <View style={styles.online}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>
                  Online / <Hi>ऑनलाइन</Hi>
                </Text>
              </View>
            </View>
            <View style={styles.langWrap} accessibilityRole="tablist">
              {(['en', 'hi'] as const).map((l) => {
                const on = lang === l;
                return (
                  <Pressable
                    key={l}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    onPress={() => setLang(l)}
                    style={[styles.langSeg, on && styles.langSegOn]}
                  >
                    {l === 'en' ? (
                      <Text style={[styles.langText, on && { color: DARK }]}>EN</Text>
                    ) : (
                      <Hi style={[styles.langText, on && { color: DARK }]}>हि</Hi>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.desk}>
            <Icon name="bank-outline" size={r.s(13)} color="#C9D1E0" />
            <Text style={styles.deskText}>Ministry of Tribal Affairs · AI Assistance Desk</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          <View style={styles.dayWrap}>
            <View style={styles.dayPill}>
              <Text style={styles.dayText}>
                Today / <Hi>आज</Hi>
              </Text>
            </View>
          </View>
          <View style={{ gap: r.s(14) }}>
            {messages.map(renderMsg)}
            {typing && (
              <View style={styles.botRow}>
                <Avatar />
                <View style={[styles.bubble, { paddingVertical: r.s(10) }]}>
                  <Text style={[styles.botTextEn, { color: MUTED }]}>Typing…</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.chipsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          keyboardShouldPersistTaps="handled"
        >
          {chips.map((c) => (
            <Pressable
              key={c.en}
              accessibilityRole="button"
              onPress={() => ask(lang === 'hi' ? c.hi : c.en, c.reply, lang === 'hi')}
              style={({ pressed }) => [styles.chip, pressed && { backgroundColor: '#E8EDF6' }]}
            >
              <Icon name={c.icon as any} size={r.s(14)} color={NAVY} />
              <Text style={styles.chipText}>
                {c.en} / <Hi>{c.hi}</Hi>
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.column}>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              returnKeyType="send"
              placeholder={lang === 'hi' ? 'यहाँ लिखें या बोलें…' : 'Type or speak in Hindi/English / यहाँ लिखें…'}
              placeholderTextColor={MUTED}
              style={styles.input}
              accessibilityLabel="Message"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Speak" onPress={() => toast('Voice input is not available in this demo')} style={[styles.round, { backgroundColor: ORANGE }]}>
              <Icon name="microphone" size={r.s(20)} color="#fff" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              onPress={send}
              style={[styles.round, { backgroundColor: NAVY }]}
            >
              <Icon name="send-outline" size={r.s(18)} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.disclaimer}>
            <Icon name="shield-check-outline" size={r.s(13)} color={NAVY} style={{ marginTop: r.s(1) }} />
            <Text style={styles.disclaimerText}>JAGO answers using your application data. Verified by Ministry of Tribal Affairs (MoTA).</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const gutter = s(16);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: gutter },

    header: {
      backgroundColor: DARK,
      borderBottomLeftRadius: s(24),
      borderBottomRightRadius: s(24),
      paddingBottom: s(14),
      overflow: 'hidden',
    },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headTop: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    back: { width: s(24), alignItems: 'center', justifyContent: 'center' },
    headAvatar: {
      width: s(36),
      height: s(36),
      borderRadius: s(18),
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headTitle: { fontFamily: fontFamily.bold, fontSize: fs(16), lineHeight: fs(20), color: '#fff' },
    online: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(2) },
    onlineDot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: GREEN },
    onlineText: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#fff' },
    langWrap: {
      flexDirection: 'row',
      padding: s(3),
      borderRadius: s(14),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center',
    },
    langSeg: { minWidth: s(28), height: s(21), borderRadius: s(11), alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(6) },
    langSegOn: { backgroundColor: '#fff' },
    langText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: '#fff' },
    desk: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(12) },
    deskText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(10.5), color: '#C9D1E0' },

    body: { paddingTop: s(14), paddingBottom: s(16) },
    dayWrap: { alignItems: 'center', marginBottom: s(14) },
    dayPill: { backgroundColor: '#E1E4EB', paddingHorizontal: s(12), paddingVertical: s(5), borderRadius: s(12) },
    dayText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: MUTED },

    botRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8), maxWidth: '100%' },
    botAvatar: {
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: BORDER,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botCol: { maxWidth: '86%', flexShrink: 1 },
    bubble: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: s(16),
      borderTopLeftRadius: s(4),
      paddingHorizontal: s(14),
      paddingVertical: s(13),
      alignSelf: 'flex-start',
    },
    botText: { fontSize: fs(14), lineHeight: fs(20), color: INK },
    botTextEn: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(19), color: INK },
    time: { fontFamily: fontFamily.regular, fontSize: fs(10), color: MUTED, marginTop: s(5) },

    userRow: { alignItems: 'flex-end' },
    userBubble: {
      maxWidth: '82%',
      backgroundColor: '#E8EDF6',
      borderWidth: 1,
      borderColor: '#D4E1EF',
      borderRadius: s(16),
      borderTopRightRadius: s(4),
      paddingHorizontal: s(15),
      paddingVertical: s(12),
    },
    userText: { fontFamily: fontFamily.regular, fontSize: fs(14), lineHeight: fs(20), color: NAVY },
    readRow: { flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: s(4) },

    card: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: s(16),
      borderTopLeftRadius: s(4),
      padding: s(15),
    },
    cardHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: s(10), justifyContent: 'space-between' },
    cardTitle: { fontFamily: fontFamily.bold, fontSize: fs(13.5), lineHeight: fs(19), color: INK },
    cardId: { fontFamily: fontFamily.regular, fontSize: fs(10.5), color: MUTED, marginTop: s(8) },
    pill: {
      backgroundColor: '#E8EDF6',
      borderWidth: 1,
      borderColor: '#D4E1EF',
      borderRadius: s(6),
      paddingHorizontal: s(9),
      paddingVertical: s(4),
    },
    pillText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: NAVY },
    rule: { height: 1, backgroundColor: '#EDEFF3', marginVertical: s(12) },

    stepper: { flexDirection: 'row', marginBottom: s(14) },
    step: { flex: 1, alignItems: 'center' },
    stepLine: { position: 'absolute', top: s(14) - 1.5, right: '50%', width: '100%', height: 3 },
    dot: { width: s(28), height: s(28), borderRadius: s(14), alignItems: 'center', justifyContent: 'center' },
    dotCore: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#fff' },
    stepLabel: { fontFamily: fontFamily.medium, fontSize: fs(9.5), color: MUTED, marginTop: s(6) },

    info: {
      flexDirection: 'row',
      gap: s(10),
      backgroundColor: '#E8EDF6',
      borderWidth: 1,
      borderColor: '#D4E1EF',
      borderRadius: s(8),
      padding: s(11),
    },
    infoText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(19), color: NAVY },
    detailsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: s(4), marginTop: s(14) },
    detailsText: { fontFamily: fontFamily.semibold, fontSize: fs(12.5), color: NAVY },

    verifiedLine: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(4) },
    verifiedText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), color: MUTED },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(10),
      backgroundColor: '#F8F9FB',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: s(6),
      paddingHorizontal: s(8),
      paddingVertical: s(7),
      minHeight: s(32),
    },
    docRowBad: { backgroundColor: '#FBE8E6', borderColor: '#F5D3D0' },
    docName: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: INK },
    docStatus: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
    docStatusText: { fontFamily: fontFamily.medium, fontSize: fs(11.5), lineHeight: fs(15) },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(12),
      backgroundColor: ORANGE,
      borderRadius: s(8),
      paddingHorizontal: s(14),
      paddingVertical: s(12),
      marginTop: s(12),
    },
    uploadText: { flex: 1, textAlign: 'center', fontFamily: fontFamily.semibold, fontSize: fs(12.5), lineHeight: fs(18), color: '#fff' },

    chipsBar: { borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: colors.background, paddingVertical: s(9) },
    chipsContent: { paddingHorizontal: gutter, gap: s(10), alignItems: 'center' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      height: s(30),
      paddingHorizontal: s(12),
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: NAVY,
      borderRadius: s(15),
    },
    chipText: { fontFamily: fontFamily.medium, fontSize: fs(11.5), color: NAVY },

    composer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: s(10) },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
    input: {
      flex: 1,
      minWidth: 0,
      height: s(42),
      borderRadius: s(21),
      borderWidth: 1,
      borderColor: '#BAC3D1',
      backgroundColor: colors.background,
      paddingHorizontal: s(16),
      fontFamily: fontFamily.regular,
      fontSize: fs(13),
      color: INK,
    },
    round: { width: s(40), height: s(40), borderRadius: s(20), alignItems: 'center', justifyContent: 'center' },
    disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8), marginTop: s(8) },
    disclaimerText: { flex: 1, textAlign: 'center', fontFamily: fontFamily.regular, fontSize: fs(9.5), lineHeight: fs(13), color: MUTED },
  });
};
