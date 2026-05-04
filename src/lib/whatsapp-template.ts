/**
 * Substitutes `{varName}` placeholders in a WhatsApp template string with the
 * provided values. Returns the `fallback` if `template` is null, undefined, or
 * an empty/whitespace-only string.
 *
 * Pure function — no side effects, no I/O.
 *
 * After substitution:
 *  - Strips Unicode replacement characters (U+FFFD `�`) that creep in when
 *    a saved template was written by a tool that mangled emoji bytes.
 *  - Strips lone surrogates that would produce `�` when re-encoded.
 *  - Removes hyphenated lamed/bet/vav prefixes injected by users between a
 *    Hebrew preposition and a placeholder (e.g. `ול-{dogName}` → `ול{dogName}`).
 *    Hebrew prepositions attach without separators; the hyphen is a developer
 *    artifact that shouldn't reach end users. Targets the prepositions that
 *    grammatically attach to a following noun: ל, ב, מ, כ, ש, ו, ה.
 *
 * @example
 *   applyTemplate('היי {firstName} 🐾', { firstName: 'דנה' }, 'fallback')
 *   // → 'היי דנה 🐾'
 *
 *   applyTemplate(null, { firstName: 'דנה' }, 'היי 🐾')
 *   // → 'היי 🐾'
 *
 *   applyTemplate('שלום! מה שלומכם ול-יוני?', {}, 'fb')
 *   // → 'שלום! מה שלומכם וליוני?'
 */
export function applyTemplate(
    template: string | null,
    vars: Record<string, string>,
    fallback: string
): string {
    if (!template || template.trim() === '') return fallback;
    const substituted = template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = vars[key];
        return value !== undefined ? value : match;
    });
    return sanitizeWhatsAppMessage(substituted);
}

/**
 * Cleans a message for WhatsApp delivery. Public so callers building a
 * fallback string directly (no template) can run it through the same filter.
 *
 *  - Removes U+FFFD (�) — the replacement char that signals upstream encoding
 *    damage. Better to ship a slightly truncated message than visible garbage.
 *  - Removes lone surrogates (high surrogate without low, or vice-versa) which
 *    `encodeURIComponent` would also reject; pre-cleaning gives a graceful UX.
 *  - Closes the Hebrew-preposition-hyphen gap: `ל-יוני` → `ליוני` (and same
 *    for ב/מ/כ/ש/ו/ה). The hyphen survives only in real compound words like
 *    `דו-קוטבי` which keep the hyphen because the second char isn't a
 *    preposition. Conservative regex: only strips when the char before the
 *    hyphen is one of the prepositional letters AND the next char is a Hebrew
 *    letter. ASCII-hyphenated words (e.g. URLs) are untouched because they
 *    don't have a Hebrew letter before the hyphen.
 */
export function sanitizeWhatsAppMessage(s: string): string {
    return s
        // Drop the Unicode replacement char outright — it's always a corruption signal.
        .replace(/�/g, '')
        // Drop lone surrogates (orphaned halves of a 4-byte UTF-8 sequence).
        // Matches a high surrogate not followed by a low surrogate, or a low
        // surrogate not preceded by a high surrogate.
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        // Strip hyphen between a Hebrew preposition (ל/ב/מ/כ/ש/ו/ה) and a
        // following Hebrew letter — but ONLY when the preposition is a single
        // letter at a word boundary (preceded by start, whitespace, or another
        // single-letter preposition). This avoids damaging real compounds like
        // `דו-קוטבי` where `ו` is part of a longer word, not a preposition.
        // Hebrew range: U+05D0–U+05EA. Loop the replace because chains like
        // `ול-{dog}` need to strip the inner `ל-` after the outer `ו` runs.
        .replace(/(^|[\sא-ת])([לבמכשוה])-([א-ת])/g, (_m, lead, prep, next) => {
            // Only treat as a preposition when `prep` immediately follows
            // a space/start OR another single preposition letter. This pattern
            // matches `ב-X`, `ל-X`, `ול-X`, `שב-X` etc. but NOT `דו-X` because
            // the `ד` before the `ו` isn't itself a preposition pattern start.
            if (lead === '' || /\s/.test(lead) || /[לבמכשוה]/.test(lead)) {
                return `${lead}${prep}${next}`;
            }
            return `${lead}${prep}-${next}`;
        });
}
