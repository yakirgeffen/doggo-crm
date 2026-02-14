import { type ReactNode } from 'react';

export interface DataTableColumn<T> {
    /** Unique key for the column */
    key: string;
    /** Column header label */
    label: string;
    /** Optional: header alignment override */
    headerClassName?: string;
    /** Optional: cell alignment override */
    cellClassName?: string;
    /** Render function for custom cell content */
    render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    /** Returns a unique key for each row */
    getRowKey: (row: T) => string;
    /** Optional click handler for rows */
    onRowClick?: (row: T) => void;
    /** Caption for screen readers (required for accessibility) */
    caption?: string;
    /** Custom empty state */
    emptyState?: ReactNode;
}

export function DataTable<T>({ columns, data, getRowKey, onRowClick, caption, emptyState }: DataTableProps<T>) {
    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div className="overflow-x-auto" role="region" aria-label={caption || 'טבלת נתונים'}>
            <table className="w-full text-right" aria-label={caption}>
                <thead className="bg-background border-b border-border">
                    <tr className="text-xs uppercase tracking-wider text-text-secondary">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={`px-6 py-4 font-semibold ${col.headerClassName || ''}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                    {data.map((row) => (
                        <tr
                            key={getRowKey(row)}
                            className={`transition-all duration-200 group ${onRowClick
                                    ? 'cursor-pointer hover:bg-surface-warm'
                                    : 'hover:bg-surface-warm'
                                }`}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            tabIndex={onRowClick ? 0 : undefined}
                            onKeyDown={onRowClick ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onRowClick(row);
                                }
                            } : undefined}
                            role={onRowClick ? 'button' : undefined}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className={`px-6 py-4 ${col.cellClassName || ''}`}
                                >
                                    {col.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
