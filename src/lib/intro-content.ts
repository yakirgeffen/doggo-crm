import { Users, Settings as SettingsIcon, Store, Calendar as CalendarIcon, Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Page-level intro modal content. v1 ships with `/clients` only; later pages
 * are added by appending entries here + bumping the migration to backfill
 * veterans for the new page id (so existing trainers don't get re-greeted on
 * a screen they already know).
 *
 * Copy follows the Kinneret gender-neutral framework — verbal-noun forms,
 * plural where natural, no slashes, no second-person masculine. Keep each
 * intro to ~3 short lines + 1 primary CTA + a 'דלג' secondary.
 */

export type PageId = 'clients' | 'settings' | 'storefront' | 'calendar' | 'leads';

/**
 * Pages where `<IntroModal>` is actually mounted via `useIntro(pageId)`.
 * The Layout's global `?` icon only appears on routes whose pageId is in
 * this set — clicking it on a non-wired route would set `?intro=X` with no
 * listener. v2 expansion: add the new pageId here when wiring.
 */
export const WIRED_INTRO_PAGES: ReadonlySet<PageId> = new Set<PageId>(['clients']);

export interface PageIntro {
    icon: LucideIcon;
    title: string;
    body: string[];
    primaryCta: string;
}

export const PAGE_INTROS: Record<PageId, PageIntro> = {
    clients: {
        icon: Users,
        title: 'ברוכים הבאים לכרטיסיית הלקוחות',
        body: [
            'כאן מנהלים את כל מי שעובדים איתם — כלבים, היסטוריית מפגשים, קבצים והערות.',
            'אפשר להתחיל בהוספת לקוח ראשון, או לייבא רשימה קיימת מאקסל.',
            'הכל נשמר אוטומטית ומסונכרן עם היומן.',
        ],
        primaryCta: 'מתחילים',
    },
    // v2 candidates — content drafted, not yet wired into pages.
    settings: {
        icon: SettingsIcon,
        title: 'בית הבקרה של העסק',
        body: [
            'מכאן מגדירים את פרטי העסק, שעות הפעילות, קטלוג השירותים וחיבורים חיצוניים — סומיט, חשבונית ירוקה ויומן Google.',
            'כל שינוי נכנס לתוקף מיידית, ואפשר לחזור ולערוך בכל שלב.',
        ],
        primaryCta: 'להגדרות',
    },
    storefront: {
        icon: Store,
        title: 'החנות הציבורית שלך',
        body: [
            'הכתובת האישית שמשותפת ב-WhatsApp, ברשתות ובמודעות. דרכה לקוחות חדשים מגיעים ישירות למערכת — בלי גיליונות אקסל.',
            'אפשר לערוך פרופיל, להוסיף שירותים ולנהל המלצות לקוחות.',
        ],
        primaryCta: 'להתחיל',
    },
    calendar: {
        icon: CalendarIcon,
        title: 'לוח הזמנים',
        body: [
            'תצוגת שבוע ורשימה למפגשים. מסונכרן דו-כיווני עם יומן Google.',
            'לחיצה על משבצת ריקה פותחת קביעת מפגש; לחיצה על אירוע מובילה לכרטיס הלקוח.',
        ],
        primaryCta: 'הבנתי',
    },
    leads: {
        icon: Inbox,
        title: 'תיבת הלידים',
        body: [
            'פניות שמגיעות מטופס החנות הציבורית מופיעות כאן. אפשר לאשר ולהמיר ללקוח, או להעביר לארכיון.',
            'כל פנייה שלא טופלה תוך 24 שעות מסומנת באדום — תזכורת לחזור אליה.',
        ],
        primaryCta: 'הבנתי',
    },
};
