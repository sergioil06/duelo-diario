"use client";

import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { ITEMS } from "@/lib/domain/shop";
import { AvatarFigure, sceneryBackground, type AvatarProps } from "./Avatar3D";

/** Si el móvil no tiene WebGL, enseñamos el muñeco 2D en su lugar. */
class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface StageProps extends AvatarProps {
  /** Arrastrar para girar el avatar. */
  interactive?: boolean;
  /** "full" enseña el escenario entero; "compact" encuadra al muñeco para el marcador. */
  framing?: "full" | "compact";
  label: string;
  className?: string;
  fallback?: ReactNode;
}

export default function AvatarStage({ interactive = false, framing = "full", label, className, fallback = null, ...avatar }: StageProps) {
  const compact = framing === "compact";
  const space = avatar.equipped.background && ITEMS.get(avatar.equipped.background)?.model === "space";
  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{ background: compact ? undefined : sceneryBackground(avatar.equipped), touchAction: interactive ? "none" : undefined }}
    >
      <WebGLBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          camera={{ position: compact ? [0.25, 1.15, 4.9] : [0, 1.3, 4.4], fov: compact ? 30 : 34 }}
          onCreated={({ camera }) => camera.lookAt(compact ? 0.25 : 0, compact ? 0.95 : 0.95, 0)}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 4, 3]} intensity={1.6} />
          <directionalLight position={[-3, 2, -2]} intensity={0.5} />
          {space && !compact && <Stars radius={20} depth={10} count={600} factor={2} fade speed={0.5} />}
          <Suspense fallback={null}>
            <AvatarFigure {...avatar} showScenery={!compact} />
          </Suspense>
          {interactive && (
            <OrbitControls
              target={[compact ? 0.25 : 0, 0.95, 0]}
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.9}
              rotateSpeed={0.8}
            />
          )}
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}
