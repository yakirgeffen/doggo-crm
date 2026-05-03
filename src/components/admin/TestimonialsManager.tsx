import { useState } from 'react';
import { Star, Plus, Trash2, Edit3, Eye, EyeOff, X } from 'lucide-react';
import { useTestimonials } from '../../hooks/useTestimonials';
import { useToast } from '../../context/toast-context';
import { type TrainerTestimonial } from '../../types';
import { Spinner } from '../Spinner';

// Trainer-side admin section: add/edit/publish/unpublish/delete client
// testimonials displayed on the public storefront. Lives inside
// StorefrontAdminPage. Public read of published rows happens directly
// from PublicStorefrontPage via RLS-allowed anon SELECT.

export function TestimonialsManager() {
    const { items, loading, create, update, remove, togglePublished } = useTestimonials();
    const { showToast } = useToast();
    const [editing, setEditing] = useState<TrainerTestimonial | null>(null);
    const [adding, setAdding] = useState(false);

    const handleDelete = async (id: string) => {
        if (!window.confirm('למחוק את ההמלצה? הפעולה לא ניתנת לביטול.')) return;
        try {
            await remove(id);
            showToast('ההמלצה נמחקה', 'success');
        } catch {
            showToast('שגיאה במחיקה', 'error');
        }
    };

    const handleTogglePublished = async (item: TrainerTestimonial) => {
        try {
            await togglePublished(item.id, item.is_published);
            showToast(item.is_published ? 'הוסרה מהפרסום' : 'פורסמה לחנות', 'success');
        } catch {
            showToast('שגיאה בעדכון סטטוס', 'error');
        }
    };

    return (
        <section className="flat-card p-6 md:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-2">
                        <Star className="text-primary" size={20} />
                        המלצות לקוחות
                    </h2>
                    <p className="text-sm text-text-muted">
                        המלצות שיוצגו בדף החנות הציבורי. ניתן לכבות פרסום בלי למחוק.
                    </p>
                </div>
                <button
                    onClick={() => setAdding(true)}
                    className="btn btn-primary text-sm flex items-center gap-1.5 shrink-0"
                    type="button"
                >
                    <Plus size={14} />
                    הוספת המלצה
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10 text-text-muted gap-2">
                    <Spinner size="md" />
                    <span className="text-sm">טוען...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-border rounded-xl">
                    <Star size={32} className="text-text-muted/40 mx-auto mb-3" />
                    <p className="text-sm text-text-secondary mb-1 font-medium">עדיין אין המלצות</p>
                    <p className="text-xs text-text-muted">המלצות עוזרות לקוחות פוטנציאליים לבחור בכם. ניתן להוסיף את הראשונה.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map(item => (
                        <li
                            key={item.id}
                            className={`p-4 rounded-xl border transition-colors ${item.is_published ? 'bg-surface border-border' : 'bg-background border-border-light opacity-60'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-bold text-sm text-text-primary">
                                            {item.client_name}
                                        </span>
                                        {item.client_dog_name && (
                                            <span className="text-xs text-text-muted">· {item.client_dog_name} 🐾</span>
                                        )}
                                        {item.rating && (
                                            <span className="flex items-center gap-0.5 text-warning text-xs ms-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        fill={i < (item.rating || 0) ? 'currentColor' : 'none'}
                                                    />
                                                ))}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{item.body}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleTogglePublished(item)}
                                        title={item.is_published ? 'מוצג בחנות' : 'מוסתר'}
                                        className="p-2 rounded-lg hover:bg-surface-warm text-text-secondary hover:text-text-primary transition-colors"
                                        type="button"
                                    >
                                        {item.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                    <button
                                        onClick={() => setEditing(item)}
                                        title="עריכה"
                                        className="p-2 rounded-lg hover:bg-surface-warm text-text-secondary hover:text-text-primary transition-colors"
                                        type="button"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        title="מחיקה"
                                        className="p-2 rounded-lg hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                                        type="button"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {(adding || editing) && (
                <TestimonialModal
                    initial={editing}
                    onClose={() => { setAdding(false); setEditing(null); }}
                    onSubmit={async (input) => {
                        try {
                            if (editing) {
                                await update(editing.id, input);
                                showToast('ההמלצה עודכנה', 'success');
                            } else {
                                await create(input);
                                showToast('ההמלצה נוספה', 'success');
                            }
                            setAdding(false);
                            setEditing(null);
                        } catch {
                            showToast('שגיאה בשמירה', 'error');
                        }
                    }}
                />
            )}
        </section>
    );
}

function TestimonialModal({
    initial,
    onClose,
    onSubmit,
}: {
    initial: TrainerTestimonial | null;
    onClose: () => void;
    onSubmit: (input: { client_name: string; client_dog_name: string | null; body: string; rating: number | null; is_published: boolean }) => Promise<void>;
}) {
    const [clientName, setClientName] = useState(initial?.client_name || '');
    const [clientDogName, setClientDogName] = useState(initial?.client_dog_name || '');
    const [body, setBody] = useState(initial?.body || '');
    const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
    const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
    const [saving, setSaving] = useState(false);

    const valid = clientName.trim().length > 0 && body.trim().length > 0;

    const handleSubmit = async () => {
        if (!valid) return;
        setSaving(true);
        await onSubmit({
            client_name: clientName.trim(),
            client_dog_name: clientDogName.trim() || null,
            body: body.trim(),
            rating,
            is_published: isPublished,
        });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div
                className="flat-card bg-surface w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h3 className="text-lg font-bold text-text-primary">
                        {initial ? 'עריכת המלצה' : 'הוספת המלצה'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-surface-warm rounded-lg text-text-muted"
                        type="button"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">שם הלקוח</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="input-field"
                                placeholder="ישראלה ישראלי"
                                maxLength={80}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">שם הכלב (לא חובה)</label>
                            <input
                                type="text"
                                value={clientDogName}
                                onChange={(e) => setClientDogName(e.target.value)}
                                className="input-field"
                                placeholder="רקס"
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">תוכן ההמלצה</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="input-field min-h-[120px] resize-y"
                            placeholder="עבדנו עם רוני שלושה חודשים. רקס היה כלב מאתגר וכיום הוא רגוע ושמח. ממליצים בחום."
                            maxLength={500}
                        />
                        <p className="text-[11px] text-text-muted mt-1 text-end">{body.length}/500</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-2">דירוג (לא חובה)</label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRating(rating === n ? null : n)}
                                    className="p-1 hover:scale-110 transition-transform"
                                    title={`${n} כוכבים`}
                                >
                                    <Star
                                        size={22}
                                        className={rating !== null && n <= rating ? 'text-warning' : 'text-border'}
                                        fill={rating !== null && n <= rating ? 'currentColor' : 'none'}
                                    />
                                </button>
                            ))}
                            {rating !== null && (
                                <button
                                    type="button"
                                    onClick={() => setRating(null)}
                                    className="text-xs text-text-muted hover:text-text-primary ms-2 underline"
                                >
                                    הסרה
                                </button>
                            )}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-4 h-4 accent-primary"
                        />
                        <span>פרסום בחנות הציבורית</span>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-background">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost text-sm"
                        type="button"
                        disabled={saving}
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !valid}
                        className="btn btn-primary text-sm flex items-center gap-1.5"
                        type="button"
                    >
                        {saving && <Spinner size="sm" />}
                        {saving ? 'שומר...' : initial ? 'שמירת שינויים' : 'הוספה'}
                    </button>
                </div>
            </div>
        </div>
    );
}
