import { useMemo } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { RegistrationPageView } from '../components/pages/RegistrationPageView';
import { buildSeoConfig, useSeoDocument } from '../lib/seo';

export function RegisterPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { referralCode: referralCodeParam } = useParams<{ referralCode?: string }>();

  useSeoDocument(
    buildSeoConfig({
      slug: 'register',
      pathname: location.pathname
    })
  );

  const initialContext = useMemo(
    () => ({
      referralCode: referralCodeParam ?? searchParams.get('ref') ?? '',
      placementContext: searchParams.get('parent') || searchParams.get('placementParentUsername')
        ? {
            parentUsername: searchParams.get('parent') ?? searchParams.get('placementParentUsername') ?? '',
            side:
              searchParams.get('slot') === 'right' || searchParams.get('placementSide') === 'right'
                ? ('right' as const)
                : ('left' as const)
          }
        : undefined,
      // GATE-PLACEMENT-TOKEN-PARAM-20260615: backend emits `placementToken` (frontend-origin.ts);
      // legacy `token` kept as fallback so older share links still resolve their reserved slot.
      placementToken: searchParams.get('placementToken') ?? searchParams.get('token') ?? ''
    }),
    [referralCodeParam, searchParams]
  );

  return <RegistrationPageView initialContext={initialContext} />;
}
