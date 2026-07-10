interface TrackRecordSparklineProps {
  data: number[];
  className?: string;
}

/**
 * Placeholder chart kinerja kumulatif — akan digantikan data performa nyata
 * setelah fitur Signal/Track Record divalidasi legal (lihat
 * "07 - Hypercritical Review & Open Questions" di dokumentasi).
 */
export function TrackRecordSparkline({ data, className }: TrackRecordSparklineProps) {
  const width = 480;
  const height = 140;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });

  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Grafik ilustratif kinerja kumulatif (data dummy)"
    >
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--emerald)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--emerald)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkline-fill)" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--emerald)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
