'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ParticleField } from './ParticleField';
import { FloatingGeometry } from './FloatingGeometry';
import { OrbitControls } from '@react-three/drei';

interface SceneProps {
  variant?: 'hero' | 'builder' | 'minimal';
  interactive?: boolean;
}

export function Scene({ variant = 'hero', interactive = false }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#6366f1" />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[0, 10, -10]} intensity={0.6} color="#8b5cf6" />

        <ParticleField count={variant === 'minimal' ? 300 : 600} />
        <FloatingGeometry variant={variant} />

        {interactive && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />}
      </Suspense>
    </Canvas>
  );
}
