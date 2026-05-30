import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
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
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);

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

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    updateScale(event.deltaY > 0 ? -0.06 : 0.06);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
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
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  return (
    <div className="genealogy-canvas-shell">
      <div className="genealogy-canvas-toolbar" aria-label="Binary tree canvas controls">
        <span className="genealogy-canvas-hint">
          <Move className="size-3.5" />
          Drag canvas, scroll to zoom
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
        </div>
      </div>
      <div
        className="genealogy-canvas-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
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
      <div className="genealogy-canvas-note">
        Yor uses the base binary placement view: left and right business legs, open slots, and point visibility without adding an extreme-left/extreme-right safety-net rule.
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
              <div className="genealogy-canvas-node-title">
                <strong>{source.username}</strong>
                <Badge variant="outline">{source.packageTier}</Badge>
                <Badge variant="secondary">{source.accountStateLabel}</Badge>
              </div>
              <p>{source.fullName}</p>
            </div>
            <div className="genealogy-canvas-node-stats">
              <span>L {source.leftPoints}</span>
              <span>R {source.rightPoints}</span>
              <span>{source.directReferrals} direct</span>
            </div>
          </>
        ) : (
          <>
            <div className="genealogy-canvas-node-orb">
              <Maximize2 className="size-4" />
            </div>
            <div className="genealogy-canvas-node-main">
              <div className="genealogy-canvas-node-title">
                <strong>Register Me</strong>
                <Badge variant="warning">{node.side}</Badge>
              </div>
              <p>Available {node.side} placement slot</p>
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
