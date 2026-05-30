import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackTone = 'info' | 'success' | 'warning' | 'destructive';

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone: FeedbackTone;
};

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: FeedbackTone;
};

type NotifyOptions = {
  title: string;
  description?: string;
  tone?: FeedbackTone;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type FeedbackContextValue = {
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
  notify: (options: NotifyOptions) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle
};

const toneClasses: Record<FeedbackTone, string> = {
  info: 'border-[var(--border)] text-[var(--foreground)]',
  success: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-300',
  warning: 'border-amber-500/35 text-amber-600 dark:text-amber-300',
  destructive: 'border-red-500/35 text-red-600 dark:text-red-300'
};

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const toastIdRef = useRef(0);
  const dismissToasts = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    window.addEventListener('pointerdown', dismissToasts, { capture: true });
    window.addEventListener('scroll', dismissToasts, { capture: true, passive: true });
    window.addEventListener('wheel', dismissToasts, { capture: true, passive: true });
    window.addEventListener('touchmove', dismissToasts, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', dismissToasts, { capture: true });
      window.removeEventListener('scroll', dismissToasts, { capture: true });
      window.removeEventListener('wheel', dismissToasts, { capture: true });
      window.removeEventListener('touchmove', dismissToasts, { capture: true });
    };
  }, [dismissToasts, toasts.length]);

  const notify = useCallback((options: NotifyOptions) => {
    const id = `toast-${Date.now()}-${toastIdRef.current++}`;
    const toast: ToastMessage = {
      id,
      title: options.title,
      description: options.description,
      tone: options.tone ?? 'info'
    };

    setToasts((current) => [toast, ...current].slice(0, 4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 5200);
  }, []);

  const confirmAction = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPendingConfirm({
        ...options,
        tone: options.tone ?? 'warning',
        resolve
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      confirmAction,
      notify
    }),
    [confirmAction, notify]
  );

  function closeConfirm(confirmed: boolean) {
    pendingConfirm?.resolve(confirmed);
    setPendingConfirm(null);
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <AlertDialogPrimitive.Root open={Boolean(pendingConfirm)}>
        <AlertDialogPrimitive.Portal>
          {pendingConfirm ? (
            <>
              <AlertDialogPrimitive.Overlay className="feedback-dialog-overlay fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm" />
              <AlertDialogPrimitive.Content className="feedback-dialog-content fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-6 text-[var(--popover-foreground)] shadow-2xl">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'flex size-11 shrink-0 items-center justify-center rounded-xl border bg-[var(--background)]',
                          toneClasses[pendingConfirm.tone ?? 'warning']
                        )}
                      >
                        {(() => {
                          const Icon = toneIcon[pendingConfirm.tone ?? 'warning'];
                          return <Icon className="size-5" />;
                        })()}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <AlertDialogPrimitive.Title className="text-lg font-semibold">
                          {pendingConfirm.title}
                        </AlertDialogPrimitive.Title>
                        <AlertDialogPrimitive.Description className="text-sm leading-6 text-[var(--muted-foreground)]">
                          {pendingConfirm.description}
                        </AlertDialogPrimitive.Description>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <AlertDialogPrimitive.Cancel asChild>
                        <Button type="button" variant="outline" onClick={() => closeConfirm(false)}>
                          {pendingConfirm.cancelLabel ?? 'Cancel'}
                        </Button>
                      </AlertDialogPrimitive.Cancel>
                      <AlertDialogPrimitive.Action asChild>
                        <Button type="button" onClick={() => closeConfirm(true)}>
                          {pendingConfirm.confirmLabel ?? 'Continue'}
                        </Button>
                      </AlertDialogPrimitive.Action>
                    </div>
              </AlertDialogPrimitive.Content>
            </>
          ) : null}
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>

      <ToastPrimitive.Provider swipeDirection="right">
        <div className="fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const Icon = toneIcon[toast.tone];
              return (
                <ToastPrimitive.Root
                  key={toast.id}
                  asChild
                  duration={5200}
                  onOpenChange={(open) => {
                    if (!open) {
                      setToasts((current) => current.filter((item) => item.id !== toast.id));
                    }
                  }}
                  open
                >
                  <motion.div
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className={cn(
                      'rounded-2xl border bg-[var(--popover)] p-4 text-[var(--popover-foreground)] shadow-xl',
                      toneClasses[toast.tone]
                    )}
                    exit={{ opacity: 0, x: 32, scale: 0.98 }}
                    initial={{ opacity: 0, x: 32, scale: 0.98 }}
                    layout
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <ToastPrimitive.Title className="text-sm font-semibold">
                          {toast.title}
                        </ToastPrimitive.Title>
                        {toast.description ? (
                          <ToastPrimitive.Description className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                            {toast.description}
                          </ToastPrimitive.Description>
                        ) : null}
                      </div>
                      <ToastPrimitive.Close asChild>
                        <button
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                          type="button"
                        >
                          <X className="size-4" />
                          <span className="sr-only">Dismiss</span>
                        </button>
                      </ToastPrimitive.Close>
                    </div>
                  </motion.div>
                </ToastPrimitive.Root>
              );
            })}
          </AnimatePresence>
        </div>
        <ToastPrimitive.Viewport className="fixed right-4 top-4 z-[120]" />
      </ToastPrimitive.Provider>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used inside FeedbackProvider');
  }

  return context;
}
