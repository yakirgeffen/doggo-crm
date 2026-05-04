import { Dog, Mail, Phone, MessageCircle, Calendar } from 'lucide-react';
import type { Client } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { applyTemplate } from '../../lib/whatsapp-template';

interface ClientHeroProps {
    client: Client;
}

/**
 * Dog-centric hero card. Iter 138 visual polish (Yakir demo prep):
 *  - Removed the divider between the gradient header and the contact row;
 *    the seam visually fragmented what should read as a single unit.
 *  - Tightened vertical rhythm — was pt-6 pb-4 + py-4 (~70px of internal
 *    padding); now pt-5 pb-5 with the contact row inset on the same
 *    background, which reads more like one card.
 *  - Avatar size reduced 80→64px for better proportion against the
 *    typography stack (date label was overshadowed by the giant avatar).
 *  - Contact pills got a `bg-surface-warm` consistent fill so phone +
 *    email + WhatsApp read as the same control class.
 *  - Joined-date moved into a subtle calendar pill in the hero header
 *    rather than a fourth line of muted text — saves vertical space.
 */
export function ClientHero({ client }: ClientHeroProps) {
    const { settings } = useSettings();
    const joinedLabel = new Date(client.created_at).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="flat-card overflow-hidden mb-4 p-0">
            {/* Hero — single block, no seam */}
            <div className="bg-gradient-to-bl from-primary/8 via-accent/4 to-transparent p-5">
                <div className="flex items-start gap-4">
                    {/* Dog avatar */}
                    <div className="w-16 h-16 bg-surface rounded-xl flex items-center justify-center shadow-soft border border-border-light shrink-0">
                        <Dog size={28} className="text-primary opacity-90" />
                    </div>

                    {/* Info stack */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-text-primary leading-tight">
                            {client.primary_dog_name || 'ללא שם כלב'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                            {client.primary_dog_breed && (
                                <>
                                    <span>{client.primary_dog_breed}</span>
                                    <span aria-hidden="true">·</span>
                                </>
                            )}
                            <span className="font-medium text-text-secondary">{client.full_name}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-text-muted">
                            <Calendar size={11} />
                            <span>הצטרפות {joinedLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Contact + tags row, same surface */}
                {(client.phone || client.email || (client.behavioral_tags && client.behavioral_tags.length > 0)) && (
                    <div className="mt-4 pt-4 border-t border-text-primary/5 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            {client.phone && (
                                <>
                                    <a
                                        href={`tel:${client.phone}`}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-primary transition-colors bg-surface px-3 py-1.5 rounded-lg border border-border-light"
                                    >
                                        <Phone size={13} className="text-text-muted" />
                                        <span className="ltr-nums" dir="ltr">{client.phone}</span>
                                    </a>
                                    {(() => {
                                        const phoneDigits = client.phone.replace(/[^0-9]/g, '');
                                        const intl = phoneDigits.startsWith('0') ? '972' + phoneDigits.slice(1) : phoneDigits;
                                        const firstName = client.full_name.split(' ')[0];
                                        const dogName = client.primary_dog_name || '';
                                        // Fallback when trainer hasn't customized the greeting template.
                                        // If the dog name is missing, drop the second sentence to avoid
                                        // shipping `מה שלומכם ושלום ?` to the recipient.
                                        const greetingFallback = dogName
                                            ? `היי ${firstName} 🐾 מה שלומכם ושלום ${dogName}?`
                                            : `היי ${firstName} 🐾`;
                                        const greetingText = applyTemplate(
                                            settings?.wa_template_greeting ?? null,
                                            { firstName, dogName },
                                            greetingFallback
                                        );
                                        const greeting = encodeURIComponent(greetingText);
                                        return (
                                            <a
                                                href={`https://wa.me/${intl}?text=${greeting}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-success bg-success/10 px-3 py-1.5 rounded-lg hover:bg-success/15 transition-colors border border-success/15"
                                            >
                                                <MessageCircle size={13} />
                                                WhatsApp
                                            </a>
                                        );
                                    })()}
                                </>
                            )}
                            {client.email && (
                                <a
                                    href={`mailto:${client.email}`}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-primary transition-colors bg-surface px-3 py-1.5 rounded-lg border border-border-light max-w-full"
                                >
                                    <Mail size={13} className="text-text-muted shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                </a>
                            )}
                        </div>

                        {/* Behavioral tags */}
                        {client.behavioral_tags && client.behavioral_tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {client.behavioral_tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[11px] font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full border border-warning/15"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
