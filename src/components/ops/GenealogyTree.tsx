import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { cn, formatAccountTypeLabel } from '@/lib/utils';
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
  Target,
  User
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GenealogyTreeNode } from '../../types/auth';
import { upgradeMemberActivationCode } from '@/lib/api';

type ActivationCodeOption = {
  code: string;
  packageTier: string;
  codeFamily: string;
  accountType?: string;
  paymentStatus?: string;
};

type GenealogyTreeProps = {
  root: GenealogyTreeNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  onNavigateToNode?: (username: string) => void;
  // Notifies the parent how many tree levels the canvas wants loaded, so the
  // server only builds that depth (instead of the whole subtree).
  onRequestDepth?: (treeDepth: number) => void;
  onOpenSlot?: (slot: { parentUsername: string; parentReferralCode?: string; side: 'left' | 'right' }) => void;
  availableActivationCodes?: ActivationCodeOption[];
  adminMode?: boolean;
  onUpgradeSuccess?: () => void;
  suppressPointerAway?: boolean;
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
  isDisableOpenSlot?: boolean;
  shadowSlot?: GenealogyTreeNode['shadowSlots']['left'] | GenealogyTreeNode['shadowSlots']['right'];
  isShadowNode?: boolean;
  parentUsername?: string;
  parentReferralCode?: string;
  placementParentUsername?: string;
  placementSide?: 'left' | 'right';
  children: CanvasNode[];
};

function getRealNetworkDepth(node: GenealogyTreeNode): number {
  let maxDepth = 1;
  const traverse = (n: GenealogyTreeNode, currentDepth: number) => {
    if (currentDepth > maxDepth) {
      maxDepth = currentDepth;
    }
    if (n.children && n.children.length > 0) {
      n.children.forEach((child) => traverse(child, currentDepth + 1));
    }
  };
  traverse(node, 1);
  return maxDepth;
}

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

const PKG_ABBR: Record<string, string> = {
  VIP: 'VIP', CLASSIC: 'CL', BASIC: 'BA', STARTER: 'ST', BUSINESS: 'BI', STANDARD: 'SD'
};
function pkgAbbr(tier: string | undefined): string {
  if (!tier) return '';
  return PKG_ABBR[tier.trim().toUpperCase()] ?? tier.slice(0, 2).toUpperCase();
}

function getVerticalGap(level: number): number {
  switch (level) {
    case 0:
      return 80;
    case 1:
      return 56;
    case 2:
      return 40;
    case 3:
      return 28;
    case 4:
      return 20;
    default:
      return 16;
  }
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

export function GenealogyTree({ root, onSelect, selectedNodeId, onNavigateToNode, onRequestDepth, onOpenSlot, availableActivationCodes = [], adminMode = false, onUpgradeSuccess, suppressPointerAway = false }: GenealogyTreeProps) {
  const navigate = useNavigate();
  const { confirmAction, presentNotice, notify } = useFeedback();
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [selectedActivationCode, setSelectedActivationCode] = useState('');
  const [activeShadowNode, setActiveShadowNode] = useState<{ label: string; shadowCode: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (isActivationModalOpen && availableActivationCodes.length > 0) {
      setSelectedActivationCode(availableActivationCodes[0].code);
    }
  }, [isActivationModalOpen, availableActivationCodes]);

  async function handleConfirmActivation() {
    if (!selectedActivationCode || !activeShadowNode?.shadowCode) return;
    setIsActivating(true);
    try {
      const result = await upgradeMemberActivationCode({
        code: selectedActivationCode,
        shadowCode: activeShadowNode.shadowCode
      });
      notify({
        title: result.moneyMode === 'sandbox' ? 'Shadow account activated' : 'Activation check passed',
        description: result.detail ?? result.reason,
        tone: result.moneyMode === 'sandbox' ? 'success' : 'warning'
      });
      setIsActivationModalOpen(false);
      setSelectedActivationCode('');
      setActiveShadowNode(null);
      onUpgradeSuccess?.();
    } catch (cause) {
      notify({
        title: 'Activation failed',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
    } finally {
      setIsActivating(false);
    }
  }
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState(DEFAULT_OFFSET);
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleDepth, setVisibleDepth] = useState(2);
  const [nodeSearch, setNodeSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(nodeSearch), 300);
    return () => clearTimeout(id);
  }, [nodeSearch]);
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

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  const [connections, setConnections] = useState<Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>>([]);

  const depthOptions = useMemo(() => {
    const opts = [];
    for (let d = 2; d <= 20; d++) {
      opts.push(d);
    }
    return opts;
  }, []);

  const canvasDepth = Math.max(2, visibleDepth * 2);
  const canvasRoot = useMemo(() => toCanvasNode(root, 0, 'root', canvasDepth), [canvasDepth, root]);

  // Ask the parent to fetch exactly the depth the canvas renders (server caps the
  // tree build to this, so we never pull the whole subtree).
  useEffect(() => {
    onRequestDepth?.(canvasDepth);
  }, [canvasDepth, onRequestDepth]);

  useEffect(() => {
    let active = true;

    const updateConnections = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const newConnections: typeof connections = [];

      const getLayoutPos = (el: HTMLElement, container: HTMLElement) => {
        let left = 0;
        let top = 0;
        let current: HTMLElement | null = el;
        while (current && current !== container) {
          left += current.offsetLeft;
          top += current.offsetTop;
          current = current.offsetParent as HTMLElement | null;
        }
        return { left, top };
      };

      const traverse = (node: CanvasNode) => {
        const parentEl = nodeRefs.current.get(node.key);
        if (parentEl) {
          node.children.forEach((child) => {
            const childEl = nodeRefs.current.get(child.key);
            if (childEl) {
              const parentPos = getLayoutPos(parentEl, canvas);
              const childPos = getLayoutPos(childEl, canvas);

              const x1 = parentPos.left + parentEl.offsetWidth / 2;
              const y1 = parentPos.top + parentEl.offsetHeight;

              const x2 = childPos.left + childEl.offsetWidth / 2;
              const y2 = childPos.top;

              newConnections.push({
                id: `${node.key}-${child.key}`,
                x1,
                y1,
                x2,
                y2
              });
            }
            traverse(child);
          });
        }
      };

      traverse(canvasRoot);
      if (active) {
        setConnections(newConnections);
      }
    };

    updateConnections();
    const frameId = requestAnimationFrame(updateConnections);
    const timerId = setTimeout(updateConnections, 50);

    window.addEventListener('resize', updateConnections);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      window.removeEventListener('resize', updateConnections);
    };
  }, [canvasRoot, visibleDepth]);
  const searchableNodes = useMemo(() => flattenCanvasNodes(canvasRoot), [canvasRoot]);
  const selectedCanvasNode = useMemo(
    () =>
      searchableNodes.find((node) => node.source?.nodeId === selectedNodeId || node.key === focusedNodeKey) ??
      searchableNodes.find((node) => node.source?.nodeId === root.nodeId) ??
      canvasRoot,
    [canvasRoot, focusedNodeKey, root.nodeId, searchableNodes, selectedNodeId]
  );
  const searchOptions = useMemo(
    () => searchableNodes.filter((node) => !!node.source).map(toSearchOption),
    [searchableNodes]
  );
  const filteredSearchOptions = useMemo(() => {
    const query = debouncedSearch.trim().toUpperCase();
    if (!query) {
      return searchOptions;
    }

    return searchOptions.filter((option) => option.searchValue.includes(query));
  }, [debouncedSearch, searchOptions]);
  const exportRows = useMemo(
    () => buildExportRows(searchableNodes).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)]))),
    [searchableNodes]
  );

  function clampScale(nextScale: number) {
    return Math.min(1.5, Math.max(0.01, Number(nextScale.toFixed(2))));
  }

  function updateScale(delta: number) {
    const currentScale = scaleRef.current;
    const nextScale = clampScale(currentScale + delta);
    if (nextScale === currentScale) return;

    const viewport = viewportRef.current;
    if (viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const cx = viewportRect.width / 2;
      const cy = viewportRect.height / 2;
      const scaleRatio = nextScale / currentScale;
      setOffset((current) => ({
        x: current.x + cx * (1 - scaleRatio),
        y: current.y + cy * (1 - scaleRatio)
      }));
    }

    setScale(nextScale);
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
        if (!suppressPointerAway) {
          setIsActive(false);
          setIsDragging(false);
          dragRef.current = null;
          pointersRef.current.clear();
          pinchDistanceRef.current = null;
        }
        setIsSearchOpen(false);
        setIsExportOpen(false);
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
  }, [suppressPointerAway]);

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
    setVisibleDepth((current) => Math.max(current, 2));
  }, [root.nodeId]);

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

      const canvas = canvasRef.current;
      if (!canvas) return;

      const currentScale = scaleRef.current;
      const delta = event.deltaY > 0 ? -0.06 : 0.06;
      const nextScale = clampScale(currentScale + delta);
      if (nextScale === currentScale) return;

      const canvasRect = canvas.getBoundingClientRect();
      const offsetX = event.clientX - canvasRect.left;
      const offsetY = event.clientY - canvasRect.top;

      const scaleRatio = nextScale / currentScale;
      const deltaX = offsetX * (1 - scaleRatio);
      const deltaY = offsetY * (1 - scaleRatio);

      setScale(nextScale);
      setOffset((current) => ({
        x: current.x + deltaX,
        y: current.y + deltaY
      }));
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentScale = scale;
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    const nextScale = clampScale(currentScale + delta);
    if (nextScale === currentScale) return;

    const canvasRect = canvas.getBoundingClientRect();
    const offsetX = event.clientX - canvasRect.left;
    const offsetY = event.clientY - canvasRect.top;

    const scaleRatio = nextScale / currentScale;
    const deltaX = offsetX * (1 - scaleRatio);
    const deltaY = offsetY * (1 - scaleRatio);

    setScale(nextScale);
    setOffset((current) => ({
      x: current.x + deltaX,
      y: current.y + deltaY
    }));
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
            {depthOptions.map((depth) => {
              const isDisabled = false;
              return (
                <option key={depth} value={depth} disabled={isDisabled}>
                  {depth} logical levels / {depth * 2} tree levels
                </option>
              );
            })}
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
          <div className="genealogy-canvas" style={{ transform: `scale(${scale})` }} ref={canvasRef}>
            <svg
              className="genealogy-connections-svg"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <defs>
                <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(245, 200, 66, 0.65)" />
                  <stop offset="100%" stopColor="rgba(122, 64, 32, 0.25)" />
                </linearGradient>
              </defs>
              {connections.map((conn) => {
                const dy = (conn.y2 - conn.y1) / 2;
                const path = `M ${conn.x1} ${conn.y1} C ${conn.x1} ${conn.y1 + dy}, ${conn.x2} ${conn.y2 - dy}, ${conn.x2} ${conn.y2}`;
                return (
                  <path
                    key={conn.id}
                    d={path}
                    stroke="url(#connector-gradient)"
                    strokeWidth="2"
                    fill="none"
                  />
                );
              })}
            </svg>
            <BinaryBranch
              node={canvasRoot}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              focusedNodeKey={focusedNodeKey}
              onNavigateToNode={onNavigateToNode}
              adminMode={adminMode}
              onOpenSlot={(slot) => {
                // The registration modal renders outside this canvas shell, so it is
                // invisible while the shell is in the Fullscreen API. Exit fullscreen
                // first so the modal is shown on the normal document.
                if (document.fullscreenElement) {
                  void document.exitFullscreen().catch(() => { /* ignore */ });
                }
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
              availableActivationCodes={availableActivationCodes}
              onActivateShadow={async (shadowNode) => {
                setActiveShadowNode(shadowNode);
                setIsActivationModalOpen(true);
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

      {isActivationModalOpen && (
        <div 
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/65 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md border border-[rgba(245,200,66,0.3)] bg-[#100d0c]/98 p-6 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 className="text-lg font-bold text-[#f5c842] mb-2 font-serif">Shadow Account</h3>
            <p className="text-sm text-gray-400 mb-5">
              <strong className="text-white">{activeShadowNode?.label ?? 'Shadow Slot'}</strong> is already active. Apply a higher package code to upgrade it, or view its pairing income.
            </p>
            <div className="mb-4 flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setIsActivationModalOpen(false);
                  setSelectedActivationCode('');
                  setActiveShadowNode(null);
                  navigate('/member/account-shadow-management');
                }}
                className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                View Shadow Income
              </button>
            </div>

            {availableActivationCodes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Select Upgrade Code</label>
                  <select
                    value={selectedActivationCode}
                    onChange={(e) => setSelectedActivationCode(e.target.value)}
                    className="w-full bg-[#1c1715] border border-[rgba(245,200,66,0.2)] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#f5c842]"
                  >
                    {availableActivationCodes.map((item) => (
                      <option key={item.code} value={item.code}>
                        {`${item.code} - ${item.accountType ? formatAccountTypeLabel(item.accountType, item.paymentStatus) : 'Registration'} - ${item.packageTier}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[rgba(245,200,66,0.1)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActivationModalOpen(false);
                      setSelectedActivationCode('');
                      setActiveShadowNode(null);
                    }}
                    className="px-4 py-2 border border-gray-700 hover:bg-white/5 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmActivation}
                    disabled={isActivating}
                    className="px-4 py-2 bg-gradient-to-r from-[#c8703a] to-[#f5c842] hover:opacity-90 text-[#2c1607] font-bold rounded-xl text-sm border-0 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isActivating ? 'Upgrading...' : 'Apply Upgrade'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-amber-300 mb-6 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                  No higher-tier upgrade codes available. This shadow is already active and earning; add a higher package code to upgrade its tier.
                </p>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-red-500/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActivationModalOpen(false);
                      setSelectedActivationCode('');
                      setActiveShadowNode(null);
                    }}
                    className="px-4 py-2 border border-gray-700 hover:bg-white/5 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActivationModalOpen(false);
                      setSelectedActivationCode('');
                      setActiveShadowNode(null);
                      navigate('/member/activation-codes');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-[#c8703a] to-[#f5c842] hover:opacity-90 text-[#2c1607] font-bold rounded-xl text-sm border-0 transition-opacity cursor-pointer"
                  >
                    Go to Activation Codes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  const openSlotParentUsername = node.username;
  const openSlotParentReferralCode = isShadow ? parentReferralCode ?? node.referralCode : node.referralCode;

  if (level < maxDepth - 1) {
    const leftChild = node.children.find((child) => child.placement === 'left');
    const rightChild = node.children.find((child) => child.placement === 'right');

    if (leftChild) {
      children.push(toCanvasNode(leftChild, level + 1, 'left', maxDepth, node.shadowSlots, node.username, node.referralCode));
    } else if (node.openSlots?.left) {
      children.push(toOpenSlot(openSlotParentUsername, openSlotParentReferralCode, level + 1, 'left', node.nodeId, 'left'));
    }

    if (rightChild) {
      children.push(toCanvasNode(rightChild, level + 1, 'right', maxDepth, node.shadowSlots, node.username, node.referralCode));
    } else if (node.openSlots?.right) {
      children.push(toOpenSlot(openSlotParentUsername, openSlotParentReferralCode, level + 1, 'right', node.nodeId, 'right'));
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
  parentKey: string,
  placementSide: 'left' | 'right'
): CanvasNode {
  return {
    key: `${parentKey}-${side}-open-${level}`,
    side,
    level,
    isOpenSlot: true,
    isDisableOpenSlot: false,
    parentUsername,
    parentReferralCode,
    placementParentUsername: parentUsername,
    placementSide,
    children: []
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
      searchValue: [node.source.username, node.source.fullName].join(' ').toUpperCase(),
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
  availableActivationCodes = [],
  adminMode = false
}: {
  node: CanvasNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  focusedNodeKey?: string | null;
  onNavigateToNode?: (username: string) => void;
  onOpenSlot?: (slot: { parentUsername: string; parentReferralCode?: string; side: 'left' | 'right' }) => void;
  registerNodeRef?: (key: string, element: HTMLDivElement | null) => void;
  onActivateShadow: (shadowNode: { label: string; shadowCode: string }) => Promise<void>;
  availableActivationCodes?: ActivationCodeOption[];
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
      // Always allow upgrade: shadows can always receive a higher-tier code
      await onActivateShadow({
        label: node.shadowSlot?.label ?? node.key,
        shadowCode: node.shadowSlot?.shadowCode ?? node.shadowSlot?.id ?? node.key
      });
      return;
    }

    if (node.isOpenSlot && node.parentUsername && node.side !== 'root') {
      if (node.isDisableOpenSlot) {
        await presentNotice({
          title: 'Slot Locked',
          description: 'You must encode a member under a direct active upline node first.',
          tone: 'warning'
        });
        return;
      }
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
    <div 
      className="genealogy-canvas-branch"
      style={{ gap: `${getVerticalGap(node.level)}px` }}
    >
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
          node.isDisableOpenSlot && 'is-disabled',
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
            <div className="genealogy-canvas-node-orb">
              <div className="genealogy-orb-content">
                <span>{source.username.slice(0, 2).toUpperCase()}</span>
                <span className="genealogy-orb-pkg">{pkgAbbr(source.packageTier)}</span>
              </div>
            </div>
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
        ) : node.isOpenSlot ? (
          <>
            <div className="genealogy-canvas-node-orb genealogy-slot-orb-pulse">
              <Plus className="size-5" />
            </div>
            <div className="genealogy-canvas-node-main">
              <div className="genealogy-canvas-node-title">
                <strong>Open Slot</strong>
                <p>{node.side.toUpperCase()} LEG · L{node.level}</p>
              </div>
            </div>
            <span className="genealogy-canvas-slot-badge">Encode Here</span>
          </>
        ) : (
          <>
            <div className="genealogy-canvas-node-orb">
              <User className="size-4" />
            </div>
            <div className="genealogy-canvas-node-main">
              <div className="genealogy-canvas-node-title">
                <strong>{node.shadowSlot?.label ?? 'Shadow'}</strong>
                <p>Shadow Slot</p>
              </div>
            </div>

            {node.isShadowNode && node.shadowSlot ? (
              <div className="genealogy-canvas-node-popover is-shadow-popover" role="presentation">
                <div className="genealogy-popover-header">
                  <div className="genealogy-popover-avatar is-shadow">
                    SH
                  </div>
                  <div className="genealogy-popover-name">
                    <strong>{node.shadowSlot.label}</strong>
                    <p>Shadow Account</p>
                  </div>
                </div>

                <div className="genealogy-popover-section-label">Shadow Status</div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Package</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot.packageTier ? 'is-positive' : 'is-warning')}>
                    {node.shadowSlot.packageTier ?? 'Not set'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Upgrade Code</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot.hasUpgradeCode ? 'is-positive' : 'is-warning')}>
                    {node.shadowSlot.hasUpgradeCode ? `${node.shadowSlot.activationCode ?? '—'} (${node.shadowSlot.pvValue} PV)` : 'None — click to upgrade'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Placement</span>
                  <span className="genealogy-popover-row-value">
                    {node.shadowSlot.placement.toUpperCase()} leg · Level {node.level}
                  </span>
                </div>

                <div className="genealogy-popover-section-label">Feature Flags</div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Registration</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot.registrationEnabled ? 'is-positive' : '')}>
                    {node.shadowSlot.registrationEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Wallet</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot.walletEnabled ? 'is-positive' : '')}>
                    {node.shadowSlot.walletEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Unilevel</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot.unilevelEnabled ? 'is-positive' : '')}>
                    {node.shadowSlot.unilevelEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="genealogy-popover-row">
                  <span className="genealogy-popover-row-label">Binary Cycle</span>
                  <span className={cn('genealogy-popover-row-value', node.shadowSlot.binaryCycleEnabled ? 'is-positive' : '')}>
                    {node.shadowSlot.binaryCycleEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {node.shadowSlot.note ? (
                  <>
                    <div className="genealogy-popover-section-label">Note</div>
                    <div className="genealogy-popover-note">{node.shadowSlot.note}</div>
                  </>
                ) : null}

                {availableActivationCodes.length > 0 ? (
                  <>
                    <div className="genealogy-popover-section-label">{node.shadowSlot.hasUpgradeCode ? 'Upgrade with Code' : 'Apply Upgrade Code'}</div>
                    <div className="genealogy-popover-code-list">
                      {availableActivationCodes.slice(0, 4).map((item) => (
                        <div key={item.code} className="genealogy-popover-code-row">
                          <span className="genealogy-popover-code-value">{item.code}</span>
                          <span className="genealogy-popover-code-meta">{item.packageTier}</span>
                        </div>
                      ))}
                      {availableActivationCodes.length > 4 ? (
                        <p className="genealogy-popover-code-overflow">+{availableActivationCodes.length - 4} more codes available</p>
                      ) : null}
                    </div>
                    <p className="genealogy-popover-note">Click this shadow node to go to Activation Codes and apply an upgrade.</p>
                  </>
                ) : null}

                {availableActivationCodes.length === 0 ? (
                  <p className="genealogy-popover-note is-warning">No upgrade codes available. Purchase a code to upgrade this shadow slot.</p>
                ) : null}
              </div>
            ) : null}
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
              availableActivationCodes={availableActivationCodes}
              adminMode={adminMode}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
