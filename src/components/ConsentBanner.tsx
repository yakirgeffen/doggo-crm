// Consent banner — GDPR + Israeli Privacy Law surface.
//
// Authored 2026-05-17 by Neta (Data IC). Pairs with `src/lib/analytics.ts`.
// Two-tier consent model:
//   - analytics  (GA4 + PostHog product analytics + session replay)
//   - marketing  (Meta Pixel + Meta CAPI for ad attribution)
//
// Defaults: both denied. Banner appears on first visit; the trainer can
// accept-all, reject-all, or open preferences to pick per-tier. Choice
// is stored in localStorage under `doggo:consent` and survives across
// visits. The wrapper module reads this on bootstrap.
//
// Hebrew-first copy matching the rest of the site. RTL preserved.

import { useEffect, useState } from 'react';
import { getConsent, setConsent, loadConsentFromStorage } from '../lib/analytics';

const DISMISSED_KEY = 'doggo:consent:dismissed';

export function ConsentBanner() {
    const [visible, setVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [analyticsChecked, setAnalyticsChecked] = useState(false);
    const [marketingChecked, setMarketingChecked] = useState(false);

    useEffect(() => {
        const current = loadConsentFromStorage();
        setAnalyticsChecked(current.analytics);
        setMarketingChecked(current.marketing);
        const dismissed = typeof localStorage !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === '1';
        if (!dismissed) {
            setVisible(true);
        }
    }, []);

    function persist(next: { analytics: boolean; marketing: boolean }) {
        setConsent(next);
        try {
            localStorage.setItem(DISMISSED_KEY, '1');
        } catch { /* swallow */ }
        setVisible(false);
    }

    function acceptAll() {
        persist({ analytics: true, marketing: true });
    }

    function rejectAll() {
        persist({ analytics: false, marketing: false });
    }

    function savePreferences() {
        persist({ analytics: analyticsChecked, marketing: marketingChecked });
    }

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="הגדרות פרטיות וקובצי Cookie"
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-elevated p-4 md:p-6"
            dir="rtl"
        >
            <div className="max-w-5xl mx-auto">
                {!showPreferences ? (
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 text-sm text-text-secondary leading-relaxed">
                            <p className="font-semibold text-text-primary mb-1">אנחנו משתמשים בקובצי Cookie</p>
                            <p>
                                האתר משתמש בקובצי Cookie בסיסיים (חיוניים לתפעול), בנתוני אנליטיקה (כדי להבין איך משתמשים באתר) ובנתוני שיווק (כדי למדוד קמפיינים).
                                {' '}
                                <a href="/privacy" className="text-primary hover:underline">פרטים מלאים במדיניות הפרטיות</a>.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:flex-shrink-0">
                            <button
                                onClick={rejectAll}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                דחה הכל
                            </button>
                            <button
                                onClick={() => setShowPreferences(true)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                הגדרות
                            </button>
                            <button
                                onClick={acceptAll}
                                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                אשר הכל
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="font-semibold text-text-primary mb-3">הגדרות פרטיות</h2>
                        <div className="space-y-3 mb-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked
                                    disabled
                                    className="mt-1"
                                    aria-label="חיוני"
                                />
                                <div className="flex-1 text-sm">
                                    <div className="font-medium text-text-primary">חיוני (תמיד פעיל)</div>
                                    {/* anti-bot: em dash removed from consent description */}
                                    <div className="text-text-secondary">דרוש לתפעול האתר: התחברות, הגדרות שפה, פעולות במערכת.</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={analyticsChecked}
                                    onChange={e => setAnalyticsChecked(e.target.checked)}
                                    id="consent-analytics"
                                    className="mt-1"
                                />
                                <div className="flex-1 text-sm">
                                    <label htmlFor="consent-analytics" className="font-medium text-text-primary cursor-pointer">אנליטיקה</label>
                                    <div className="text-text-secondary">עוזר לנו להבין איך משתמשים באתר — Google Analytics, PostHog. הקלטות מסך עם מסוך אוטומטי של שדות קלט.</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={marketingChecked}
                                    onChange={e => setMarketingChecked(e.target.checked)}
                                    id="consent-marketing"
                                    className="mt-1"
                                />
                                <div className="flex-1 text-sm">
                                    <label htmlFor="consent-marketing" className="font-medium text-text-primary cursor-pointer">שיווק</label>
                                    <div className="text-text-secondary">מאפשר מדידת קמפיינים פרסומיים — Meta Pixel. שולח אירועי המרה ל-Meta דרך השרת שלנו (CAPI) עם נתונים מוצפנים.</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowPreferences(false)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                חזור
                            </button>
                            <button
                                onClick={savePreferences}
                                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                שמור הגדרות
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Re-export for surfaces that want to surface a "manage privacy" link
// (footer, settings page). Calls into the wrapper directly.
export function getCurrentConsent() {
    return getConsent();
}
