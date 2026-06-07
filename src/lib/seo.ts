import { useEffect } from 'react';
import type { PageContent } from '../types/content';

const SITE_NAME = 'Yor International';
const SITE_URL = 'https://yorinternational.net';
const DEFAULT_IMAGE = `${SITE_URL}/assets/yor/branding/yor-logo-showcase.png`;

type JsonLdEntry = Record<string, unknown>;

export type SeoConfig = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index,follow' | 'noindex,follow';
  openGraphType: 'website' | 'article';
  jsonLd: JsonLdEntry[];
};

type BuildSeoConfigInput = {
  slug: string;
  pathname: string;
  content?: Pick<PageContent, 'title' | 'summary'> | null;
};

function trimSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getCanonicalUrl(pathname: string) {
  if (pathname === '/') {
    return `${SITE_URL}/`;
  }

  return `${trimSlash(SITE_URL)}${pathname}`;
}

function getFaqSchema(): JsonLdEntry {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Yor International?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yor International is a founder-led fragrance and entrepreneur platform that presents premium products, package options, and structured ways to earn.'
        }
      },
      {
        '@type': 'Question',
        name: 'What products does Yor International offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Yor International highlights a perfume-led product line with men's and women's fragrance variants, supported by public product and package presentation content."
        }
      },
      {
        '@type': 'Question',
        name: 'How do I explore the Ways of Wealth?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The homepage introduces the Ways of Wealth and each earning stream has its own detail page for visitors who want a deeper explanation of the compensation plan.'
        }
      }
    ]
  };
}

function getOrganizationSchema(): JsonLdEntry {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/assets/yor/branding/yor-logo-round.png`,
    image: DEFAULT_IMAGE,
    description:
      'Yor International is a premium fragrance and entrepreneur network focused on products, packages, and structured ways to earn.'
  };
}

function getWebsiteSchema(): JsonLdEntry {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/`
  };
}

function getBreadcrumbSchema(pathname: string, title: string): JsonLdEntry {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: `${SITE_URL}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Ways of Wealth',
        item: `${SITE_URL}/#ways-of-wealth`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: getCanonicalUrl(pathname)
      }
    ]
  };
}

function getDetailTitle(slug: string, content?: Pick<PageContent, 'title' | 'summary'> | null) {
  if (content?.title?.trim()) {
    return `${content.title} | ${SITE_NAME}`;
  }

  const fallbackLabel = slug.split('/').pop()?.replace(/-/g, ' ') ?? slug;
  return `${fallbackLabel} | ${SITE_NAME}`;
}

function getDetailDescription(content?: Pick<PageContent, 'title' | 'summary'> | null) {
  if (content?.summary?.trim()) {
    return content.summary.trim();
  }

  return `${SITE_NAME} public compensation-plan detail page.`;
}

export function buildSeoConfig({ slug, pathname, content }: BuildSeoConfigInput): SeoConfig {
  if (slug === 'home') {
    const isCanonicalHome = pathname === '/';

    return {
      title: 'Yor International | Premium Fragrance Opportunity & Ways of Wealth',
      description:
        'Discover Yor International, a premium fragrance, direct selling, and entrepreneur network platform with products, packages, vision, mission, and the full Ways of Wealth overview.',
      canonicalUrl: `${SITE_URL}/`,
      robots: isCanonicalHome ? 'index,follow' : 'noindex,follow',
      openGraphType: 'website',
      jsonLd: [getOrganizationSchema(), getWebsiteSchema(), getFaqSchema()]
    };
  }

  if (slug === 'login' || slug === 'register' || slug === 'thank-you') {
    return {
      title:
        slug === 'login'
          ? `Portal Login | ${SITE_NAME}`
          : slug === 'register'
            ? `Register | ${SITE_NAME}`
            : `Thank You | ${SITE_NAME}`,
      description:
        slug === 'login'
          ? 'Access the Yor International member and office portal.'
          : slug === 'register'
            ? 'Register for the Yor International opportunity and onboarding flow.'
            : 'Thank you for exploring Yor International.',
      canonicalUrl: getCanonicalUrl(pathname),
      robots: 'noindex,follow',
      openGraphType: 'website',
      jsonLd: [getOrganizationSchema()]
    };
  }

  if (slug.startsWith('earn/')) {
    const title = getDetailTitle(slug, content);

    return {
      title,
      description: getDetailDescription(content),
      canonicalUrl: getCanonicalUrl(pathname),
      robots: 'index,follow',
      openGraphType: 'article',
      jsonLd: [getOrganizationSchema(), getBreadcrumbSchema(pathname, content?.title ?? title)]
    };
  }

  return {
    title: getDetailTitle(slug, content),
    description: getDetailDescription(content),
    canonicalUrl: getCanonicalUrl(pathname),
    robots: 'index,follow',
    openGraphType: 'website',
    jsonLd: [getOrganizationSchema()]
  };
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('data-yor-seo', 'true');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('data-yor-seo', 'true');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function writeJsonLd(entries: JsonLdEntry[]) {
  document.head
    .querySelectorAll('script[data-yor-jsonld="true"]')
    .forEach((node) => node.remove());

  entries.forEach((entry) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-yor-jsonld', 'true');
    script.textContent = JSON.stringify(entry);
    document.head.appendChild(script);
  });
}

export function applySeoConfig(config: SeoConfig) {
  document.title = config.title;

  upsertMeta('meta[name="description"]', {
    name: 'description',
    content: config.description
  });
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: config.robots
  });
  upsertMeta('meta[property="og:title"]', {
    property: 'og:title',
    content: config.title
  });
  upsertMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: config.description
  });
  upsertMeta('meta[property="og:type"]', {
    property: 'og:type',
    content: config.openGraphType
  });
  upsertMeta('meta[property="og:url"]', {
    property: 'og:url',
    content: config.canonicalUrl
  });
  upsertMeta('meta[property="og:site_name"]', {
    property: 'og:site_name',
    content: SITE_NAME
  });
  upsertMeta('meta[property="og:image"]', {
    property: 'og:image',
    content: DEFAULT_IMAGE
  });
  upsertMeta('meta[name="twitter:card"]', {
    name: 'twitter:card',
    content: 'summary_large_image'
  });
  upsertMeta('meta[name="twitter:title"]', {
    name: 'twitter:title',
    content: config.title
  });
  upsertMeta('meta[name="twitter:description"]', {
    name: 'twitter:description',
    content: config.description
  });
  upsertLink('link[rel="canonical"]', {
    rel: 'canonical',
    href: config.canonicalUrl
  });

  writeJsonLd(config.jsonLd);
}

export function useSeoDocument(config: SeoConfig) {
  useEffect(() => {
    applySeoConfig(config);
  }, [config]);
}
