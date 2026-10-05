import React from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { fontFamily } from '../theme/typography';
import { ViewportContext } from '../theme/responsive';

// Web only. On a desktop browser the app is shown inside a phone-sized frame (390 x ~844), so it looks like the mobile
// app. On a real phone (or any narrow / short window) nothing is wrapped: the app fills the screen and the responsive
// system fits it to the device width. Native builds are never wrapped.
const FRAME_W = 390;
const MAX_FRAME_H = 844;
const WIDE = 600; // wider than this = desktop / tablet landscape
const TALL = 520; // shorter than this = phone in landscape, keep full-screen
const BEZEL = 11;

export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const win = useWindowDimensions();
  if (Platform.OS !== 'web' || win.width <= WIDE || win.height < TALL) return <>{children}</>;

  const frameH = Math.min(MAX_FRAME_H, win.height - 2 * BEZEL - 64);
  return (
    <View style={styles.stage}>
      <View style={[styles.bezel, { width: FRAME_W + 2 * BEZEL, height: frameH + 2 * BEZEL }]}>
        <View style={[styles.screen, { width: FRAME_W, height: frameH }]}>
          <ViewportContext.Provider value={{ width: FRAME_W, height: frameH }}>{children}</ViewportContext.Provider>
        </View>
      </View>
      <Text style={styles.caption}>ANVAY · Ministry of Tribal Affairs · Best experienced on your phone</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EBF4',
    // soft background so the frame stands out on a large screen
    ...(Platform.OS === 'web' ? ({ backgroundImage: 'radial-gradient(circle at 20% 10%, #F4F7FC 0%, #DDE4F0 70%)' } as object) : null),
  },
  bezel: {
    borderRadius: 46,
    backgroundColor: '#0F1725',
    padding: BEZEL,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 30px 70px rgba(20,35,70,0.35), 0 6px 18px rgba(20,35,70,0.25)' } as object) : null),
  },
  screen: {
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  caption: {
    marginTop: 16,
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: '#5E6B79',
    textAlign: 'center',
  },
});
