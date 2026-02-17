export interface Client {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    primary_dog_name: string | null;
    notes: string | null;
    is_active: boolean;
    behavioral_tags: string[];
    lead_source: string | null;
    created_at: string;
}

export interface Program {
    id: string;
    client_id: string;
    service_id: string | null;
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
    greeninvoice_invoice_number: string | null;
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

export interface TrainerProfile {
    user_id: string;
    business_name: string | null;
    trainer_handle: string | null;
    bio: string | null;
    avatar_url: string | null;
    specialties: string[];
    work_days: number[];
    work_hours_start: string;
    work_hours_end: string;
}

export interface IntakeSubmission {
    id: string;
    trainer_id: string | null;
    full_name: string;
    phone: string | null;
    dog_name: string | null;
    dog_breed: string | null;
    dog_age: string | null;
    notes: string | null;
    behavioral_tags: string[];
    lead_source: string | null;
    selected_service_id: string | null;
    status: 'new' | 'approved' | 'archived';
    created_at: string;
}

export interface UserSettings {
    user_id: string;
    business_name: string | null;
    trainer_handle: string | null;
    bio: string | null;
    avatar_url: string | null;
    specialties: string[];
    work_days: number[]; // 0-6
    work_hours_start: string; // "09:00"
    work_hours_end: string; // "17:00"
}
