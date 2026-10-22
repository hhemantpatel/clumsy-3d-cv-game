import React from 'react';
import { useFrame } from '@react-three/fiber';
import { envUniforms } from './materials';

/** The single per-frame update shared by all wind/water/sky shaders (no allocations). */
export const WindDriver: React.FC = () => {
  useFrame(({ clock }) => {
    envUniforms.uTime.value = clock.elapsedTime;
  });
  return null;
};
