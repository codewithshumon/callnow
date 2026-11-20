// Dual-Tone Multi-Frequency (DTMF) Sound Generator for Dialpad
let audioCtx: AudioContext | null = null;

const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};

export function playDtmfTone(digit: string, durationMs = 120): void {
  if (typeof window === "undefined") return;
  const freqs = DTMF_FREQUENCIES[digit];
  if (!freqs) return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const duration = durationMs / 1000;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    // Gentle gain curve to avoid popping artifacts
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // Ignore audio context errors gracefully
  }
}

// ── North American Standard Telephone Ringback Tone (440 Hz + 480 Hz) ──

let ringbackInterval: ReturnType<typeof setInterval> | null = null;
let activeRingOscillators: OscillatorNode[] = [];
let activeRingGain: GainNode | null = null;

export function startRingbackTone(): void {
  if (typeof window === "undefined") return;
  stopRingbackTone();

  const playRingBurst = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      // Dual frequency 440 Hz and 480 Hz
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      // 1.8s ring burst, 0.1s smooth fade in, 0.1s smooth fade out
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.08);
      gainNode.gain.setValueAtTime(0.06, now + 1.7);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 1.85);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.9);
      osc2.stop(now + 1.9);

      activeRingOscillators = [osc1, osc2];
      activeRingGain = gainNode;
    } catch {
      // AudioContext could be blocked by autoplay policies
    }
  };

  playRingBurst();
  // 1.8s burst + 2.2s silence = 4.0s cadence
  ringbackInterval = setInterval(playRingBurst, 4000);
}

export function stopRingbackTone(): void {
  if (ringbackInterval) {
    clearInterval(ringbackInterval);
    ringbackInterval = null;
  }
  if (activeRingGain) {
    try {
      activeRingGain.gain.setValueAtTime(0.0001, 0);
      activeRingGain.disconnect();
    } catch {}
    activeRingGain = null;
  }
  activeRingOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  });
  activeRingOscillators = [];
}
