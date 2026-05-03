import { useState } from 'react';
import { Receipt, Send, Loader2, Plus, Trash2, MessageCircle, CheckCircle2 } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { useToast } from '../context/toast-context';
import { useServices, type Service } from '../hooks/useServices';
import { useSumit } from '../hooks/useSumit';

interface SendQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSent?: () => void;
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
}

interface QuoteLine {
    serviceId: string | null;
    name: string;
    quantity: number;
    unitPrice: number;
}

export function SendQuoteModal({ isOpen, onClose, onSent, clientId, clientName, clientEmail, clientPhone }: SendQuoteModalProps) {
    const { showToast } = useToast();
    const { services, loading: servicesLoading } = useServices();
    const sumit = useSumit();
    const [lines, setLines] = useState<QuoteLine[]>([{ serviceId: null, name: '', quantity: 1, unitPrice: 0 }]);
    const [personalMessage, setPersonalMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sentSuccess, setSentSuccess] = useState<{ documentNumber: number | undefined; total: number } | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setSentSuccess(null);
        onClose();
    };

    if (sentSuccess) {
        const whatsappMessage = encodeURIComponent(
            `שלום ${clientName}!\n` +
            `הרגע שלחתי לך במייל הצעת מחיר${sentSuccess.documentNumber ? ` (#${sentSuccess.documentNumber})` : ''} בסך ₪${sentSuccess.total.toLocaleString()}.\n` +
            `אם יש שאלות — אני כאן 🐾`
        );
        const phoneDigits = (clientPhone || '').replace(/[^\d]/g, '');
        const waUrl = phoneDigits
            ? `https://wa.me/${phoneDigits.startsWith('0') ? '972' + phoneDigits.slice(1) : phoneDigits}?text=${whatsappMessage}`
            : `https://wa.me/?text=${whatsappMessage}`;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleClose}>
                <div className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden animate-modal-in" onClick={e => e.stopPropagation()}>
                    <div className="bg-success/5 border-b border-success/20 px-6 py-5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">הצעת מחיר נשלחה!</h2>
                            <p className="text-xs text-text-muted">
                                {sentSuccess.documentNumber ? `#${sentSuccess.documentNumber} · ` : ''}
                                ל-{clientEmail}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-sm text-text-secondary leading-relaxed">
                            רוצה לשלוח גם הודעה ב-WhatsApp ללקוח/ה? לפעמים זה מקצר את זמן התגובה.
                        </p>

                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-success/10 hover:bg-success/15 text-success font-bold py-3 rounded-xl transition-colors"
                        >
                            <MessageCircle size={18} />
                            {phoneDigits ? `שלח/י ל-${phoneDigits}` : 'בחר/י נמען ב-WhatsApp'}
                        </a>

                        <button
                            onClick={handleClose}
                            className="btn btn-secondary w-full"
                        >
                            סיום
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const total = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);

    const updateLine = (idx: number, patch: Partial<QuoteLine>) => {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
    };

    const pickService = (idx: number, serviceId: string) => {
        const svc = services.find((s: Service) => s.id === serviceId);
        if (svc) {
            updateLine(idx, { serviceId: svc.id, name: svc.name, unitPrice: Number(svc.price) || 0 });
        } else {
            updateLine(idx, { serviceId: null });
        }
    };

    const addLine = () => setLines(prev => [...prev, { serviceId: null, name: '', quantity: 1, unitPrice: 0 }]);
    const removeLine = (idx: number) => setLines(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));

    const validLines = lines.filter(l => l.name.trim() && l.unitPrice > 0 && l.quantity > 0);

    const canSend = !!clientEmail && validLines.length > 0 && sumit.isConnected && !submitting;

    const handleSend = async () => {
        if (!canSend) return;
        setSubmitting(true);
        try {
            const result = await sumit.sendQuoteToClient({
                clientName,
                clientEmail,
                clientPhone,
                items: validLines.map(l => ({
                    Item: { Name: l.name },
                    Quantity: l.quantity,
                    UnitPrice: l.unitPrice,
                    Currency: 'ILS',
                })),
                subject: `הצעת מחיר עבור ${clientName}`,
                personalMessage: personalMessage || undefined,
            });

            if (!result.success) {
                showToast(`שליחת הצעת המחיר נכשלה: ${result.error || ''}`, 'error');
                setSubmitting(false);
                return;
            }

            const { error: insertError } = await supabase.from('quotes').insert([{
                client_id: clientId,
                sumit_document_id: result.documentId,
                sumit_document_number: result.documentNumber,
                total_amount: total,
                currency: 'ILS',
                status: 'sent',
            }]);
            if (insertError) console.error('quotes insert failed:', insertError);

            await logActivity('client', clientId, 'quote_sent', `הצעת מחיר Sumit #${result.documentNumber ?? result.documentId} נשלחה ב-₪${total.toLocaleString()}`);

            showToast(`הצעת מחיר נשלחה ל-${clientEmail} 🐾`, 'success');
            setSentSuccess({ documentNumber: result.documentNumber, total });
            setLines([{ serviceId: null, name: '', quantity: 1, unitPrice: 0 }]);
            setPersonalMessage('');
            onSent?.();
        } catch (err) {
            console.error('SendQuote error:', err);
            showToast('שגיאה בשליחת הצעת המחיר', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-card w-full max-w-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col animate-modal-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-primary/5 border-b border-border px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">שליחת הצעת מחיר</h2>
                        <p className="text-xs text-text-muted">הפק הצעת מחיר ושלח ללקוח דרך Sumit</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!sumit.isConnected && (
                        <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl text-sm">
                            <p className="font-bold text-text-primary mb-1">חיבור Sumit חסר</p>
                            <p className="text-text-secondary">כדי לשלוח הצעות מחיר, חבר את Sumit בעמוד ההגדרות תחת אינטגרציות.</p>
                        </div>
                    )}

                    {!clientEmail && (
                        <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl text-sm">
                            <p className="font-bold text-text-primary mb-1">כתובת מייל חסרה</p>
                            <p className="text-text-secondary">יש להוסיף כתובת מייל לכרטיס הלקוח לפני שליחת הצעת מחיר.</p>
                        </div>
                    )}

                    {/* Recipient */}
                    <div className="bg-background border border-border p-4 rounded-xl">
                        <p className="text-xs font-medium text-text-muted mb-1">נמען</p>
                        <p className="font-bold text-text-primary">{clientName}</p>
                        {clientEmail && <p className="text-sm text-text-secondary ltr-nums" dir="ltr">{clientEmail}</p>}
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-text-primary">פירוט שירותים</h3>
                            <button onClick={addLine} className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Plus size={14} /> הוסף שורה
                            </button>
                        </div>

                        <div className="space-y-3">
                            {lines.map((line, idx) => (
                                <div key={idx} className="bg-surface-warm border border-border rounded-xl p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="input-field text-sm flex-1"
                                            value={line.serviceId || ''}
                                            onChange={e => pickService(idx, e.target.value)}
                                            disabled={servicesLoading}
                                        >
                                            <option value="">בחר מהקטלוג או הקלד מטה...</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} (₪{s.price})</option>
                                            ))}
                                        </select>
                                        {lines.length > 1 && (
                                            <button onClick={() => removeLine(idx)} className="text-text-muted hover:text-error p-2" title="מחק שורה">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-text-muted mb-1">שם הפריט</label>
                                            <input
                                                type="text"
                                                className="input-field text-sm py-1.5"
                                                value={line.name}
                                                onChange={e => updateLine(idx, { name: e.target.value })}
                                                placeholder="שם השירות"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-text-muted mb-1">כמות</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="input-field text-sm py-1.5 ltr-nums"
                                                value={line.quantity}
                                                onChange={e => updateLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-text-muted mb-1">מחיר (₪)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="input-field text-sm py-1.5 ltr-nums"
                                                value={line.unitPrice}
                                                onChange={e => updateLine(idx, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-medium text-text-secondary">סה״כ</span>
                        <span className="text-xl font-bold text-primary ltr-nums">₪{total.toLocaleString()}</span>
                    </div>

                    {/* Personal Message */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">הודעה אישית (אופציונלי)</label>
                        <textarea
                            className="input-field min-h-[80px]"
                            value={personalMessage}
                            onChange={e => setPersonalMessage(e.target.value)}
                            placeholder="ההודעה תופיע במייל שילווה את הצעת המחיר..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border p-4 flex gap-3 bg-surface-warm">
                    <button onClick={onClose} className="btn btn-secondary flex-1">ביטול</button>
                    <button onClick={handleSend} disabled={!canSend} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>שולח...</span>
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                <span>שליחת הצעת מחיר</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
