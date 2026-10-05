import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

// Vector redraw of the Scheme Details hero (girl cycling past a boy with a bag, house, sun).
// The PDF only holds a 200x200 raster of it, which blurs when scaled, so this stays sharp at any size.
// Drawn on a 200 x 120 canvas and scaled with "cover" semantics (same crop as the reference).
const diamonds = Array.from({ length: 20 }, (_, i) => 5 + i * 10);
const dashes = Array.from({ length: 10 }, (_, i) => 2 + i * 21);

export function SchemeHeroIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
      {/* Sky, sun, hills */}
      <Rect width={200} height={100} fill="#E5EDF8" />
      <Circle cx={170} cy={23} r={13} fill="#F6E6B8" fillOpacity={0.8} />
      <Circle cx={170} cy={23} r={10} fill="#F2BC1A" />
      <Path d="M0 78 Q50 62 105 70 Q160 76 200 66 L200 98 L0 98 Z" fill="#CFE0DA" />
      <Path d="M0 86 Q40 80 90 86 Q140 92 200 84 L200 98 L0 98 Z" fill="#BFD6CD" />

      {/* Path and woven border */}
      <Rect x={0} y={97} width={200} height={20} fill="#F0D8C2" />
      {dashes.map((x) => (
        <Rect key={x} x={x} y={105} width={14} height={2.4} rx={1.2} fill="#F8C9A0" />
      ))}
      {dashes.map((x) => (
        <Rect key={`b${x}`} x={x + 8} y={110} width={14} height={2.4} rx={1.2} fill="#F8C9A0" />
      ))}
      <Rect x={0} y={115} width={200} height={5} fill="#0F2A55" />
      {diamonds.map((x) => (
        <Polygon key={x} points={`${x - 2},117.5 ${x},115.6 ${x + 2},117.5 ${x},119.4`} fill="#E8772E" />
      ))}

      {/* Trees */}
      <Rect x={30} y={62} width={3.6} height={36} fill="#6B4A3A" />
      <Ellipse cx={31.5} cy={43} rx={13.5} ry={23} fill="#3A8F3E" />
      <Rect x={48} y={68} width={3.4} height={30} fill="#5A3E2D" />
      <Ellipse cx={50} cy={51.5} rx={11} ry={18.5} fill="#1E6A28" />

      {/* House */}
      <Rect x={140} y={75} width={44} height={23} fill="#D49A72" />
      <Polygon points="137,75 162,57 187,75" fill="#C8592E" />
      <Circle cx={161.5} cy={68} r={2.6} fill="#F7E9DC" />
      <Rect x={155} y={82} width={10} height={16} fill="#5A3A2A" />
      <Rect x={145} y={80} width={7} height={6.5} fill="#F1E3D2" />
      <Rect x={143} y={90} width={3} height={1.6} fill="#F1E3D2" />
      <Rect x={174} y={90} width={3} height={1.6} fill="#F1E3D2" />

      {/* Girl on bicycle */}
      <Ellipse cx={82} cy={99} rx={16} ry={1.6} fill="#8A5A3A" fillOpacity={0.25} />
      <G fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={70} cy={91.5} r={8.8} stroke="#2F3A40" strokeWidth={1.1} />
        <Circle cx={94.5} cy={91.5} r={8.8} stroke="#2F3A40" strokeWidth={1.1} />
        <Path d="M70 91.5 L79 83 L88 84 L94.5 91.5 M79 83 L77 91.5 L70 91.5 M77 91.5 L88 84" stroke="#C9803E" strokeWidth={1} />
        <Path d="M81 80 L77 90" stroke="#1B2F5E" strokeWidth={2.2} />
        <Path d="M82 80 L88 86" stroke="#1B2F5E" strokeWidth={2.2} />
        <Path d="M85 75 L91 78" stroke="#2A2A30" strokeWidth={1.3} />
      </G>
      <Rect x={75} y={71} width={4} height={8} rx={1} fill="#E8772E" />
      <Path d="M79.5 74 L86.5 74 L85.5 82 L79.5 82 Z" fill="#FFFFFF" />
      <Circle cx={81} cy={66.5} r={3.4} fill="#2A1A18" />
      <Circle cx={82} cy={67.5} r={2.2} fill="#8A5238" />
      <Rect x={91} y={76} width={4} height={6} fill="#2A2A30" />

      {/* Boy with bag */}
      <Rect x={109} y={73} width={8} height={12} rx={1} fill="#FFFFFF" />
      <Line x1={113} y1={74} x2={113} y2={82} stroke="#1B2F5E" strokeWidth={1.2} />
      <Rect x={109.5} y={85} width={3} height={12} fill="#1B2F5E" />
      <Rect x={113.5} y={85} width={3} height={12} fill="#1B2F5E" />
      <Rect x={108} y={96.5} width={4.6} height={1.8} rx={0.9} fill="#2A1A18" />
      <Rect x={113} y={96.5} width={4.6} height={1.8} rx={0.9} fill="#2A1A18" />
      <Circle cx={112.5} cy={69} r={3.3} fill="#2A1A18" />
      <Circle cx={112.5} cy={70} r={2.3} fill="#8A5238" />
      <Rect x={117} y={77} width={4} height={6.5} rx={0.6} fill="#E8A35A" />
    </Svg>
  );
}
