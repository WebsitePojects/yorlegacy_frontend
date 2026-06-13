import { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { submitSupportMessage, type SupportMessageCategory } from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORIES: Array<{ value: SupportMessageCategory; label: string }> = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'account', label: 'Account / Profile' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'encashment', label: 'Encashment / Payout' }
];

const FAQS = [
  {
    question: 'When is the encashment cutoff and payout schedule?',
    answer:
      'Encashment requests are processed every Tuesday. Approved payouts are released every Friday. Make sure your payout details are up to date in your Account Details before submitting an encashment request.'
  },
  {
    question: 'How do binary points get credited to my account?',
    answer:
      'Binary Points (BP) are credited when left and right sides of your binary tree are matched (salesmatch pairing). Each match credits BP based on your package: Basic = 1 BP, Classic = 2 BP, Standard = 10 BP, Business = 20 BP, VIP = 60 BP. Strong-leg excess carries forward — it is never flushed.'
  },
  {
    question: 'How do I transfer an activation code to another member?',
    answer:
      'Go to Activation Codes in the left sidebar. Select the code you want to transfer, click "Transfer", search for the recipient\'s username, and confirm. Only released, unused codes can be transferred.'
  },
  {
    question: 'What is YOU 2 and YOU 3 (shadow accounts)?',
    answer:
      'YOU 2 (left) and YOU 3 (right) are Binary Function Only placeholder slots directly beneath your main account. They are not registration surfaces — actual members are placed under the open child slots beneath them. Shadow accounts do not earn wallet, Direct Referral, or Binary Cycle bonuses.'
  },
  {
    question: 'How do I register someone under my binary tree?',
    answer:
      'Go to Genealogy in the sidebar. You will see your binary tree with open slot markers. Click an open slot, fill in the registration form, enter a valid activation code you own, and submit. The new member will be placed in the slot you selected.'
  },
  {
    question: 'Why is my wallet balance showing as Pending?',
    answer:
      'Pending balance holds computed income that has not yet been formally posted to your available wallet. Once the relevant pairing, cycle, or referral process is confirmed by the system, the amount moves to your available balance and becomes encashable.'
  }
];

type FaqItemProps = { question: string; answer: string };

function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--accent)]/30"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{question}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--muted-foreground)] transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open ? (
        <p className="px-5 pb-4 text-sm leading-6 text-[var(--muted-foreground)]">{answer}</p>
      ) : null}
    </div>
  );
}

export function SupportView() {
  const { user } = useAuth();
  const { notify } = useFeedback();

  const [category, setCategory] = useState<SupportMessageCategory>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 10) return;
    setSubmitting(true);
    try {
      await submitSupportMessage({ category, subject: subject.trim(), message: message.trim() });
      notify({
        title: 'Inquiry submitted',
        description: 'Your message has been received. Our team will follow up with you.',
        tone: 'success'
      });
      setSubject('');
      setMessage('');
      setCategory('general');
    } catch {
      notify({
        title: 'Unable to submit',
        description: 'Please try again or contact support directly.',
        tone: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Alert banner */}
      <div className="flex items-start gap-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-5 py-4">
        <MessageCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            For urgent concerns, message us directly on Facebook for the fastest response.
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
            Include your username, the date and time of the issue, and a short description.
          </p>
        </div>
      </div>

      {/* Contact channels */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="flex items-start gap-3 pt-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10">
              <MessageCircle className="size-4 text-blue-600 dark:text-blue-400" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Facebook</p>
              <p className="text-sm font-medium text-[var(--foreground)]">Yor International</p>
              <p className="text-xs text-[var(--muted-foreground)]">Primary support channel</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="flex items-start gap-3 pt-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <Mail className="size-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Email</p>
              <p className="text-sm font-medium text-[var(--foreground)]">support@yor.ph</p>
              <p className="text-xs text-[var(--muted-foreground)]">Secondary support channel</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="flex items-start gap-3 pt-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
              <Phone className="size-4 text-violet-600 dark:text-violet-400" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Operations</p>
              <p className="text-sm font-medium text-[var(--foreground)]">Mon – Fri, 9 AM – 5 PM</p>
              <p className="text-xs text-[var(--muted-foreground)]">Office hours only</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Submit inquiry form */}
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Submit an Inquiry</CardTitle>
            <p className="text-xs text-[var(--muted-foreground)]">
              Sending as <span className="font-medium text-[var(--foreground)]">{user?.name ?? 'you'}</span>
              {user?.email ? ` · ${user.email}` : ''}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--foreground)]">Category</span>
                <select
                  className="flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportMessageCategory)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--foreground)]">Subject</span>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your concern"
                  maxLength={120}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--foreground)]">Message</span>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue in detail. Include your username, the date and time, and any relevant code or transaction IDs."
                  maxLength={2000}
                />
                <span className="text-right text-[10px] text-[var(--muted-foreground)]">{message.length}/2000</span>
              </label>

              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="text-xs">
                  {CATEGORIES.find((c) => c.value === category)?.label}
                </Badge>
                <Button
                  type="submit"
                  disabled={submitting || subject.trim().length < 3 || message.trim().length < 10}
                >
                  {submitting ? 'Submitting…' : 'Submit Inquiry'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">FAQ</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">Common Questions</h3>
          </div>
          <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </Card>
        </div>
      </div>
    </section>
  );
}
