import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';

// Sumit DocumentType enum — VERIFY against Sumit's authoritative enum
// before relying on these values in production. Common Sumit values
// across community integrations:
//   1 = Invoice
//   2 = InvoiceReceipt
//   3 = Receipt
//   4 = TaxInvoice (less common)
//   5 = CreditInvoice
//   6 = PriceQuotation (working assumption for G8)
//   7 = DeliveryNote
//   8 = PurchaseOrder
// CTO confirms exact enum during the integration design pass; the
// value below is parameterized at the call site so a one-line change
// updates everything when verified.
export const SUMIT_DOC_TYPE_PRICE_QUOTATION = 6;
export const SUMIT_DOC_TYPE_INVOICE = 1;
export const SUMIT_DOC_TYPE_RECEIPT = 3;

export interface SumitLineItem {
    Item?: { Name?: string; Description?: string };
    Quantity: number;
    UnitPrice: number;
    Total?: number;
    Currency?: string;
}

export interface SumitCustomerInput {
    Name: string;
    EmailAddress?: string;
    Phone?: string;
    ExternalIdentifier?: string;
}

export interface CreateDocumentInput {
    DocumentType: number;
    Customer: SumitCustomerInput;
    Items: SumitLineItem[];
    Subject?: string;
    Description?: string;
    Language?: number; // 0 = Hebrew per Sumit docs
}

export interface SendDocumentInput {
    DocumentID: number;
    DocumentType: number;
    DocumentNumber?: number;
    EmailAddress: string;
    SenderName?: string;
    SenderEmail?: string;
    Subject?: string;
    Language?: number;
    PersonalMessage?: string;
}

export function useSumit() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [vaultData, setVaultData] = useState<{ company_id: string } | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('sys_integrations_vault')
                .select('access_key_id, is_connected')
                .eq('user_id', user.id)
                .eq('service_name', 'sumit')
                .single();

            if (data) {
                setVaultData({ company_id: data.access_key_id });
                setIsConnected(data.is_connected || false);
            } else {
                setVaultData(null);
                setIsConnected(false);
            }
        } catch (error) {
            console.error('Error fetching Sumit status:', error);
        }
    }, [user]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const saveKeys = async (companyId: string, apiKey: string) => {
        if (!user) return { success: false, error: 'no user' as const };
        setLoading(true);
        try {
            if (!/^\d+$/.test(companyId.trim())) {
                throw new Error('CompanyID חייב להיות מספר.');
            }
            const { error } = await supabase
                .from('sys_integrations_vault')
                .upsert({
                    user_id: user.id,
                    service_name: 'sumit',
                    access_key_id: companyId.trim(),
                    secret_access_key: apiKey.trim(),
                    is_connected: false,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
            await fetchStatus();
            return { success: true };
        } catch (error) {
            console.error('Error saving Sumit keys:', error);
            return { success: false, error: error instanceof Error ? error.message : 'save failed' };
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('sumit-api', {
                body: { action: 'test_connection' }
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Connection failed');
            await supabase
                .from('sys_integrations_vault')
                .update({ is_connected: true })
                .eq('user_id', user?.id)
                .eq('service_name', 'sumit');
            setIsConnected(true);
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Sumit test_connection error:', error);
            return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
        } finally {
            setLoading(false);
        }
    };

    const createDocument = async (input: CreateDocumentInput) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('sumit-api', {
                body: {
                    action: 'create_document',
                    payload: { body: input }
                }
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Create failed');
            return { success: true, data: data.data };
        } catch (error) {
            console.error('Sumit create_document error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'create failed' };
        } finally {
            setLoading(false);
        }
    };

    const sendDocument = async (input: SendDocumentInput) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('sumit-api', {
                body: {
                    action: 'send_document',
                    payload: { body: input }
                }
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Send failed');
            return { success: true, data: data.data };
        } catch (error) {
            console.error('Sumit send_document error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'send failed' };
        } finally {
            setLoading(false);
        }
    };

    /**
     * G8 happy path — create a Sumit price quotation for a client and email it.
     * Returns the Sumit DocumentID on success so caller can store it.
     */
    type SendQuoteResult =
        | { success: true; documentId: number; documentNumber?: number }
        | { success: false; error?: string; documentId?: number };

    const sendQuoteToClient = async (params: {
        clientName: string;
        clientEmail: string;
        clientPhone?: string;
        items: SumitLineItem[];
        subject?: string;
        personalMessage?: string;
    }): Promise<SendQuoteResult> => {
        const create = await createDocument({
            DocumentType: SUMIT_DOC_TYPE_PRICE_QUOTATION,
            Customer: {
                Name: params.clientName,
                EmailAddress: params.clientEmail,
                Phone: params.clientPhone,
            },
            Items: params.items,
            Subject: params.subject || 'הצעת מחיר',
            Language: 0, // Hebrew
        });
        if (!create.success) {
            return { success: false, error: typeof create.error === 'string' ? create.error : 'create failed' };
        }

        const created = create.data as { DocumentID?: number; DocumentNumber?: number; DocumentType?: number } | undefined;
        const documentId = created?.DocumentID;
        if (!documentId) {
            return { success: false, error: 'Sumit returned no DocumentID' };
        }

        const send = await sendDocument({
            DocumentID: documentId,
            DocumentType: SUMIT_DOC_TYPE_PRICE_QUOTATION,
            DocumentNumber: created?.DocumentNumber,
            EmailAddress: params.clientEmail,
            Subject: params.subject || 'הצעת מחיר',
            Language: 0,
            PersonalMessage: params.personalMessage,
        });

        if (!send.success) {
            return { success: false, error: typeof send.error === 'string' ? send.error : 'send failed', documentId };
        }

        return { success: true, documentId, documentNumber: created?.DocumentNumber };
    };

    return {
        isConnected,
        vaultData,
        loading,
        saveKeys,
        testConnection,
        createDocument,
        sendDocument,
        sendQuoteToClient,
    };
}
