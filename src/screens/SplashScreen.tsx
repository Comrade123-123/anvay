import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { fontFamily, useViewport } from '../theme';

// Port of anvay_splash_screen.dart: scene is designed on a 300 x 600 canvas
// and scaled with "cover" semantics to fill any screen. ~5.6 s, then hands off.
const CW = 300;
const CH = 600;
const TOTAL = 5.6;
const FADE_OUT_MS = 350;

const NAVY = '#13294B';
const NAVY_MID = '#1B3A6B';
const NAVY_DEEP = '#0F2240';
const SAFFRON = '#E8772E';
const GOLD = '#F2C14E';
const LEAF_GREEN = '#6FBF73';
const HINDI_GOLD = '#F4B77A';

// Flutter curve equivalents
const easeOut = Easing.bezier(0, 0, 0.58, 1);
const easeInOut = Easing.bezier(0.42, 0, 0.58, 1);
const easeOutCubic = Easing.bezier(0.215, 0.61, 0.355, 1);
const easeOutBack = Easing.bezier(0.175, 0.885, 0.32, 1.275);

type Ease = (x: number) => number;
const prog = (t: number, start: number, dur: number, curve: Ease = easeOut) =>
  curve(Math.min(1, Math.max(0, (t - start) / dur)));

// Book outline as segments so a partial stroke can be drawn (dash-based).
const BOOK_D = 'M38 90 Q54 82 70 90 Q86 82 102 90 L102 98 Q86 90 70 98 Q54 90 38 98 Z';
const quadLen = (p0: number[], p1: number[], p2: number[]) => {
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= 24; i++) {
    const u = i / 24;
    const x = (1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * p1[0] + u ** 2 * p2[0];
    const y = (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * p1[1] + u ** 2 * p2[1];
    len += Math.hypot(x - prev[0], y - prev[1]);
    prev = [x, y];
  }
  return len;
};
const BOOK_LEN =
  quadLen([38, 90], [54, 82], [70, 90]) +
  quadLen([70, 90], [86, 82], [102, 90]) +
  8 +
  quadLen([102, 98], [86, 90], [70, 98]) +
  quadLen([70, 98], [54, 90], [38, 98]) +
  8;
const STEM_LEN = 36;
const RING_LEN = 2 * Math.PI * 52;

const LEFT_LEAF = 'M70 70 Q54 68 50 52 Q66 52 70 70 Z';
const RIGHT_LEAF = 'M70 62 Q84 58 90 42 Q74 42 70 62 Z';

function Art({ t, sway, ripple }: { t: number; sway: number; ripple: number }) {
  const ringP = prog(t, 0.5, 1.0);
  const bookP = prog(t, 0.9, 0.7);
  const stemP = prog(t, 1.4, 0.4);
  const leftS = prog(t, 1.7, 0.5, easeOutBack);
  const rightS = prog(t, 1.85, 0.5, easeOutBack);
  const barShow = prog(t, 3.1, 0.4);
  const barFill = prog(t, 3.2, 1.8, easeInOut);
  const hillRise = prog(t, 0, 0.9, easeOutCubic);
  const armsP = prog(t, 3.4, 0.5);
  const swayIn = prog(t, 3.4, 0.4);

  return (
    <Svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`}>
      {/* Ripples */}
      {[0, 0.5].map((phase) => {
        const r = (ripple + phase) % 1;
        return (
          <Circle
            key={phase}
            cx={150}
            cy={170}
            r={70 * (0.9 + r)}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1}
            strokeOpacity={0.16 * (1 - r)}
          />
        );
      })}

      {/* Logo */}
      <G transform="translate(80 100)">
        {ringP > 0 && (
          <Circle
            cx={70}
            cy={70}
            r={52}
            fill="none"
            stroke={SAFFRON}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={[RING_LEN, RING_LEN]}
            strokeDashoffset={RING_LEN * (1 - ringP)}
            transform="rotate(-90 70 70)"
          />
        )}
        {Array.from({ length: 12 }, (_, i) => {
          const s = prog(t, 1.5 + i * 0.05, 0.3);
          if (s <= 0) return null;
          const a = -Math.PI / 2 + (i * Math.PI) / 6;
          return <Circle key={i} cx={70 + Math.cos(a) * 62} cy={70 + Math.sin(a) * 62} r={2 * s} fill={GOLD} />;
        })}
        {bookP > 0 && (
          <Path
            d={BOOK_D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={[BOOK_LEN, BOOK_LEN]}
            strokeDashoffset={BOOK_LEN * (1 - bookP)}
          />
        )}
        {stemP > 0 && (
          <Path
            d="M70 90 L70 54"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={[STEM_LEN, STEM_LEN]}
            strokeDashoffset={STEM_LEN * (1 - stemP)}
          />
        )}
        {leftS > 0 && <Path d={LEFT_LEAF} fill={LEAF_GREEN} transform={`translate(70 70) scale(${leftS}) translate(-70 -70)`} />}
        {rightS > 0 && <Path d={RIGHT_LEAF} fill={GOLD} transform={`translate(70 62) scale(${rightS}) translate(-70 -62)`} />}
      </G>

      {/* Progress bar (caption is a Text overlay) */}
      {barShow > 0 && (
        <>
          <Rect x={90} y={396} width={120} height={3} rx={2} fill="#FFFFFF" fillOpacity={0.14 * barShow} />
          {barFill > 0 && <Rect x={90} y={396} width={120 * barFill} height={3} rx={2} fill={SAFFRON} />}
        </>
      )}

      {/* Hills */}
      <G transform={`translate(0 ${430 + 90 * (1 - hillRise)})`}>
        <Path d="M0 90 Q60 50 120 80 Q190 40 300 75 L300 170 L0 170 Z" fill={NAVY_MID} />
        <G fill={NAVY_DEEP}>
          <Path d="M42 58 L32 84 L52 84 Z" />
          <Rect x={41} y={84} width={2} height={6} />
          <Path d="M58 66 L50 86 L66 86 Z" />
          <Path d="M248 52 L238 76 L258 76 Z" />
          <Rect x={247} y={76} width={2} height={6} />
          <Path d="M264 62 L256 80 L272 80 Z" />
        </G>
        <Path d="M0 120 Q80 95 150 115 Q220 90 300 112 L300 170 L0 170 Z" fill={NAVY_DEEP} />

        {armsP > 0 && (
          <Line x1={104} y1={97} x2={196} y2={97} stroke="#FFFFFF" strokeOpacity={0.8 * armsP} strokeWidth={1.2} />
        )}
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 110 + i * 20;
          const pop = prog(t, 3.0 + i * 0.08, 0.4, easeOutBack);
          if (pop <= 0) return null;
          const phase = i % 2 === 0 ? sway : 1 - sway;
          const angle = (phase * 2 - 1) * 5 * swayIn;
          return (
            <G key={i} transform={`translate(${x} 118) rotate(${angle}) scale(${pop}) translate(${-x} -118)`} fill="#FFFFFF" fillOpacity={0.8}>
              <Circle cx={x} cy={88} r={3} />
              <Path d={`M${x - 5} 94 L${x + 5} 94 L${x} 101 Z M${x} 101 L${x - 5} 110 L${x + 5} 110 Z`} />
              <Line x1={x - 3} y1={110} x2={x - 5} y2={118} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1.2} strokeLinecap="round" />
              <Line x1={x + 3} y1={110} x2={x + 5} y2={118} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1.2} strokeLinecap="round" />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

const FadeUp = ({ t, start, dur, children }: { t: number; start: number; dur: number; children: React.ReactNode }) => {
  const v = prog(t, start, dur);
  return <View style={{ opacity: v, transform: [{ translateY: 10 * (1 - v) }] }}>{children}</View>;
};

type Props = { onFinish?: () => void };

export function SplashScreen({ onFinish }: Props) {
  const { width, height } = useViewport();
  const scale = Math.max(width / CW, height / CH); // BoxFit.cover
  const [t, setT] = useState(0);
  const [clock, setClock] = useState(0);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let raf = 0;
    let done = false;
    const t0 = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - t0) / 1000;
      setClock(elapsed);
      setT(Math.min(elapsed, TOTAL));
      if (elapsed >= TOTAL && !done) {
        done = true;
        Animated.timing(opacity, { toValue: 0, duration: FADE_OUT_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
          () => onFinish?.(),
        );
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFinish, opacity]);

  const swayRaw = (clock / 1.6) % 2;
  const sway = swayRaw <= 1 ? swayRaw : 2 - swayRaw;
  const ripple = (clock % 2.6) / 2.6;

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <View style={{ width: CW, height: CH, transform: [{ scale }] }}>
        <View style={StyleSheet.absoluteFill}>
          <Art t={t} sway={sway} ripple={ripple} />
        </View>

        {/* Tricolour strip */}
        <View style={styles.flag}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>

        {/* Wordmark, Hindi name, tagline */}
        <View style={styles.titleBlock}>
          <View style={styles.letters}>
            {'ANVAY'.split('').map((c, i) => (
              <FadeUp key={i} t={t} start={2.2 + i * 0.08} dur={0.45}>
                <Text style={styles.letter}>{c}</Text>
              </FadeUp>
            ))}
          </View>
          <View style={{ height: 2 }} />
          <FadeUp t={t} start={2.75} dur={0.5}>
            <Text style={styles.hindi}>अन्वय</Text>
          </FadeUp>
          <View style={{ height: 10 }} />
          <FadeUp t={t} start={2.95} dur={0.5}>
            <Text style={styles.tagline}>Every scholarship. One place.</Text>
          </FadeUp>
        </View>

        <Text style={[styles.loading, { opacity: prog(t, 3.1, 0.4) }]}>Loading your scholarships…</Text>

        <Text style={[styles.footer, { opacity: prog(t, 3.0, 0.6) }]}>
          {'Ministry of Tribal Affairs\nGovernment of India'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  flag: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, flexDirection: 'row' },
  titleBlock: { position: 'absolute', top: 254, left: 0, right: 0, alignItems: 'center' },
  letters: { flexDirection: 'row', justifyContent: 'center' },
  letter: { fontFamily: fontFamily.medium, fontSize: 30, color: '#FFFFFF', paddingHorizontal: 3.5 },
  hindi: { fontFamily: fontFamily.hindiRegular, fontSize: 16, color: HINDI_GOLD },
  tagline: { fontFamily: fontFamily.regular, fontSize: 12.5, letterSpacing: 0.3, color: 'rgba(255,255,255,0.72)' },
  loading: {
    position: 'absolute',
    top: 406,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.55)',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 10.5,
    lineHeight: 15.75,
    color: 'rgba(255,255,255,0.5)',
  },
});
