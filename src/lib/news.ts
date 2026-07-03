import type { NewsAttachment, NewsAttachmentKind, NewsCategory } from '@/lib/api';

export const NEWS_CATEGORY_LABEL: Record<NewsCategory, string> = {
  announcement: 'Announcement',
  news: 'News',
  promo: 'Promo',
  memo: 'Memo'
};

export function formatNewsDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function applyInlineFormatting(value: string): string {
  return value
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

export function renderNewsBodyHtml(value: string): string {
  const safe = escapeHtml(value.trim());
  if (!safe) return '';

  const blocks = safe.split(/\n{2,}/).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      const listItems = lines
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- ') || line.startsWith('* '));

      if (listItems.length === lines.filter((line) => line.trim()).length && listItems.length > 0) {
        return `<ul>${listItems.map((item) => `<li>${applyInlineFormatting(item.slice(2))}</li>`).join('')}</ul>`;
      }

      return `<p>${applyInlineFormatting(block)}</p>`;
    })
    .join('');
}

export function stripNewsFormatting(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();
}

export function getNewsAttachmentKind(mimeType: string): NewsAttachmentKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

export function formatAttachmentSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAttachmentAcceptValue(): string {
  return [
    'image/*',
    'video/*',
    'application/pdf',
    '.doc',
    '.docx'
  ].join(',');
}

export function hasRenderablePreview(attachment: NewsAttachment): boolean {
  return attachment.kind === 'image' || attachment.kind === 'video';
}
