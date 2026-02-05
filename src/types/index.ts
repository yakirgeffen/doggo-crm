export interface Client {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    primary_dog_name: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Program {
    id: string;
    client_id: string;
    program_name: string;
    program_type: 'fixed_sessions' | 'open_ended';
    sessions_included: number | null;
    sessions_completed: number;
    status: 'active' | 'paused' | 'completed';
    assigned_trainer: string | null;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_link_id: string | null;
    invoice_url: string | null;
    invoice_pdf_url: string | null;
    greeninvoice_invoice_number: string | null; // Legacy? Keep for now
    price: number | null;
    currency: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
}

export interface Session {
    id: string;
    program_id: string;
    session_date: string;
    trainer: string | null;
    session_notes: string | null;
    homework: string | null;
    next_session_date: string | null;
    created_at: string;
}
