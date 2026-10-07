import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { PulseEntry } from '../logic/pulselog';

export default function RhythmConstellation({
  log,
  matches,
  tint,
}: {
  log: PulseEntry[];
  matches: PulseEntry[];
  tint: string;
}) {
  const recent = log.slice(-18);
  const matchDates = new Set(matches.map((entry) => entry.date));
  const points = recent.map((entry, index) => {
    const x = 18 + ((index * 47) % 280);
    const band = entry.level === 'wired' ? 22 : entry.level === 'steady' ? 58 : 92;
    const y = band + ((index * 19) % 17) - 8;
    return { entry, x, y };
  });
  const selected = points.filter((point) => matchDates.has(point.entry.date));

  return (
    <Svg width="100%" height={120} viewBox="0 0 320 120">
      {selected.slice(1).map((point, index) => (
        <Line
          key={point.entry.date}
          x1={selected[0].x}
          y1={selected[0].y}
          x2={point.x}
          y2={point.y}
          stroke={tint}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      {points.map((point) => {
        const matched = matchDates.has(point.entry.date);
        return (
          <Circle
            key={point.entry.date}
            cx={point.x}
            cy={point.y}
            r={matched ? 5 : 2.5}
            fill={matched ? tint : 'rgba(255,255,255,0.28)'}
            opacity={matched ? 1 : 0.7}
          />
        );
      })}
    </Svg>
  );
}
