import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { fontFamily } from '../theme';
import { useOnline } from '../api/connectivity';
import { outbox } from '../api/outbox';
import { useToast } from './Toast';

// Shown on top of every screen while the server cannot be reached, and reports uploads of things saved offline.
export function OfflineBanner({ signedIn }: { signedIn: boolean }) {
  const online = useOnline();
  const toast = useToast();

  useEffect(
    () =>
      outbox.onFlushed((r) => {
        if (r.sent) toast(`${r.sent} saved ${r.sent === 1 ? 'item was' : 'items were'} uploaded.`);
        if (r.rejected.length) toast(`Not accepted: ${r.rejected[0]}`);
      }),
    [toast],
  );

  // Send anything saved earlier as soon as there is a signed-in student and a connection.
  useEffect(() => {
    if (signedIn && online) outbox.flush();
  }, [signedIn, online]);

  if (online) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert">
      <Icon name="cloud-off-outline" size={14} color="#3D2B00" />
      <Text style={styles.text}>You're offline. Showing saved information. Changes are sent when you're back online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFD97A', paddingHorizontal: 12, paddingVertical: 5 },
  text: { flexShrink: 1, fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 15, color: '#3D2B00', textAlign: 'center' },
});
