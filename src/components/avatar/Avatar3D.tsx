"use client";

/**
 * Avatar chibi 3D hecho solo con formas básicas (esferas, cápsulas, conos), así que
 * no hay modelos externos ni licencias de terceros, pesa muy poco y los accesorios
 * se enganchan en puntos fijos (cabeza, cara, cuerpo, al lado).
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { ITEMS, type Appearance, type Equipped, type ShopItem } from "@/lib/domain/shop";

export type Mood = "idle" | "happy" | "sad";

const SEG = 20;
const PANTS = "#334155";
const INK = "#1E1B3A";

function Mat({ color, emissive }: { color: string; emissive?: string }) {
  return <meshToonMaterial color={color} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 0.4 : 0} />;
}

function shape(kind: "heart" | "star") {
  const s = new THREE.Shape();
  if (kind === "heart") {
    s.moveTo(0, -0.07);
    s.bezierCurveTo(-0.11, 0.0, -0.08, 0.09, 0, 0.04);
    s.bezierCurveTo(0.08, 0.09, 0.11, 0.0, 0, -0.07);
  } else {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.09 : 0.04;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
  }
  return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
}

/* ---------------- Pelo ---------------- */

function Hair({ style, color, hasHat }: { style: Appearance["hairStyle"]; color: string; hasHat: boolean }) {
  if (style === "bald") return null;
  const cap = (
    <mesh position={[0, 0.06, -0.03]} scale={[1.06, 0.92, 1.06]}>
      <sphereGeometry args={[0.5, SEG, SEG, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
      <Mat color={color} />
    </mesh>
  );
  const fringe = (
    <mesh position={[0, 0.3, 0.3]} rotation={[0.9, 0, 0]} scale={[1, 0.5, 0.6]}>
      <sphereGeometry args={[0.28, SEG, SEG]} />
      <Mat color={color} />
    </mesh>
  );
  return (
    <group>
      {cap}
      {fringe}
      {style === "spiky" &&
        !hasHat &&
        [-0.25, 0, 0.25].map((x, i) => (
          <mesh key={i} position={[x, 0.55, -0.05]} rotation={[-0.2, 0, -x * 1.4]}>
            <coneGeometry args={[0.12, 0.3, 6]} />
            <Mat color={color} />
          </mesh>
        ))}
      {(style === "long" || style === "pony") && (
        <mesh position={style === "long" ? [0, -0.25, -0.22] : [0, -0.1, -0.5]} rotation={style === "pony" ? [0.5, 0, 0] : [0, 0, 0]}>
          <capsuleGeometry args={[style === "long" ? 0.44 : 0.12, style === "long" ? 0.45 : 0.4, 6, SEG]} />
          <Mat color={color} />
        </mesh>
      )}
      {style === "bun" && !hasHat && (
        <mesh position={[0, 0.52, -0.18]}>
          <sphereGeometry args={[0.18, SEG, SEG]} />
          <Mat color={color} />
        </mesh>
      )}
      {style === "curly" &&
        Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0.25 + Math.sin(i * 1.7) * 0.06, Math.sin(a) * 0.42 - 0.05]}>
              <sphereGeometry args={[0.14, 10, 10]} />
              <Mat color={color} />
            </mesh>
          );
        })}
    </group>
  );
}

/* ---------------- Cara ---------------- */

function Face({ eyes, mood, blinkRef }: { eyes: Appearance["eyes"]; mood: Mood; blinkRef: React.RefObject<THREE.Group | null> }) {
  const happy = mood === "happy";
  const sad = mood === "sad";
  return (
    <group position={[0, -0.02, 0.43]}>
      <group ref={blinkRef}>
        {[-0.17, 0.17].map((x) =>
          happy ? (
            <mesh key={x} position={[x, 0.02, 0.04]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.055, 0.018, 6, 12, Math.PI]} />
              <Mat color={INK} />
            </mesh>
          ) : (
            <group key={x} position={[x, sad ? -0.01 : 0, 0.02]}>
              {eyes === "big" && (
                <mesh scale={[1, 1.15, 0.5]}>
                  <sphereGeometry args={[0.085, 12, 12]} />
                  <Mat color="#FFFFFF" />
                </mesh>
              )}
              <mesh position={[0, 0, eyes === "big" ? 0.04 : 0]} scale={[1, 1.2, 0.6]}>
                <sphereGeometry args={[eyes === "big" ? 0.05 : 0.055, 12, 12]} />
                <Mat color={INK} />
              </mesh>
              {eyes === "lashes" && (
                <mesh position={[x > 0 ? 0.05 : -0.05, 0.06, 0.01]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}>
                  <boxGeometry args={[0.05, 0.015, 0.01]} />
                  <Mat color={INK} />
                </mesh>
              )}
            </group>
          ),
        )}
      </group>
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, -0.1, -0.02]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshToonMaterial color="#FF8FA3" transparent opacity={sad ? 0.3 : 0.8} />
        </mesh>
      ))}
      <mesh position={[0, sad ? -0.17 : -0.13, 0.02]} rotation={[0, 0, sad ? 0 : Math.PI]}>
        <torusGeometry args={[happy ? 0.07 : 0.05, 0.016, 6, 14, Math.PI]} />
        <Mat color={INK} />
      </mesh>
      {sad && (
        <mesh position={[0.2, -0.08, 0.03]} scale={[0.7, 1, 0.5]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshToonMaterial color="#60A5FA" />
        </mesh>
      )}
    </group>
  );
}

/* ---------------- Accesorios ---------------- */

function Hat({ item }: { item: ShopItem }) {
  const { model, color, accent = "#FFFFFF" } = item;
  if (model === "cap")
    return (
      <group position={[0, 0.3, 0]}>
        <mesh scale={[1.08, 0.8, 1.08]}>
          <sphereGeometry args={[0.5, SEG, SEG, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color={color} />
        </mesh>
        <mesh position={[0, 0.02, 0.45]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.4]} />
          <Mat color={accent} />
        </mesh>
      </group>
    );
  if (model === "beanie")
    return (
      <group position={[0, 0.3, 0]}>
        <mesh scale={[1.08, 0.95, 1.08]}>
          <sphereGeometry args={[0.5, SEG, SEG, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color={color} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.07, 8, SEG]} />
          <Mat color={accent} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.11, 10, 10]} />
          <Mat color={accent} />
        </mesh>
      </group>
    );
  if (model === "party" || model === "wizard") {
    const tall = model === "wizard";
    return (
      <group position={[0, 0.45, -0.02]} rotation={[-0.1, 0, tall ? 0.15 : -0.1]}>
        {tall && (
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.04, SEG]} />
            <Mat color={color} />
          </mesh>
        )}
        <mesh position={[0, tall ? 0.35 : 0.22, 0]}>
          <coneGeometry args={[tall ? 0.38 : 0.22, tall ? 0.8 : 0.5, SEG]} />
          <Mat color={color} />
        </mesh>
        {tall ? (
          <mesh position={[0.1, 0.25, 0.3]} rotation={[-0.3, 0, 0]} geometry={shape("star")}>
            <Mat color={accent} emissive={accent} />
          </mesh>
        ) : (
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <Mat color={accent} />
          </mesh>
        )}
      </group>
    );
  }
  if (model === "flowers")
    return (
      <group position={[0, 0.38, 0]}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]}>
              <sphereGeometry args={[0.08, 10, 10]} />
              <Mat color={i % 2 ? color : accent} />
            </mesh>
          );
        })}
      </group>
    );
  if (model === "crown")
    return (
      <group position={[0, 0.48, 0]}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.3, 0.16, 8, 1, true]} />
          <meshToonMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.25} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.31, 0.14, Math.sin(a) * 0.31]}>
              <coneGeometry args={[0.06, 0.14, 4]} />
              <Mat color={color} />
            </mesh>
          );
        })}
        <mesh position={[0, 0, 0.31]}>
          <octahedronGeometry args={[0.05]} />
          <Mat color={accent} emissive={accent} />
        </mesh>
      </group>
    );
  return null;
}

function Glasses({ item }: { item: ShopItem }) {
  const { model, color } = item;
  const lens = (x: number) => {
    if (model === "round")
      return (
        <mesh key={x} position={[x, 0, 0]}>
          <torusGeometry args={[0.1, 0.018, 8, 18]} />
          <Mat color={color} />
        </mesh>
      );
    if (model === "sun")
      return (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.24, 0.13, 0.03]} />
          <meshToonMaterial color={color} />
        </mesh>
      );
    return (
      <mesh key={x} position={[x, 0, -0.01]} scale={1.3} geometry={shape(model === "heart" ? "heart" : "star")}>
        <Mat color={color} emissive={model === "star" ? color : undefined} />
      </mesh>
    );
  };
  return (
    <group position={[0, 0, 0.5]}>
      {lens(-0.17)}
      {lens(0.17)}
      <mesh>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <Mat color={model === "heart" || model === "star" ? color : "#1E1B3A"} />
      </mesh>
    </group>
  );
}

function OutfitExtras({ item }: { item: ShopItem | undefined }) {
  if (!item) return null;
  const accent = item.accent ?? "#FFFFFF";
  switch (item.model) {
    case "hoodie":
      return (
        <>
          <mesh position={[0, 0.3, -0.22]} rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.2, 0.08, 8, 16]} />
            <Mat color={item.color} />
          </mesh>
          <mesh position={[0, -0.12, 0.3]}>
            <boxGeometry args={[0.32, 0.12, 0.04]} />
            <Mat color={accent} />
          </mesh>
        </>
      );
    case "sport":
      return (
        <mesh rotation={[0, 0, 0]} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.335, 0.335, 0.08, SEG, 1, true]} />
          <meshToonMaterial color={accent} side={THREE.DoubleSide} />
        </mesh>
      );
    case "suit":
      return (
        <>
          <mesh position={[0, 0.12, 0.29]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.12, 0.3, 3]} />
            <Mat color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.06, 0.32]}>
            <boxGeometry args={[0.05, 0.22, 0.03]} />
            <Mat color={accent} />
          </mesh>
        </>
      );
    case "hero":
      return (
        <>
          <mesh position={[0, -0.05, -0.33]} rotation={[0.12, 0, 0]}>
            <planeGeometry args={[0.7, 0.75]} />
            <meshToonMaterial color={accent === "#FACC15" ? "#1D4ED8" : accent} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.08, 0.32]} geometry={shape("star")}>
            <Mat color={accent} emissive={accent} />
          </mesh>
        </>
      );
    default:
      return null;
  }
}

function Pet({ item }: { item: ShopItem }) {
  const ref = useRef<THREE.Group>(null);
  const { model, color, accent = "#FFFFFF" } = item;
  const flying = model === "dragon";
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = flying ? 0.75 + Math.sin(t * 2) * 0.08 : Math.abs(Math.sin(t * 3)) * 0.05;
    ref.current.rotation.y = -0.5 + Math.sin(t * 0.8) * 0.2;
  });
  const ear = (x: number, long: boolean, floppy: boolean) => (
    <mesh key={x} position={[x, floppy ? 0.0 : long ? 0.22 : 0.12, floppy ? 0.02 : 0]} rotation={[0, 0, floppy ? (x > 0 ? -0.4 : 0.4) : x * 1.5]}>
      {long ? <capsuleGeometry args={[0.04, 0.2, 4, 8]} /> : floppy ? <boxGeometry args={[0.06, 0.14, 0.04]} /> : <coneGeometry args={[0.06, 0.12, 4]} />}
      <Mat color={floppy ? accent : color} />
    </mesh>
  );
  return (
    <group position={[0.82, 0, 0.15]} scale={0.95}>
      <group ref={ref}>
        <mesh position={[0, 0.17, 0]} scale={[1, 0.9, 1.1]}>
          <sphereGeometry args={[0.17, 14, 14]} />
          <Mat color={color} />
        </mesh>
        <group position={[0, 0.38, 0.06]}>
          <mesh>
            <sphereGeometry args={[0.14, 14, 14]} />
            <Mat color={color} />
          </mesh>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.13]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <Mat color={INK} />
            </mesh>
          ))}
          {model === "chick" && (
            <mesh position={[0, -0.03, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.04, 0.08, 4]} />
              <Mat color={accent} />
            </mesh>
          )}
          {model === "cat" && [-0.08, 0.08].map((x) => ear(x, false, false))}
          {model === "dog" && [-0.13, 0.13].map((x) => ear(x, false, true))}
          {model === "bunny" && [-0.05, 0.05].map((x) => ear(x, true, false))}
          {model === "dragon" &&
            [-0.06, 0.06].map((x) => (
              <mesh key={x} position={[x, 0.13, -0.02]} rotation={[-0.3, 0, 0]}>
                <coneGeometry args={[0.03, 0.1, 4]} />
                <Mat color={accent} />
              </mesh>
            ))}
        </group>
        {(model === "cat" || model === "dog" || model === "dragon") && (
          <mesh position={[0, 0.2, -0.2]} rotation={[-0.8, 0, 0]}>
            <capsuleGeometry args={[0.03, 0.18, 4, 8]} />
            <Mat color={model === "dragon" ? accent : color} />
          </mesh>
        )}
        {model === "dragon" &&
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.18, 0.25, -0.05]} rotation={[0, s * 0.5, s * 0.6]}>
              <coneGeometry args={[0.12, 0.25, 3]} />
              <Mat color={accent} />
            </mesh>
          ))}
      </group>
    </group>
  );
}

function Scenery({ item }: { item: ShopItem | undefined }) {
  const ground = item?.accent ?? "#E4DDFF";
  return (
    <group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 32]} />
        <meshToonMaterial color={item?.model === "space" ? "#312E81" : item?.model === "sunset" ? "#FDE68A" : ground} />
      </mesh>
      {item?.model === "park" && (
        <group position={[-0.9, 0, -0.7]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
            <Mat color="#92400E" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <icosahedronGeometry args={[0.35, 0]} />
            <meshToonMaterial color="#22C55E" />
          </mesh>
        </group>
      )}
      {item?.model === "beach" && (
        <group position={[-0.85, 0, -0.6]} rotation={[0, 0, 0.15]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
            <Mat color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <coneGeometry args={[0.5, 0.25, 8, 1, true]} />
            <meshToonMaterial color="#EF4444" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {item?.model === "space" && (
        <mesh position={[-1.0, 1.9, -1.2]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <Mat color="#F472B6" emissive="#F472B6" />
        </mesh>
      )}
    </group>
  );
}

function Effect({ item }: { item: ShopItem }) {
  const ring = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      ring.current.rotation.y = clock.elapsedTime * 0.8;
      ring.current.position.y = 0.2 + ((clock.elapsedTime * 0.3) % 1) * 1.8;
    }
  });
  if (item.model === "sparkles") return <Sparkles count={30} scale={[2, 2.4, 2]} position={[0, 1.1, 0]} size={4} speed={0.6} color={item.color} />;
  if (item.model === "hearts")
    return (
      <group ref={ring}>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.8, Math.sin(i) * 0.2, Math.sin(a) * 0.8]} scale={1.4} geometry={shape("heart")}>
              <Mat color={item.color} emissive={item.color} />
            </mesh>
          );
        })}
      </group>
    );
  return (
    <>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.85, 40]} />
        <meshBasicMaterial color={item.color} transparent opacity={0.6} />
      </mesh>
      <Sparkles count={40} scale={[1.8, 2.6, 1.8]} position={[0, 1.2, 0]} size={5} speed={1} color={item.color} />
    </>
  );
}

/* ---------------- Figura completa ---------------- */

export interface AvatarProps {
  appearance: Appearance;
  equipped: Equipped;
  mood?: Mood;
  /** Cambia este número para lanzar la animación de celebración. */
  celebrate?: number;
  showScenery?: boolean;
}

const ARM_POSES: Record<string, [number, number]> = {
  // [rotación z brazo izquierdo, rotación z brazo derecho] (radianes, 0 = abajo)
  none: [-0.35, 0.35],
  wave: [-0.35, 2.6],
  peace: [-0.35, 2.2],
  flex: [-2.3, 2.3],
  champion: [-2.9, 2.9],
};

export function AvatarFigure({ appearance, equipped, mood = "idle", celebrate = 0, showScenery = true }: AvatarProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const blink = useRef<THREE.Group>(null);
  const celebStart = useRef<{ key: number; t: number | null }>({ key: celebrate, t: null });

  const item = (slot: keyof Equipped) => (equipped[slot] ? ITEMS.get(equipped[slot]!) : undefined);
  const hat = item("hat");
  const glasses = item("glasses");
  const outfit = item("outfit");
  const pet = item("pet");
  const bg = item("background");
  const pose = item("pose")?.model ?? "none";
  const effect = item("effect");
  const shirt = outfit?.color ?? appearance.shirt;
  const [baseL, baseR] = ARM_POSES[pose] ?? ARM_POSES.none;
  const skinMat = useMemo(() => <Mat color={appearance.skin} />, [appearance.skin]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!root.current || !head.current || !armL.current || !armR.current) return;
    if (celebStart.current.key !== celebrate) celebStart.current = { key: celebrate, t };
    const ct = celebStart.current.t === null ? Infinity : t - celebStart.current.t;
    const celebrating = mood === "happy" || ct < 1.6;
    const sad = mood === "sad" && !celebrating;

    if (celebrating) {
      const p = (ct === Infinity ? t : ct) * 2.2;
      root.current.position.y = Math.abs(Math.sin(p * Math.PI)) * 0.35;
      root.current.rotation.y = ct < 1.6 ? (ct / 1.6) * Math.PI * 2 : 0;
      armL.current.rotation.z = -2.7 + Math.sin(t * 14) * 0.25;
      armR.current.rotation.z = 2.7 - Math.sin(t * 14) * 0.25;
      head.current.rotation.z = Math.sin(t * 8) * 0.08;
    } else {
      root.current.position.y = Math.sin(t * (sad ? 1.2 : 2)) * (sad ? 0.01 : 0.025);
      root.current.rotation.y = 0;
      head.current.rotation.x = sad ? 0.25 : Math.sin(t * 0.7) * 0.04;
      head.current.rotation.z = sad ? -0.1 : Math.sin(t * 0.9) * 0.05;
      armL.current.rotation.z = sad ? -0.12 : baseL + Math.sin(t * 2) * 0.04;
      armR.current.rotation.z = sad ? 0.12 : pose === "wave" ? baseR + Math.sin(t * 6) * 0.3 : baseR - Math.sin(t * 2) * 0.04;
    }
    // Parpadeo cada ~3,5 s
    if (blink.current) blink.current.scale.y = t % 3.5 < 0.12 ? 0.1 : 1;
  });

  return (
    <group>
      {showScenery && <Scenery item={bg} />}
      {effect && <Effect item={effect} />}
      {pet && <Pet item={pet} />}
      {/* Sombra */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
      <group ref={root}>
        {/* Piernas */}
        {[-0.13, 0.13].map((x) => (
          <group key={x} position={[x, 0.17, 0]}>
            <mesh>
              <capsuleGeometry args={[0.1, 0.16, 4, 12]} />
              <Mat color={outfit?.model === "hero" ? outfit.color : PANTS} />
            </mesh>
            <mesh position={[0, -0.12, 0.05]} scale={[1, 0.6, 1.3]}>
              <sphereGeometry args={[0.1, 10, 10]} />
              <Mat color={INK} />
            </mesh>
          </group>
        ))}
        {/* Cuerpo */}
        <group position={[0, 0.58, 0]}>
          <mesh>
            <capsuleGeometry args={[0.32, 0.28, 6, SEG]} />
            <Mat color={shirt} />
          </mesh>
          <OutfitExtras item={outfit} />
        </group>
        {/* Brazos (pivotan en el hombro) */}
        {(
          [
            [armL, -0.3],
            [armR, 0.3],
          ] as const
        ).map(([ref, x]) => (
          <group key={x} ref={ref} position={[x, 0.78, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.08, 0.2, 4, 10]} />
              <Mat color={shirt} />
            </mesh>
            <mesh position={[0, -0.33, 0]}>
              <sphereGeometry args={[0.08, 10, 10]} />
              {skinMat}
            </mesh>
          </group>
        ))}
        {/* Cabeza */}
        <group ref={head} position={[0, 1.38, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 28, 28]} />
            {skinMat}
          </mesh>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, -0.02, 0]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.1, 10, 10]} />
              {skinMat}
            </mesh>
          ))}
          <Hair style={appearance.hairStyle} color={appearance.hair} hasHat={!!hat} />
          <Face eyes={appearance.eyes} mood={mood} blinkRef={blink} />
          {glasses && <Glasses item={glasses} />}
          {hat && <Hat item={hat} />}
        </group>
      </group>
    </group>
  );
}

/** Fondo CSS detrás del canvas según el escenario equipado. */
export function sceneryBackground(equipped: Equipped): string | undefined {
  const bg = equipped.background ? ITEMS.get(equipped.background) : undefined;
  if (!bg) return undefined;
  switch (bg.model) {
    case "park":
      return "linear-gradient(#bae6fd, #e0f2fe 70%)";
    case "beach":
      return "linear-gradient(#7dd3fc, #e0f2fe 65%)";
    case "sunset":
      return "linear-gradient(#c084fc, #fb923c 55%, #fde68a)";
    case "space":
      return "radial-gradient(circle at 70% 20%, #4c1d95, #0b0a24 70%)";
  }
}
