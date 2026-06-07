import { BonusDetailPageView } from '../components/pages/BonusDetailPageView';
import { CollectionPageView } from '../components/pages/CollectionPageView';
import { EarnOverviewPageView } from '../components/pages/EarnOverviewPageView';
import { FounderShowcasePage } from '../components/pages/FounderShowcasePage';
import { HomeExperiencePage } from '../components/pages/HomeExperiencePage';
import { PackagesPageView } from '../components/pages/PackagesPageView';
import { RankIncentivePageView } from '../components/pages/RankIncentivePageView';
import { RegistrationPageView } from '../components/pages/RegistrationPageView';
import { SpotlightPage } from '../components/pages/SpotlightPage';
import { PageTemplate } from '../components/layout/PageTemplate';
import { usePageContent } from '../hooks/usePageContent';
import { buildSeoConfig, useSeoDocument } from '../lib/seo';
import { useLocation } from 'react-router-dom';

type ContentPageProps = {
  slug: string;
};

export function ContentPage({ slug }: ContentPageProps) {
  const location = useLocation();
  const { data, isLoading, error } = usePageContent(slug);
  useSeoDocument(
    buildSeoConfig({
      slug,
      pathname: location.pathname,
      content: data
    })
  );

  if (!data && (error || !isLoading)) {
    return (
      <section className="page-template">
        <div className="page-container">
          <div className="glass-panel content-card">
            <span className="eyebrow">Unavailable</span>
            <h1 className="display-heading">Page content not available</h1>
            <p className="hero-summary">
              {error ?? 'The requested content could not be loaded.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  if (slug === 'home') {
    return <HomeExperiencePage content={data} />;
  }

  if (slug === 'founder') {
    return <FounderShowcasePage content={data} />;
  }

  if (slug === 'perfume-collection') {
    return <CollectionPageView content={data} />;
  }

  if (slug === 'packages') {
    return <PackagesPageView content={data} />;
  }

  if (slug === 'register') {
    return <RegistrationPageView content={data} />;
  }

  if (slug === 'earn') {
    return <EarnOverviewPageView content={data} />;
  }

  if (slug === 'rank-incentives') {
    return <RankIncentivePageView content={data} />;
  }

  if (slug.startsWith('earn/')) {
    return <BonusDetailPageView content={data} />;
  }

  if (slug === 'mission' || slug === 'vision' || slug === 'thank-you') {
    return <SpotlightPage content={data} />;
  }

  return <PageTemplate content={data} />;
}
