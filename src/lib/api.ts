import { fallbackContent } from '../data/fallbackContent';
import type { PageContent } from '../types/content';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787';

export async function fetchPageContent(slug: string): Promise<PageContent> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pages/${encodeURIComponent(slug)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to load page ${slug}`);
    }

    return (await response.json()) as PageContent;
  } catch {
    const fallback = fallbackContent[slug];

    if (!fallback) {
      throw new Error(`No content available for ${slug}`);
    }

    return fallback;
  }
}
