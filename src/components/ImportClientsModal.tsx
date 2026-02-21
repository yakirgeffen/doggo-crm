import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { supabase, logActivity } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

interface ImportClientsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done';

interface ParsedRow {
    [key: string]: string;
}

export function ImportClientsModal({ isOpen, onClose, onComplete }: ImportClientsModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState<Step>('upload');
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);

    const [nameColumns, setNameColumns] = useState<string[]>([]);
    const [dogColumn, setDogColumn] = useState<string>('');
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    const [emailColumn, setEmailColumn] = useState<string>('');

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setParsedData(results.data as ParsedRow[]);
                setHeaders(results.meta.fields || []);
                setStep('map');
            }
        });
    };

    const toggleNameColumn = (col: string) => {
        if (nameColumns.includes(col)) {
            setNameColumns(nameColumns.filter(c => c !== col));
        } else {
            setNameColumns([...nameColumns, col]);
        }
    };

    const generatePreview = () => {
        const transformed = parsedData.map((row, index) => {
            const fullName = nameColumns.map(col => row[col]).filter(Boolean).join(' ').trim();
            const dogName = dogColumn ? row[dogColumn] : 'Dog';
            const phone = phoneColumn ? row[phoneColumn] : '';
            const email = emailColumn ? row[emailColumn] : '';

            const isValid = fullName.length > 0;
            const issues = [];
            if (!isValid) issues.push('Missing Name');
            if (!dogName) issues.push('Missing Dog Name (will default)');

            return {
                id: index,
                raw: row,
                full_name: fullName,
                primary_dog_name: dogName || 'Dog',
                phone,
                email,
                isValid,
                issues
            };
        });

        setPreviewData(transformed);
        setStep('preview');
    };

    const executeImport = async () => {
        setStep('importing');
        const validRows = previewData.filter(r => r.isValid);

        const dbRows = validRows.map(r => ({
            full_name: r.full_name,
            primary_dog_name: r.primary_dog_name,
            phone: r.phone || null,
            email: r.email || null,
            created_at: new Date().toISOString(),
            is_active: true
        }));

        const { data, error } = await supabase.from('clients').insert(dbRows).select('id, full_name');

        if (error) {
            console.error('Import error:', error);
            showToast('שגיאה בייבוא הנתונים פנה לתמיכה.', 'error');
            setStep('preview');
        } else {
            // Log import creation
            if (data) {
                await Promise.all(
                    data.map(client => logActivity('client', client.id, 'created', `לקוח יובא מהקובץ: ${client.full_name}`))
                );
            }

            setImportStats({
                total: validRows.length,
                success: validRows.length,
                failed: 0
            });
            setStep('done');
        }
    };

    const dialogRef = useRef<HTMLDivElement>(null);

    // Focus trap + Escape key — IS 5568
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key !== 'Tab' || !dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-clients-title"
                className="bg-surface rounded-xl w-full max-w-2xl h-[90vh] flex flex-col shadow-elevated overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-warm">
                    <div>
                        <h3 id="import-clients-title" className="font-bold text-lg text-text-primary">ייבוא לקוחות</h3>
                        <p className="text-xs text-text-muted">
                            {step === 'upload' && 'שלב 1/4: בחירת קובץ'}
                            {step === 'map' && 'שלב 2/4: מיפוי עמודות'}
                            {step === 'preview' && 'שלב 3/4: בדיקת נתונים'}
                            {step === 'importing' && 'מייבא נתונים...'}
                            {step === 'done' && 'הייבוא הושלם!'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg" aria-label="סגור">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                            <div className="w-24 h-24 bg-success/10 rounded-xl flex items-center justify-center">
                                <FileSpreadsheet size={48} className="text-success" />
                            </div>
                            <div className="text-center max-w-md">
                                <h4 className="text-xl font-bold mb-2 text-text-primary">ייבוא מאקסל או CSV</h4>
                                <p className="text-text-muted">
                                    העלה קובץ עם רשימת הלקוחות שלך. המערכת תזהה את העמודות באופן אוטומטי.
                                </p>
                            </div>

                            <label className="btn btn-primary cursor-pointer shadow-card hover:shadow-elevated transition-all hover:-translate-y-1">
                                <Upload size={20} className="ms-2" />
                                בחר קובץ CSV
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                            </label>

                            <p className="text-xs text-center text-text-muted mt-4">
                                תומך בקבצי .csv בלבד כרגע.
                            </p>
                        </div>
                    )}

                    {/* STEP 2: MAP */}
                    {step === 'map' && (
                        <div className="space-y-6">
                            <div className="bg-accent/10 border border-accent/15 p-4 rounded-xl text-sm text-accent">
                                <p className="font-bold mb-1">💡 זיהינו {parsedData.length} שורות.</p>
                                אנא בחר איזה עמודה בקובץ מתאימה לכל שדה.
                            </div>

                            {/* Name Mapping */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-primary">שם הלקוח (חובה)</label>
                                <p className="text-xs text-text-muted mb-2">ניתן לבחור מספר עמודות (למשל: שם פרטי + שם משפחה). הם יחוברו אוטומטית.</p>
                                <div className="flex flex-wrap gap-2">
                                    {headers.map(header => (
                                        <button
                                            key={header}
                                            onClick={() => toggleNameColumn(header)}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${nameColumns.includes(header)
                                                ? 'bg-success/10 text-success border-success/20 font-medium ring-2 ring-success/20'
                                                : 'bg-surface text-text-secondary border-border hover:border-success/30'
                                                }`}
                                        >
                                            {header}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-border" />

                            {/* Dog Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">שם הכלב</label>
                                    <select
                                        className="input-field"
                                        value={dogColumn}
                                        onChange={(e) => setDogColumn(e.target.value)}
                                    >
                                        <option value="">-- ללא (ברירת מחדל: Dog) --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">טלפון</label>
                                    <select
                                        className="input-field"
                                        value={phoneColumn}
                                        onChange={(e) => setPhoneColumn(e.target.value)}
                                    >
                                        <option value="">-- ללא --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">אימייל</label>
                                    <select
                                        className="input-field"
                                        value={emailColumn}
                                        onChange={(e) => setEmailColumn(e.target.value)}
                                    >
                                        <option value="">-- ללא --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 'preview' && (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex gap-4 text-sm">
                                <div className="bg-success/10 text-success px-3 py-1 rounded-lg font-medium">
                                    {previewData.filter(r => r.isValid).length} תקינים
                                </div>
                                <div className="bg-error/10 text-error px-3 py-1 rounded-lg font-medium">
                                    {previewData.filter(r => !r.isValid).length} שגיאות (ידולגו)
                                </div>
                            </div>

                            <div className="border border-border rounded-xl overflow-hidden flex-1 relative">
                                <div className="overflow-auto absolute inset-0">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-surface-warm sticky top-0 font-medium text-text-primary">
                                            <tr>
                                                <th className="p-3 border-b border-border">סטטוס</th>
                                                <th className="p-3 border-b border-border">שם לקוח</th>
                                                <th className="p-3 border-b border-border">כלב</th>
                                                <th className="p-3 border-b border-border">טלפון</th>
                                                <th className="p-3 border-b border-border">אימייל</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {previewData.map((row) => (
                                                <tr key={row.id} className={!row.isValid ? 'bg-error/5' : 'hover:bg-surface-warm'}>
                                                    <td className="p-3">
                                                        {row.isValid ? (
                                                            <Check size={16} className="text-success" />
                                                        ) : (
                                                            <div title={row.issues.join(', ')}>
                                                                <AlertTriangle size={16} className="text-error" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={`p-3 font-medium ${!row.full_name ? 'text-error italic' : ''}`}>
                                                        {row.full_name || '(חסר)'}
                                                    </td>
                                                    <td className="p-3 text-text-muted">{row.primary_dog_name}</td>
                                                    <td className="p-3 text-text-muted" dir="ltr">{row.phone}</td>
                                                    <td className="p-3 text-text-muted truncate max-w-[150px]">{row.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: DONE */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-fade-in">
                            <div className="w-24 h-24 bg-success/10 rounded-xl flex items-center justify-center">
                                <Check size={48} className="text-success" />
                            </div>
                            <h4 className="text-2xl font-bold text-text-primary">הייבוא הושלם בהצלחה!</h4>
                            <p className="text-text-muted text-lg">
                                נוספו {importStats.success} לקוחות חדשים למערכת.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-border bg-surface-warm flex justify-between items-center">
                    {step !== 'done' && step !== 'upload' && (
                        <button
                            onClick={() => setStep(step === 'preview' ? 'map' : 'upload')}
                            className="btn btn-secondary text-sm"
                        >
                            חזרה
                        </button>
                    )}

                    <div className="flex-1"></div>

                    {step === 'upload' && <span className="text-xs text-text-muted">בחר קובץ להמשך</span>}

                    {step === 'map' && (
                        <button
                            onClick={generatePreview}
                            disabled={nameColumns.length === 0}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            המשך לתצוגה מקדימה
                        </button>
                    )}

                    {step === 'preview' && (
                        <button
                            onClick={executeImport}
                            className="btn btn-primary"
                        >
                            ייבא {previewData.filter(r => r.isValid).length} לקוחות
                            <Check size={16} className="ms-2" />
                        </button>
                    )}

                    {step === 'done' && (
                        <button onClick={() => { onComplete(); onClose(); }} className="btn btn-primary w-full md:w-auto">
                            סיום ורענון
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
