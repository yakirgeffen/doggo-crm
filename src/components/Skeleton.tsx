/**
 * Skeleton loading primitives with shimmer animation.
 * Usage:
 *   <SkeletonCard />           — full flat-card placeholder
 *   <SkeletonRow />            — table row placeholder
 *   <SkeletonText lines={3} /> — paragraph placeholder
 */

interface SkeletonTextProps {
    lines?: number;
    className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
    return (
        <div className={`space-y-2.5 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-3 bg-border/40 rounded-md skeleton-shimmer"
                    style={{ width: i === lines - 1 ? '60%' : '100%' }}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`flat-card p-5 space-y-3 animate-fade-in ${className}`}>
            <div className="h-4 w-1/3 bg-border/40 rounded-md skeleton-shimmer" />
            <div className="h-8 w-2/3 bg-border/30 rounded-md skeleton-shimmer" />
            <SkeletonText lines={2} />
        </div>
    );
}

export function SkeletonRow({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-4 p-4 border-b border-border-light ${className}`}>
            <div className="w-10 h-10 rounded-xl bg-border/40 skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 bg-border/40 rounded-md skeleton-shimmer" />
                <div className="h-3 w-1/2 bg-border/30 rounded-md skeleton-shimmer" />
            </div>
            <div className="h-6 w-16 bg-border/30 rounded-full skeleton-shimmer" />
        </div>
    );
}

/** Dashboard-specific: 4 KPI stat cards */
export function SkeletonKPIGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="flat-card p-3 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="h-7 w-12 bg-border/40 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-16 bg-border/30 rounded-md skeleton-shimmer" />
                </div>
            ))}
        </div>
    );
}

/** Client detail page skeleton */
export function SkeletonClientDetail() {
    return (
        <div className="space-y-6 animate-fade-in p-4">
            {/* Hero */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-border/40 skeleton-shimmer" />
                <div className="space-y-2 flex-1">
                    <div className="h-5 w-1/3 bg-border/40 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-1/2 bg-border/30 rounded-md skeleton-shimmer" />
                </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-3">
                {[0, 1, 2].map(i => (
                    <div key={i} className="h-9 w-20 bg-border/30 rounded-lg skeleton-shimmer" />
                ))}
            </div>
            {/* Content */}
            <SkeletonCard />
            <SkeletonCard />
        </div>
    );
}

/** Sessions list skeleton */
export function SkeletonSessionList({ count = 2 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flat-card p-4 space-y-2 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex justify-between">
                        <div className="h-4 w-1/4 bg-border/40 rounded-md skeleton-shimmer" />
                        <div className="h-4 w-16 bg-border/30 rounded-md skeleton-shimmer" />
                    </div>
                    <SkeletonText lines={2} />
                </div>
            ))}
        </div>
    );
}

/** Timeline skeleton */
export function SkeletonTimeline({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="w-2 h-2 rounded-full bg-border/40 skeleton-shimmer mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-border/40 rounded-md skeleton-shimmer" />
                        <div className="h-2.5 w-1/3 bg-border/30 rounded-md skeleton-shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}
