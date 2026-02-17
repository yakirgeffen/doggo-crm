import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TrainerPublicProfile {
    business_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    specialties: string[];
}

interface PublicService {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    duration_minutes: number;
    type: 'fixed' | 'open';
    sessions_included: number | null;
}

export function PublicStorefrontPage() {
    const { trainerHandle } = useParams<{ trainerHandle: string }>();
    const [profile, setProfile] = useState<TrainerPublicProfile | null>(null);
    const [services, setServices] = useState<PublicService[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!trainerHandle) return;
        fetchStorefront();
    }, [trainerHandle]);

    const fetchStorefront = async () => {
        setLoading(true);

        // 1. Find trainer by handle
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('user_id, business_name, bio, avatar_url, specialties')
            .eq('trainer_handle', trainerHandle)
            .single();

        if (settingsError || !settingsData) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setProfile({
            business_name: settingsData.business_name,
            bio: settingsData.bio,
            avatar_url: settingsData.avatar_url,
            specialties: settingsData.specialties || [],
        });

        // 2. Fetch active services for this trainer
        const { data: servicesData } = await supabase
            .from('services')
            .select('id, name, description, price, currency, duration_minutes, type, sessions_included')
            .eq('user_id', settingsData.user_id)
            .eq('is_active', true)
            .order('price', { ascending: true });

        if (servicesData) setServices(servicesData);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-text-muted text-sm">טוען...</div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="flat-card w-full max-w-md p-10 text-center">
                    <div className="text-5xl mb-4">🐾</div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">מאלף לא נמצא</h1>
                    <p className="text-text-secondary">הדף שחיפשת לא קיים או שהקישור אינו תקין.</p>
                </div>
            </div>
        );
    }

    const displayName = profile?.business_name || trainerHandle;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <header className="bg-gradient-to-bl from-primary/15 via-accent/5 to-background">
                <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-2xl bg-surface shadow-card border border-border mx-auto mb-5 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">🐕‍🦺</span>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-text-primary mb-2">{displayName}</h1>

                    {profile?.bio && (
                        <p className="text-text-secondary max-w-lg mx-auto leading-relaxed">{profile.bio}</p>
                    )}

                    {profile?.specialties && profile.specialties.length > 0 && (
                        <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
                            {profile.specialties.map((s) => (
                                <span key={s} className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* Services Grid */}
            <main className="max-w-3xl mx-auto px-4 pb-16 -mt-2">
                {services.length === 0 ? (
                    <div className="flat-card p-10 text-center text-text-muted">
                        <p className="font-medium">עדיין לא הוגדרו שירותים</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="flat-card p-6 flex flex-col justify-between hover:shadow-card transition-shadow group"
                            >
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary mb-1">{service.name}</h3>
                                    {service.description && (
                                        <p className="text-sm text-text-secondary mb-3 leading-relaxed">{service.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} />
                                            {service.duration_minutes} דק׳
                                        </span>
                                        {service.type === 'fixed' && service.sessions_included && (
                                            <span className="flex items-center gap-1">
                                                <Users size={13} />
                                                {service.sessions_included} מפגשים
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-light">
                                    <span className="text-2xl font-bold text-text-primary ltr-nums" dir="ltr">
                                        ₪{service.price}
                                    </span>
                                    <Link
                                        to={`/t/${trainerHandle}/intake?service=${service.id}`}
                                        className="btn btn-primary text-sm py-2 px-5 flex items-center gap-1.5 group-hover:shadow-md transition-shadow"
                                    >
                                        קבע תור
                                        <ArrowLeft size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center pb-8 text-xs text-text-muted">
                פועל באמצעות <span className="font-medium">Doggo CRM</span> 🐾
            </footer>
        </div>
    );
}
