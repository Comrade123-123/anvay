import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { fontFamily } from '../theme';

// Vector redraw of the "Bank Mitra" counter scene on the Aadhaar seeding screen (the PDF holds it as a
// small raster). Drawn on a 377 x 140 canvas and scaled with "cover" semantics.
export function BankMitraIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 377 140" preserveAspectRatio="xMidYMid slice">
      <Rect width={377} height={140} fill="#E8EDF6" />
      <Circle cx={292} cy={34} r={16} fill="#FDE9C8" />
      <Path d="M0 96 Q60 82 130 92 L130 140 L0 140 Z" fill="#D3DFED" />
      <Path d="M250 96 Q320 78 377 84 L377 140 L250 140 Z" fill="#D3DFED" />
      <Rect x={0} y={90} width={377} height={50} fill="#D3DFED" />
      <Line x1={0} y1={95} x2={377} y2={95} stroke="#A9B7C4" strokeWidth={2} />
      <Line x1={0} y1={100} x2={377} y2={100} stroke={'#13284B'} strokeWidth={1} />

      {/* Tree */}
      <Rect x={16} y={36} width={6} height={92} fill="#755038" />
      <Path d="M18 76 L36 64" stroke="#755038" strokeWidth={4} strokeLinecap="round" />
      <Circle cx={10} cy={58} r={17} fill="#1A5D1F" />
      <Circle cx={34} cy={50} r={15} fill="#388E3B" />
      <Circle cx={20} cy={40} r={17} fill="#2D7C31" />
      <Ellipse cx={26} cy={30} rx={13} ry={10} fill="#4BAF50" />

      {/* Building */}
      <Rect x={119} y={107} width={185} height={14} fill="#AFBDC4" />
      <Rect x={128} y={116} width={166} height={7} fill="#90A3AF" />
      <Rect x={133} y={54} width={158} height={56} fill="#FFFFFF" />
      {[145, 179, 234, 269].map((x) => (
        <Rect key={x} x={x} y={54} width={9} height={56} fill="#EBEFF0" />
      ))}
      <Polygon points="119,54 211,21 304,54" fill="#13284B" />
      <Rect x={150} y={42} width={132} height={13} rx={1} fill="#FF9933" />
      <SvgText x={216} y={51.5} fontFamily={fontFamily.bold} fontSize={8} letterSpacing={0.8} fill="#FFFFFF" textAnchor="middle">
        BANK MITRA / शाखा
      </SvgText>

      {/* Bank Mitra at the counter */}
      <Rect x={198} y={78} width={30} height={32} fill="#DBE2EB" />
      <G>
        <Rect x={192} y={76} width={8} height={17} rx={2} fill="#13284B" />
        <Rect x={195} y={73} width={19} height={20} rx={3} fill="#E8772D" />
        <Rect x={200} y={92} width={5} height={18} fill="#13284B" />
        <Rect x={207} y={92} width={5} height={18} fill="#13284B" />
        <Circle cx={204.5} cy={67} r={6} fill="#5D3F36" />
        <Rect x={205} y={79} width={13} height={6} rx={2} fill="#E8772D" />
        <Rect x={216} y={80} width={9} height={11} rx={1.5} fill="#FFFFFF" stroke="#13284B" strokeWidth={1} />
        <Line x1={218} y1={84} x2={223} y2={84} stroke="#138708" strokeWidth={1} />
        <Line x1={218} y1={87} x2={223} y2={87} stroke="#FF9933" strokeWidth={1} />
      </G>
    </Svg>
  );
}
