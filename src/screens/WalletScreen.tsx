import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';
import { useToast } from '../components/Toast';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';
import { LoadState } from '../components/LoadState';
import { api, ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import { pickFile } from '../api/pickFile';
import type { WalletDoc } from '../api/types';

// Screen 9 of ANVAY_ka_kaam.pdf (Document Wallet). Documents come from /api/documents; uploads go to private storage.
// Sizes and icon sizes follow the PDF's drawing data on its 390pt frame: 44pt document tiles with 22pt icons,
// a 40pt vault tile with a 20pt icon, 20pt chevrons, 22pt header back arrow, 32pt bell button.
const NAVY = colors.primary;
const DARK = colors.primaryDark;
const ORANGE = colors.accent;
const MUTED = '#546075';

type IconName = React.ComponentProps<typeof Icon>['name'];

const Hi = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fontFamily.hindiRegular }, style]}>{children}</Text>
);

const kindIcon: Record<string, IconName> = {
  aadhaar: 'fingerprint',
  st_caste: 'badge-account-horizontal-outline',
  income: 'cash-multiple',
  residence: 'map-marker-outline',
  marksheet: 'school-outline',
  bonafide: 'file-document-outline',
  admission: 'clipboard-text-outline',
};

const UPLOADABLE: { kind: string; en: string }[] = [
  { kind: 'aadhaar', en: 'Aadhaar Card' },
  { kind: 'st_caste', en: 'ST Caste Certificate' },
  { kind: 'income', en: 'Annual Income Certificate' },
  { kind: 'residence', en: 'Permanent Resident Certificate' },
  { kind: 'marksheet', en: 'Class 10 & 12 Marksheets' },
  { kind: 'bonafide', en: 'Bonafide Student Certificate' },
  { kind: 'admission', en: 'Admission Letter' },
];

const AMBER = '#896000';
const RED = '#C62828';

type Filter = 'all' | 'verified' | 'attention';
const FILTER_LABEL: Record<Filter, string> = { all: 'All documents', verified: 'Verified', attention: 'Needs action' };
const NEXT_FILTER: Record<Filter, Filter> = { all: 'verified', verified: 'attention', attention: 'all' };

type Props = { onBack?: () => void; onTabSelect?: (key: TabKey) => void; onNotifications?: () => void };

export function WalletScreen({ onBack, onTabSelect, onNotifications }: Props) {
  const toast = useToast();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lang, setLang] = useState<'hi' | 'en'>('en');
  const { data, error, reload } = useApi<WalletDoc[]>('/documents');
  const [fetching, setFetching] = useState(false);
  const [synced, setSynced] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [chooser, setChooser] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  if (!data) return <LoadState error={error} onRetry={reload} label="Opening your wallet…" />;

  const verifiedCount = data.filter((d) => d.status === 'verified').length;
  const visible = data.filter((d) => (filter === 'all' ? true : filter === 'verified' ? d.status === 'verified' : d.status !== 'verified'));

  // Asks DigiLocker (simulated) to refresh the documents it issued.
  const fetchDocs = async () => {
    if (fetching) return;
    setFetching(true);
    setSynced(false);
    try {
      const res = await api.post<{ refreshed: number; needAttention: number }>('/documents/sync');
      await reload();
      setSynced(true);
      toast(res.needAttention ? `${res.refreshed} documents refreshed. ${res.needAttention} still need your action.` : `${res.refreshed} documents refreshed from DigiLocker.`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not reach DigiLocker.');
    } finally {
      setFetching(false);
    }
  };

  const upload = async (kind: string) => {
    if (uploading) return;
    setChooser(false);
    try {
      const file = await pickFile();
      if (!file) return;
      setUploading(kind);
      const res = await api.post<{ status: string; problems: string[] }>('/documents/upload', { kind, fileName: file.name, contentType: file.type, dataBase64: file.base64 });
      await reload();
      toast(res.status === 'verified' ? 'Document uploaded and verified.' : `Document was not accepted${res.problems.length ? `: ${res.problems.join(', ')}` : ''}. Please upload a clearer copy.`);
    } catch (e) {
      toast(e instanceof ApiError || e instanceof Error ? e.message : 'Could not upload the document.');
    } finally {
      setUploading(null);
    }
  };

  const openDoc = (d: WalletDoc) => {
    if (d.status === 'verified') toast(`${d.title}: verified${d.verifiedOn ? ` on ${d.verifiedOn}` : ''}${d.expiresOn ? `, valid till ${d.expiresOn}` : ''}.`);
    else upload(d.kind);
  };

  const chev = r.s(20);

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
                <Icon name="arrow-left" size={r.s(22)} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.title} numberOfLines={2}>
                Document Wallet <Hi style={styles.titleHi}>/ दस्तावेज़</Hi>
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change language" hitSlop={10}
                onPress={() => setLang(lang === 'en' ? 'hi' : 'en')}
                style={styles.langBtn}
              >
                <Hi style={[styles.langText, { color: '#FF9933' }]}>अ</Hi>
                <Text style={styles.langText}> / A</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onNotifications} style={styles.bell}>
                <Icon name="bell-outline" size={r.s(18)} color="#FFFFFF" />
                <View style={styles.bellDot} />
              </Pressable>
            </View>
            <View style={styles.headerRule} />
            <View style={styles.ministryRow}>
              <Icon name="bank" size={r.s(14)} color="#FF9933" />
              <Text style={styles.ministry} numberOfLines={2}>
                <Hi style={styles.ministry}>जनजातीय कार्य मंत्रालय</Hi> | MoTA (Govt. of India)
              </Text>
              <View style={styles.synced}>
                <View style={styles.syncedDot} />
                <Text style={styles.syncedText}>DIGILOCKER SYNCED</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          {/* Vault summary */}
          <View style={styles.vault}>
            <View style={styles.vaultTop}>
              <View style={styles.vaultTile}>
                <Icon name="shield-check" size={r.s(22)} color={DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.vaultTitleRow}>
                  <Text style={styles.vaultTitle}>DigiLocker & APAAR Verified Vault</Text>
                  <View style={styles.attested}>
                    <Icon name="check-circle" size={r.s(13)} color={colors.success} />
                    <Text style={styles.attestedText}>Attested</Text>
                  </View>
                </View>
                <Text style={styles.vaultBody}>
                  Cryptographically anchored via UIDAI Aadhaar Vault & National Academic Depository (NAD).
                </Text>
              </View>
            </View>
            <View style={styles.rule} />
            <View style={styles.vaultFoot}>
              <View style={styles.vaultFootLeft}>
                <Icon name="shield-outline" size={r.s(13)} color={ORANGE} />
                <Text style={styles.vaultFootText}>256-Bit SHA Encrypted</Text>
              </View>
              <Text style={styles.vaultFootRight}>{verifiedCount} of {data.length} Documents Verified</Text>
            </View>
          </View>

          {/* Section label */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>
              VERIFIED CREDENTIALS / <Hi style={styles.sectionLabel}>प्रमाण पत्र</Hi>
            </Text>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setFilter(NEXT_FILTER[filter])} style={styles.filterBtn}>
              <Text style={styles.filterText}>{FILTER_LABEL[filter]}</Text>
              <Icon name="menu-down" size={r.s(16)} color={DARK} />
            </Pressable>
          </View>

          {/* Credentials */}
          {visible.length === 0 && <Text style={[styles.docIssuer, { textAlign: 'center', marginVertical: r.s(16) }]}>No documents in this view.</Text>}
          {visible.map((d) => {
            const ok = d.status === 'verified';
            const busy = uploading === d.kind;
            return (
              <Pressable key={d.id} accessibilityRole="button" onPress={() => openDoc(d)} style={({ pressed }) => [styles.doc, !ok && { borderColor: '#F4C1C6' }, pressed && { opacity: 0.9 }]}>
                <View style={styles.docTile}>
                  <Icon name={kindIcon[d.kind] ?? 'file-document-outline'} size={r.s(22)} color={ok ? DARK : RED} />
                </View>
                <View style={styles.docBody}>
                  <Text style={styles.docTitle}>
                    {d.title}
                    {d.titleHi ? <Hi style={styles.docHi}> / {d.titleHi}</Hi> : null}
                  </Text>
                  <View style={styles.verified}>
                    {busy ? <ActivityIndicator size="small" color={NAVY} /> : <Icon name={ok ? 'check-circle' : 'alert-circle-outline'} size={r.s(12)} color={ok ? '#138708' : d.status === 'pending' ? AMBER : RED} />}
                    <Text style={[styles.verifiedText, !ok && { color: d.status === 'pending' ? AMBER : RED }]}>
                      {busy
                        ? 'Uploading…'
                        : ok
                          ? d.issuer === 'Uploaded by student' ? 'Uploaded and verified' : 'Verified via DigiLocker'
                          : d.status === 'pending' ? 'Verification pending' : `Needs re-upload${d.problems.length ? ` · ${d.problems.join(', ')}` : ''}`}
                    </Text>
                  </View>
                  {!!d.issuer && d.issuer !== 'Uploaded by student' && <Text style={styles.docIssuer}>Issued by {d.issuer}</Text>}
                </View>
                <Icon name={ok ? 'chevron-right' : 'upload'} size={chev} color={ok ? '#697585' : RED} />
              </Pressable>
            );
          })}

          {/* Actions */}
          <Pressable
            accessibilityRole="button"
            onPress={fetchDocs}
            style={({ pressed }) => [styles.fetchBtn, pressed && { opacity: 0.85 }]}
          >
            {fetching ? (
              <ActivityIndicator size="small" color={NAVY} />
            ) : (
              <Icon name={synced ? 'check-circle-outline' : 'cloud-download-outline'} size={r.s(20)} color={NAVY} />
            )}
            <Text style={styles.fetchText}>
              {fetching ? 'Fetching… / ' : synced ? 'Synced just now / ' : 'Fetch from DigiLocker / '}
              <Hi style={styles.fetchText}>{fetching ? 'लाया जा रहा है' : synced ? 'अभी सिंक हुआ' : 'डिजीलॉकर से लाएं'}</Hi>
            </Text>
            <View style={styles.instant}>
              <Text style={styles.instantText}>INSTANT</Text>
            </View>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => setChooser((v) => !v)} style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="plus-circle-outline" size={r.s(20)} color="#FFFFFF" />
            <Text style={styles.uploadText}>
              Upload Certificate / <Hi style={styles.uploadText}>नया दस्तावेज़ अपलोड करें</Hi>
            </Text>
          </Pressable>
          {chooser && (
            <View style={[styles.doc, { flexDirection: 'column', alignItems: 'stretch', gap: r.s(2) }]}>
              <Text style={[styles.docIssuer, { marginBottom: r.s(6) }]}>Which document are you uploading? (JPG, PNG or PDF, up to 2 MB)</Text>
              {UPLOADABLE.map((u) => (
                <Pressable key={u.kind} accessibilityRole="button" onPress={() => upload(u.kind)} style={{ paddingVertical: r.s(10), flexDirection: 'row', alignItems: 'center', gap: r.s(10) }}>
                  <Icon name={kindIcon[u.kind]} size={r.s(18)} color={DARK} />
                  <Text style={styles.docTitle}>{u.en}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Icon name="lock-outline" size={r.s(13)} color={colors.indiaGreen} />
              <Text style={styles.footerStrong}>Secured via National Informatics Centre (NIC) & MeitY</Text>
            </View>
            <Text style={styles.footerSmall}>
              All documents digitally encrypted under IT Act 2000. Verified for National Tribal Fellowship & Scholarship
              Schemes.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="wallet" onSelect={onTabSelect} />
    </View>
  );
}

const makeStyles = (r: Responsive) => {
  const { s, fs } = r;
  const pad = s(16);
  const card = { backgroundColor: '#FFFFFF', borderRadius: s(16), borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: s(24) },

    // ---- header (PDF: 19pt title, 28pt lang pill, 32pt bell, 23pt status pill)
    header: { backgroundColor: DARK, paddingBottom: s(11) },
    tricolor: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
    headerInner: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
    backBtn: { width: s(24), alignItems: 'flex-start' },
    title: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fs(19), lineHeight: fs(25), color: '#FFFFFF' },
    titleHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(13), color: '#B9CBEA' },
    langBtn: { flexDirection: 'row', alignItems: 'center', height: s(28), paddingHorizontal: s(11), borderRadius: s(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.08)' },
    langText: { fontFamily: fontFamily.bold, fontSize: fs(11), color: '#FFFFFF' },
    bell: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    bellDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE, borderWidth: 1, borderColor: DARK },
    headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: s(10) },
    ministryRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(9) },
    ministry: { flex: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: '#FFFFFF' },
    synced: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: s(12), borderWidth: 1, borderColor: '#138708', backgroundColor: 'rgba(19,135,8,0.28)', paddingHorizontal: s(10), paddingVertical: s(4) },
    syncedDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#49DD80' },
    syncedText: { fontFamily: fontFamily.semibold, fontSize: fs(10), letterSpacing: 0.3, color: '#49DD80' },

    column: { width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: pad },
    rule: { height: 1, backgroundColor: colors.border, marginVertical: s(12) },

    // ---- vault card (PDF: 358x138, 40pt tile)
    vault: { ...card, marginTop: s(13), padding: s(15) },
    vaultTop: { flexDirection: 'row', gap: s(12) },
    vaultTile: { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    vaultTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(8) },
    vaultTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fs(14), lineHeight: fs(18), color: DARK },
    attested: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
    attestedText: { fontFamily: fontFamily.semibold, fontSize: fs(11), color: colors.success },
    vaultBody: { fontFamily: fontFamily.regular, fontSize: fs(12), lineHeight: fs(16), color: MUTED, marginTop: 4 },
    vaultFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: s(10), rowGap: 4 },
    vaultFootLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    vaultFootText: { fontFamily: fontFamily.medium, fontSize: fs(11), color: DARK },
    vaultFootRight: { fontFamily: fontFamily.regular, fontSize: fs(11), color: '#697585' },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10), marginTop: s(20), marginBottom: s(14) },
    sectionLabel: { flexShrink: 1, fontFamily: fontFamily.bold, fontSize: fs(11), letterSpacing: 0.5, color: MUTED },
    filterBtn: { flexDirection: 'row', alignItems: 'center' },
    filterText: { fontFamily: fontFamily.bold, fontSize: fs(12), color: DARK },

    // ---- credential rows (PDF: 358x95 cards, 44pt tile, 23pt chip, 6x10 chevron)
    doc: { ...card, flexDirection: 'row', alignItems: 'center', gap: s(12), minHeight: s(95), marginBottom: s(10), paddingHorizontal: s(15), paddingVertical: s(14) },
    docTile: { width: s(44), height: s(44), borderRadius: s(10), backgroundColor: colors.surfaceTint, borderWidth: 1, borderColor: '#D4E1F2', alignItems: 'center', justifyContent: 'center' },
    docBody: { flex: 1, minWidth: 0 },
    docTitle: { fontFamily: fontFamily.bold, fontSize: fs(13), lineHeight: fs(19), color: DARK },
    docHi: { fontFamily: fontFamily.hindiRegular, fontSize: fs(12), color: MUTED },
    verified: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, height: s(23), marginTop: 4, borderRadius: s(12), borderWidth: 1, borderColor: '#CDE9D6', backgroundColor: '#E6F4E9', paddingHorizontal: s(10) },
    verifiedText: { fontFamily: fontFamily.semibold, fontSize: fs(10), color: '#138708' },
    docIssuer: { fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(16), color: MUTED, marginTop: 4 },

    // ---- actions (PDF: 63pt outlined fetch button with 2pt navy border, 40pt orange upload)
    fetchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), minHeight: s(63), marginTop: s(4), borderRadius: s(14), borderWidth: 2, borderColor: DARK, backgroundColor: '#FFFFFF', paddingHorizontal: s(14), paddingVertical: s(8) },
    fetchText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(13), lineHeight: fs(19), color: DARK, textAlign: 'center' },
    instant: { borderRadius: 4, backgroundColor: '#E8EDF6', paddingHorizontal: s(7), paddingVertical: s(3) },
    instantText: { fontFamily: fontFamily.bold, fontSize: fs(10), letterSpacing: 0.5, color: DARK },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(10), minHeight: s(40), marginTop: s(8), borderRadius: s(12), backgroundColor: ORANGE, paddingHorizontal: s(14), paddingVertical: s(8) },
    uploadText: { flexShrink: 1, fontFamily: fontFamily.semibold, fontSize: fs(13), lineHeight: fs(18), color: '#FFFFFF', textAlign: 'center' },

    footer: { alignItems: 'center', marginTop: s(22), paddingHorizontal: s(8), gap: s(4) },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    footerStrong: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: fs(11), lineHeight: fs(15), color: MUTED, textAlign: 'center' },
    footerSmall: { fontFamily: fontFamily.regular, fontSize: fs(10), lineHeight: fs(14), color: '#8C97A8', textAlign: 'center' },
  });
};
