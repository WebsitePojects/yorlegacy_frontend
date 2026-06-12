// Phase 2: Extract genealogy/binary tree state from pages into this hook.

import type { GenealogyCenter, ShadowAccountCenter } from '../types';

export interface UseGenealogyReturn {
  binaryTree: GenealogyCenter | null;
  shadowAccounts: ShadowAccountCenter | null;
  isLoading: boolean;
  error: string | null;
}

// TODO Phase 2: implement and replace inline state in GenealogyTree component
