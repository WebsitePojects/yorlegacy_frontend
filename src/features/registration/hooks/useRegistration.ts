// Phase 2: Extract registration flow state from RegisterPage into this hook.

import type { RegistrationReadiness, GatedActionResponse } from '../types';

export interface UseRegistrationReturn {
  readiness: RegistrationReadiness | null;
  isSubmitting: boolean;
  result: GatedActionResponse | null;
  error: string | null;
}

// TODO Phase 2: implement and replace inline state in RegisterPage
