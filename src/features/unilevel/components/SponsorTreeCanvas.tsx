import { cn } from '@/lib/utils';
import type { SponsorTreeApiNode } from '@/lib/api';
import {
  Maximize2,
  Minimize2,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Search,
  Target,
  Users
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent as ReactWheelEvent
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Connection = { id: string; x1: number; y1: number; x2: number; y2: number };

type SponsorTreeCanvasProps = {
  root: SponsorTreeApiNode;
  onNavigate: (username: string) => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_SCALE = 0.82;
const DEFAULT_OFFSET = { x: 0, y: 64 };

function packageColor(tier: string): string {
  const t = tier.trim().toUpperCase();
  if (t === 'VIP') return 'border-amber-500/60 bg-amber-500/10 text-amber-300';
  if (t === 'BUSINESS') return 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300';
  if (t === 'STANDARD') return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
  if (t === 'CLASSIC') return 'border-violet-500/60 bg-violet-500/10 text-violet-300';
  return 'border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)]';
}

function stateDot(label: SponsorTreeApiNode['accountStateLabel']): string {
  if (label === 'FS') return 'bg-blue-500';
  if (label === 'CD - Paid') return 'bg-amber-400';
  if (label === 'CD - Unpaid') return 'bg-red-500';
  return 'bg-emerald-500';
}

function flattenTree(node: SponsorTreeApiNode, depth = 0): SponsorTreeApiNode[] {
  const result: SponsorTreeApiNode[] = [node];
  for (const child of node.children) result.push(...flattenTree(child, depth + 1));
  return result;
}

function getVerticalGap(depth: number): number {
  if (depth <= 1) return 72;
  if (depth <= 3) return 52;
  if (depth <= 6) return 36;
  return 24;
}

// ── Node component ─────────────────────────────────────────────────────────────

type NodeCardProps = {
  node: SponsorTreeApiNode;
  visibleDepth: number;
  focusedKey: string | null;
  onNavigate: (username: string) => void;
  registerRef: (key: string, el: HTMLDivElement | null) => void;
};

function SponsorBranch({ node, visibleDepth, focusedKey, onNavigate, registerRef }: NodeCardProps) {
  const isFocused = focusedKey === node.nodeId;
  const hasChildren = node.children.length > 0 && node.depth < visibleDepth - 1;
  const vGap = getVerticalGap(node.depth);

  return (
    <div
      className="sponsor-branch"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Node card */}
      <div
        ref={(el) => registerRef(node.nodeId, el)}
        role="button"
        tabIndex={0}
        aria-label={`Navigate to ${node.username}'s sponsor tree`}
        className={cn(
          'sponsor-node-card',
          'relative flex flex-col gap-1 rounded-2xl border px-3 py-2 text-left cursor-pointer select-none',
          'transition-all duration-150',
          'hover:scale-[1.03] hover:shadow-lg hover:z-10',
          isFocused && 'ring-2 ring-[var(--ring)] ring-offset-1',
          packageColor(node.packageTier)
        )}
        style={{ width: 136, minHeight: 64 }}
        onClick={() => onNavigate(node.username)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(node.username); } }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className={cn('size-2 shrink-0 rounded-full', stateDot(node.accountStateLabel))} />
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]">
            {node.username}
          </span>
          <span className="shrink-0 rounded-full border px-1 text-[9px] font-semibold leading-4">
            {node.packageTier.slice(0, 3).toUpperCase()}
          </span>
        </div>
        <p className="truncate text-[10px] text-[var(--muted-foreground)]">
          {node.fullName.length > 18 ? node.fullName.slice(0, 18) + '…' : node.fullName}
        </p>
        {node.directReferrals > 0 && (
          <div className="flex items-center gap-1">
            <Users className="size-2.5 text-[var(--muted-foreground)]" />
            <span className="text-[9px] text-[var(--muted-foreground)]">{node.directReferrals}</span>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && (
        <div
          className="sponsor-children"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            marginTop: vGap
          }}
        >
          {node.children.map((child) => (
            <SponsorBranch
              key={child.nodeId}
              node={child}
              visibleDepth={visibleDepth}
              focusedKey={focusedKey}
              onNavigate={onNavigate}
              registerRef={registerRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Canvas ────────────────────────────────────────────────────────────────

export function SponsorTreeCanvas({ root, onNavigate }: SponsorTreeCanvasProps) {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState(DEFAULT_OFFSET);
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleDepth, setVisibleDepth] = useState(5);
  const [focusedKey, setFocusedKey] = useState<string | null>(root.nodeId);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [nodeSearch, setNodeSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scaleRef = useRef(scale);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number; dragging: boolean } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDistanceRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const allNodes = useMemo(() => flattenTree(root), [root]);

  const filteredSearch = useMemo(() => {
    const q = nodeSearch.trim().toUpperCase();
    if (!q) return allNodes.slice(0, 24);
    return allNodes.filter(
      (n) =>
        n.username.toUpperCase().includes(q) ||
        n.fullName.toUpperCase().includes(q)
    ).slice(0, 24);
  }, [nodeSearch, allNodes]);

  function registerRef(key: string, el: HTMLDivElement | null) {
    if (el) nodeRefs.current.set(key, el);
    else nodeRefs.current.delete(key);
  }

  function clampScale(v: number) {
    return Math.min(1.8, Math.max(0.08, Number(v.toFixed(2))));
  }

  function updateScale(delta: number) {
    const next = clampScale(scaleRef.current + delta);
    if (next === scaleRef.current) return;
    const viewport = viewportRef.current;
    if (viewport) {
      const r = viewport.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const ratio = next / scaleRef.current;
      setOffset((cur) => ({ x: cur.x + cx * (1 - ratio), y: cur.y + cy * (1 - ratio) }));
    }
    setScale(next);
  }

  function queueNodeFocus(key: string, yBias = 0) {
    if (focusFrameRef.current != null) cancelAnimationFrame(focusFrameRef.current);
    const tryFocus = (attempts = 0) => {
      const viewport = viewportRef.current;
      const target = nodeRefs.current.get(key);
      if (!viewport || !target) {
        if (attempts < 15) focusFrameRef.current = requestAnimationFrame(() => tryFocus(attempts + 1));
        return;
      }
      const vr = viewport.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      if (tr.width === 0) {
        if (attempts < 15) focusFrameRef.current = requestAnimationFrame(() => tryFocus(attempts + 1));
        return;
      }
      const dx = vr.left + vr.width / 2 - (tr.left + tr.width / 2);
      const dy = vr.top + vr.height / 2 - (tr.top + tr.height / 2) + yBias;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setOffset((cur) => ({ x: cur.x + dx, y: cur.y + dy }));
        if (attempts < 15) focusFrameRef.current = requestAnimationFrame(() => tryFocus(attempts + 1));
      }
    };
    focusFrameRef.current = requestAnimationFrame(() => tryFocus(0));
  }

  function resetCanvas() {
    setScale(DEFAULT_SCALE);
    setOffset(DEFAULT_OFFSET);
    setFocusedKey(root.nodeId);
    queueNodeFocus(root.nodeId, -120);
  }

  function fitCanvas() {
    setScale(0.6);
    setOffset(DEFAULT_OFFSET);
    queueNodeFocus(root.nodeId, -120);
  }

  // Rebuild SVG connections after render
  useEffect(() => {
    let active = true;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const newConns: Connection[] = [];

      const getPos = (el: HTMLElement, container: HTMLElement) => {
        let left = 0, top = 0;
        let cur: HTMLElement | null = el;
        while (cur && cur !== container) {
          left += cur.offsetLeft;
          top += cur.offsetTop;
          cur = cur.offsetParent as HTMLElement | null;
        }
        return { left, top };
      };

      const traverse = (node: SponsorTreeApiNode) => {
        const parentEl = nodeRefs.current.get(node.nodeId);
        if (parentEl && node.depth < visibleDepth - 1) {
          for (const child of node.children) {
            const childEl = nodeRefs.current.get(child.nodeId);
            if (childEl) {
              const pp = getPos(parentEl, canvas);
              const cp = getPos(childEl, canvas);
              newConns.push({
                id: `${node.nodeId}-${child.nodeId}`,
                x1: pp.left + parentEl.offsetWidth / 2,
                y1: pp.top + parentEl.offsetHeight,
                x2: cp.left + childEl.offsetWidth / 2,
                y2: cp.top
              });
            }
            traverse(child);
          }
        }
      };

      traverse(root);
      if (active) setConnections(newConns);
    };

    update();
    const frame = requestAnimationFrame(update);
    const timer = setTimeout(update, 60);
    window.addEventListener('resize', update);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', update);
    };
  }, [root, visibleDepth]);

  // Reset on root change
  useEffect(() => {
    setFocusedKey(root.nodeId);
    setScale(DEFAULT_SCALE);
    setOffset(DEFAULT_OFFSET);
    queueNodeFocus(root.nodeId, -120);
    return () => { if (focusFrameRef.current != null) cancelAnimationFrame(focusFrameRef.current); };
  }, [root.nodeId]);

  // Native wheel listener
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handler = (e: globalThis.WheelEvent) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cur = scaleRef.current;
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      const next = clampScale(cur + delta);
      if (next === cur) return;
      const rect = canvas.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const ratio = next / cur;
      setScale(next);
      setOffset((c) => ({ x: c.x + ox * (1 - ratio), y: c.y + oy * (1 - ratio) }));
    };
    viewport.addEventListener('wheel', handler, { passive: false });
    return () => viewport.removeEventListener('wheel', handler);
  }, [isActive]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Search outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cur = scale;
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    const next = clampScale(cur + delta);
    if (next === cur) return;
    const rect = canvas.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    const ratio = next / cur;
    setScale(next);
    setOffset((c) => ({ x: c.x + ox * (1 - ratio), y: c.y + oy * (1 - ratio) }));
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsActive(true);
    setIsDragging(false);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size > 1) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchDistanceRef.current = Math.hypot(b.x - a.x, b.y - a.y);
      dragRef.current = null;
      setIsDragging(true);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y, dragging: false };
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (pointersRef.current.has(e.pointerId)) pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size > 1) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (pinchDistanceRef.current != null) updateScale((dist - pinchDistanceRef.current) / 240);
      pinchDistanceRef.current = dist;
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    drag.dragging = true;
    setIsDragging(true);
    setOffset({ x: drag.offsetX + e.clientX - drag.x, y: drag.offsetY + e.clientY - drag.y });
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
    if (pointersRef.current.size === 0) setIsDragging(false);
  }

  async function toggleFullscreen() {
    if (!shellRef.current) return;
    if (document.fullscreenElement === shellRef.current) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
  }

  const depthOptions = useMemo(() => {
    const opts: number[] = [];
    for (let d = 2; d <= 20; d++) opts.push(d);
    return opts;
  }, []);

  function handleNavigate(username: string) {
    setFocusedKey(username);
    onNavigate(username);
  }

  return (
    <div
      ref={shellRef}
      className={cn('genealogy-canvas-shell', isActive && 'is-active', isDragging && 'is-dragging', isFullscreen && 'is-fullscreen')}
    >
      {/* Toolbar */}
      <div className="genealogy-canvas-toolbar" aria-label="Sponsor tree canvas controls">
        <span className="genealogy-canvas-hint">
          <Move className="size-3.5" />
          {isActive ? 'Canvas engaged: drag and scroll to zoom' : 'Click the canvas to engage controls'}
        </span>

        <label className="genealogy-canvas-depth">
          <span>Depth</span>
          <select value={visibleDepth} onChange={(e) => setVisibleDepth(Number(e.target.value))}>
            {depthOptions.map((d) => (
              <option key={d} value={d}>{d} levels</option>
            ))}
          </select>
        </label>

        <div ref={searchRef} className="genealogy-canvas-search">
          <Search className="size-4" />
          <input
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search username or name"
            type="search"
          />
          <button type="button" onClick={() => {
            const match = filteredSearch[0];
            if (match) {
              setFocusedKey(match.nodeId);
              setIsSearchOpen(false);
              setIsActive(true);
              queueNodeFocus(match.nodeId, -120);
            }
          }}>Find</button>
          {isSearchOpen && filteredSearch.length > 0 && (
            <div className="genealogy-canvas-search-popover">
              <div className="genealogy-canvas-search-caption">Sponsor tree members</div>
              <div className="genealogy-canvas-search-results" role="listbox">
                {filteredSearch.map((n) => (
                  <button
                    key={n.nodeId}
                    type="button"
                    role="option"
                    className="genealogy-canvas-search-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFocusedKey(n.nodeId);
                      setNodeSearch(n.username);
                      setIsSearchOpen(false);
                      setIsActive(true);
                      queueNodeFocus(n.nodeId, -120);
                    }}
                  >
                    <span className="genealogy-canvas-search-kind">member</span>
                    <div className="genealogy-canvas-search-copy">
                      <strong>{n.username}</strong>
                      <p>{n.fullName}</p>
                    </div>
                    <small>{n.packageTier}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="genealogy-canvas-actions">
          <button type="button" data-tooltip="Zoom Out" onClick={() => updateScale(-0.08)} aria-label="Zoom out"><Minus className="size-4" /></button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" data-tooltip="Zoom In" onClick={() => updateScale(0.08)} aria-label="Zoom in"><Plus className="size-4" /></button>
          <button type="button" data-tooltip="Reset View" onClick={resetCanvas} aria-label="Reset view"><RotateCcw className="size-4" /></button>
          <button type="button" data-tooltip="Center Root" onClick={fitCanvas} aria-label="Fit view"><Target className="size-4" /></button>
          <button type="button" data-tooltip={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={() => void toggleFullscreen()} aria-label="Toggle fullscreen">
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Viewport */}
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
        {!isActive && (
          <div
            className="genealogy-canvas-overlay"
            role="button"
            tabIndex={0}
            onPointerDown={(e) => { e.stopPropagation(); setIsActive(true); }}
            onClick={(e) => { e.stopPropagation(); setIsActive(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsActive(true); } }}
          >
            <p>Click or touch the tree to engage drag, zoom, and navigation controls.</p>
          </div>
        )}

        <div className="genealogy-canvas-pan" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
          <div className="genealogy-canvas" style={{ transform: `scale(${scale})` }} ref={canvasRef}>
            {/* SVG connection lines */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
            >
              <defs>
                <linearGradient id="sponsor-connector-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(245, 200, 66, 0.65)" />
                  <stop offset="100%" stopColor="rgba(122, 64, 32, 0.25)" />
                </linearGradient>
              </defs>
              {connections.map((conn) => {
                // Elbow / orthogonal connector: down from the parent, across a shared
                // horizontal bus at the midpoint, then down into the child — the classic
                // org-chart look that always lands cleanly on each node.
                const midY = conn.y1 + (conn.y2 - conn.y1) / 2;
                const path = `M ${conn.x1} ${conn.y1} L ${conn.x1} ${midY} L ${conn.x2} ${midY} L ${conn.x2} ${conn.y2}`;
                return (
                  <path
                    key={conn.id}
                    d={path}
                    stroke="url(#sponsor-connector-gradient)"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                    fill="none"
                  />
                );
              })}
            </svg>

            {/* Tree */}
            <div style={{ position: 'relative', zIndex: 2, padding: '16px 40px 60px' }}>
              <SponsorBranch
                node={root}
                visibleDepth={visibleDepth}
                focusedKey={focusedKey}
                onNavigate={handleNavigate}
                registerRef={registerRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="genealogy-canvas-breakdown">
        <div>
          <span>Viewing</span>
          <strong>{root.username}</strong>
          <p>{root.fullName}</p>
        </div>
        <div>
          <span>Package</span>
          <strong>{root.packageTier}</strong>
          <p>{root.accountStateLabel}</p>
        </div>
        <div>
          <span>Direct Referrals</span>
          <strong>{root.directReferrals}</strong>
          <p>Click any node to navigate into its sponsor tree</p>
        </div>
      </div>
    </div>
  );
}
