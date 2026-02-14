import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { type ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string | ReactNode;
    backUrl?: string;
    onBack?: () => void;
    actions?: ReactNode;
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
                <div className="flex items-center gap-3">
                    {(backUrl || onBack) && (
                        <button
                            onClick={handleBack}
                            className="p-2 -me-2 text-text-muted hover:text-primary hover:bg-background rounded-lg transition-all active:scale-95"
                            aria-label="חזרה"
                        >
                            <ArrowRight size={22} />
                        </button>
                    )}

                    <div>
                        <h1 className="text-2xl md:text-[28px] font-bold text-text-primary leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <div className="text-text-secondary text-sm font-normal mt-1">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
