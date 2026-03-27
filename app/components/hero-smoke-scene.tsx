"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    8,
    size / 2,
    size / 2,
    size / 2,
  );

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.24, "rgba(121,214,255,0.86)");
  gradient.addColorStop(0.62, "rgba(34,211,238,0.26)");
  gradient.addColorStop(1, "rgba(34,211,238,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function seeded(seed: number) {
  const value = Math.sin(seed * 129.9898) * 43758.5453;
  return value - Math.floor(value);
}

function SmokePoints({
  count,
  radius,
  height,
  color,
  speed,
  size,
}: {
  count: number;
  radius: number;
  height: number;
  color: string;
  speed: number;
  size: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const texture = useMemo(() => createGlowTexture(), []);
  const positions = useMemo(() => {
    const buffer = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const angle = seeded(index + radius) * Math.PI * 2;
      const band = radius * (0.4 + seeded(index + 14) * 0.9);
      const y = (seeded(index + 31) - 0.5) * height;
      const drift = (seeded(index + 53) - 0.5) * 0.8;

      buffer[index * 3] = Math.cos(angle) * band + drift;
      buffer[index * 3 + 1] = y;
      buffer[index * 3 + 2] = Math.sin(angle) * band * 0.7;
    }

    return buffer;
  }, [count, height, radius]);

  useFrame((state, delta) => {
    if (!ref.current) {
      return;
    }

    ref.current.rotation.y += delta * speed;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * speed * 0.7) * 0.14;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * speed * 0.4) * 0.22;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        map={texture ?? undefined}
        alphaMap={texture ?? undefined}
        transparent
        depthWrite={false}
        opacity={0.34}
        size={size}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function TrailRibbon({
  offset,
  color,
  speed,
}: {
  offset: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Line | null>(null);
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.8, -0.8 + offset, -1.4),
      new THREE.Vector3(-2.4, 1.2 + offset, -0.5),
      new THREE.Vector3(0.2, -1.1 + offset, 0.3),
      new THREE.Vector3(2.6, 1.1 + offset, 0.8),
      new THREE.Vector3(4.9, -0.7 + offset, -0.2),
    ]);

    return curve.getPoints(220);
  }, [offset]);

  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points],
  );
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.34,
      }),
    [color],
  );
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.rotation.z =
      Math.sin(state.clock.elapsedTime * speed + offset * 4) * 0.08;
    ref.current.position.y =
      Math.cos(state.clock.elapsedTime * speed * 0.8 + offset * 12) * 0.18;
  });

  return <primitive object={line} ref={ref} />;
}

function Scene() {
  const rig = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!rig.current) {
      return;
    }

    rig.current.rotation.y += delta * 0.04;
    rig.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.06;
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <pointLight position={[-2.5, 2.5, 4]} intensity={26} color="#005F73" />
      <pointLight position={[2.2, -1.2, 4]} intensity={18} color="#2EC5FF" />
      <pointLight position={[0.2, 1.5, 2.8]} intensity={8} color="#35D39A" />

      <group ref={rig}>
        <SmokePoints
          count={170}
          radius={3.2}
          height={4.8}
          color="#005F73"
          speed={0.08}
          size={0.18}
        />
        <SmokePoints
          count={160}
          radius={2.4}
          height={5.2}
          color="#2EC5FF"
          speed={-0.11}
          size={0.16}
        />
        <SmokePoints
          count={110}
          radius={1.4}
          height={3.2}
          color="#35D39A"
          speed={0.14}
          size={0.12}
        />

        <TrailRibbon offset={-0.9} color="#005F73" speed={0.44} />
        <TrailRibbon offset={0} color="#2EC5FF" speed={0.36} />
        <TrailRibbon offset={0.9} color="#35D39A" speed={0.28} />

        {[2.1, 2.9, 3.7].map((radius, index) => (
          <mesh
            key={radius}
            rotation={[Math.PI / 2.3, index * 0.22, index * 0.4]}
          >
            <torusGeometry args={[radius, 0.025, 16, 220]} />
            <meshBasicMaterial
              color={index === 1 ? "#2EC5FF" : "#005F73"}
              transparent
              opacity={0.18 - index * 0.03}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function HeroSmokeScene() {
  return (
    <div className="hero-canvas-shell" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.2, 8.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>
      <div className="hero-canvas-vignette" />
    </div>
  );
}
