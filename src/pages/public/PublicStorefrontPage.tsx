import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Clock, Users, ArrowLeft, Star, Quote } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// G3 data-quality fix: forward marketing params (utm_*, gclid, fbclid, ref)
// from the storefront URL to the intake URL so the lead_source captured at
// intake time includes the trainer's outbound campaign tracking.
const FORWARD_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref'];

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

interface PublicTestimonial {
    id: string;
    client_name: string;
    client_dog_name: string | null;
    body: string;
    rating: number | null;
    display_order: number;
    created_at: string;
}

export function PublicStorefrontPage() {
    const { trainerHandle } = useParams<{ trainerHandle: string }>();
    const [searchParams] = useSearchParams();

    // Build a query suffix that forwards marketing params to the intake URL
    const forwardQuery = (() => {
        const out = new URLSearchParams();
        for (const key of FORWARD_PARAMS) {
            const v = searchParams.get(key);
            if (v) out.set(key, v);
        }
        return out.toString();
    })();
    const [profile, setProfile] = useState<TrainerPublicProfile | null>(null);
    const [services, setServices] = useState<PublicService[]>([]);
    const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const fetchStorefront = useCallback(async () => {
        if (!trainerHandle) return;
        setLoading(true);

        // 1. Find trainer by handle via security-definer RPC. Cross-tenant
        //    authenticated access to user_settings is blocked since
        //    2026-05-02 TG-1 hardening; the RPC exposes only storefront-
        //    safe columns.
        const { data: profileRows, error: settingsError } = await supabase
            .rpc('get_trainer_profile_by_handle', { handle: trainerHandle });
        const settingsData = Array.isArray(profileRows) ? profileRows[0] : null;

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

        // 3. Fetch published testimonials. RLS allows anon SELECT where is_published=true.
        const { data: testimonialsData } = await supabase
            .from('trainer_testimonials')
            .select('id, client_name, client_dog_name, body, rating, display_order, created_at')
            .eq('user_id', settingsData.user_id)
            .eq('is_published', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (testimonialsData) setTestimonials(testimonialsData as PublicTestimonial[]);
        setLoading(false);
    }, [trainerHandle]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch, setState resolves after I/O
        fetchStorefront();
    }, [fetchStorefront]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background" role="status" aria-label="טוען עמוד מאלף">
                <header className="bg-gradient-to-bl from-primary/10 via-accent/5 to-background">
                    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
                        <div className="h-8 w-48 bg-border/40 rounded-md skeleton-shimmer mb-3" />
                        <div className="h-4 w-3/4 bg-border/30 rounded-md skeleton-shimmer mb-2" />
                        <div className="h-4 w-1/2 bg-border/30 rounded-md skeleton-shimmer" />
                    </div>
                </header>
                <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="flat-card p-6 space-y-3 animate-fade-in"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="h-5 w-1/3 bg-border/40 rounded-md skeleton-shimmer" />
                            <div className="h-4 w-full bg-border/30 rounded-md skeleton-shimmer" />
                            <div className="h-4 w-2/3 bg-border/30 rounded-md skeleton-shimmer" />
                        </div>
                    ))}
                </div>
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
                    <div className="flat-card p-8 md:p-10 text-center">
                        <div className="text-4xl mb-3">🐾</div>
                        <p className="font-bold text-text-primary mb-2">השירותים בעדכון</p>
                        <p className="text-sm text-text-secondary mb-5 max-w-md mx-auto leading-relaxed">
                            הקטלוג עדיין בעדכון{profile?.business_name ? ` אצל ${profile.business_name}` : ''}. אפשר לפנות ישירות בטופס פנייה — מענה מהיר.
                        </p>
                        <Link
                            to={`/t/${trainerHandle}/intake${forwardQuery ? `?${forwardQuery}` : ''}`}
                            className="btn btn-primary inline-flex items-center gap-2 text-sm"
                        >
                            לטופס פנייה
                            <ArrowLeft size={14} />
                        </Link>
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
                                        to={`/t/${trainerHandle}/intake?service=${service.id}${forwardQuery ? `&${forwardQuery}` : ''}`}
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

            {/* Testimonials — public social proof, only published rows */}
            {testimonials.length > 0 && (
                <section className="bg-surface-warm/40 border-t border-border py-12">
                    <div className="max-w-3xl mx-auto px-4">
                        <h2 className="text-xl md:text-2xl font-bold text-center text-text-primary mb-8 flex items-center justify-center gap-2">
                            <Star size={18} className="text-primary" fill="currentColor" />
                            לקוחות מספרים
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {testimonials.map(t => (
                                <article key={t.id} className="flat-card p-5 bg-surface relative">
                                    <Quote size={16} className="absolute top-3 end-3 text-border" />
                                    {t.rating && (
                                        <div className="flex items-center gap-0.5 text-warning mb-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    fill={i < (t.rating || 0) ? 'currentColor' : 'none'}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm text-text-secondary leading-relaxed mb-3 whitespace-pre-line">
                                        {t.body}
                                    </p>
                                    <p className="text-xs font-bold text-text-primary">
                                        {t.client_name}
                                        {t.client_dog_name && (
                                            <span className="text-text-muted font-normal"> · {t.client_dog_name} 🐾</span>
                                        )}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer — link to Doggo CRM landing for trainer acquisition */}
            <footer className="text-center pb-8 text-xs text-text-muted">
                פועל באמצעות{' '}
                <a
                    href="/?utm_source=storefront_footer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                >
                    Doggo CRM
                </a>{' '}
                🐾 · CRM למאלפי כלבים
            </footer>
        </div>
    );
}
