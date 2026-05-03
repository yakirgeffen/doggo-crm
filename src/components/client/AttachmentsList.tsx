import { useRef, useState } from 'react';
import {
    Upload,
    Download,
    Trash2,
    Image as ImageIcon,
    FileText,
    Video,
    File as FileIcon,
    Paperclip,
} from 'lucide-react';
import { Spinner } from '../Spinner';
import { useToast } from '../../context/toast-context';
import {
    useClientAttachments,
    ATTACHMENT_MAX_BYTES,
    ATTACHMENT_ACCEPT_ATTR,
} from '../../hooks/useClientAttachments';
import type { ClientAttachment } from '../../types';

interface AttachmentsListProps {
    clientId: string;
}

function formatBytes(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function MimeIcon({ mime }: { mime: string | null }) {
    if (!mime) return <FileIcon size={20} />;
    if (mime.startsWith('image/')) return <ImageIcon size={20} />;
    if (mime.startsWith('video/')) return <Video size={20} />;
    if (mime === 'application/pdf') return <FileText size={20} />;
    return <FileIcon size={20} />;
}

export function AttachmentsList({ clientId }: AttachmentsListProps) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        attachments,
        loading,
        uploadAttachment,
        deleteAttachment,
        getDownloadUrl,
    } = useClientAttachments(clientId);

    const [uploading, setUploading] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const onPickFile = () => {
        fileInputRef.current?.click();
    };

    const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Reset the input so the same file can be re-picked after an error.
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!file) return;

        if (file.size > ATTACHMENT_MAX_BYTES) {
            showToast('הקובץ גדול מ-50MB. יש לבחור קובץ קטן יותר.', 'error');
            return;
        }

        setUploading(true);
        try {
            await uploadAttachment(file);
            showToast('הקובץ הועלה', 'success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'שגיאה בהעלאת הקובץ';
            showToast(message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachment: ClientAttachment) => {
        setDownloadingId(attachment.id);
        try {
            const url = await getDownloadUrl(attachment);
            // Open in a new tab — for images/PDFs the browser previews,
            // for videos it streams, otherwise the signed URL's
            // download=<name> param triggers a save dialog.
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'שגיאה ביצירת קישור הורדה';
            showToast(message, 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleConfirmDelete = async (attachment: ClientAttachment) => {
        setDeletingId(attachment.id);
        try {
            await deleteAttachment(attachment);
            showToast('הקובץ נמחק', 'success');
            setPendingDeleteId(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'שגיאה במחיקת הקובץ';
            showToast(message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header + upload button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                        קבצים מצורפים
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                        תמונות, סרטוני אילוף, אישורי חיסון ועוד · עד 50MB לקובץ
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onPickFile}
                    disabled={uploading}
                    className="btn btn-primary text-sm py-2 px-4 flex items-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Spinner size="sm" />
                            מעלה...
                        </>
                    ) : (
                        <>
                            <Upload size={16} />
                            העלאת קובץ
                        </>
                    )}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ATTACHMENT_ACCEPT_ATTR}
                    className="hidden"
                    onChange={onFileSelected}
                />
            </div>

            {/* Body */}
            {loading ? (
                <div className="flat-card p-8 flex items-center justify-center text-text-muted gap-2">
                    <Spinner size="md" />
                    <span className="text-sm">טוען קבצים...</span>
                </div>
            ) : attachments.length === 0 ? (
                <div className="flat-card p-12 text-center border-dashed border-2 bg-transparent text-text-muted">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mx-auto mb-3 text-text-muted">
                        <Paperclip size={24} />
                    </div>
                    <p className="font-medium">אין קבצים מצורפים</p>
                    <p className="text-sm mt-1">העלאת תמונות, סרטוני אילוף או אישורים רפואיים</p>
                    <button
                        type="button"
                        onClick={onPickFile}
                        disabled={uploading}
                        className="btn btn-primary mt-4 inline-flex items-center gap-2"
                    >
                        <Upload size={16} />
                        העלאת קובץ ראשון
                    </button>
                </div>
            ) : (
                <ul className="space-y-2">
                    {attachments.map((attachment) => {
                        const isPendingDelete = pendingDeleteId === attachment.id;
                        const isDeleting = deletingId === attachment.id;
                        const isDownloading = downloadingId === attachment.id;
                        return (
                            <li
                                key={attachment.id}
                                className="flat-card p-4 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-text-muted shrink-0">
                                    <MimeIcon mime={attachment.mime_type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-text-primary truncate" title={attachment.display_name}>
                                        {attachment.display_name}
                                    </p>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        {formatDate(attachment.uploaded_at)}
                                        {attachment.size_bytes ? ` · ${formatBytes(attachment.size_bytes)}` : ''}
                                        {attachment.mime_type ? ` · ${attachment.mime_type}` : ''}
                                    </p>
                                </div>

                                {isPendingDelete ? (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-text-muted">למחוק?</span>
                                        <button
                                            type="button"
                                            onClick={() => handleConfirmDelete(attachment)}
                                            disabled={isDeleting}
                                            className="text-xs font-medium text-error border border-error/30 rounded-lg px-3 py-1.5 hover:bg-error/10 transition-colors flex items-center gap-1"
                                        >
                                            {isDeleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
                                            {isDeleting ? 'מוחק...' : 'מחיקה'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDeleteId(null)}
                                            disabled={isDeleting}
                                            className="text-xs font-medium text-text-muted border border-border rounded-lg px-3 py-1.5 hover:bg-surface-warm transition-colors"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(attachment)}
                                            disabled={isDownloading}
                                            title="הורדה"
                                            aria-label="הורדה"
                                            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                                        >
                                            {isDownloading ? <Spinner size="sm" /> : <Download size={16} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDeleteId(attachment.id)}
                                            title="מחיקה"
                                            aria-label="מחיקה"
                                            className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
