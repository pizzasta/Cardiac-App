import React from 'react';
import { Platform } from 'react-native';

// Renders `fallback` instead of a 3D canvas when WebGL is missing (old
// browsers, some headless or locked-down environments) or the scene throws.

export function webglAvailable(): boolean {
  if (Platform.OS !== 'web') return true;
  try {
    const g: any = globalThis;
    const canvas = g.document?.createElement('canvas');
    return !!(canvas?.getContext('webgl2') || canvas?.getContext('webgl'));
  } catch {
    return false;
  }
}

export default class GLBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: !webglAvailable() };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
