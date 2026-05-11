'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingGeometryProps {
  variant?: 'hero' | 'builder' | 'minimal';
}

function WireframeMesh({ position, rotation, scale, color, speed, shape }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  shape: 'icosahedron' | 'octahedron' | 'torus' | 'dodecahedron';
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialRot = useRef(rotation);
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = initialRot.current[0] + t * speed * 0.3;
    meshRef.current.rotation.y = initialRot.current[1] + t * speed * 0.5;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.4 + offset.current) * 0.3;
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case 'icosahedron': return new THREE.IcosahedronGeometry(1, 0);
      case 'octahedron': return new THREE.OctahedronGeometry(1, 0);
      case 'torus': return new THREE.TorusGeometry(0.8, 0.2, 8, 12);
      case 'dodecahedron': return new THREE.DodecahedronGeometry(1, 0);
    }
  }, [shape]);

  return (
    <mesh ref={meshRef} position={position} scale={scale} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.15}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

function GlowRing({ position, color, radius }: { position: [number, number, number]; color: string; radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.z = t * 0.2;
    meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.5;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(t * 1.5) * 0.2;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[radius, 0.03, 4, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

function NetworkLines({ count = 8 }: { count?: number }) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const nodes: [number, number, number][] = Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4 - 1,
    ]);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(
          nodes[i][0] - nodes[j][0],
          nodes[i][1] - nodes[j][1],
          nodes[i][2] - nodes[j][2],
        );
        if (dist < 5) {
          positions.push(...nodes[i], ...nodes[j]);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const t = state.clock.getElapsedTime();
    lineRef.current.rotation.y = t * 0.05;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.08 + Math.sin(t * 0.6) * 0.04;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#6366f1" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

export function FloatingGeometry({ variant = 'hero' }: FloatingGeometryProps) {
  if (variant === 'minimal') {
    return (
      <>
        <WireframeMesh position={[0, 0, -2]} rotation={[0.3, 0.5, 0]} scale={1.5} color="#6366f1" speed={0.3} shape="icosahedron" />
        <GlowRing position={[0, 0, -3]} color="#6366f1" radius={2.5} />
      </>
    );
  }

  if (variant === 'builder') {
    return (
      <>
        <WireframeMesh position={[-4, 1, -2]} rotation={[0.2, 0.4, 0]} scale={1.2} color="#06b6d4" speed={0.25} shape="octahedron" />
        <WireframeMesh position={[4, -1, -2]} rotation={[0.5, 0.2, 0.3]} scale={1.0} color="#8b5cf6" speed={0.35} shape="dodecahedron" />
        <GlowRing position={[0, 0, -4]} color="#06b6d4" radius={3.5} />
        <GlowRing position={[0, 0, -5]} color="#8b5cf6" radius={5} />
        <NetworkLines count={10} />
      </>
    );
  }

  return (
    <>
      <WireframeMesh position={[-4, 2, -2]} rotation={[0.2, 0.4, 0]} scale={1.4} color="#6366f1" speed={0.2} shape="icosahedron" />
      <WireframeMesh position={[4.5, -1.5, -3]} rotation={[0.5, 0.2, 0.3]} scale={1.1} color="#8b5cf6" speed={0.28} shape="dodecahedron" />
      <WireframeMesh position={[0, -3, -1]} rotation={[0.1, 0.7, 0.2]} scale={0.8} color="#06b6d4" speed={0.4} shape="octahedron" />
      <WireframeMesh position={[2.5, 3, -4]} rotation={[0.3, 0.1, 0.5]} scale={0.9} color="#10b981" speed={0.22} shape="torus" />
      <WireframeMesh position={[-3.5, -2, -3]} rotation={[0.6, 0.3, 0.1]} scale={0.7} color="#f59e0b" speed={0.35} shape="octahedron" />

      <GlowRing position={[0, 0, -5]} color="#6366f1" radius={4} />
      <GlowRing position={[1, 0.5, -6]} color="#8b5cf6" radius={6} />
      <GlowRing position={[-1, -0.5, -7]} color="#06b6d4" radius={8} />

      <NetworkLines count={12} />
    </>
  );
}
