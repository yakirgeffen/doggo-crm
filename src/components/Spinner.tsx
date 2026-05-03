/**
 * Shared Spinner primitive — wraps lucide-react's Loader2 with a
 * consistent size + color contract. Use this anywhere you previously
 * inlined a `border-2 ... animate-spin` div, or where you used
 * `<Loader2 className="animate-spin" />` directly.
 *
 *   <Spinner />               // default 16px, currentColor
 *   <Spinner size="sm" />     // 14px
 *   <Spinner size="md" />     // 16px (default)
 *   <Spinner size="lg" />     // 20px
 *   <Spinner size="xl" />     // 24px
 *   <Spinner className="text-primary" />  // recolor via currentColor
 */
import { Loader2 } from 'lucide-react';

const SIZE_PX = {
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
} as const;

interface SpinnerProps {
    size?: keyof typeof SIZE_PX;
    className?: string;
    'aria-label'?: string;
}

export function Spinner({ size = 'md', className = '', 'aria-label': ariaLabel = 'טוען' }: SpinnerProps) {
    return (
        <Loader2
            size={SIZE_PX[size]}
            className={`animate-spin ${className}`}
            role="status"
            aria-label={ariaLabel}
        />
    );
}
