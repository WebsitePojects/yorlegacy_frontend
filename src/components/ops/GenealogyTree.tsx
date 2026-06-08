import { Badge } from '@/components/ui/badge';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { cn } from '@/lib/utils';
import {
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Minimize2,
  Minus,
  Move,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Target
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GenealogyTreeNode } from '../../types/auth';

type GenealogyTreeProps = {
  root: GenealogyTreeNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  onNavigateToNode?: (username: string) => void;
  onOpenSlot?: (slot: { parentUsername: string; parentReferralCode?: string; side: 'left' | 'right' }) => void;
  adminMode?: boolean;
};

type SearchOption = {
  key: string;
  title: string;
  subtitle: string;
  meta: string;
  searchValue: string;
  nodeId?: string;
  kind: 'member' | 'shadow';
};

type CanvasNode = {
  key: string;
  side: 'root' | 'left' | 'right';
  level: number;
  source?: GenealogyTreeNode;
  isOpenSlot?: boolean;
  shadowSlot?: GenealogyTreeNode['shadowSlots']['left'] | GenealogyTreeNode['shadowSlots']['right'];
  isShadowNode?: boolean;
  parentUsername?: string;
  parentReferralCode?: string;
  placementParentUsername?: string;
  placementSide?: 'left' | 'right';
  children: CanvasNode[];
};

const DEFAULT_SCALE = 0.82;
const DEFAULT_OFFSET = { x: 0, y: 72 };

function compactAccountState(value: GenealogyTreeNode['accountStateLabel']) {
  return value.startsWith('CD') ? 'CD' : value;
}

function packageTone(packageTier: string) {
  const normalized = packageTier.trim().toUpperCase();

  if (normalized === 'VIP') {
    return 'is-vip';
  }

  if (normalized === 'BUSINESS') {
    return 'is-business';
  }

  if (normalized === 'STANDARD') {
    return 'is-standard';
  }

  if (normalized === 'CLASSIC') {
    return 'is-classic';
  }

  return 'is-basic';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildExportRows(nodes: CanvasNode[]) {
  return nodes.map((node) => ({
    fullName: node.source?.fullName ?? node.shadowSlot?.label ?? 'Open Slot',
    username: node.source?.username ?? '',
    packageTier: node.source?.packageTier ?? (node.isShadowNode ? 'Shadow' : 'Open'),
    accountType: node.source ? compactAccountState(node.source.accountStateLabel) : node.isShadowNode ? 'SHADOW' : 'OPEN',
    kind: node.source ? 'Member' : node.isShadowNode ? 'Shadow' : 'Open Slot',
    level: String(node.level),
    leg: node.side.toUpperCase(),
    parent: node.parentUsername ?? '',
    trace: node.source?.tracePath ?? node.shadowSlot?.note ?? ''
  }));
}

function toCsv(rows: Array<Record<string, string>>, delimiter = ',') {
  const headers = ['fullName', 'username', 'packageTier', 'accountType', 'kind', 'level', 'leg', 'parent', 'trace'];
  const serialize = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.join(delimiter), ...rows.map((row) => headers.map((header) => serialize(row[header] ?? '')).join(delimiter))].join('\n');
}

function openPrintableExport(title: string, rows: Array<Record<string, string>>, autoPrint: boolean) {
  const printable = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');

  if (!printable) {
    return false;
  }

  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.fullName}</td>
          <td>${row.username}</td>
          <td>${row.packageTier}</td>
          <td>${row.accountType}</td>
          <td>${row.kind}</td>
          <td>${row.level}</td>
          <td>${row.leg}</td>
          <td>${row.parent}</td>
          <td>${row.trace}</td>
        </tr>`
    )
    .join('');

  printable.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 16px; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Username</th>
              <th>Package</th>
              <th>Account</th>
              <th>Kind</th>
              <th>Level</th>
              <th>Leg</th>
              <th>Parent</th>
              <th>Trace</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printable.document.close();
  printable.focus();

  if (autoPrint) {
    printable.print();
  }

  return true;
}

export function GenealogyTree({ root, onSelect, selectedNodeId, onNavigateToNode, onOpenSlot, adminMode = false }: GenealogyTreeProps) {
  const navigate = useNavigate();
  const { confirmAction, presentNotice } = useFeedback();
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState(DEFAULT_OFFSET);
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleDepth, setVisibleDepth] = useState(3);
  const [nodeSearch, setNodeSearch] = useState('');
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [highlightedSearchKey, setHighlightedSearchKey] = useState<string | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const focusFrameRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number; dragging: boolean } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const canvasRoot = useMemo(() => toCanvasNode(root, 0, 'root', visibleDepth), [root, visibleDepth]);
  const searchableNodes = useMemo(() => flattenCanvasNodes(canvasRoot), [canvasRoot]);
  const selectedCanvasNode = useMemo(
    () =>
      searchableNodes.find((node) => node.source?.nodeId === selectedNodeId || node.key === focusedNodeKey) ??
      searchableNodes.find((node) => node.source?.nodeId === root.nodeId) ??
      canvasRoot,
    [canvasRoot, focusedNodeKey, root.nodeId, searchableNodes, selectedNodeId]
  );
  const searchOptions = useMemo(
    () => searchableNodes.filter((node) => node.source || node.isShadowNode).map(toSearchOption),
    [searchableNodes]
  );
  const filteredSearchOptions = useMemo(() => {
    const query = nodeSearch.trim().toUpperCase();
    if (!query) {
      return searchOptions;
    }

    return searchOptions.filter((option) => option.searchValue.includes(query));
  }, [nodeSearch, searchOptions]);
  const exportRows = useMemo(
    () => buildExportRows(searchableNodes).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)]))),
    [searchableNodes]
  );

  function clampScale(nextScale: number) {
    return Math.min(1.5, Math.max(0.01, Number(nextScale.toFixed(2))));
  }

  function updateScale(delta: number) {
    setScale((current) => clampScale(current + delta));
  }

  function queueNodeFocus(nodeKey: string, yBias = 0) {
    if (focusFrameRef.current != null) {
      cancelAnimationFrame(focusFrameRef.current);
    }

    const tryFocus = (attempts = 0) => {
      const viewport = viewportRef.current;
      const target = nodeRefs.current.get(nodeKey);

      if (!viewport || !target) {
        if (attempts < 15) {
          focusFrameRef.current = requestAnimationFrame(() => tryFocus(attempts + 1));
        }
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      if (targetRect.width === 0 || targetRect.height === 0) {
        if (attempts < 15) {
          focusFrameRef.current = requestAnimationFrame(() => tryFocus(attempts + 1));
        }
        return;
      }

      const deltaX = viewportRect.left + viewportRect.width / 2 - (targetRect.left + targetRect.width / 2);
      const deltaY = viewportRect.top + viewportRect.height / 2 - (targetRect.top + targetRect.height / 2) + yBias;

      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        setOffset((current) => ({
          x: current.x + deltaX,
          y: current.y + deltaY
        }));
        if (attempts < 15) {
          focusFrameRef.current = requestAnimationFrame(() => tryFocus(attempts + 1));
        }
      }
    };

    focusFrameRef.current = requestAnimationFrame(() => tryFocus(0));
  }

  function resetCanvas() {
    setScale(DEFAULT_SCALE);
    setOffset(DEFAULT_OFFSET);
    setFocusedNodeKey(root.nodeId);
    queueNodeFocus(root.nodeId, -140);
  }

  function fitCanvas() {
    setScale(0.72);
    setOffset(DEFAULT_OFFSET);
    setFocusedNodeKey(root.nodeId);
    setIsActive(true);
    queueNodeFocus(root.nodeId, -140);
  }

  function registerNodeRef(key: string, element: HTMLDivElement | null) {
    if (element) {
      nodeRefs.current.set(key, element);
      return;
    }

    nodeRefs.current.delete(key);
  }

  function applySearchOption(option: SearchOption) {
    setFocusedNodeKey(option.key);
    setHighlightedSearchKey(option.key);
    setNodeSearch(option.title);
    setIsSearchOpen(false);
    setIsActive(true);

    if (option.nodeId) {
      onSelect?.(option.nodeId);
    }

    queueNodeFocus(option.key, -140);
  }

  function handleNodeSearch() {
    if (!nodeSearch.trim()) {
      setFocusedNodeKey(null);
      setIsSearchOpen(true);
      return;
    }

    const match = filteredSearchOptions[0];

    if (match) {
      applySearchOption(match);
      return;
    }

    setIsSearchOpen(true);
  }

  async function runExport(action: 'copy' | 'csv' | 'excel' | 'pdf' | 'print') {
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(toCsv(exportRows, '\t'));
        await presentNotice({
          title: 'Tree copied',
          description: 'The visible genealogy export rows are now on your clipboard.',
          tone: 'success'
        });
        return;
      }

      if (action === 'csv') {
        downloadBlob(new Blob([toCsv(exportRows)], { type: 'text/csv;charset=utf-8' }), `${root.username.toLowerCase()}-binary-tree.csv`);
        return;
      }

      if (action === 'excel') {
        const html = `<table><tr><th>Full Name</th><th>Username</th><th>Package</th><th>Account</th><th>Kind</th><th>Level</th><th>Leg</th><th>Parent</th><th>Trace</th></tr>${exportRows
          .map(
            (row) =>
              `<tr><td>${row.fullName}</td><td>${row.username}</td><td>${row.packageTier}</td><td>${row.accountType}</td><td>${row.kind}</td><td>${row.level}</td><td>${row.leg}</td><td>${row.parent}</td><td>${row.trace}</td></tr>`
          )
          .join('')}</table>`;
        downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), `${root.username.toLowerCase()}-binary-tree.xls`);
        return;
      }

      if (action === 'pdf') {
        if (!openPrintableExport(`${root.username} Binary Tree`, exportRows, true)) {
          throw new Error('Popup was blocked while opening the PDF print view.');
        }
        return;
      }

      if (!openPrintableExport(`${root.username} Binary Tree`, exportRows, true)) {
        throw new Error('Popup was blocked while opening the print view.');
      }
    } catch (cause) {
      await presentNotice({
        title: 'Unable to export tree',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    } finally {
      setIsExportOpen(false);
    }
  }

  useEffect(() => {
    function handlePointerAway(event: Event) {
      const target = event.target as Node;

      if (!shellRef.current?.contains(target)) {
        setIsActive(false);
        setIsDragging(false);
        setIsSearchOpen(false);
        setIsExportOpen(false);
        dragRef.current = null;
        pointersRef.current.clear();
        pinchDistanceRef.current = null;
      }

      if (!searchRef.current?.contains(target)) {
        setIsSearchOpen(false);
      }

      if (!exportRef.current?.contains(target)) {
        setIsExportOpen(false);
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
    if (!filteredSearchOptions.length) {
      setHighlightedSearchKey(null);
      return;
    }

    if (!highlightedSearchKey || !filteredSearchOptions.some((option) => option.key === highlightedSearchKey)) {
      setHighlightedSearchKey(filteredSearchOptions[0].key);
    }
  }, [filteredSearchOptions, highlightedSearchKey]);

  useEffect(() => {
    setFocusedNodeKey(root.nodeId);
    setScale(DEFAULT_SCALE);
    setOffset(DEFAULT_OFFSET);
    queueNodeFocus(root.nodeId, -140);

    return () => {
      if (focusFrameRef.current != null) {
        cancelAnimationFrame(focusFrameRef.current);
      }
    };
  }, [root.nodeId, visibleDepth]);

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
    setIsDragging(false);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size > 1) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchDistanceRef.current = Math.hypot(second.x - first.x, second.y - first.y);
      dragRef.current = null;
      setIsDragging(true);
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
    setIsDragging(true);
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

    if (pointersRef.current.size === 0) {
      setIsDragging(false);
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
    <div ref={shellRef} className={cn('genealogy-canvas-shell', isActive && 'is-active', isDragging && 'is-dragging', isFullscreen && 'is-fullscreen')}>
      <div className="genealogy-canvas-toolbar" aria-label="Binary tree canvas controls">
        <span className="genealogy-canvas-hint">
          <Move className="size-3.5" />
          {isActive ? 'Canvas engaged: drag and scroll to zoom' : 'Click the canvas to engage controls'}
        </span>
        <label className="genealogy-canvas-depth">
          <span>Depth</span>
          <select value={visibleDepth} onChange={(event) => setVisibleDepth(Number(event.target.value))}>
            {[2, 3, 4, 5, 6].map((depth) => (
              <option key={depth} value={depth}>
                {depth} levels
              </option>
            ))}
          </select>
        </label>
        <div ref={searchRef} className="genealogy-canvas-search">
          <Search className="size-4" />
          <input
            value={nodeSearch}
            onChange={(event) => setNodeSearch(event.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setIsSearchOpen(true);
                if (!filteredSearchOptions.length) {
                  return;
                }

                const currentIndex = filteredSearchOptions.findIndex((option) => option.key === highlightedSearchKey);
                const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % filteredSearchOptions.length : 0;
                setHighlightedSearchKey(filteredSearchOptions[nextIndex].key);
                return;
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setIsSearchOpen(true);
                if (!filteredSearchOptions.length) {
                  return;
                }

                const currentIndex = filteredSearchOptions.findIndex((option) => option.key === highlightedSearchKey);
                const nextIndex = currentIndex >= 0 ? (currentIndex - 1 + filteredSearchOptions.length) % filteredSearchOptions.length : filteredSearchOptions.length - 1;
                setHighlightedSearchKey(filteredSearchOptions[nextIndex].key);
                return;
              }

              if (event.key === 'Enter') {
                event.preventDefault();
                const highlightedOption = filteredSearchOptions.find((option) => option.key === highlightedSearchKey);
                if (highlightedOption) {
                  applySearchOption(highlightedOption);
                  return;
                }

                handleNodeSearch();
                return;
              }

              if (event.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            placeholder="Search username, name, or YOU"
            type="search"
            aria-autocomplete="list"
            aria-controls="genealogy-tree-search-results"
            aria-expanded={isSearchOpen}
            aria-activedescendant={highlightedSearchKey ? `genealogy-search-option-${highlightedSearchKey}` : undefined}
          />
          <button type="button" onClick={handleNodeSearch}>
            Find
          </button>
          {isSearchOpen ? (
            <div className="genealogy-canvas-search-popover">
              <div className="genealogy-canvas-search-caption">Visible nodes in this depth</div>
              <div id="genealogy-tree-search-results" className="genealogy-canvas-search-results" role="listbox" aria-label="Placement tree search results">
                {filteredSearchOptions.length ? (
                  filteredSearchOptions.map((option) => (
                    <button
                      key={option.key}
                      id={`genealogy-search-option-${option.key}`}
                      type="button"
                      role="option"
                      aria-selected={highlightedSearchKey === option.key}
                      className={cn('genealogy-canvas-search-option', highlightedSearchKey === option.key && 'is-highlighted')}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlightedSearchKey(option.key)}
                      onClick={() => applySearchOption(option)}
                    >
                      <span className={cn('genealogy-canvas-search-kind', option.kind === 'shadow' && 'is-shadow')}>{option.kind}</span>
                      <div className="genealogy-canvas-search-copy">
                        <strong>{option.title}</strong>
                        <p>{option.subtitle}</p>
                      </div>
                      <small>{option.meta}</small>
                    </button>
                  ))
                ) : (
                  <div className="genealogy-canvas-search-empty">No visible account matches this search.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="genealogy-canvas-actions">
          <button type="button" data-tooltip="Zoom Out" onClick={() => updateScale(-0.08)} aria-label="Zoom out">
            <Minus className="size-4" />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" data-tooltip="Zoom In" onClick={() => updateScale(0.08)} aria-label="Zoom in">
            <Plus className="size-4" />
          </button>
          <button type="button" data-tooltip="Reset View" onClick={resetCanvas} aria-label="Reset tree view">
            <RotateCcw className="size-4" />
          </button>
          <button type="button" data-tooltip="Center Root" onClick={fitCanvas} aria-label="Fit tree to viewport">
            <Target className="size-4" />
          </button>
          <div ref={exportRef} className={cn('genealogy-canvas-export', isExportOpen && 'is-open')}>
            <button type="button" data-tooltip="Export" onClick={() => setIsExportOpen((current) => !current)} aria-label="Export tree">
              <Download className="size-4" />
            </button>
            {isExportOpen ? (
              <div className="genealogy-canvas-export-menu">
                <button type="button" onClick={() => void runExport('copy')}>
                  <Copy className="size-4" />
                  Copy
                </button>
                <button type="button" onClick={() => void runExport('csv')}>
                  <FileText className="size-4" />
                  CSV
                </button>
                <button type="button" onClick={() => void runExport('excel')}>
                  <FileSpreadsheet className="size-4" />
                  Excel
                </button>
                <button type="button" onClick={() => void runExport('pdf')}>
                  <FileText className="size-4" />
                  PDF
                </button>
                <button type="button" onClick={() => void runExport('print')}>
                  <Printer className="size-4" />
                  Print
                </button>
              </div>
            ) : null}
          </div>
          <button type="button" data-tooltip={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen'} onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}>
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
            <p>Click or touch the tree to engage drag, zoom, and export controls. Click anywhere outside when you want normal page scrolling again.</p>
          </div>
        ) : null}

        <div className="genealogy-canvas-pan" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
          <div className="genealogy-canvas" style={{ transform: `scale(${scale})` }}>
            <BinaryBranch
              node={canvasRoot}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              focusedNodeKey={focusedNodeKey}
              onNavigateToNode={onNavigateToNode}
              adminMode={adminMode}
              onOpenSlot={(slot) => {
                if (onOpenSlot) {
                  onOpenSlot(slot);
                  return;
                }

                const params = new URLSearchParams({
                  origin: 'genealogy-slot',
                  ref: root.referralCode,
                  placementParentUsername: slot.parentUsername,
                  placementSide: slot.side
                });
                navigate(`/register?${params.toString()}`);
              }}
              registerNodeRef={registerNodeRef}
              onActivateShadow={async (label) => {
                const confirmed = await confirmAction({
                  title: 'Activate/Upgrade Shadow Account',
                  description: `Would you like to upgrade your shadow account ${label} using an activation code?`,
                  confirmLabel: 'Upgrade',
                  cancelLabel: 'Cancel'
                });

                if (confirmed) {
                  navigate('/member/activation-codes');
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="genealogy-canvas-breakdown" aria-label="Selected genealogy node breakdown">
        <div>
          <span>Selected</span>
          <strong>{selectedCanvasNode.source?.fullName ?? selectedCanvasNode.shadowSlot?.label ?? 'Open Slot'}</strong>
          <p>{selectedCanvasNode.source?.username ?? selectedCanvasNode.shadowSlot?.note ?? 'Select a node to inspect its placement context.'}</p>
        </div>
        <div>
          <span>Placement</span>
          <strong>{selectedCanvasNode.side.toUpperCase()}</strong>
          <p>Level {selectedCanvasNode.level}</p>
        </div>
        <div>
          <span>Binary Function</span>
          <strong>{selectedCanvasNode.isShadowNode ? 'Shadow Only' : selectedCanvasNode.source ? 'Member Node' : 'Open Slot'}</strong>
          <p>{selectedCanvasNode.isShadowNode ? 'No wallet, DR, unilevel, or binary-cycle rights while shadow state is inactive.' : 'Server revalidates slot availability before final registration.'}</p>
        </div>
      </div>
    </div>
  );
}

function toCanvasNode(
  node: GenealogyTreeNode,
  level: number,
  side: 'root' | 'left' | 'right',
  maxDepth = 4,
  parentShadowSlots?: GenealogyTreeNode['shadowSlots'],
  parentUsername?: string,
  parentReferralCode?: string
): CanvasNode {
  const isShadow = node.status === 'shadow';
  const children: CanvasNode[] = [];
  const shadowSlot = isShadow && parentShadowSlots ? parentShadowSlots[side as 'left' | 'right'] : undefined;

  if (level < maxDepth - 1) {
    const leftChild = node.children.find((child) => child.placement === 'left');
    const rightChild = node.children.find((child) => child.placement === 'right');

    if (leftChild) {
      children.push(toCanvasNode(leftChild, level + 1, 'left', maxDepth, node.shadowSlots, node.username, node.referralCode));
    } else {
      children.push(toOpenSlot(node.username, node.referralCode, level + 1, 'left', maxDepth, node.nodeId, 'left'));
    }

    if (rightChild) {
      children.push(toCanvasNode(rightChild, level + 1, 'right', maxDepth, node.shadowSlots, node.username, node.referralCode));
    } else {
      children.push(toOpenSlot(node.username, node.referralCode, level + 1, 'right', maxDepth, node.nodeId, 'right'));
    }
  }

  return {
    key: node.nodeId,
    side,
    level,
    source: isShadow ? undefined : node,
    isOpenSlot: false,
    shadowSlot,
    isShadowNode: isShadow,
    parentUsername: isShadow ? parentUsername : node.username,
    parentReferralCode: isShadow ? parentReferralCode : node.referralCode,
    placementParentUsername: parentUsername,
    placementSide: side === 'root' ? undefined : side,
    children
  };
}

function toOpenSlot(
  parentUsername: string,
  parentReferralCode: string,
  level: number,
  side: 'left' | 'right',
  maxDepth: number,
  parentKey: string,
  placementSide: 'left' | 'right'
): CanvasNode {
  const key = `${parentKey}-${side}-open-${level}`;
  const children: CanvasNode[] = [];
  if (level < maxDepth - 1) {
    children.push(toOpenSlot(parentUsername, parentReferralCode, level + 1, 'left', maxDepth, key, placementSide));
    children.push(toOpenSlot(parentUsername, parentReferralCode, level + 1, 'right', maxDepth, key, placementSide));
  }

  return {
    key,
    side,
    level,
    isOpenSlot: true,
    parentUsername,
    parentReferralCode,
    placementParentUsername: parentUsername,
    placementSide,
    children
  };
}

function flattenCanvasNodes(node: CanvasNode): CanvasNode[] {
  return [node, ...node.children.flatMap((child) => flattenCanvasNodes(child))];
}

function toSearchOption(node: CanvasNode): SearchOption {
  if (node.source) {
    return {
      key: node.key,
      title: node.source.username,
      subtitle: node.source.fullName,
      meta: `Level ${node.level} - ${node.side} leg - ${node.source.packageTier}`,
      searchValue: [node.source.username, node.source.fullName, node.source.referralCode, node.side, `level ${node.level}`].join(' ').toUpperCase(),
      nodeId: node.source.nodeId,
      kind: 'member'
    };
  }

  const label = node.shadowSlot?.label ?? node.key;
  const note = node.shadowSlot?.note ?? 'Binary Function Only';

  return {
    key: node.key,
    title: label,
    subtitle: note,
    meta: `Level ${node.level} - ${node.side} leg - Shadow`,
    searchValue: [label, note, node.shadowSlot?.id ?? '', node.side, `level ${node.level}`].join(' ').toUpperCase(),
    kind: 'shadow'
  };
}

function BinaryBranch({
  node,
  onSelect,
  selectedNodeId,
  focusedNodeKey,
  onNavigateToNode,
  onOpenSlot,
  registerNodeRef,
  onActivateShadow,
  adminMode = false
}: {
  node: CanvasNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  focusedNodeKey?: string | null;
  onNavigateToNode?: (username: string) => void;
  onOpenSlot?: (slot: { parentUsername: string; parentReferralCode?: string; side: 'left' | 'right' }) => void;
  registerNodeRef?: (key: string, element: HTMLDivElement | null) => void;
  onActivateShadow: (label: string) => Promise<void>;
  adminMode?: boolean;
}) {
  const source = node.source;
  const isSelected = source ? selectedNodeId === source.nodeId || focusedNodeKey === node.key : focusedNodeKey === node.key;
  const { presentNotice } = useFeedback();

  const handleAction = async () => {
    if (source) {
      onSelect?.(source.nodeId);
      onNavigateToNode?.(source.username);
      return;
    }

    if (node.isShadowNode) {
      await onActivateShadow(node.shadowSlot?.label ?? node.key);
      return;
    }

    if (node.isOpenSlot && node.parentUsername && node.side !== 'root') {
      if (adminMode) {
        await presentNotice({
          title: 'Admin View Only',
          description: 'Admin view: open slots cannot be encoded.',
          tone: 'info'
        });
        return;
      }
      onOpenSlot?.({
        parentUsername: node.parentUsername,
        parentReferralCode: node.parentReferralCode,
        side: node.placementSide ?? node.side
      });
    }
  };

  return (
    <div className="genealogy-canvas-branch">
      <div
        role="button"
        tabIndex={0}
        ref={(element) => registerNodeRef?.(node.key, element)}
        aria-label={
          source
            ? undefined
            : node.isShadowNode
              ? `Shadow account ${node.shadowSlot?.label ?? node.key}`
              : `Open slot ${node.side} under ${node.parentUsername ?? 'available placement'}`
        }
        className={cn(
          'genealogy-canvas-node',
          node.side !== 'root' && `is-${node.side}`,
          node.isOpenSlot && 'is-open-slot',
          node.isShadowNode && 'is-shadow-node',
          node.shadowSlot && 'is-shadow-slot',
          node.shadowSlot?.state === 'activated_shadow' && 'is-shadow-activated',
          source && packageTone(source.packageTier),
          isSelected && 'is-selected'
        )}
        onClick={(event) => {
          event.stopPropagation();
          void handleAction();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            void handleAction();
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {source ? (
          <>
            <div className="genealogy-canvas-node-orb">{source.username.slice(0, 2).toUpperCase()}</div>
            <div className="genealogy-canvas-node-main">
              <div className="genealogy-canvas-node-title">
                <strong>{source.fullName}</strong>
                <p>{source.username}</p>
              </div>
              <div className="genealogy-canvas-node-stats">
                <span>L: {source.leftPoints}</span>
                <span>R: {source.rightPoints}</span>
              </div>
            </div>
            
            <div className="genealogy-canvas-node-popover" role="presentation">
              <div className="genealogy-popover-header">
                <div className="genealogy-popover-avatar">
                  {source.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="genealogy-popover-name">
                  <strong>{source.fullName}</strong>
                  <p>@{source.username}</p>
                </div>
              </div>

              <div className="genealogy-popover-section-label">Account Details</div>
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Package Tier</span>
                <span className={cn('genealogy-popover-row-value', packageTone(source.packageTier))}>
                  {source.packageTier}
                </span>
              </div>
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Account State</span>
                <span className="genealogy-popover-row-value">
                  {source.accountStateLabel}
                </span>
              </div>
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Direct Referrals</span>
                <span className="genealogy-popover-row-value">
                  {source.directReferrals}
                </span>
              </div>
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Left Points</span>
                <span className="genealogy-popover-row-value is-positive">
                  {source.leftPoints}
                </span>
              </div>
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Right Points</span>
                <span className="genealogy-popover-row-value is-positive">
                  {source.rightPoints}
                </span>
              </div>
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Level / Leg</span>
                <span className="genealogy-popover-row-value">
                  Level {node.level} - {node.side.toUpperCase()}
                </span>
              </div>
              {node.placementParentUsername && (
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Placement Parent</span>
                  <span className="genealogy-popover-row-value">
                    {node.placementParentUsername}
                  </span>
                </div>
              )}
              <div className="genealogy-popover-row">
                <span className="genealogy-popover-row-label">Referral Code</span>
                <span className="genealogy-popover-row-value">
                  {source.referralCode}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="genealogy-canvas-node-orb">
              <Plus className="size-4" />
            </div>
            <div className="genealogy-canvas-node-main">
              <div className="genealogy-canvas-node-title">
                <strong>{node.shadowSlot?.label ?? 'Open Slot'}</strong>
                <p>{node.isShadowNode ? 'Shadow Slot' : 'Available'}</p>
              </div>
            </div>
            
            {node.isShadowNode ? (
              <div className="genealogy-canvas-node-popover" role="presentation">
                <div className="genealogy-popover-header">
                  <div className="genealogy-popover-avatar">
                    {node.shadowSlot?.label.slice(0, 2).toUpperCase() ?? 'SH'}
                  </div>
                  <div className="genealogy-popover-name">
                    <strong>{node.shadowSlot?.label ?? 'Shadow Slot'}</strong>
                    <p>{node.shadowSlot?.id}</p>
                  </div>
                </div>

                <div className="genealogy-popover-section-label">Shadow Configuration</div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Shadow State</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot?.state === 'activated_shadow' ? 'is-positive' : 'is-warn')}>
                    {node.shadowSlot?.state === 'activated_shadow' ? 'Activated' : 'Reserved (Inactive)'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Wallet</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot?.walletEnabled ? 'is-positive' : 'is-warn')}>
                    {node.shadowSlot?.walletEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Unilevel</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot?.unilevelEnabled ? 'is-positive' : 'is-warn')}>
                    {node.shadowSlot?.unilevelEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Binary Cycle</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot?.binaryCycleEnabled ? 'is-positive' : 'is-warn')}>
                    {node.shadowSlot?.binaryCycleEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {node.shadowSlot?.note && (
                  <div className="genealogy-popover-row">
                    <span className="genealogy-popover-row-label">Note</span>
                    <span className="genealogy-popover-row-value">{node.shadowSlot.note}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="genealogy-canvas-node-popover" role="presentation">
                <div className="genealogy-popover-header">
                  <div className="genealogy-popover-avatar">
                    <Plus className="size-4" />
                  </div>
                  <div className="genealogy-popover-name">
                    <strong>Open Registration Slot</strong>
                    <p>{node.parentUsername} - {node.side.toUpperCase()}</p>
                  </div>
                </div>

                <div className="genealogy-popover-section-label">Placement Slot</div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Placement Under</span>
                  <span className="genealogy-popover-row-value">{node.parentUsername}</span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Leg</span>
                  <span className="genealogy-popover-row-value">{node.side.toUpperCase()}</span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Level</span>
                  <span className="genealogy-popover-row-value">Level {node.level}</span>
                </div>
                {adminMode ? (
                  <div className="genealogy-popover-row">
                    <span className="genealogy-popover-row-value is-warn" style={{ width: '100%', textAlign: 'left', fontSize: '0.62rem' }}>
                      Admin view: open slots cannot be encoded
                    </span>
                  </div>
                ) : (
                  <div className="genealogy-popover-row">
                    <span className="genealogy-popover-row-value is-positive" style={{ width: '100%', textAlign: 'left', fontSize: '0.62rem' }}>
                      Click to encode a new member here
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {node.children.length ? (
        <div className="genealogy-canvas-children">
          {node.children.map((child) => (
            <BinaryBranch
              key={child.key}
              node={child}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              focusedNodeKey={focusedNodeKey}
              onNavigateToNode={onNavigateToNode}
              onOpenSlot={onOpenSlot}
              registerNodeRef={registerNodeRef}
              onActivateShadow={onActivateShadow}
              adminMode={adminMode}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
