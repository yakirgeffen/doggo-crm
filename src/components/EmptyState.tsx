import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionTo?: string;
    onAction?: () => void;
    action?: ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'accent';
}

const colorStyles: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
};

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, action, color = 'primary' }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in" role="status">
            {/* Rounded square icon — NOT circle per design system */}
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 border ${colorStyles[color]}`}>
                <Icon size={28} strokeWidth={2} />
            </div>

            <h3 className="text-xl font-bold text-text-primary mb-2">
                {title}
            </h3>

            <p className="text-text-muted max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                {description}
            </p>

            {action ? action : (
                actionLabel && (
                    actionTo ? (
                        <Link to={actionTo} className="btn btn-primary">
                            {actionLabel}
                        </Link>
                    ) : onAction ? (
                        <button onClick={onAction} className="btn btn-primary">
                            {actionLabel}
                        </button>
                    ) : null
                )
            )}
        </div>
    );
}
