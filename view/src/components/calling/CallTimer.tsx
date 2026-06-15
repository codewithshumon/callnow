"use client";

import { useEffect, useState } from "react";

interface Props { startTime: number; }

export default function CallTimer({ startTime }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span className="text-sm tabular-nums">{m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}</span>;
}
