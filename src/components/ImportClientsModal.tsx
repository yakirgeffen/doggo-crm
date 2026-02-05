import { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

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
    const [step, setStep] = useState<Step>('upload');
    // const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);

    // Mapping State
    const [nameColumns, setNameColumns] = useState<string[]>([]); // Allow multi-select
    const [dogColumn, setDogColumn] = useState<string>('');
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    const [emailColumn, setEmailColumn] = useState<string>('');

    // Processed Data
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // setFile(file); // Unused

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
        // Transform data based on mapping
        const transformed = parsedData.map((row, index) => {
            // Smart Concatenation for Name
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
                primary_dog_name: dogName || 'Dog', // Fallback
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



        // Batch insert could be faster, but let's do loop for progress feedback or error handling per row if validRows is small enough (<1000)
        // For 'Import Current Clients' usually < 500.
        // Actually Supabase bulk insert is safer.

        const dbRows = validRows.map(r => ({
            full_name: r.full_name,
            primary_dog_name: r.primary_dog_name,
            phone: r.phone || null,
            email: r.email || null,
            created_at: new Date().toISOString(),
            is_active: true
        }));

        const { error } = await supabase.from('clients').insert(dbRows);

        if (error) {
            console.error('Import error:', error);
            alert('Error importing data. Check console.');
            setStep('preview');
        } else {
            setImportStats({
                total: validRows.length,
                success: validRows.length, // Assuming all succeed if batch succeeds
                failed: 0
            });
            setStep('done');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-[var(--color-text-main)]">ייבוא לקוחות</h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {step === 'upload' && 'שלב 1/4: בחירת קובץ'}
                            {step === 'map' && 'שלב 2/4: מיפוי עמודות'}
                            {step === 'preview' && 'שלב 3/4: בדיקת נתונים'}
                            {step === 'importing' && 'מייבא נתונים...'}
                            {step === 'done' && 'הייבוא הושלם!'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                                <FileSpreadsheet size={48} className="text-green-600" />
                            </div>
                            <div className="text-center max-w-md">
                                <h4 className="text-xl font-bold mb-2">ייבוא מאקסל או CSV</h4>
                                <p className="text-[var(--color-text-muted)]">
                                    העלה קובץ עם רשימת הלקוחות שלך. המערכת תזהה את העמודות באופן אוטומטי.
                                </p>
                            </div>

                            <label className="btn btn-primary cursor-pointer shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                <Upload size={20} className="ml-2" />
                                בחר קובץ CSV
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                            </label>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                תומך בקבצי .csv בלבד כרגע.
                            </p>
                        </div>
                    )}

                    {/* STEP 2: MAP */}
                    {step === 'map' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                                <p className="font-bold mb-1">💡 זיהינו {parsedData.length} שורות.</p>
                                אנא בחר איזה עמודה בקובץ מתאימה לכל שדה.
                            </div>

                            {/* Name Mapping */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold">שם הלקוח (חובה)</label>
                                <p className="text-xs text-gray-500 mb-2">ניתן לבחור מספר עמודות (למשל: שם פרטי + שם משפחה). הם יחוברו אוטומטית.</p>
                                <div className="flex flex-wrap gap-2">
                                    {headers.map(header => (
                                        <button
                                            key={header}
                                            onClick={() => toggleNameColumn(header)}
                                            className={`px-3 py-1.5 rounded-md text-sm transition-all border ${nameColumns.includes(header)
                                                ? 'bg-green-100 text-green-800 border-green-200 font-bold ring-2 ring-green-500/20'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                                                }`}
                                        >
                                            {header}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Dog Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">שם הכלב</label>
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
                                    <label className="block text-sm font-bold mb-2">טלפון</label>
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
                                    <label className="block text-sm font-bold mb-2">אימייל</label>
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
                                <div className="bg-green-50 text-green-800 px-3 py-1 rounded-md font-bold">
                                    {previewData.filter(r => r.isValid).length} תקינים
                                </div>
                                <div className="bg-red-50 text-red-800 px-3 py-1 rounded-md font-bold">
                                    {previewData.filter(r => !r.isValid).length} שגיאות (ידולגו)
                                </div>
                            </div>

                            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden flex-1 relative">
                                <div className="overflow-auto absolute inset-0">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50 sticky top-0 font-bold text-gray-700">
                                            <tr>
                                                <th className="p-3 border-b">סטטוס</th>
                                                <th className="p-3 border-b">שם לקוח</th>
                                                <th className="p-3 border-b">כלב</th>
                                                <th className="p-3 border-b">טלפון</th>
                                                <th className="p-3 border-b">אימייל</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {previewData.map((row) => (
                                                <tr key={row.id} className={!row.isValid ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                                                    <td className="p-3">
                                                        {row.isValid ? (
                                                            <Check size={16} className="text-green-600" />
                                                        ) : (
                                                            <div title={row.issues.join(', ')}>
                                                                <AlertTriangle size={16} className="text-red-500" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={`p-3 font-medium ${!row.full_name ? 'text-red-500 italic' : ''}`}>
                                                        {row.full_name || '(חסר)'}
                                                    </td>
                                                    <td className="p-3 text-gray-600">{row.primary_dog_name}</td>
                                                    <td className="p-3 text-gray-600" dir="ltr">{row.phone}</td>
                                                    <td className="p-3 text-gray-600 truncate max-w-[150px]">{row.email}</td>
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
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                                <Check size={48} className="text-green-600" />
                            </div>
                            <h4 className="text-2xl font-black text-[var(--color-text-main)]">הייבוא הושלם בהצלחה!</h4>
                            <p className="text-[var(--color-text-muted)] text-lg">
                                נוספו {importStats.success} לקוחות חדשים למערכת.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-[var(--color-border)] bg-gray-50 flex justify-between items-center">
                    {step !== 'done' && step !== 'upload' && (
                        <button
                            onClick={() => setStep(step === 'preview' ? 'map' : 'upload')}
                            className="btn btn-secondary text-sm"
                        >
                            <ArrowRight size={16} className="ml-2" />
                            חזרה
                        </button>
                    )}

                    <div className="flex-1"></div>

                    {step === 'upload' && <span className="text-xs text-gray-400">בחר קובץ להמשך</span>}

                    {step === 'map' && (
                        <button
                            onClick={generatePreview}
                            disabled={nameColumns.length === 0}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            המשך לתצוגה מקדימה
                            <ArrowLeft size={16} className="mr-2" />
                        </button>
                    )}

                    {step === 'preview' && (
                        <button
                            onClick={executeImport}
                            className="btn btn-primary"
                        >
                            ייבא {previewData.filter(r => r.isValid).length} לקוחות
                            <Check size={16} className="mr-2" />
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
