import { useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type InteractiveGlowCanvasProps = {
  className?: string;
};

export function InteractiveGlowCanvas({ className }: InteractiveGlowCanvasProps) {
  const [pointer, setPointer] = useState({ x: 50, y: 42 });

  return (
    <div
      className={cn('interactive-glow-canvas', className)}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        setPointer({ x, y });
      }}
      style={
        {
          '--pointer-x': `${pointer.x}%`,
          '--pointer-y': `${pointer.y}%`
        } as CSSProperties
      }
    >
      <span className="interactive-glow-orb interactive-glow-orb--one" />
      <span className="interactive-glow-orb interactive-glow-orb--two" />
      <span className="interactive-glow-orb interactive-glow-orb--three" />
      <span className="interactive-glow-grid" />
    </div>
  );
}
