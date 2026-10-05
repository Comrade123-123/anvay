import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

// Vector redraw of the welcome-screen illustration (girl cycling home).
// The PDF only contains a 200x200 raster of it, which blurs when scaled, so this stays sharp at any size.
// Drawn on a 200 x 150 canvas and scaled with "cover" semantics.
const triangles = Array.from({ length: 16 }, (_, i) => 6 + i * 12.5);

export function OnboardingIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">
      {/* Sky and sun */}
      <Rect width={200} height={150} fill="#E4ECF6" />
      <Circle cx={154} cy={38} r={24} fill="#F8C9A0" fillOpacity={0.3} />
      <Circle cx={154} cy={38} r={16} fill="#F9A64C" />

      {/* Far hills */}
      <Path d="M0 84 Q40 68 100 76 Q160 82 200 90 L200 104 L0 104 Z" fill="#CBDDD9" />
      <Path d="M0 90 Q50 80 100 88 Q150 96 200 92 L200 104 L0 104 Z" fill="#A9CBC0" />

      {/* Back tree (left) */}
      <Rect x={28} y={72} width={3} height={28} fill="#5A3E2D" />
      <Ellipse cx={28} cy={50} rx={14} ry={25} fill="#3A8F3E" />
      <Rect x={45} y={76} width={2.6} height={24} fill="#5A3E2D" />
      <Ellipse cx={46.5} cy={57} rx={12} ry={21} fill="#1E6A22" />

      {/* House */}
      <Rect x={134} y={72} width={46} height={30} fill="#C08560" />
      <Polygon points="127,72 160,50 181,68 181,72" fill="#B45F38" />
      <Path d="M127 72 L160 50 L181 68" fill="none" stroke="#F3E4D8" strokeWidth={1} strokeLinejoin="round" />
      <Rect x={140} y={78} width={9} height={9} fill="#F4EDE6" />
      <Line x1={144.5} y1={78} x2={144.5} y2={87} stroke="#B45F38" strokeWidth={0.8} />
      <Line x1={140} y1={82.5} x2={149} y2={82.5} stroke="#B45F38" strokeWidth={0.8} />
      <Rect x={152} y={81} width={11} height={21} fill="#4E2E20" />
      <G fill="#F4E6D6">
        <Rect x={141} y={91} width={2.2} height={1.6} />
        <Rect x={145} y={91} width={2.2} height={1.6} />
        <Rect x={149} y={91} width={2.2} height={1.6} />
        <Rect x={170} y={93} width={2.2} height={1.6} />
        <Rect x={174} y={93} width={2.2} height={1.6} />
        <Rect x={178} y={93} width={2.2} height={1.6} />
      </G>
      <Ellipse cx={173} cy={82} rx={3.6} ry={1.6} fill="#FFFFFF" transform="rotate(-20 173 82)" />
      <Path d="M170 85 Q167 90 166 93" stroke="#F4E6D6" strokeWidth={0.8} fill="none" strokeLinecap="round" />

      {/* Right tree */}
      <Rect x={184} y={80} width={3.4} height={30} fill="#4F3526" />
      <Ellipse cx={182} cy={62} rx={12} ry={21} fill="#2E7D32" />

      {/* Ground */}
      <Rect x={0} y={100} width={200} height={50} fill="#D9713A" />
      <Path d="M0 114 Q60 106 130 112 Q170 116 200 110 L200 150 L0 150 Z" fill="#CE6532" />
      <Path d="M0 127 Q70 120 140 126 Q175 129 200 124 L200 150 L0 150 Z" fill="#C55A28" />
      <Path d="M0 139 Q80 133 200 137 L200 150 L0 150 Z" fill="#B94F20" />

      {/* Woven border strip */}
      <Rect x={0} y={143} width={200} height={7} fill="#14284B" />
      {triangles.map((x) => (
        <Polygon key={x} points={`${x - 1.6},149 ${x},144.5 ${x + 1.6},149`} fill="#E8772E" />
      ))}

      {/* Cyclist */}
      <Ellipse cx={92} cy={126} rx={22} ry={2.4} fill="#5A2A12" fillOpacity={0.35} />
      <G fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={76} cy={117} r={10} stroke="#3A2A2A" strokeWidth={1.4} />
        <Circle cx={109} cy={117} r={10} stroke="#3A2A2A" strokeWidth={1.4} />
        <Circle cx={76} cy={117} r={9} stroke="#F2A56A" strokeWidth={0.3} />
        <Circle cx={109} cy={117} r={9} stroke="#F2A56A" strokeWidth={0.3} />
        <Path d="M76 117 L88 106 L100 108 L109 117 M88 106 L86 117 L76 117 M86 117 L100 108" stroke="#2A2A32" strokeWidth={1.1} />
        <Path d="M89 103 L86 116" stroke="#1E3A6B" strokeWidth={2.4} />
        <Path d="M89 103 L100 111" stroke="#1E3A6B" strokeWidth={2.4} />
        <Path d="M94 95 L102 99" stroke="#2A2A32" strokeWidth={1.4} />
      </G>
      <Rect x={82} y={93} width={5} height={10} rx={1} fill="#E8772E" />
      <Path d="M85 93 L94 93 L93 104 L85 104 Z" fill="#FFFFFF" />
      <Path d="M100 98 L107 97 L108 108 L102 108 Z" fill="#2A2A32" />
      <Circle cx={90} cy={87} r={4.2} fill="#2A1A18" />
      <Circle cx={91.2} cy={88.2} r={2.6} fill="#8A5238" />
    </Svg>
  );
}
