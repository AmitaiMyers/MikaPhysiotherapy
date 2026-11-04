import { daysBetween, parseLocalDate } from '../patients/dates';
import type { Series } from '../patients/progress';

const WIDTH = 320;
const HEIGHT = 150;
const PAD = { top: 16, right: 14, bottom: 24, left: 30 };

const shortDate = (date: string) => parseLocalDate(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const format = (value: number) => String(Math.round(value * 10) / 10);

/** Minimal SVG line chart of a measurement over the session dates. */
export function LineChart({ series }: { series: Series }) {
  const points = series.points;
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) return null;
  const xs = points.map((p) => daysBetween(first.date, p.date));
  const ys = points.map((p) => p.value);
  const [minY, maxY] = series.range ?? [Math.min(...ys), Math.max(...ys)];
  const spanX = Math.max(...xs) || 1;
  const spanY = maxY - minY || 1;
  const toX = (x: number) => (points.length === 1 ? WIDTH / 2 : PAD.left + (x / spanX) * (WIDTH - PAD.left - PAD.right));
  const toY = (y: number) => HEIGHT - PAD.bottom - ((y - minY) / spanY) * (HEIGHT - PAD.top - PAD.bottom);
  return (
    <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${series.label}: ${points.map((p) => `${shortDate(p.date)} ${format(p.value)}`).join(', ')}`}>
      {[maxY, minY].map((y) => (
        <g key={y}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={toY(y)} y2={toY(y)} className="chart-grid" />
          <text x={PAD.left - 4} y={toY(y) + 4} textAnchor="end" className="chart-label">
            {format(y)}
          </text>
        </g>
      ))}
      <polyline points={points.map((p, i) => `${toX(xs[i] ?? 0)},${toY(p.value)}`).join(' ')} className="chart-line" />
      {points.map((p, i) => (
        <g key={`${p.date}-${i}`}>
          <circle cx={toX(xs[i] ?? 0)} cy={toY(p.value)} r={3.5} className="chart-dot" />
          {(i === 0 || i === points.length - 1 || points.length <= 6) && (
            <text x={toX(xs[i] ?? 0)} y={toY(p.value) - 8} textAnchor="middle" className="chart-value">
              {format(p.value)}
            </text>
          )}
        </g>
      ))}
      <text x={PAD.left} y={HEIGHT - 6} className="chart-label">
        {shortDate(first.date)}
      </text>
      {points.length > 1 && (
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="chart-label">
          {shortDate(last.date)}
        </text>
      )}
    </svg>
  );
}
