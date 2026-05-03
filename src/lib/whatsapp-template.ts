/**
 * Substitutes `{varName}` placeholders in a WhatsApp template string with the
 * provided values. Returns the `fallback` if `template` is null, undefined, or
 * an empty/whitespace-only string.
 *
 * Pure function — no side effects, no I/O.
 *
 * @example
 *   applyTemplate('היי {firstName} 🐾', { firstName: 'דנה' }, 'fallback')
 *   // → 'היי דנה 🐾'
 *
 *   applyTemplate(null, { firstName: 'דנה' }, 'היי 🐾')
 *   // → 'היי 🐾'
 */
export function applyTemplate(
    template: string | null,
    vars: Record<string, string>,
    fallback: string
): string {
    if (!template || template.trim() === '') return fallback;
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = vars[key];
        return value !== undefined ? value : match;
    });
}
