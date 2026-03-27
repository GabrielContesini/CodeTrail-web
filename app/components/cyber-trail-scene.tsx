"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 9999.123) * 43758.5453;
  return x - Math.floor(x);
}

function TrailParticles({
  active,
  particleCount,
}: {
  active: boolean;
  particleCount: number;
}) {
  const instancesRef = useRef<THREE.InstancedMesh>(null);
  const scrollProgressRef = useRef(0);
  const frameAccumulatorRef = useRef(0);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4, 2, -15),
      new THREE.Vector3(-4, -2, -30),
      new THREE.Vector3(6, 4, -45),
      new THREE.Vector3(-6, -4, -60),
      new THREE.Vector3(0, 0, -80),
    ]);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const lookAtMatrix = useMemo(() => new THREE.Matrix4(), []);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, index) => {
      const t = pseudoRandom(index + 1);
      const position = curve.getPointAt(t);

      position.x += (pseudoRandom(index + 101) - 0.5) * 15;
      position.y += (pseudoRandom(index + 202) - 0.5) * 15;
      position.z += (pseudoRandom(index + 303) - 0.5) * 6;

      return {
        t,
        position,
        scale: pseudoRandom(index + 404) * 0.045 + 0.012,
      };
    });
  }, [curve, particleCount]);

  useEffect(() => {
    const instanceMesh = instancesRef.current;
    if (!instanceMesh) {
      return;
    }

    particles.forEach((particle, index) => {
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      instanceMesh.setMatrixAt(index, dummy.matrix);
    });
    instanceMesh.instanceMatrix.needsUpdate = true;
  }, [dummy, particles]);

  useEffect(() => {
    const syncScrollProgress = () => {
      const scrollY = window.scrollY || 0;
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      scrollProgressRef.current = scrollY / maxScroll;
    };

    syncScrollProgress();
    window.addEventListener("scroll", syncScrollProgress, { passive: true });
    window.addEventListener("resize", syncScrollProgress);

    return () => {
      window.removeEventListener("scroll", syncScrollProgress);
      window.removeEventListener("resize", syncScrollProgress);
    };
  }, []);

  useFrame((state, delta) => {
    if (!active || !instancesRef.current) {
      return;
    }

    frameAccumulatorRef.current += delta;
    if (frameAccumulatorRef.current < 1 / 24) {
      return;
    }
    frameAccumulatorRef.current = 0;

    const time = state.clock.elapsedTime;
    particles.forEach((particle, index) => {
      const scale = particle.scale + Math.sin(time * 2.6 + index) * 0.012;
      dummy.position.copy(particle.position);
      dummy.position.z += Math.sin(time * 0.8 + particle.t * 5) * 0.18;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instancesRef.current!.setMatrixAt(index, dummy.matrix);
    });
    instancesRef.current.instanceMatrix.needsUpdate = true;

    const targetT = Math.min(scrollProgressRef.current * 0.95, 0.95);
    const camPos = curve.getPointAt(targetT);
    const lookAtPos = curve.getPointAt(Math.min(targetT + 0.05, 1));

    state.camera.position.lerp(cameraTarget.set(camPos.x, camPos.y, camPos.z + 5), 0.08);
    lookAtTarget.set(lookAtPos.x, lookAtPos.y, lookAtPos.z);
    lookAtMatrix.lookAt(state.camera.position, lookAtTarget, state.camera.up);
    targetQuaternion.setFromRotationMatrix(lookAtMatrix);
    state.camera.quaternion.slerp(targetQuaternion, 0.08);
  });

  return (
    <instancedMesh ref={instancesRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0.28} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

export function CyberTrailScene() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particleCount, setParticleCount] = useState(1400);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.35]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    const updateSceneMode = () => {
      const reduced = reduceMotionQuery.matches;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const lowPower =
        coarsePointerQuery.matches ||
        window.innerWidth < 1024 ||
        (typeof deviceMemory === "number" && deviceMemory <= 4);

      setReducedMotion(reduced);
      setVisible(document.visibilityState === "visible");
      setParticleCount(lowPower ? 760 : 1400);
      setDpr(lowPower ? [0.75, 1] : [1, 1.35]);
    };

    updateSceneMode();
    document.addEventListener("visibilitychange", updateSceneMode);
    window.addEventListener("resize", updateSceneMode);
    reduceMotionQuery.addEventListener("change", updateSceneMode);
    coarsePointerQuery.addEventListener("change", updateSceneMode);

    return () => {
      document.removeEventListener("visibilitychange", updateSceneMode);
      window.removeEventListener("resize", updateSceneMode);
      reduceMotionQuery.removeEventListener("change", updateSceneMode);
      coarsePointerQuery.removeEventListener("change", updateSceneMode);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.01 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  const active = visible && inView && !reducedMotion;

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0 opacity-70 mix-blend-screen" aria-hidden="true">
      {active ? (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          dpr={dpr}
          frameloop={active ? "always" : "never"}
          gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
          performance={{ min: 0.45 }}
        >
          <fog attach="fog" args={["#000000", 5, 30]} />
          <TrailParticles active={active} particleCount={particleCount} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_26%,rgba(50,208,255,0.12),transparent_18%),radial-gradient(circle_at_84%_74%,rgba(50,208,255,0.08),transparent_16%)] opacity-80" />
      )}
    </div>
  );
}
