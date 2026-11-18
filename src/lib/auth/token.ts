import { SignJWT, jwtVerify } from "jose";

/** Funciona en Edge (middleware) y en Node. */
export const SESSION_COOKIE = "duelo_session";
export const SESSION_DAYS = 180;

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string;
  v: number;
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ v: p.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.v !== "number") return null;
    return { sub: payload.sub, v: payload.v };
  } catch {
    return null;
  }
}
