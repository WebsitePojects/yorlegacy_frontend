import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchPublicAnnouncements, type NewsCategory, type NewsPost } from '@/lib/api';
import { buildSeoConfig, useSeoDocument } from '@/lib/seo';
import {
  NEWS_CATEGORY_LABEL,
  formatAttachmentSize,
  formatNewsDate,
  hasRenderablePreview,
  renderNewsBodyHtml
} from '@/lib/news';

const FILTERS: Array<{ label: string; value: 'all' | NewsCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'News', value: 'news' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Promo', value: 'promo' },
  { label: 'Memo', value: 'memo' }
];

function AttachmentBlock({ post }: { post: NewsPost }) {
  if (!post.attachments.length) return null;

  return (
    <div className="mt-5 grid gap-3">
      {post.attachments.map((attachment) => (
        <div key={`${post.id}-${attachment.name}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          {hasRenderablePreview(attachment) ? (
            attachment.kind === 'image' ? (
              <img src={attachment.dataUrl} alt={attachment.name} className="max-h-80 w-full object-cover" />
            ) : (
              <video src={attachment.dataUrl} controls className="max-h-80 w-full bg-black object-cover" />
            )
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">{attachment.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{formatAttachmentSize(attachment.sizeBytes)}</p>
            </div>
            <a
              href={attachment.dataUrl}
              download={attachment.name}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--yor-copper-soft)]"
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewsUpdatesPage() {
  const location = useLocation();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | NewsCategory>('all');

  useSeoDocument(
    buildSeoConfig({
      slug: 'news-updates',
      pathname: location.pathname
    })
  );

  useEffect(() => {
    let cancelled = false;
    fetchPublicAnnouncements()
      .then((data) => {
        if (!cancelled) setPosts(data.posts);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter((post) => post.category === activeFilter);
  }, [activeFilter, posts]);

  return (
    <section className="page-template">
      <div className="page-container space-y-8 py-10">
        <div className="glass-panel rounded-[2rem] p-7 sm:p-9">
          <span className="eyebrow">News & Updates</span>
          <h1 className="display-heading">Latest public posts from Yor International</h1>
          <p className="hero-summary">
            News, announcements, promos, and memos published from the admin office appear here.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  activeFilter === filter.value
                    ? 'bg-[var(--yor-copper)] text-[#1f1409]'
                    : 'border border-white/10 bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-[2rem] p-8 text-sm text-[var(--muted-foreground)]">Loading updates...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-panel rounded-[2rem] p-8 text-center">
            <p className="text-lg font-semibold text-[var(--foreground)]">No posts in this filter yet.</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Try another category or check back after the next admin update.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredPosts.map((post) => (
              <article key={post.id} className="glass-panel rounded-[2rem] p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--yor-copper-soft)]">
                    {NEWS_CATEGORY_LABEL[post.category]}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">{formatNewsDate(post.publishedAt)}</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">{post.title}</h2>
                <div
                  className="news-rich-body mt-4 text-sm leading-7 text-[var(--muted-foreground)]"
                  dangerouslySetInnerHTML={{ __html: renderNewsBodyHtml(post.body) }}
                />
                <AttachmentBlock post={post} />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--yor-copper-soft)]">
                    {post.createdByLabel ? `By ${post.createdByLabel}` : 'Yor Office'}
                  </span>
                  <Link to="/login" className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--yor-copper-soft)]">
                    Portal login
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
