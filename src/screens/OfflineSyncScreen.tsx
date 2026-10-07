import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { OfflineIllustration } from '../components/OfflineIllustration';
import { api } from '../api/client';
import { cache } from '../api/cache';
import { useOnline } from '../api/connectivity';
import { outbox, useOutbox } from '../api/outbox';

// Screen 17 of ANVAY_ka_kaam.pdf (Offline & sync, opened from Profile > Offline Data & Background Sync).
// Shows the real connection, what is waiting to upload and what is saved on the phone. Sizes follow the PDF's drawing data: 28pt "Offline" pill, 40pt circular icon tiles,
// 16pt tick circles, 24pt toggles (44 x 24 track), 52pt sticky sync button.
// The two toggles are saved on the phone; "Try syncing now" checks the connection and uploads what is waiting.
// Alignment fix vs the reference: the sticky sync bar covered the SMS card in the PDF - here it sits below the
// scroll area and the list ends with room for it.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const GREEN = '#1D8E3D';
const INK = '#1F2836';
const MUTED = '#5E6B79';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const worksOffline = [
  'Open screens you have already seen (documents, status, payments)',
  'See deadlines and reminders',
  'Write a grievance. It is saved and sent later',
];

const when = (ms: number) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(ms));

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const r = useResponsive();
  const w = r.s(44);
  const h = r.s(24);
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
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

type Props = { onBack?: () => void };

export function OfflineSyncScreen({ onBack }: Props) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const online = useOnline();
  const { items: queue, lastSynced } = useOutbox();
  const [wifiOnly, setWifiOnlyState] = useState(false);
  const [saveOffline, setSaveOfflineState] = useState(true);
  const [saved, setSaved] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    cache.prefs().then((p) => {
      setWifiOnlyState(p.wifiOnly);
      setSaveOfflineState(p.saveOffline);
    });
    cache.count().then(setSaved);
  }, []);

  const setWifiOnly = (v: boolean) => {
    setWifiOnlyState(v);
    cache.setPrefs({ wifiOnly: v });
  };
  const setSaveOffline = (v: boolean) => {
    setSaveOfflineState(v);
    cache.setPrefs({ saveOffline: v }).then(() => cache.count().then(setSaved));
  };

  // Finds out whether the server can really be reached, then uploads whatever is waiting.
  const trySync = async () => {
    if (syncing) return;
    setSyncing(true);
    setResult(null);
    try {
      await api.get('/health', { fresh: true });
      const res = await outbox.flush(true);
      if (res.offline) setResult(`Connection lost. ${res.remaining} ${res.remaining === 1 ? 'item stays' : 'items stay'} queued`);
      else if (res.rejected.length) setResult(`Not accepted: ${res.rejected[0]}`);
      else {
        await outbox.markSynced();
        setResult(res.sent ? `Uploaded ${res.sent} ${res.sent === 1 ? 'item' : 'items'}` : 'Everything is up to date');
      }
    } catch {
      setResult(`Still offline. ${queue.length} ${queue.length === 1 ? 'item stays' : 'items stay'} queued and will retry automatically`);
    } finally {
      setSyncing(false);
      cache.count().then(setSaved);
    }
  };

  const copySms = () => {
    try {
      Promise.resolve((globalThis as any).navigator?.clipboard?.writeText?.('ANVAY STATUS 004512')).catch(() => {});
    } catch {}
    setCopied(true);
    timers.current.push(setTimeout(() => setCopied(false), 1400));
  };

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
                <Text style={styles.title}>Offline & sync</Text>
                <Hi style={styles.titleHi}>ऑफ़लाइन और सिंक</Hi>
              </View>
              <View style={[styles.offlinePill, online && { backgroundColor: '#E6F4E9' }]}>
                <Icon name={online ? 'cloud-check-outline' : 'cloud-off-outline'} size={r.s(16)} color={online ? GREEN : '#4B5462'} />
                <Text style={[styles.offlinePillText, online && { color: GREEN }]}>{online ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Offline hero card */}
          <View style={styles.hero}>
            <View style={styles.heroArt}>
              <OfflineIllustration />
            </View>
            <Text style={styles.heroTitle}>
              {online ? "You're online / " : "You're offline / "}
              <Hi style={styles.heroTitleHi}>{online ? 'आप ऑनलाइन हैं' : 'आप ऑफ़लाइन हैं'}</Hi>
            </Text>
            <Text style={styles.heroBody}>
              {online
                ? 'Everything is connected. Anything you saved while offline is uploaded automatically.'
                : "Don't worry, ANVAY keeps working. What you have already opened stays available and your changes upload when the network returns."}
            </Text>
            <View style={styles.heroRule} />
            <View style={styles.synced}>
              <Icon name="clock" size={r.s(14)} color={NAVY} />
              <Text style={styles.syncedText}>{lastSynced ? `Last synced ${when(lastSynced)}` : 'Not synced from this phone yet'}</Text>
            </View>
          </View>

          {/* Waiting to upload */}
          <Text style={styles.sectionTitle}>
            Waiting to upload <Hi style={styles.sectionHi}>अपलोड बाकी</Hi>
          </Text>
          <View style={styles.card}>
            {queue.length === 0 && (
              <View style={styles.qRow}>
                <View style={styles.qTile}>
                  <Icon name="check-all" size={r.s(20)} color={GREEN} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.qTitle}>Nothing waiting</Text>
                  <Text style={styles.qSub}>Everything you did has reached the server</Text>
                </View>
              </View>
            )}
            {queue.map((q, i) => (
              <View key={q.id} style={[styles.qRow, i > 0 && styles.qBorder]}>
                <View style={styles.qTile}>
                  <Icon name="forum-outline" size={r.s(20)} color={NAVY} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.qTitle}>Grievance: {q.title}</Text>
                  <Text style={styles.qSub}>{q.sub} · {when(q.createdAt)}</Text>
                </View>
                <View style={styles.queued}>
                  <Text style={styles.queuedText}>Queued</Text>
                </View>
              </View>
            ))}
            <View style={styles.qFoot}>
              <Icon name="sync" size={r.s(14)} color={NAVY} />
              <Text style={styles.qFootText}>{queue.length} {queue.length === 1 ? 'item' : 'items'} · will upload automatically</Text>
            </View>
          </View>

          {/* Works offline */}
          <Text style={styles.sectionTitle}>
            Works offline <Hi style={styles.sectionHi}>बिना इंटरनेट</Hi>
          </Text>
          <View style={[styles.card, styles.works]}>
            {worksOffline.map((w) => (
              <View key={w} style={styles.workRow}>
                <View style={styles.tick}>
                  <Icon name="check" size={r.s(12)} color="#FFFFFF" />
                </View>
                <Text style={styles.workText}>{w}</Text>
              </View>
            ))}
          </View>

          {/* SMS fallback */}
          <View style={styles.sms}>
            <View style={styles.smsTop}>
              <View style={styles.smsIcon}>
                <Icon name="message-text-outline" size={r.s(20)} color={NAVY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smsTitle}>
                  No internet? Use SMS / <Hi style={styles.smsTitle}>SMS से जानें</Hi>
                </Text>
                <Text style={styles.smsBody}>
                  Send <Text style={styles.smsBold}>ANVAY STATUS</Text> to <Text style={styles.smsBold}>1XXXX</Text> to get
                  your application status
                </Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Copy SMS text" onPress={copySms} style={styles.smsChip}>
              <Text style={styles.smsChipText}>ANVAY STATUS 004512</Text>
              <Icon name={copied ? 'check' : 'content-copy'} size={r.s(15)} color={copied ? GREEN : NAVY} />
            </Pressable>
          </View>

          {/* Settings */}
          <View style={[styles.card, { marginTop: r.s(16) }]}>
            <View style={styles.setRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.setTitle}>Sync only on Wi-Fi</Text>
                <Hi style={styles.setSub}>केवल Wi-Fi पर</Hi>
              </View>
              <Toggle value={wifiOnly} onChange={setWifiOnly} label="Sync only on Wi-Fi" />
            </View>
            <View style={[styles.setRow, styles.setBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.setTitle}>Save documents on phone for offline use</Text>
                <Text style={styles.setSub}>{saveOffline ? `${saved} ${saved === 1 ? 'screen' : 'screens'} saved on this phone` : 'Screens load only when online'}</Text>
              </View>
              <Toggle value={saveOffline} onChange={setSaveOffline} label="Save documents on phone for offline use" />
            </View>
          </View>

          <Text style={styles.footer}>Digital India · Saved on this phone · Ministry of Tribal Affairs</Text>
        </View>
      </ScrollView>

      {/* Sticky sync */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomInner}>
          {result && <Text style={styles.result}>{result}</Text>}
          <Pressable
            accessibilityRole="button"
            disabled={syncing}
            onPress={trySync}
            style={({ pressed }) => [styles.syncBtn, pressed && { opacity: 0.9 }]}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="refresh" size={r.s(20)} color="#FFFFFF" />
            )}
            <Text style={styles.syncText}>
              {syncing ? 'Syncing… / ' : 'Try syncing now / '}
              <Hi style={styles.syncText}>{syncing ? 'सिंक हो रहा है' : 'अभी सिंक करें'}</Hi>
            </Text>
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
    scroll: { paddingBottom: s(24) },

    header: { backgroundColor: DARK, borderBottomLeftRadius: s(26), borderBottomRightRadius: s(26), paddingBottom: s(48) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    backBtn: { width: s(24), alignItems: 'flex-start' },
    title: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(23), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(16), color: '#B7C6E0' },
    offlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: s(28), paddingHorizontal: s(11), borderRadius: s(14), backgroundColor: '#EBEDF2' },
    offlinePillText: { fontFamily: fontFamily.medium, fontSize: fs(12), color: '#364150' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },

    // ---- offline hero card (PDF: 377x268, overlaps the header)
    hero: { ...card, marginTop: -s(32), borderRadius: s(22), alignItems: 'center', paddingHorizontal: s(20), paddingTop: s(18), paddingBottom: s(14) },
    heroArt: { width: '100%', height: s(96) },
    heroTitle: { fontFamily: fontFamily.bold, fontSize: fs(18), lineHeight: fs(24), color: INK, textAlign: 'center', marginTop: s(14) },
    heroTitleHi: { fontFamily: fontFamily.hindiSemibold, fontSize: fs(18), color: NAVY },
    heroBody: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(21), color: MUTED, textAlign: 'center', marginTop: s(6) },
    heroRule: { alignSelf: 'stretch', height: 1, backgroundColor: '#EEF1F5', marginVertical: s(14) },
    synced: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    syncedText: { fontFamily: fontFamily.regular, fontSize: fs(12), color: MUTED },

    sectionTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK, marginTop: s(22), marginBottom: s(10) },
    sectionHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(11), color: MUTED },
    card: { ...card, overflow: 'hidden' },

    // ---- queue (PDF: 40pt round tiles, 27pt Queued pills)
    qRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingHorizontal: s(15), paddingVertical: s(15) },
    qBorder: { borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    qTile: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#E8EDF6', alignItems: 'center', justifyContent: 'center' },
    qTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(19), color: INK },
    qSub: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginTop: 2 },
    queued: { height: s(27), justifyContent: 'center', paddingHorizontal: s(12), borderRadius: s(14), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#EBEDF2' },
    queuedText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: '#364150' },
    qFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: s(15), paddingVertical: s(12), backgroundColor: '#F9F9FB', borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    qFootText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(12), color: MUTED },

    works: { paddingHorizontal: s(15), paddingVertical: s(8) },
    workRow: { flexDirection: 'row', alignItems: 'center', gap: s(11), minHeight: s(33), marginVertical: s(4) },
    tick: { width: s(16), height: s(16), borderRadius: s(8), backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
    workText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(14), lineHeight: fs(19), color: INK },

    // ---- SMS card (PDF: blue-tinted with a white circle icon and a mono chip)
    sms: { marginTop: s(16), padding: s(16), borderRadius: s(18), borderWidth: 1.5, borderColor: '#C9D6EC', backgroundColor: '#E8EDF6' },
    smsTop: { flexDirection: 'row', alignItems: 'flex-start', gap: s(13) },
    smsIcon: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    smsTitle: { fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(20), color: INK },
    smsBody: { fontFamily: fontFamily.regular, fontSize: fs(13), lineHeight: fs(19), color: INK, marginTop: 4 },
    smsBold: { fontFamily: fontFamily.bold, color: NAVY },
    smsChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: s(10), marginTop: s(12), marginLeft: s(53), paddingHorizontal: s(13), paddingVertical: s(8), borderRadius: s(10), borderWidth: 1, borderColor: '#E1E4EB', backgroundColor: '#FFFFFF' },
    smsChipText: { fontFamily: mono, fontWeight: '700', fontSize: fs(12), color: NAVY },

    setRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingHorizontal: s(15), paddingVertical: s(15) },
    setBorder: { borderTopWidth: 1, borderTopColor: '#EEF1F5' },
    setTitle: { fontFamily: fontFamily.regular, fontSize: fs(14), lineHeight: fs(19), color: INK },
    setSub: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), lineHeight: fs(17), color: MUTED, marginTop: 2 },

    footer: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: '#7A889B', textAlign: 'center', marginTop: s(20) },

    bottom: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E4EB', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    bottomInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad, paddingTop: s(12) },
    result: { fontFamily: fontFamily.medium, fontSize: fs(11), lineHeight: fs(16), color: '#AF6000', textAlign: 'center', marginBottom: s(8) },
    syncBtn: { minHeight: s(52), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), borderRadius: s(14), backgroundColor: ORANGE, paddingHorizontal: s(14), paddingVertical: s(8) },
    syncText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(15), lineHeight: fs(20), color: '#FFFFFF', textAlign: 'center' },
  });
};
