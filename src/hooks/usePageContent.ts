import { useEffect, useState } from 'react';
import { fetchPageContent } from '../lib/api';
import type { PageContent } from '../types/content';

type PageState = {
  data: PageContent | null;
  isLoading: boolean;
  error: string | null;
};

export function usePageContent(slug: string): PageState {
  const [state, setState] = useState<PageState>({
    data: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isActive = true;

    setState({
      data: null,
      isLoading: true,
      error: null
    });

    fetchPageContent(slug)
      .then((data) => {
        if (!isActive) {
          return;
        }

        setState({
          data,
          isLoading: false,
          error: null
        });
      })
      .catch((cause: Error) => {
        if (!isActive) {
          return;
        }

        setState({
          data: null,
          isLoading: false,
          error: cause.message
        });
      });

    return () => {
      isActive = false;
    };
  }, [slug]);

  return state;
}
