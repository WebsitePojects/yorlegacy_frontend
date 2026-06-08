import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { RegistrationPageView } from '../components/pages/RegistrationPageView';
import { buildSeoConfig, useSeoDocument } from '../lib/seo';

export function RegisterPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useSeoDocument(
    buildSeoConfig({
      slug: 'register',
      pathname: location.pathname
    })
  );

  const initialContext = useMemo(
    () => ({
      referralCode: searchParams.get('ref') ?? '',
      placementContext: searchParams.get('parent') || searchParams.get('placementParentUsername')
        ? {
            parentUsername: searchParams.get('parent') ?? searchParams.get('placementParentUsername') ?? '',
            side:
              searchParams.get('slot') === 'right' || searchParams.get('placementSide') === 'right'
                ? ('right' as const)
                : ('left' as const)
          }
        : undefined,
      placementToken: searchParams.get('token') ?? ''
    }),
    [searchParams]
  );

  return <RegistrationPageView initialContext={initialContext} />;
}
