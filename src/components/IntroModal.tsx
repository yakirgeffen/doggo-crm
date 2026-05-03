import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { PageId, PageIntro } from '../lib/intro-content';
import { supabase } from '../lib/supabase';

/**
 * IntroModal — centered welcome card shown on first visit to a page (and
 * re-openable via the global `?` icon in Layout). Backdrop click closes
 * WITHOUT writing the seen-flag, so an accidental tap re-shows the intro
 * next visit. Primary CTA + secondary `דלג` both write the flag.
 *
 * Behaviour matches the rest of the app's modal lifecycle pattern (Esc to
 * close, focus on first interactive element). No spotlight tour — see CPO
 * proposal 2026-05-03 for the rationale (RTL + responsive math fights
 * spotlight libs hard, and a single card carries enough copy).
 *
 * Telemetry (EXP-001, CMO pre-spec 2026-05-03): three events fire to
 * `intro_modal_events`:
 *   - `'seen'` once on the first render where `isOpen` is true (de-duped
 *     per mount via `seenFiredRef`). The dedupe scope is intentional — we
 *     want one 'seen' per actually-shown-modal instance, not one per
 *     re-render. Closing and re-opening the modal in the same session
 *     intentionally re-fires (a separate viewing event).
 *   - `'cta_click'` on primary CTA before `onDismiss`.
 *   - `'dismiss'` on `דלג` (`onSkip`) or backdrop/Esc/X (`onBackdropClose`).
 *
 * Fire-and-forget: insert errors are caught + logged, never block UI.
 * Pattern matches `useClientAttachments.uploadAttachment` shape but uses
 * a direct `supabase.from().insert()` (no `logActivity` — these are
 * product-telemetry events, not audit-log entries).
 */

interface IntroModalProps {
    isOpen: boolean;
    pageId: PageId;
    intro: PageIntro;
    onDismiss: () => void;
    onSkip: () => void;
    onBackdropClose: () => void;
}

function fireEvent(pageId: PageId, event: 'seen' | 'cta_click' | 'dismiss') {
    // Fire-and-forget: no await, no UI gating. The auth.uid() default on
    // trainer_id supplies the value server-side; insert payload omits it
    // so a logged-out caller hits RLS, not a NULL-default silent failure.
    supabase
        .from('intro_modal_events')
        .insert({ page: pageId, event })
        .then(({ error }) => {
            if (error) console.error('Failed to log intro modal event:', error);
        });
}

export function IntroModal({ isOpen, pageId, intro, onDismiss, onSkip, onBackdropClose }: IntroModalProps) {
    const seenFiredRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset on close so a re-open (via ?-icon or URL param) fires
            // 'seen' again. Each opening of the modal is a distinct view.
            seenFiredRef.current = false;
            return;
        }
        if (!seenFiredRef.current) {
            seenFiredRef.current = true;
            fireEvent(pageId, 'seen');
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                fireEvent(pageId, 'dismiss');
                onBackdropClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, pageId, onBackdropClose]);

    if (!isOpen) return null;

    const Icon = intro.icon;

    const handleBackdropClose = () => {
        fireEvent(pageId, 'dismiss');
        onBackdropClose();
    };

    const handleCtaClick = () => {
        fireEvent(pageId, 'cta_click');
        onDismiss();
    };

    const handleSkip = () => {
        fireEvent(pageId, 'dismiss');
        onSkip();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={handleBackdropClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="intro-modal-title"
        >
            <div
                className="relative flat-card w-full max-w-md p-6 shadow-elevated animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={handleBackdropClose}
                    className="absolute top-3 end-3 p-1.5 text-text-muted hover:text-text-primary hover:bg-background rounded-lg transition-colors"
                    aria-label="סגירה"
                >
                    <X size={18} />
                </button>

                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                    <Icon size={26} strokeWidth={2} />
                </div>

                <h2 id="intro-modal-title" className="text-xl font-bold text-text-primary mb-3">
                    {intro.title}
                </h2>

                <div className="text-sm text-text-secondary leading-relaxed space-y-2 mb-6">
                    {intro.body.map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCtaClick}
                        className="btn btn-primary flex-1"
                        autoFocus
                    >
                        {intro.primaryCta}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="text-sm font-medium text-text-muted hover:text-text-primary px-3 py-2 rounded-lg transition-colors"
                    >
                        דלג
                    </button>
                </div>
            </div>
        </div>
    );
}
