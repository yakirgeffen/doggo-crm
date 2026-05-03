import { useState, useEffect } from 'react';
import { Globe, Lock, CheckCircle2, Receipt, Webhook, Send, Key, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { useIntegrations } from '../../hooks/useIntegrations';
import { useSumit } from '../../hooks/useSumit';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../context/toast-context';

export function IntegrationsSettings() {
    const { isConnected, vaultData, saveKeys, testConnection, loading: integrationsLoading } = useIntegrations();
    const sumit = useSumit();
    const { settings, loading: settingsLoading, updateLocalSettings, saveSettings } = useSettings();
    const { showToast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [testCheckResult, setTestCheckResult] = useState<{ success: boolean; message: string } | null>(null);
    const [sumitCompanyId, setSumitCompanyId] = useState('');
    const [sumitApiKey, setSumitApiKey] = useState('');
    const [sumitTestResult, setSumitTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSaving, setWebhookSaving] = useState(false);
    const [webhookTestSending, setWebhookTestSending] = useState(false);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [tokenGenerating, setTokenGenerating] = useState(false);
    const [tokenCopied, setTokenCopied] = useState(false);

    useEffect(() => {
        if (settings?.webhook_url) setWebhookUrl(settings.webhook_url);
    }, [settings?.webhook_url]);

    const apiBaseUrl = `${(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/api-v1`;
    const hasActiveToken = Boolean(settings?.api_token_hash);

    const sha256Hex = async (input: string): Promise<string> => {
        const buf = new TextEncoder().encode(input);
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleGenerateToken = async () => {
        if (hasActiveToken) {
            const ok = window.confirm('יצירת טוקן חדש תבטל את הטוקן הקיים. אינטגרציות פעילות יפסיקו לעבוד עד שיעודכנו. להמשיך?');
            if (!ok) return;
        }
        setTokenGenerating(true);
        setTokenCopied(false);
        try {
            const bytes = new Uint8Array(32);
            crypto.getRandomValues(bytes);
            const plaintext = 'dggo_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const hash = await sha256Hex(plaintext);
            await saveSettings({ api_token_hash: hash });
            setGeneratedToken(plaintext);
            updateLocalSettings({ api_token_hash: hash });
            showToast('טוקן API נוצר בהצלחה', 'success');
        } catch (err) {
            console.error('Token generation error:', err);
            showToast('שגיאה ביצירת טוקן', 'error');
        } finally {
            setTokenGenerating(false);
        }
    };

    const handleCopyToken = async () => {
        if (!generatedToken) return;
        try {
            await navigator.clipboard.writeText(generatedToken);
            setTokenCopied(true);
            showToast('הטוקן הועתק', 'success');
            setTimeout(() => setTokenCopied(false), 2500);
        } catch {
            showToast('לא ניתן להעתיק אוטומטית — סימון ידני נדרש.', 'error');
        }
    };

    const handleRevokeToken = async () => {
        const ok = window.confirm('ביטול הטוקן יפסיק מיד את כל האינטגרציות שמשתמשות בו. להמשיך?');
        if (!ok) return;
        try {
            await saveSettings({ api_token_hash: null });
            updateLocalSettings({ api_token_hash: null });
            setGeneratedToken(null);
            showToast('הטוקן בוטל', 'success');
        } catch {
            showToast('שגיאה בביטול הטוקן', 'error');
        }
    };

    const handleCopyEndpoint = async () => {
        try {
            await navigator.clipboard.writeText(apiBaseUrl);
            showToast('כתובת ה-API הועתקה', 'success');
        } catch {
            showToast('לא ניתן להעתיק', 'error');
        }
    };

    const isValidWebhookUrl = (url: string) => /^https:\/\//i.test(url.trim());

    const handleSaveWebhook = async () => {
        const trimmed = webhookUrl.trim();
        if (trimmed && !isValidWebhookUrl(trimmed)) {
            showToast('כתובת ה-Webhook חייבת להתחיל ב-https://', 'error');
            return;
        }
        setWebhookSaving(true);
        try {
            updateLocalSettings({ webhook_url: trimmed || null });
            await saveSettings({ webhook_url: trimmed || null });
            showToast(trimmed ? 'Webhook נשמר' : 'Webhook הוסר', 'success');
        } catch {
            showToast('שגיאה בשמירת Webhook', 'error');
        } finally {
            setWebhookSaving(false);
        }
    };

    const handleTestWebhook = async () => {
        const trimmed = webhookUrl.trim();
        if (!trimmed || !isValidWebhookUrl(trimmed)) {
            showToast('יש להזין כתובת https:// תקינה', 'error');
            return;
        }
        setWebhookTestSending(true);
        try {
            const res = await fetch(trimmed, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Doggo-Event': 'test' },
                body: JSON.stringify({
                    event: 'test',
                    message: 'Doggo CRM webhook test from Settings',
                    timestamp: new Date().toISOString(),
                }),
            });
            if (res.ok) {
                showToast(`Webhook נבדק בהצלחה (${res.status}) 🟢`, 'success');
            } else {
                showToast(`כתובת ה-Webhook החזירה ${res.status}`, 'error');
            }
        } catch (err) {
            showToast('Webhook לא הגיב — כדאי לבדוק שהכתובת זמינה', 'error');
            console.error('Webhook test error:', err);
        } finally {
            setWebhookTestSending(false);
        }
    };

    const handleSaveKeys = async () => {
        if (!apiKey || !apiSecret) return;
        await saveKeys(apiKey, apiSecret);
        setApiKey('');
        setApiSecret('');
        const result = await testConnection();
        setTestCheckResult(result);
    };

    const handleSaveSumitKeys = async () => {
        if (!sumitCompanyId || !sumitApiKey) return;
        const saveResult = await sumit.saveKeys(sumitCompanyId, sumitApiKey);
        if (!saveResult.success) {
            setSumitTestResult({ success: false, message: typeof saveResult.error === 'string' ? saveResult.error : 'שמירה נכשלה' });
            return;
        }
        setSumitCompanyId('');
        setSumitApiKey('');
        const result = await sumit.testConnection();
        setSumitTestResult(result);
    };

    if (settingsLoading) {
        return (
            <div className="flat-card p-6 md:p-8 animate-fade-in space-y-8" role="status" aria-label="טוען הגדרות אינטגרציות">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-border/40 skeleton-shimmer" />
                            <div className="h-5 w-1/3 bg-border/40 rounded-md skeleton-shimmer" />
                        </div>
                        <div className="h-3 w-2/3 bg-border/30 rounded-md skeleton-shimmer" />
                        <div className="p-4 rounded-xl border border-border bg-background flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-border/40 skeleton-shimmer" />
                            <div className="h-4 w-1/4 bg-border/30 rounded-md skeleton-shimmer" />
                        </div>
                        {i < 3 && <div className="border-t border-border" />}
                    </div>
                ))}
            </div>
        );
    }

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
                            <li>להיכנס למערכת <a href="https://www.greeninvoice.co.il/login" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-primary">Morning (חשבונית ירוקה)</a>.</li>
                            <li>בתפריט הצד, ללחוץ על <b>הגדרות</b> (Settings).</li>
                            <li>לבחור באפשרות <b>API & Webhooks</b> או <b>כלים למפתחים</b>.</li>
                            <li>ללחוץ על <b>הוספת מפתח</b> (Add Key) ולהעתיק את הנתונים.</li>
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
                            placeholder="להדביק כאן את Key ID"
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
                                placeholder="להדביק כאן את Secret Key"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveKeys}
                        disabled={integrationsLoading || !apiKey || !apiSecret}
                        className="btn btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {integrationsLoading ? 'מתחבר...' : 'שמור ובדוק חיבור'}
                    </button>
                    {!integrationsLoading && (!apiKey || !apiSecret) && (
                        <p className="text-xs text-text-muted text-center">
                            יש למלא את שני המפתחות כדי לבדוק את החיבור
                        </p>
                    )}

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

            <div className="border-t border-border pt-8">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-text-primary">
                    <Receipt className="text-primary" />
                    חיבור Sumit
                </h2>
                <p className="text-sm text-text-muted">
                    חבר את חשבון Sumit שלך להפקת חשבוניות, הצעות מחיר, וקבלות ישירות מהמערכת.
                </p>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${sumit.isConnected ? 'bg-success/10 border-success/20' : 'bg-background border-border'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${sumit.isConnected ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></div>
                    <div>
                        <p className={`font-bold ${sumit.isConnected ? 'text-success' : 'text-text-secondary'}`}>
                            {sumit.isConnected ? 'מחובר למערכת Sumit' : 'לא מחובר'}
                        </p>
                        {sumit.vaultData?.company_id && (
                            <p className="text-xs text-text-muted font-mono mt-0.5 ltr-nums">CompanyID: {sumit.vaultData.company_id}</p>
                        )}
                    </div>
                </div>
                {sumit.isConnected && <CheckCircle2 className="text-success" />}
            </div>

            {!sumit.isConnected && (
                <div className="space-y-4 max-w-lg p-6 bg-surface border border-border rounded-xl shadow-soft">
                    <h3 className="font-bold text-sm text-text-primary">הגדרת מפתחות Sumit API</h3>

                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm mb-6">
                        <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                            <Receipt size={16} />
                            איך משיגים CompanyID + APIKey?
                        </h4>
                        <ol className="list-decimal list-inside text-text-secondary space-y-1 mb-3 marker:font-bold">
                            <li>להיכנס למערכת <a href="https://app.sumit.co.il/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-primary">Sumit</a>.</li>
                            <li>בתפריט הגדרות, לחפש <b>API</b> או <b>מפתחים</b>.</li>
                            <li>להפיק <b>API Key חדש</b> ולהעתיק את <b>CompanyID</b> ואת ה-<b>APIKey</b>.</li>
                        </ol>
                        <p className="text-[11px] text-text-muted mt-2 border-t border-primary/10 pt-2">
                            * תיעוד מלא: app.sumit.co.il/developers/api/
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">CompanyID (מספרי)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            className="input-field dir-ltr font-mono text-sm"
                            value={sumitCompanyId}
                            onChange={(e) => setSumitCompanyId(e.target.value)}
                            placeholder="לדוגמה: 12345"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">APIKey</label>
                        <div className="relative">
                            <Lock className="absolute start-3 top-2.5 text-text-muted" size={14} />
                            <input
                                type="password"
                                className="input-field dir-ltr font-mono text-sm ps-9"
                                value={sumitApiKey}
                                onChange={(e) => setSumitApiKey(e.target.value)}
                                placeholder="להדביק כאן את ה-APIKey"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveSumitKeys}
                        disabled={sumit.loading || !sumitCompanyId || !sumitApiKey}
                        className="btn btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sumit.loading ? 'מתחבר...' : 'שמור ובדוק חיבור'}
                    </button>
                    {!sumit.loading && (!sumitCompanyId || !sumitApiKey) && (
                        <p className="text-xs text-text-muted text-center">
                            יש למלא את שני השדות כדי לבדוק את החיבור
                        </p>
                    )}

                    {sumitTestResult && (
                        <div className={`text-xs p-3 rounded-lg ${sumitTestResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {sumitTestResult.message}
                        </div>
                    )}

                    <div className="text-[10px] text-text-muted leading-relaxed bg-background p-3 rounded-lg">
                        ℹ️ המפתחות נשמרים בצורה מאובטחת. הם משמשים להפקת חשבוניות, הצעות מחיר, וקבלות באמצעות Sumit.
                    </div>
                </div>
            )}

            {sumit.isConnected && (
                <div className="mt-4">
                    <button
                        onClick={async () => {
                            const res = await sumit.testConnection();
                            setSumitTestResult(res);
                        }}
                        disabled={sumit.loading}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        🔄 בדוק חיבור מחדש
                    </button>
                    {sumitTestResult && (
                        <div className={`mt-2 text-xs p-2 rounded-lg w-fit ${sumitTestResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {sumitTestResult.message}
                        </div>
                    )}
                </div>
            )}

            <div className="border-t border-border pt-8">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-text-primary">
                    <Webhook className="text-primary" />
                    Webhook לאוטומציות (G4)
                </h2>
                <p className="text-sm text-text-muted">
                    כל פנייה חדשה מטופס הפניות תישלח גם לכתובת ה-Webhook שלך — כדי לחבר את Doggo CRM ל-Make / Zapier / WhatsApp / כל אוטומציה אחרת.
                </p>
            </div>

            <div className="space-y-4 max-w-lg p-6 bg-surface border border-border rounded-xl shadow-soft">
                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Webhook URL</label>
                    <input
                        type="url"
                        className="input-field dir-ltr font-mono text-sm"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://hook.eu1.make.com/..."
                        dir="ltr"
                    />
                    <p className="text-[11px] text-text-muted mt-1">חייב להתחיל ב-https://. אנחנו שולחים POST עם payload JSON של הפנייה.</p>
                </div>

                <div className="space-y-1">
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveWebhook}
                            disabled={webhookSaving}
                            className="btn btn-primary text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {webhookSaving ? 'שומרים...' : 'שמירה'}
                        </button>
                        <button
                            onClick={handleTestWebhook}
                            disabled={webhookTestSending || !webhookUrl.trim()}
                            className="btn btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!webhookUrl.trim() ? 'יש להזין כתובת Webhook לפני שליחת בדיקה' : undefined}
                        >
                            <Send size={14} />
                            {webhookTestSending ? 'שולח בדיקה...' : 'שלח בדיקה'}
                        </button>
                    </div>
                    {!webhookTestSending && !webhookUrl.trim() && (
                        <p className="text-xs text-text-muted">שליחת בדיקה זמינה לאחר הזנת כתובת Webhook</p>
                    )}
                </div>

                <details className="text-xs text-text-muted bg-background p-3 rounded-lg">
                    <summary className="cursor-pointer font-medium text-text-secondary mb-2">סוגי אירועים שנשלחים</summary>
                    <ul className="text-[11px] mt-2 space-y-1">
                        <li><code className="font-mono bg-surface px-1 rounded ltr-nums" dir="ltr">intake_submission.created</code> — פנייה חדשה מטופס הפניות</li>
                        <li><code className="font-mono bg-surface px-1 rounded ltr-nums" dir="ltr">session.created</code> — מפגש חדש נקבע</li>
                        <li><code className="font-mono bg-surface px-1 rounded ltr-nums" dir="ltr">session.cancelled</code> — מפגש בוטל</li>
                        <li><code className="font-mono bg-surface px-1 rounded ltr-nums" dir="ltr">program.paid</code> — תוכנית סומנה כשולמה</li>
                    </ul>
                    <p className="text-[11px] text-text-muted mt-3">לכל אירוע, payload בפורמט JSON עם <code dir="ltr" className="font-mono bg-surface px-1 rounded">"event"</code> וכותרת <code dir="ltr" className="font-mono bg-surface px-1 rounded">X-Doggo-Event</code>.</p>
                    <details className="mt-3">
                        <summary className="cursor-pointer text-text-secondary">דוגמת payload (intake_submission.created)</summary>
                        <pre className="overflow-x-auto text-[10px] mt-2 ltr-nums" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{`{
  "event": "intake_submission.created",
  "submission_id": "uuid",
  "trainer_id": "uuid",
  "full_name": "string",
  "phone": "string|null",
  "dog_name": "string|null",
  "dog_breed": "string|null",
  "dog_age": "string|null",
  "notes": "string|null",
  "lead_source": "string|null",
  "selected_service_id": "uuid|null",
  "created_at": "2026-05-02T12:34:56Z"
}`}</pre>
                    </details>
                </details>
            </div>

            <div className="border-t border-border pt-8">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-text-primary">
                    <Key className="text-primary" />
                    טוקן API נכנס (G5 — Make/Zapier inbound)
                </h2>
                <p className="text-sm text-text-muted">
                    טוקן זה מאפשר למערכות חיצוניות (Make, Zapier, טפסים מותאמים) ליצור לקוחות ופניות חדשות ב-Doggo CRM. שילוב דו-כיווני: Webhook (יציאה) + API נכנס.
                </p>
            </div>

            <div className="space-y-4 max-w-lg p-6 bg-surface border border-border rounded-xl shadow-soft">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${hasActiveToken ? 'bg-success/10 border-success/20' : 'bg-background border-border'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${hasActiveToken ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></div>
                        <p className={`font-bold text-sm ${hasActiveToken ? 'text-success' : 'text-text-secondary'}`}>
                            {hasActiveToken ? 'טוקן API פעיל' : 'לא הוגדר טוקן'}
                        </p>
                    </div>
                    {hasActiveToken && <CheckCircle2 className="text-success" size={18} />}
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">כתובת ה-API</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={apiBaseUrl}
                            className="input-field dir-ltr font-mono text-xs flex-1"
                            dir="ltr"
                            onFocus={(e) => e.currentTarget.select()}
                        />
                        <button
                            onClick={handleCopyEndpoint}
                            className="btn btn-secondary text-xs flex items-center gap-1 px-3"
                            type="button"
                        >
                            <Copy size={12} />
                            העתק
                        </button>
                    </div>
                </div>

                {generatedToken && (
                    <div className="p-4 rounded-xl border-2 border-warning/40 bg-warning/5 space-y-3 animate-fade-in">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="text-warning shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-text-primary font-medium">
                                כדאי לשמור את הטוקן הזה במקום בטוח. <b>לא נציג אותו שוב.</b> במקרה של אובדן, תצטרכו ליצור טוקן חדש.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={generatedToken}
                                className="input-field dir-ltr font-mono text-xs flex-1"
                                dir="ltr"
                                onFocus={(e) => e.currentTarget.select()}
                            />
                            <button
                                onClick={handleCopyToken}
                                className="btn btn-primary text-xs flex items-center gap-1 px-3"
                                type="button"
                            >
                                <Copy size={12} />
                                {tokenCopied ? 'הועתק ✓' : 'העתק'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateToken}
                        disabled={tokenGenerating}
                        className="btn btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center"
                    >
                        <RefreshCw size={14} className={tokenGenerating ? 'animate-spin' : ''} />
                        {tokenGenerating ? 'יוצרים...' : (hasActiveToken ? 'יצירת טוקן חדש (יבטל את הקיים)' : 'יצירת טוקן חדש')}
                    </button>
                    {hasActiveToken && (
                        <button
                            onClick={handleRevokeToken}
                            className="btn btn-secondary text-sm"
                            type="button"
                        >
                            בטל טוקן
                        </button>
                    )}
                </div>

                <details className="text-xs text-text-muted bg-background p-3 rounded-lg">
                    <summary className="cursor-pointer font-medium text-text-secondary mb-2">פעולות זמינות + דוגמת קריאה</summary>
                    <p className="text-[11px] mt-2 mb-2">7 פעולות זמינות: 2 יצירה, 3 קריאה, 2 עדכון. כולן מקבלות <code dir="ltr" className="font-mono bg-surface px-1 rounded">{'{ "action": "...", "payload": {...} }'}</code> ומחזירות <code dir="ltr" className="font-mono bg-surface px-1 rounded">{'{ "success": true, ... }'}</code> או status 4xx/5xx עם <code dir="ltr" className="font-mono bg-surface px-1 rounded">error</code>.</p>
                    <pre className="overflow-x-auto text-[10px] mt-2 ltr-nums" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{`POST ${apiBaseUrl}
Headers:
  Content-Type: application/json
  X-Doggo-Token: <your-token>

═══ CREATE ═══

create_client                    → { client_id }
{
  "action": "create_client",
  "payload": {
    "full_name": "ישראל ישראלי",
    "email": "israel@example.com",
    "phone": "050-1234567",
    "primary_dog_name": "רקס",
    "lead_source": "facebook"
  }
}

create_intake_submission         → { submission_id }
{
  "action": "create_intake_submission",
  "payload": {
    "full_name": "ישראל ישראלי",
    "phone": "050-1234567",
    "dog_name": "רקס",
    "dog_breed": "לברדור",
    "dog_age": "3",
    "lead_source": "google-form"
  }
}

═══ READ ═══

list_clients                     → { clients[], total, limit, offset }
{
  "action": "list_clients",
  "payload": {
    "is_active": true,            // optional filter
    "search": "רקס",              // optional ilike on name/email/phone
    "limit": 50,                  // 1-200, default 50
    "offset": 0
  }
}

get_client                       → { client }
{ "action": "get_client", "payload": { "client_id": "<uuid>" } }

list_intake_submissions          → { submissions[], total, limit, offset }
{
  "action": "list_intake_submissions",
  "payload": {
    "status": "new",              // new | approved | archived
    "limit": 50,
    "offset": 0
  }
}

═══ UPDATE ═══

update_client                    → { client_id }
{
  "action": "update_client",
  "payload": {
    "client_id": "<uuid>",
    "updates": {                  // partial; only allowed fields persist
      "phone": "052-9999999",
      "notes": "המאלף שלח שאלה",
      "is_active": false
    }
  }
}
// Allowed: full_name, email, phone, primary_dog_name, notes,
//          lead_source, is_active

update_intake_submission_status  → { submission_id }
{
  "action": "update_intake_submission_status",
  "payload": {
    "submission_id": "<uuid>",
    "status": "approved"          // new | approved | archived
  }
}`}</pre>
                    <p className="text-[11px] text-text-muted mt-3">כל הקריאות מתבצעות בשם המאלפת המזוהה לפי הטוקן. גישה למידע של מאלפת אחרת חסומה ברמת הפונקציה (predicates על user_id / trainer_id) וברמת ה-RLS.</p>
                </details>
            </div>
        </div>
    );
}
