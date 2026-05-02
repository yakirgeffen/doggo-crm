import { createContext, useContext } from 'react';
import { type Session, type User } from '@supabase/supabase-js';

export interface AuthContextType {
    session: Session | null;
    user: User | null;
    providerToken: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    providerToken: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);
