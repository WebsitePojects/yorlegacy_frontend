import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, Minus, Move, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GenealogyTreeNode } from '../../types/auth';

type GenealogyTreeProps = {
  root: GenealogyTreeNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  onNavigateToNode?: (username: string) => void;
};

const DEFAULT_SCALE = 0.78;

export function GenealogyTree({ root, onSelect, selectedNodeId, onNavigateToNode }: GenealogyTreeProps) {
  const canvasRoot = useMemo(() => toCanvasNode(root, 0, 'root'), [root]);
  const navigate = useNavigate();
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number; dragging: boolean } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  function clampScale(nextScale: number) {
    return Math.min(1.45, Math.max(0.42, Number(nextScale.toFixed(2))));
  }

  function updateScale(delta: number) {
    setScale((current) => clampScale(current + delta));
  }

  function resetCanvas() {
    setScale(DEFAULT_SCALE);
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
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    setIsActive(true);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

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
      offsetY: offset.y,
      dragging: false
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

    drag.dragging = true;
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

  function handleViewportLeave() {
    if (pointersRef.current.size === 0) {
      setIsActive(false);
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
        onPointerLeave={handleViewportLeave}
        onClick={() => setIsActive(true)}
      >
        {!isActive ? (
          <div
            className="genealogy-canvas-overlay"
            role="button"
            tabIndex={0}
            onPointerDown={(event) => {
              event.stopPropagation();
              setIsActive(true);
            }}
            onClick={(event) => {
              event.stopPropagation();
              setIsActive(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsActive(true);
              }
            }}
          >
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
            onNavigateToNode={onNavigateToNode}
            onOpenSlot={(slot) => {
              const params = new URLSearchParams({
                ref: slot.parentReferralCode ?? slot.parentUsername,
                sponsor: slot.parentUsername,
                preferredSide: slot.side
              });
              navigate(`/register?${params.toString()}`);
            }}
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
  shadowSlot?: GenealogyTreeNode['shadowSlots']['left'] | GenealogyTreeNode['shadowSlots']['right'];
  parentUsername?: string;
  parentReferralCode?: string;
  children: CanvasNode[];
};

function toCanvasNode(node: GenealogyTreeNode, level: number, side: 'root' | 'left' | 'right'): CanvasNode {
  const leftChild = node.children.find((child) => child.placement === 'left');
  const rightChild = node.children.find((child) => child.placement === 'right');
  const children: CanvasNode[] = [];

  children.push(leftChild ? toCanvasNode(leftChild, level + 1, 'left') : toOpenSlot(node, level + 1, 'left'));
  children.push(rightChild ? toCanvasNode(rightChild, level + 1, 'right') : toOpenSlot(node, level + 1, 'right'));

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
    shadowSlot: parent.shadowSlots?.[side],
    parentUsername: parent.username,
    parentReferralCode: parent.referralCode,
    children: []
  };
}

function BinaryBranch({
  node,
  onSelect,
  selectedNodeId,
  onNavigateToNode,
  onOpenSlot
}: {
  node: CanvasNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  onNavigateToNode?: (username: string) => void;
  onOpenSlot?: (slot: { parentUsername: string; parentReferralCode?: string; side: 'left' | 'right' }) => void;
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
          node.shadowSlot && 'is-shadow-slot',
          node.shadowSlot?.state === 'activated_shadow' && 'is-shadow-activated',
          isSelected && 'is-selected'
        )}
        onClick={(event) => {
          event.stopPropagation();
          if (source) {
            onSelect?.(source.nodeId);
            onNavigateToNode?.(source.username);
            return;
          }

          if (node.isOpenSlot && node.parentUsername && node.side !== 'root') {
            onOpenSlot?.({
              parentUsername: node.parentUsername,
              parentReferralCode: node.parentReferralCode,
              side: node.side
            });
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
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
              <Badge variant={node.shadowSlot?.state === 'activated_shadow' ? 'success' : 'warning'}>
                {node.side}
              </Badge>
              <div className="genealogy-canvas-node-title">
                <strong>{node.shadowSlot?.label ?? 'Available Slot'}</strong>
              </div>
              <p>{node.shadowSlot?.note ?? (node.parentUsername ? `${node.parentUsername} ${node.side} leg` : 'Ready for the next placement')}</p>
            </div>
            <div className="genealogy-canvas-shadow-state">
              {node.shadowSlot?.activationStatus ?? 'inactive'}
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
              onNavigateToNode={onNavigateToNode}
              onOpenSlot={onOpenSlot}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
