import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, fontFamily, Responsive, useResponsive } from '../theme';

export type TabKey = 'home' | 'schemes' | 'wallet' | 'journey' | 'profile';

const TABS: { key: TabKey; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'home', label: 'Home', icon: 'home-variant' },
  { key: 'schemes', label: 'Schemes', icon: 'school' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
  { key: 'journey', label: 'Journey', icon: 'chart-line-variant' },
  { key: 'profile', label: 'Profile', icon: 'account-outline' },
];

type Props = { active: TabKey; onSelect?: (key: TabKey) => void };

// All five tabs share one equal-width column with icon and label centred, so nothing drifts on any width.
export function BottomTabBar({ active, onSelect }: Props) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(r), [r.width]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.inner}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onSelect?.(t.key)}
              style={styles.tab}
            >
              <View style={[styles.pill, isActive && styles.pillActive]}>
                <Icon name={t.icon} size={r.s(22)} color={isActive ? colors.primaryDark : '#5E6267'} />
                <Text numberOfLines={1} style={[styles.label, isActive && styles.labelActive]}>
                  {t.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (r: Responsive) =>
  StyleSheet.create({
    bar: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: colors.border },
    inner: { flexDirection: 'row', width: '100%', maxWidth: r.maxContentWidth, alignSelf: 'center', paddingHorizontal: r.s(6), paddingTop: 6 },
    tab: { flex: 1, alignItems: 'center' },
    pill: { minWidth: r.s(60), paddingVertical: r.s(6), paddingHorizontal: r.s(8), borderRadius: r.s(10), alignItems: 'center', gap: 2 },
    pillActive: { backgroundColor: '#E8EFFD' },
    label: { fontFamily: fontFamily.regular, fontSize: r.fs(11), lineHeight: r.fs(14), color: '#5E6267' },
    labelActive: { fontFamily: fontFamily.bold, color: colors.primaryDark },
  });
