export default function DurationDisplay({ seconds }: { seconds: number }) {
  if (seconds < 60) return <span>{seconds}s</span>;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return <span>{m}:{s.toString().padStart(2, "0")}</span>;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return <span>{h}h {rm}m {s}s</span>;
}
