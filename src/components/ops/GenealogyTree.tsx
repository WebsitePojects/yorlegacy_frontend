import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GenealogyTreeNode } from '../../types/auth';

type GenealogyTreeProps = {
  root: GenealogyTreeNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
};

export function GenealogyTree({ root, onSelect, selectedNodeId }: GenealogyTreeProps) {
  return (
    <div className="space-y-4">
      <GenealogyBranch node={root} onSelect={onSelect} selectedNodeId={selectedNodeId} level={0} />
    </div>
  );
}

function GenealogyBranch({
  node,
  onSelect,
  selectedNodeId,
  level
}: {
  node: GenealogyTreeNode;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  level: number;
}) {
  const isSelected = selectedNodeId === node.nodeId;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={cn(
          'member-genealogy-node w-full rounded-xl border p-4 text-left transition-colors',
          level > 0 && 'ml-0 lg:ml-6',
          isSelected
            ? 'border-[var(--ring)] bg-[var(--accent)]'
            : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]'
        )}
        onClick={() => onSelect?.(node.nodeId)}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="break-words text-sm text-[var(--foreground)]">{node.username}</strong>
              <Badge variant="outline">{node.packageTier}</Badge>
              <Badge variant="secondary">{node.accountStateLabel}</Badge>
            </div>
            <p className="break-words text-sm text-[var(--muted-foreground)]">{node.fullName}</p>
          </div>
          <div className="member-genealogy-meta grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)] sm:grid-cols-4">
            <span>Placement: {node.placement}</span>
            <span>Direct: {node.directReferrals}</span>
            <span>L: {node.leftPoints}</span>
            <span>R: {node.rightPoints}</span>
          </div>
        </div>
        <div className="member-genealogy-badges mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant={node.openSlots.left ? 'warning' : 'outline'}>
            {node.openSlots.left ? 'Open left slot' : 'Left filled'}
          </Badge>
          <Badge variant={node.openSlots.right ? 'warning' : 'outline'}>
            {node.openSlots.right ? 'Open right slot' : 'Right filled'}
          </Badge>
        </div>
      </button>

      {node.children.length ? (
        <div className="space-y-3 border-l border-[var(--border)] pl-4 lg:pl-6">
          {node.children.map((child) => (
            <GenealogyBranch
              key={child.nodeId}
              node={child}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
