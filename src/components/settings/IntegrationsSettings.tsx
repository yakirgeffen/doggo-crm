import { useState } from 'react';
import { Globe, Lock, CheckCircle2 } from 'lucide-react';
import { useIntegrations } from '../../hooks/useIntegrations';

export function IntegrationsSettings() {
    const { isConnected, vaultData, saveKeys, testConnection, loading: integrationsLoading } = useIntegrations();
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [testCheckResult, setTestCheckResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSaveKeys = async () => {
        if (!apiKey || !apiSecret) return;
        await saveKeys(apiKey, apiSecret);
        setApiKey('');
        setApiSecret('');
        const result = await testConnection();
        setTestCheckResult(result);
    };

    return (
        <div className="flat-card p-6 md:p-8 animate-fade-in space-y-8">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-text-primary">
                    <Globe className="text-primary" />
                    חיבור חשבונית ירוקה (Morning)
                </h2>
                <p className="text-sm text-text-muted">
                    חבר את החשבון שלך כדי לשלוח דרישות תשלום באשראי, ביט, ו-Paybox ישירות מהמערכת.
                </p>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${isConnected ? 'bg-success/10 border-success/20' : 'bg-background border-border'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></div>
                    <div>
                        <p className={`font-bold ${isConnected ? 'text-success' : 'text-text-secondary'}`}>
                            {isConnected ? 'מחובר למערכת Morning' : 'לא מחובר'}
                        </p>
                        {vaultData?.access_key_id && (
                            <p className="text-xs text-text-muted font-mono mt-0.5 ltr-nums">Key ID: ...{vaultData.access_key_id.slice(-4)}</p>
                        )}
                    </div>
                </div>
                {isConnected && <CheckCircle2 className="text-success" />}
            </div>

            {!isConnected && (
                <div className="space-y-4 max-w-lg p-6 bg-surface border border-border rounded-xl shadow-soft">
                    <h3 className="font-bold text-sm text-text-primary">הגדרת מפתחות API</h3>

                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm mb-6">
                        <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                            <Globe size={16} />
                            איך משיגים מפתחות API?
                        </h4>
                        <ol className="list-decimal list-inside text-text-secondary space-y-1 mb-3 marker:font-bold">
                            <li>היכנס למערכת <a href="https://www.greeninvoice.co.il/login" target="_blank" rel="noreferrer" className="underline font-bold hover:text-primary">Morning (חשבונית ירוקה)</a>.</li>
                            <li>בתפריט הצד, לחץ על <b>הגדרות</b> (Settings).</li>
                            <li>בחר באפשרות <b>API & Webhooks</b> או <b>כלים למפתחים</b>.</li>
                            <li>לחץ על <b>הוספת מפתח</b> (Add Key) והעתק את הנתונים.</li>
                        </ol>
                        <p className="text-[11px] text-text-muted mt-2 border-t border-primary/10 pt-2">
                            * המיקום המדויק בתפריט עשוי להשתנות, אך תמיד יימצא תחת "הגדרות".
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">מזהה מפתח (API Key ID)</label>
                        <input
                            type="text"
                            className="input-field dir-ltr font-mono text-sm"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="הדבק כאן את Key ID"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">מפתח סודי (Secret Key)</label>
                        <div className="relative">
                            <Lock className="absolute start-3 top-2.5 text-text-muted" size={14} />
                            <input
                                type="password"
                                className="input-field dir-ltr font-mono text-sm ps-9"
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                                placeholder="הדבק כאן את Secret Key"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveKeys}
                        disabled={integrationsLoading || !apiKey || !apiSecret}
                        className="btn btn-primary w-full flex justify-center items-center gap-2"
                    >
                        {integrationsLoading ? 'מתחבר...' : 'שמור ובדוק חיבור'}
                    </button>

                    {testCheckResult && (
                        <div className={`text-xs p-3 rounded-lg ${testCheckResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {testCheckResult.message}
                        </div>
                    )}

                    <div className="text-[10px] text-text-muted leading-relaxed bg-background p-3 rounded-lg">
                        ℹ️ המפתחות נשמרים בצורה מאובטחת. המערכת משתמשת בהם רק לצורך הפקת מסמכים וקישורי תשלום.
                        המפתחות הסודיים אינם מוצגים שוב לאחר השמירה.
                    </div>
                </div>
            )}

            {isConnected && (
                <div className="mt-4">
                    <button
                        onClick={async () => {
                            const res = await testConnection();
                            setTestCheckResult(res);
                        }}
                        disabled={integrationsLoading}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        🔄 בדוק חיבור מחדש
                    </button>
                    {testCheckResult && (
                        <div className={`mt-2 text-xs p-2 rounded-lg w-fit ${testCheckResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {testCheckResult.message}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
