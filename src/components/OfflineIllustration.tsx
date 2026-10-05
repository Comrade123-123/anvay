import React from 'react';
import Svg, { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';

// Line-art "you're offline" scene (tree, house, phone with a crossed-out signal), redrawn as vector from the
// PDF. Drawn on a 300 x 96 canvas, stroke #1A3A6B, fill #E8EDF6.
const INK = '#1A3A6B';
const FILL = '#E8EDF6';

export function OfflineIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 96" preserveAspectRatio="xMidYMid meet">
      <G stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* ground with little grass ticks */}
        <Line x1={8} y1={90} x2={292} y2={90} />
        <Path d="M22 90 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" />
        <Path d="M240 90 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" />

        {/* tree */}
        <Line x1={44} y1={90} x2={44} y2={34} />
        <Path d="M44 66 L58 56" />
        <Path d="M44 54 L32 46" />
        <Circle cx={44} cy={20} r={10} fill={FILL} />
        <Circle cx={30} cy={38} r={9} fill={FILL} />
        <Circle cx={62} cy={34} r={9} fill={FILL} />
        <Circle cx={31} cy={56} r={8} fill={FILL} />
        <Circle cx={61} cy={52} r={8} fill={FILL} />

        {/* dotted arc */}
        <Path d="M80 44 Q96 36 112 44" strokeDasharray="1.5 3" strokeWidth={1.2} />

        {/* house */}
        <Polygon points="90,62 116,42 142,62" fill={FILL} />
        <Line x1={116} y1={42} x2={116} y2={62} />
        <Line x1={103} y1={62} x2={110} y2={50} />
        <Line x1={129} y1={62} x2={122} y2={50} />
        <Rect x={95} y={62} width={42} height={28} fill="#FFFFFF" />
        <Rect x={101} y={70} width={9} height={10} />
        <Line x1={105.5} y1={70} x2={105.5} y2={80} />
        <Path d="M120 90 L120 76 Q124 71 128 76 L128 90" fill={FILL} />

        {/* mound */}
        <Path d="M158 90 Q170 76 184 90" fill={FILL} />

        {/* phone */}
        <Rect x={200} y={6} width={44} height={84} rx={7} strokeWidth={2.4} fill="#FFFFFF" />
        <Rect x={206} y={14} width={32} height={62} rx={4} fill={FILL} />
        <Line x1={215} y1={10} x2={229} y2={10} />
        <Line x1={215} y1={83} x2={229} y2={83} />
        {/* crossed-out signal */}
        <Path d="M212 44 Q222 34 232 44" />
        <Path d="M216 49 Q222 43 228 49" />
        <Line x1={222} y1={52} x2={222} y2={66} strokeWidth={2.2} />
        <Line x1={211} y1={36} x2={233} y2={62} strokeWidth={2.2} />
      </G>
    </Svg>
  );
}
