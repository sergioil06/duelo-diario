import confetti from "canvas-confetti";

const COLORS = ["#6D4AFF", "#FFB020", "#22C55E", "#F97316", "#2563EB", "#FF8FA3"];

/** Confeti desde el elemento pulsado, vibración corta y sonido si está activado. */
export function celebrate(origin: HTMLElement) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const r = origin.getBoundingClientRect();
  const x = (r.left + r.width / 2) / innerWidth;
  const y = (r.top + r.height / 2) / innerHeight;
  if (!reduce) {
    confetti({ particleCount: 70, spread: 75, startVelocity: 38, origin: { x, y }, colors: COLORS, scalar: 0.9, disableForReducedMotion: true });
    setTimeout(() => confetti({ particleCount: 40, spread: 120, startVelocity: 25, origin: { x, y: y - 0.05 }, colors: COLORS, shapes: ["circle"], disableForReducedMotion: true }), 160);
  }
  navigator.vibrate?.(30);
  playChime();
}

function playChime() {
  try {
    if (localStorage.getItem("sound") !== "on") return;
    const ctx = new AudioContext();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.08;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* sin sonido */
  }
}
