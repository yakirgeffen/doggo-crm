import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { PageIntro } from '../lib/intro-content';

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
 */

interface IntroModalProps {
    isOpen: boolean;
    intro: PageIntro;
    onDismiss: () => void;
    onSkip: () => void;
    onBackdropClose: () => void;
}

export function IntroModal({ isOpen, intro, onDismiss, onSkip, onBackdropClose }: IntroModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBackdropClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onBackdropClose]);

    if (!isOpen) return null;

    const Icon = intro.icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={onBackdropClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="intro-modal-title"
        >
            <div
                className="relative flat-card w-full max-w-md p-6 shadow-elevated animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onBackdropClose}
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
                        onClick={onDismiss}
                        className="btn btn-primary flex-1"
                        autoFocus
                    >
                        {intro.primaryCta}
                    </button>
                    <button
                        onClick={onSkip}
                        className="text-sm font-medium text-text-muted hover:text-text-primary px-3 py-2 rounded-lg transition-colors"
                    >
                        דלג
                    </button>
                </div>
            </div>
        </div>
    );
}
