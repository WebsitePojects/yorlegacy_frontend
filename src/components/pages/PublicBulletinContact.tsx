import { useEffect, useMemo, useState } from 'react';
import { fetchPublicAnnouncements, submitPublicContact, type NewsPost } from '@/lib/api';

const CATEGORY_LABEL: Record<string, string> = {
  announcement: 'Announcement',
  news: 'News',
  promo: 'Promo',
  memo: 'Memo'
};

function formatBulletinDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric' });
}

function AnnouncementsBulletin() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublicAnnouncements()
      .then((d) => { if (!cancelled) setPosts(d.posts); })
      .catch(() => { if (!cancelled) setPosts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const [featured, ...rest] = posts;

  if (loading) {
    return (
      <section className="story-section" id="bulletin">
        <div className="page-container">
          <span className="eyebrow">Bulletin</span>
          <h2 className="display-heading">Latest from Yor International</h2>
          <p className="hero-summary">Loading the latest announcements…</p>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null; // Nothing published yet — keep the page clean.
  }

  return (
    <section className="story-section" id="bulletin">
      <div className="page-container">
        <span className="eyebrow">Bulletin</span>
        <h2 className="display-heading">Latest from Yor International</h2>
        <p className="hero-summary">
          Announcements, promos, and company news — published straight from the Yor office.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Featured / most recent */}
          {featured ? (
            <article
              className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-3xl p-7"
              style={{ animation: 'yor-rise 0.7s ease both' }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    'radial-gradient(circle at 12% 0%, color-mix(in oklab, var(--yor-copper) 18%, transparent), transparent 42%)'
                }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{
                      color: 'var(--yor-copper-soft)',
                      border: '1px solid color-mix(in oklab, var(--yor-copper) 36%, var(--border))',
                      background: 'color-mix(in oklab, var(--yor-copper) 12%, transparent)'
                    }}
                  >
                    {CATEGORY_LABEL[featured.category] ?? 'Post'}
                  </span>
                  {featured.pinned ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--yor-amber)' }}>
                      ★ Pinned
                    </span>
                  ) : null}
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatBulletinDate(featured.publishedAt)}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                  {featured.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {featured.body}
                </p>
              </div>
              {featured.createdByLabel ? (
                <p className="relative mt-6 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--yor-copper-soft)' }}>
                  — {featured.createdByLabel}
                </p>
              ) : null}
            </article>
          ) : null}

          {/* Rest */}
          <div className="grid content-start gap-4">
            {rest.slice(0, 4).map((post, i) => (
              <article
                key={post.id}
                className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                style={{ animation: `yor-rise 0.6s ease both`, animationDelay: `${0.08 * (i + 1)}s` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--yor-copper-soft)' }}>
                    {CATEGORY_LABEL[post.category] ?? 'Post'}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{formatBulletinDate(post.publishedAt)}</span>
                </div>
                <h4 className="mt-2 text-base font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>{post.title}</h4>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{post.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(
    () => name.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && subject.trim().length >= 3 && message.trim().length >= 10,
    [name, email, subject, message]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) {
      setError('Please complete every field (message at least 10 characters).');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await submitPublicContact({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setStatus('sent');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Unable to send your message right now.');
    }
  }

  const fieldStyle = {
    background: 'color-mix(in oklab, var(--background) 88%, var(--yor-copper) 4%)',
    border: '1px solid color-mix(in oklab, var(--border) 78%, var(--yor-copper) 22%)',
    color: 'var(--foreground)'
  } as const;

  return (
    <section className="story-section" id="contact">
      <div className="page-container">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="eyebrow">Contact Us</span>
            <h2 className="display-heading">Let's talk</h2>
            <p className="hero-summary">
              Questions about packages, the compensation plan, or partnering with Yor International?
              Send us a message and the office team will get back to you.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                ['Office', 'Yor International — Member Services'],
                ['Email', 'support@yorinternational.net'],
                ['Hours', 'Mon–Sat · 9:00 AM – 6:00 PM (PHT)']
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-4">
                  <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--yor-copper-soft)' }}>{label}</span>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-7">
            {status === 'sent' ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <span
                  className="flex size-14 items-center justify-center rounded-full text-2xl"
                  style={{ color: 'var(--yor-copper-soft)', background: 'color-mix(in oklab, var(--yor-copper) 16%, transparent)' }}
                >
                  ✓
                </span>
                <h3 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Message sent</h3>
                <p className="max-w-sm text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Thank you for reaching out. The Yor office team has received your message and will reply to your email soon.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ border: '1px solid color-mix(in oklab, var(--yor-copper) 40%, var(--border))', color: 'var(--yor-copper-soft)' }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={handleSubmit}>
                {error ? (
                  <div className="rounded-xl px-4 py-2.5 text-sm" style={{ border: '1px solid color-mix(in oklab, red 40%, var(--border))', background: 'color-mix(in oklab, red 10%, transparent)', color: '#fca5a5' }}>
                    {error}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--yor-copper-soft)' }}>Name</span>
                    <input className="h-11 rounded-xl px-3.5 text-sm outline-none" style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--yor-copper-soft)' }}>Email</span>
                    <input className="h-11 rounded-xl px-3.5 text-sm outline-none" style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--yor-copper-soft)' }}>Subject</span>
                  <input className="h-11 rounded-xl px-3.5 text-sm outline-none" style={fieldStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--yor-copper-soft)' }}>Message</span>
                  <textarea className="min-h-[130px] rounded-xl px-3.5 py-3 text-sm outline-none" style={fieldStyle} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message…" />
                </label>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="mt-1 h-12 rounded-full text-sm font-semibold uppercase tracking-[0.22em] transition-opacity disabled:opacity-50"
                  style={{
                    color: '#1a1208',
                    background: 'linear-gradient(135deg, var(--yor-copper), var(--yor-amber))',
                    boxShadow: '0 12px 30px -12px color-mix(in oklab, var(--yor-copper) 70%, transparent)'
                  }}
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PublicBulletinContact() {
  return (
    <>
      <style>{`@keyframes yor-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <AnnouncementsBulletin />
      <ContactUs />
    </>
  );
}
