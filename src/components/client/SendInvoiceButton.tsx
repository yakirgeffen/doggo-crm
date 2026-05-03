import { useState } from 'react';
import { FileCheck, MessageCircle, X } from 'lucide-react';
import { supabase, logActivity } from '../../lib/supabase';
import { useToast } from '../../context/toast-context';
import { useSumit } from '../../hooks/useSumit';
import { Spinner } from '../Spinner';

interface SendInvoiceButtonProps {
    programId: string;
    programName: string;
    price: number | null;
    currency: string;
    clientName: string;
    clientEmail: string | null;
    clientPhone?: string | null;
    sumitInvoiceDocumentId: number | null;
    onInvoiceSent?: () => void;
}

// CTO loop iteration 8 — Sumit invoice flow.
// Renders a "Send invoice" button when:
//   - Program has a price > 0
//   - Client has an email address
//   - Sumit is connected
//   - No invoice has been sent yet for this program
// On click, creates a Sumit Invoice document, emails it to the client,
// and persists the resulting DocumentID + DocumentNumber back to the
// programs row for audit trail.

export function SendInvoiceButton({
    programId,
    programName,
    price,
    currency,
    clientName,
    clientEmail,
    clientPhone,
    sumitInvoiceDocumentId,
    onInvoiceSent,
}: SendInvoiceButtonProps) {
    const { showToast } = useToast();
    const sumit = useSumit();
    const [sending, setSending] = useState(false);
    const [showWhatsApp, setShowWhatsApp] = useState<{ documentNumber: number | undefined } | null>(null);

    if (!price || price <= 0) return null;
    if (!clientEmail) return null;

    if (sumitInvoiceDocumentId) {
        return (
            <div className="text-xs text-text-muted flex items-center gap-1.5 px-3 py-1.5 bg-success/5 rounded-lg">
                <FileCheck size={14} className="text-success" />
                חשבונית #{sumitInvoiceDocumentId} נשלחה
            </div>
        );
    }

    if (!sumit.isConnected) {
        return (
            <a
                href="/settings"
                className="text-xs font-medium text-text-secondary hover:text-primary flex items-center gap-1.5 bg-background hover:bg-surface-warm px-3 py-1.5 rounded-lg transition-colors"
            >
                <FileCheck size={14} />
                חבר Sumit להפקת חשבונית
            </a>
        );
    }

    const handleSend = async () => {
        if (sending) return;
        setSending(true);
        try {
            const result = await sumit.sendInvoiceToClient({
                clientName,
                clientEmail,
                clientPhone: clientPhone || undefined,
                items: [{
                    Item: { Name: programName },
                    Quantity: 1,
                    UnitPrice: price,
                    Currency: currency || 'ILS',
                }],
                subject: `חשבונית — ${programName}`,
                personalMessage: 'תודה על העסק! מצורפת החשבונית.',
            });

            if (!result.success) {
                showToast(`שליחת החשבונית נכשלה: ${result.error || ''}`, 'error');
                setSending(false);
                return;
            }

            // Persist DocumentID + DocumentNumber back to the program
            const { error: updateError } = await supabase
                .from('programs')
                .update({
                    sumit_invoice_document_id: result.documentId,
                    sumit_invoice_document_number: result.documentNumber || null,
                })
                .eq('id', programId);
            if (updateError) console.error('Programs update failed:', updateError);

            await logActivity('program', programId, 'invoice_sent', `חשבונית Sumit #${result.documentNumber ?? result.documentId} נשלחה ב-₪${price.toLocaleString()}`);

            showToast(`חשבונית נשלחה ל-${clientEmail} 🐾`, 'success');
            setShowWhatsApp({ documentNumber: result.documentNumber });
            onInvoiceSent?.();
        } catch (err) {
            console.error('SendInvoice error:', err);
            showToast('שגיאה בשליחת החשבונית', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button
                onClick={handleSend}
                disabled={sending || sumit.loading}
                className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                title="הפק וחתום חשבונית בסומיט"
            >
                {sending ? (
                    <>
                        <Spinner size="sm" />
                        <span>שולח...</span>
                    </>
                ) : (
                    <>
                        <FileCheck size={14} />
                        <span>שליחת חשבונית</span>
                    </>
                )}
            </button>

            {showWhatsApp && (() => {
                const phoneDigits = (clientPhone || '').replace(/[^\d]/g, '');
                const intl = phoneDigits.startsWith('0') ? '972' + phoneDigits.slice(1) : phoneDigits;
                const msg = encodeURIComponent(
                    `שלום ${clientName}!\n` +
                    `הרגע שלחתי לך חשבונית${showWhatsApp.documentNumber ? ` #${showWhatsApp.documentNumber}` : ''} בסך ₪${price.toLocaleString()} עבור ${programName}.\n` +
                    `תודה רבה! 🐾`
                );
                const waUrl = phoneDigits ? `https://wa.me/${intl}?text=${msg}` : `https://wa.me/?text=${msg}`;

                return (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowWhatsApp(null)}>
                        <div className="bg-surface rounded-2xl shadow-card w-full max-w-sm border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="bg-success/5 border-b border-success/20 px-5 py-4 flex justify-between items-center">
                                <h2 className="text-base font-bold text-text-primary">חשבונית נשלחה ✓</h2>
                                <button onClick={() => setShowWhatsApp(null)} className="text-text-muted hover:text-text-primary p-1">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-5 space-y-3">
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    רוצה לעדכן את הלקוח/ה גם ב-WhatsApp?
                                </p>
                                <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setShowWhatsApp(null)}
                                    className="flex items-center justify-center gap-2 w-full bg-success/10 hover:bg-success/15 text-success font-bold py-2.5 rounded-xl transition-colors text-sm"
                                >
                                    <MessageCircle size={16} />
                                    {phoneDigits ? `שלח/י ל-${phoneDigits}` : 'בחר/י נמען'}
                                </a>
                                <button
                                    onClick={() => setShowWhatsApp(null)}
                                    className="btn btn-secondary w-full text-sm"
                                >
                                    סיום
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
