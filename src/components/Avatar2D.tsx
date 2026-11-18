/**
 * Avatar chibi provisional en SVG. En la fase 4 se sustituye por el 3D
 * (React Three Fiber) con las mismas props.
 */
export type Mood = "idle" | "happy" | "sad";

/** `look` es el muñeco de cada persona; `side` solo decide el color (tú azul, rival naranja). */
export function Avatar2D({
  side,
  look = side === "me" ? "cap" : "bow",
  mood = "idle",
  label,
  size = 92,
}: {
  side: "me" | "rival";
  look?: "cap" | "bow";
  mood?: Mood;
  label: string;
  size?: number;
}) {
  const body = side === "me" ? "var(--me-fill)" : "var(--rival-fill)";
  const accent = side === "me" ? "#1D4ED8" : "#C2410C";
  const skin = look === "cap" ? "#FFD9B8" : "#F6C9A5";
  const hair = look === "cap" ? "#3B2A20" : "#7A3E1D";
  const happy = mood === "happy";
  const sad = mood === "sad";
  return (
    <svg
      width={size}
      height={size * 1.17}
      viewBox="0 0 100 120"
      role="img"
      aria-label={label}
      className={happy ? "avatar-happy" : sad ? "avatar-sad" : "avatar-idle"}
    >
      <ellipse cx="50" cy="114" rx="28" ry="5" fill="#000" opacity=".14" />
      {look === "bow" && <path d="M16 50c0-22 14-34 34-34s34 12 34 34v30H16z" fill={hair} />}
      <rect x="30" y="72" width="40" height="38" rx="18" fill={body} />
      {happy ? (
        <>
          <rect x="18" y="74" width="12" height="22" rx="6" fill={body} transform="rotate(-145 24 80)" />
          <rect x="70" y="74" width="12" height="22" rx="6" fill={body} transform="rotate(145 76 80)" />
        </>
      ) : (
        <>
          <rect x="22" y="76" width="11" height="22" rx="5.5" fill={body} transform="rotate(15 27 78)" />
          <rect x="67" y="76" width="11" height="22" rx="5.5" fill={body} transform="rotate(-15 73 78)" />
        </>
      )}
      <circle cx="50" cy="48" r="31" fill={skin} />
      {look === "cap" ? (
        <>
          <path d="M19 42c2-16 15-26 31-26s29 10 31 26c-9-6-19-9-31-9s-22 3-31 9z" fill={hair} />
          <path d="M20 34c4-13 16-21 30-21s26 8 30 21z" fill={body} />
          <rect x="52" y="30" width="38" height="7" rx="3.5" fill={accent} />
        </>
      ) : (
        <>
          <path d="M19 46c1-18 14-29 31-29s30 11 31 29c-6-9-14-14-22-15-6 6-18 10-40 15z" fill={hair} />
          <path d="M66 14l12-8 2 14zM66 14l-2 14 14-6z" fill={body} />
          <circle cx="66" cy="16" r="4" fill={accent} />
        </>
      )}
      {happy ? (
        <path d="M35 51q4-5 8 0M57 51q4-5 8 0" stroke="#1E1B3A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="39" cy={sad ? 54 : 52} r="4" fill="#1E1B3A" />
          <circle cx="61" cy={sad ? 54 : 52} r="4" fill="#1E1B3A" />
        </>
      )}
      <circle cx="32" cy="60" r="4.5" fill="#FF8FA3" opacity={sad ? 0.25 : 0.7} />
      <circle cx="68" cy="60" r="4.5" fill="#FF8FA3" opacity={sad ? 0.25 : 0.7} />
      {happy ? (
        <path d="M42 62q8 9 16 0z" fill="#1E1B3A" />
      ) : sad ? (
        <path d="M44 67q6-5 12 0" stroke="#1E1B3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M44 64q6 4 12 0" stroke="#1E1B3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {sad && <path d="M64 58q2 4 0 6q-2-2 0-6z" fill="#60A5FA" />}
    </svg>
  );
}
