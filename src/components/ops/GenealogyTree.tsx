import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, Minus, Move, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import type { GenealogyTreeNode } from '../../types/auth';

type GenealogyTreeProps = {
  root: GenealogyTreeNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
};

export function GenealogyTree({ root, onSelect, selectedNodeId }: GenealogyTreeProps) {
  const canvasRoot = useMemo(() => toCanvasNode(root, 0, 'root'), [root]);
  const [scale, setScale] = useState(0.92);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  function clampScale(nextScale: number) {
    return Math.min(1.35, Math.max(0.52, Number(nextScale.toFixed(2))));
  }

  function updateScale(delta: number) {
    setScale((current) => clampScale(current + delta));
  }

  function resetCanvas() {
    setScale(0.92);
    setOffset({ x: 0, y: 0 });
  }

  useEffect(() => {
    function handlePointerAway(event: Event) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setIsActive(false);
      }
    }

    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    }

    document.addEventListener('pointerdown', handlePointerAway);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('pointerdown', handlePointerAway);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousDocumentOverflow = documentElement.style.overflow;

    if (isActive) {
      body.style.overflow = 'hidden';
      documentElement.style.overflow = 'hidden';
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isActive]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const handleNativeWheel = (event: globalThis.WheelEvent) => {
      if (!isActive) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateScale(event.deltaY > 0 ? -0.06 : 0.06);
    };

    viewport.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      viewport.removeEventListener('wheel', handleNativeWheel);
    };
  }, [isActive]);

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!isActive) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    updateScale(event.deltaY > 0 ? -0.06 : 0.06);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    setIsActive(true);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if (pointersRef.current.size > 1) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchDistanceRef.current = Math.hypot(second.x - first.x, second.y - first.y);
      dragRef.current = null;
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pointersRef.current.size > 1) {
      const [first, second] = Array.from(pointersRef.current.values());
      const nextDistance = Math.hypot(second.x - first.x, second.y - first.y);

      if (pinchDistanceRef.current != null) {
        updateScale((nextDistance - pinchDistanceRef.current) / 240);
      }

      pinchDistanceRef.current = nextDistance;
      return;
    }

    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setOffset({
      x: drag.offsetX + event.clientX - drag.x,
      y: drag.offsetY + event.clientY - drag.y
    });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchDistanceRef.current = null;
    }
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  async function toggleFullscreen() {
    if (!shellRef.current) {
      return;
    }

    if (document.fullscreenElement === shellRef.current) {
      await document.exitFullscreen();
      return;
    }

    await shellRef.current.requestFullscreen();
  }

  return (
    <div ref={shellRef} className={cn('genealogy-canvas-shell', isActive && 'is-active', isFullscreen && 'is-fullscreen')}>
      <div className="genealogy-canvas-toolbar" aria-label="Binary tree canvas controls">
        <span className="genealogy-canvas-hint">
          <Move className="size-3.5" />
          {isActive ? 'Canvas engaged: drag and scroll to zoom' : 'Click the canvas to engage controls'}
        </span>
        <div className="genealogy-canvas-actions">
          <button type="button" onClick={() => updateScale(-0.08)} aria-label="Zoom out">
            <Minus className="size-4" />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => updateScale(0.08)} aria-label="Zoom in">
            <Plus className="size-4" />
          </button>
          <button type="button" onClick={resetCanvas} aria-label="Reset tree view">
            <RotateCcw className="size-4" />
          </button>
          <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}>
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="genealogy-canvas-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={() => setIsActive(true)}
      >
        {!isActive ? (
          <div className="genealogy-canvas-overlay">
            <p>Click or touch the tree to engage drag, zoom, and fullscreen controls. Click anywhere outside when you want normal page scrolling again.</p>
          </div>
        ) : null}
        <div
          className="genealogy-canvas"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
        >
          <BinaryBranch
            node={canvasRoot}
            onSelect={onSelect}
            selectedNodeId={selectedNodeId}
          />
        </div>
      </div>
    </div>
  );
}

type CanvasNode = {
  key: string;
  side: 'root' | 'left' | 'right';
  level: number;
  source?: GenealogyTreeNode;
  isOpenSlot?: boolean;
  children: CanvasNode[];
};

function toCanvasNode(node: GenealogyTreeNode, level: number, side: 'root' | 'left' | 'right'): CanvasNode {
  const leftChild = node.children.find((child) => child.placement === 'left');
  const rightChild = node.children.find((child) => child.placement === 'right');
  const maxDepth = 3;
  const children: CanvasNode[] = [];

  if (level < maxDepth) {
    children.push(leftChild ? toCanvasNode(leftChild, level + 1, 'left') : toOpenSlot(node, level + 1, 'left'));
    children.push(rightChild ? toCanvasNode(rightChild, level + 1, 'right') : toOpenSlot(node, level + 1, 'right'));
  }

  return {
    key: node.nodeId,
    side,
    level,
    source: node,
    children
  };
}

function toOpenSlot(parent: GenealogyTreeNode, level: number, side: 'left' | 'right'): CanvasNode {
  return {
    key: `${parent.nodeId}-${side}-open-${level}`,
    side,
    level,
    isOpenSlot: true,
    children: []
  };
}

function BinaryBranch({
  node,
  onSelect,
  selectedNodeId
}: {
  node: CanvasNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}) {
  const source = node.source;
  const isSelected = source ? selectedNodeId === source.nodeId : false;

  return (
    <div className="genealogy-canvas-branch">
      <button
        type="button"
        className={cn(
          'genealogy-canvas-node',
          node.side !== 'root' && `is-${node.side}`,
          node.isOpenSlot && 'is-open-slot',
          isSelected && 'is-selected'
        )}
        onClick={(event) => {
          event.stopPropagation();
          if (source) {
            onSelect?.(source.nodeId);
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        disabled={!source}
      >
        {source ? (
          <>
            <div className="genealogy-canvas-node-orb">
              {source.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="genealogy-canvas-node-main">
              <Badge variant="outline">{source.packageTier}</Badge>
              <div className="genealogy-canvas-node-title">
                <strong>{source.username}</strong>
              </div>
              <p>{source.fullName}</p>
            </div>
            <div className="genealogy-canvas-node-stats">
              <span>L {source.leftPoints}</span>
              <span>R {source.rightPoints}</span>
              <span>{source.directReferrals} D</span>
            </div>
            <div className="genealogy-canvas-node-status">{source.accountStateLabel}</div>
          </>
        ) : (
          <>
            <div className="genealogy-canvas-node-orb">
              <Plus className="size-4" />
            </div>
            <div className="genealogy-canvas-node-main">
              <Badge variant="warning">{node.side}</Badge>
              <div className="genealogy-canvas-node-title">
                <strong>Available Slot</strong>
              </div>
              <p>Ready for the next placement</p>
            </div>
          </>
        )}
      </button>

      {node.children.length ? (
        <div className="genealogy-canvas-children">
          {node.children.map((child) => (
            <BinaryBranch
              key={child.key}
              node={child}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
