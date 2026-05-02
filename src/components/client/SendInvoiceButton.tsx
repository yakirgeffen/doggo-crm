import { useState } from 'react';
import { FileCheck, Loader2 } from 'lucide-react';
import { supabase, logActivity } from '../../lib/supabase';
import { useToast } from '../../context/toast-context';
import { useSumit } from '../../hooks/useSumit';

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
            onInvoiceSent?.();
        } catch (err) {
            console.error('SendInvoice error:', err);
            showToast('שגיאה בשליחת החשבונית', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <button
            onClick={handleSend}
            disabled={sending || sumit.loading}
            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            title="הפק וחתום חשבונית בסומיט"
        >
            {sending ? (
                <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>שולח...</span>
                </>
            ) : (
                <>
                    <FileCheck size={14} />
                    <span>שלח חשבונית</span>
                </>
            )}
        </button>
    );
}
