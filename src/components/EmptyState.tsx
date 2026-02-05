import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionTo?: string;
    onAction?: () => void;
    color?: 'blue' | 'green' | 'orange' | 'purple'; // Theme colors
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, color = 'blue' }: EmptyStateProps) {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-500 border-blue-100',
        green: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]', // Tea Green-ish
        orange: 'bg-orange-50 text-orange-500 border-orange-100',
        purple: 'bg-purple-50 text-purple-500 border-purple-100',
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            {/* Illustrated Icon Bubble */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm ${colorStyles[color]}`}>
                <Icon size={32} strokeWidth={2.5} />
            </div>

            <h3 className="text-xl font-black text-[var(--color-text-main)] mb-2">
                {title}
            </h3>

            <p className="text-[var(--color-text-muted)] max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                {description}
            </p>

            {/* Action */}
            {actionLabel && (
                actionTo ? (
                    <Link to={actionTo} className="btn btn-primary shadow-lg hover:-translate-y-0.5 transition-transform">
                        {actionLabel}
                    </Link>
                ) : onAction ? (
                    <button onClick={onAction} className="btn btn-primary shadow-lg hover:-translate-y-0.5 transition-transform">
                        {actionLabel}
                    </button>
                ) : null
            )}
        </div>
    );
}
