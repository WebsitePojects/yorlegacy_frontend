import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { GenealogyTree } from './GenealogyTree';
import type { GenealogyTreeNode } from '@/types/auth';

const upgradeMemberActivationCodeMock = vi.fn().mockResolvedValue({
  moneyMode: 'production',
  action: 'member-shadow-account-activate',
  status: 'completed',
  reason: 'ok'
});

vi.mock('@/lib/api', () => ({
  upgradeMemberActivationCode: (payload: unknown) => upgradeMemberActivationCodeMock(payload)
}));

beforeEach(() => {
  upgradeMemberActivationCodeMock.mockClear();
});

function makeNode(overrides: Partial<GenealogyTreeNode> = {}): GenealogyTreeNode {
  return {
    nodeId: overrides.nodeId ?? 'node-root',
    username: overrides.username ?? 'YOU1',
    fullName: overrides.fullName ?? 'Root Member',
    referralCode: overrides.referralCode ?? 'YOR-MEMBER-001',
    packageTier: overrides.packageTier ?? 'VIP',
    placement: overrides.placement ?? 'root',
    status: overrides.status ?? 'active',
    depth: overrides.depth ?? 0,
    tracePath: overrides.tracePath ?? 'YOU1',
    binaryPoints: overrides.binaryPoints ?? 0,
    directReferrals: overrides.directReferrals ?? 2,
    leftPoints: overrides.leftPoints ?? 100,
    rightPoints: overrides.rightPoints ?? 80,
    openSlots: overrides.openSlots ?? { left: false, right: false },
    shadowSlots: overrides.shadowSlots ?? {
      left: {
        id: 'shadow-left',
        owner: 'YOU1',
        placement: 'left',
        state: 'reserved_shadow',
        shadowCode: 'shadow-left',
        label: 'YOU 2',
        hasUpgradeCode: false,
        registrationEnabled: false,
        walletEnabled: false,
        unilevelEnabled: false,
        binaryCycleEnabled: false,
        note: 'Binary Function Only',
        packageTier: null,
        accountType: null,
        activationCode: null,
        pvValue: 0,
        salesmatchValue: 0,
        activatedAt: null,
        lastUpgradedAt: null
      },
      right: {
        id: 'shadow-right',
        owner: 'YOU1',
        placement: 'right',
        state: 'reserved_shadow',
        shadowCode: 'shadow-right',
        label: 'YOU 3',
        hasUpgradeCode: false,
        registrationEnabled: false,
        walletEnabled: false,
        unilevelEnabled: false,
        binaryCycleEnabled: false,
        note: 'Binary Function Only',
        packageTier: null,
        accountType: null,
        activationCode: null,
        pvValue: 0,
        salesmatchValue: 0,
        activatedAt: null,
        lastUpgradedAt: null
      }
    },
    accountStateLabel: overrides.accountStateLabel ?? 'PD',
    children: overrides.children ?? []
  };
}

function buildTree() {
  const alpha = makeNode({
    nodeId: 'node-alpha',
    username: 'ALPHA001',
    fullName: 'Alice Alpha',
    placement: 'left',
    depth: 2,
    tracePath: 'YOU1>YOU2>ALPHA001',
    openSlots: { left: true, right: true }
  });

  const bravo = makeNode({
    nodeId: 'node-bravo',
    username: 'BRAVO002',
    fullName: 'Bruno Bravo',
    placement: 'right',
    depth: 2,
    tracePath: 'YOU1>YOU3>BRAVO002',
    openSlots: { left: true, right: true }
  });

  const leftShadow = makeNode({
    nodeId: 'node-shadow-left',
    username: 'YOU2',
    fullName: 'Left Shadow',
    placement: 'left',
    status: 'shadow',
    depth: 1,
    tracePath: 'YOU1>YOU2',
    openSlots: { left: true, right: true },
    children: [alpha]
  });

  const rightShadow = makeNode({
    nodeId: 'node-shadow-right',
    username: 'YOU3',
    fullName: 'Right Shadow',
    placement: 'right',
    status: 'shadow',
    depth: 1,
    tracePath: 'YOU1>YOU3',
    openSlots: { left: true, right: true },
    children: [bravo]
  });

  return makeNode({
    children: [leftShadow, rightShadow]
  });
}

function renderTree({
  onSelect = vi.fn(),
  onOpenSlot,
  availableActivationCodes = []
}: {
  onSelect?: (nodeId: string) => void;
  onOpenSlot?: (slot: { parentUsername: string; parentReferralCode?: string; side: 'left' | 'right' }) => void;
  availableActivationCodes?: Array<{
    code: string;
    packageTier: string;
    codeFamily: string;
    accountType?: string;
    paymentStatus?: string;
  }>;
} = {}) {
  return render(
    <MemoryRouter>
      <FeedbackProvider>
        <GenealogyTree
          root={buildTree()}
          onSelect={onSelect}
          onOpenSlot={onOpenSlot}
          availableActivationCodes={availableActivationCodes}
        />
      </FeedbackProvider>
    </MemoryRouter>
  );
}

describe('GenealogyTree', () => {
  it('stays active after pointer leave until an outside click deactivates it', () => {
    const { container } = renderTree();
    const shell = container.querySelector('.genealogy-canvas-shell');
    const viewport = container.querySelector('.genealogy-canvas-viewport');

    expect(shell).not.toHaveClass('is-active');

    fireEvent.click(screen.getByText(/Click or touch the tree to engage drag, zoom, and export controls/i));
    expect(shell).toHaveClass('is-active');

    fireEvent.pointerLeave(viewport as Element);
    expect(shell).toHaveClass('is-active');

    fireEvent.pointerDown(document.body);
    expect(shell).not.toHaveClass('is-active');
  });

  it('shows visible tree accounts in a search dropdown and selects a result', () => {
    const onSelect = vi.fn();
    renderTree({ onSelect });

    const searchInput = screen.getByPlaceholderText(/Search username, name, or YOU/i);
    fireEvent.focus(searchInput);

    const results = screen.getByRole('listbox', { name: /placement tree search results/i });
    expect(results).toBeInTheDocument();
    expect(within(results).getByText('YOU1')).toBeInTheDocument();
    expect(within(results).getByText('YOU 2')).toBeInTheDocument();
    expect(within(results).getByText('ALPHA001')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'alpha' } });
    fireEvent.click(screen.getByRole('option', { name: /ALPHA001/i }));

    expect(onSelect).toHaveBeenCalledWith('node-alpha');
  }, 10000);

  it('emits the selected open-slot placement instead of forcing a page navigation', () => {
    const onOpenSlot = vi.fn();
    renderTree({ onOpenSlot });

    // Change depth select to 4 so Alice Alpha (level 2) children are generated
    const select = screen.getByLabelText(/depth/i);
    fireEvent.change(select, { target: { value: '4' } });

    const targetSlot = screen
      .getAllByRole('button', { name: /open slot left under alpha001/i })
      .find((node) => !node.className.includes('is-disabled'));

    expect(targetSlot).toBeDefined();
    fireEvent.click(targetSlot!);

    expect(onOpenSlot).toHaveBeenCalledWith({
      parentUsername: 'ALPHA001',
      parentReferralCode: 'YOR-MEMBER-001',
      side: 'left'
    });
  }, 10000);

  it('does not render disabled open slots (no blank spacer nodes)', () => {
    renderTree();

    const select = screen.getByLabelText(/depth/i);
    fireEvent.change(select, { target: { value: '5' } });

    const nodes = screen.getAllByRole('button');
    const disabledSlot = nodes.find(
      (n) => n.className.includes('is-open-slot') && n.className.includes('is-disabled')
    );

    expect(disabledSlot).toBeUndefined();
  }, 10000);

  it('sends the specific shadow code when activating a shadow slot', async () => {
    renderTree({
      availableActivationCodes: [
        {
          code: 'YOR-TEST-001',
          packageTier: 'Basic',
          codeFamily: 'YOR CODES',
          accountType: 'PD',
          paymentStatus: 'paid'
        }
      ]
    });

    fireEvent.click(screen.getByRole('button', { name: /shadow account you 2/i }));
    expect(await screen.findByText(/Activate Shadow Account/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    expect(upgradeMemberActivationCodeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shadowCode: 'shadow-left'
      })
    );
  });
});
