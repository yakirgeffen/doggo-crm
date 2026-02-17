import { type Program } from './index';

export interface DashboardStats {
    activeClients: number;
    activePrograms: number;
    sessionsThisMonth: number;
    pendingPayment: number;
}

export interface ProgramWithClient extends Program {
    clients: {
        id: string;
        full_name: string;
        primary_dog_name: string;
    };
}

export interface SessionWithProgram {
    id: string;
    session_date: string;
    session_number: number | null;
    programs: {
        id: string;
        program_name: string;
        sessions_included: number | null;
        clients: {
            id: string;
            full_name: string;
            primary_dog_name: string;
            phone: string | null;
        };
    };
}

export interface ActionItem {
    type: 'renewal' | 'unpaid';
    program: ProgramWithClient;
}
