import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string | ReactNode;
    backUrl?: string; // If provided, shows a back button to this URL
    onBack?: () => void; // Alternative to backUrl
    actions?: ReactNode; // Buttons or controls on the right (or left in RTL)
    className?: string;
}

export function PageHeader({ title, subtitle, backUrl, onBack, actions, className = '' }: PageHeaderProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backUrl) {
            navigate(backUrl);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-fade-in ${className}`}>
            <div>
                {/* Back Link + Title Row */}
                <div className="flex items-center gap-3">
                    {(backUrl || onBack) && (
                        <button
                            onClick={handleBack}
                            className="p-2 -mr-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-app)] rounded-full transition-all active:scale-95"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={24} className="rtl:rotate-180" />
                        </button>
                    )}

                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[var(--color-text-main)] leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <div className="text-[var(--color-text-muted)] text-sm font-medium mt-1">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions Area */}
            {actions && (
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
