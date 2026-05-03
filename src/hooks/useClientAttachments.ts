import { useCallback, useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import type { ClientAttachment } from '../types';

const BUCKET = 'client-attachments';
const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5-minute signed URL — long enough to start a download/preview, short enough to not be a sharable link

export const ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024; // 50 MiB — must stay in lockstep with the bucket-level cap in 20260503093924_client_attachments_storage_bucket.sql

export const ATTACHMENT_ACCEPT_MIME = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/x-m4v',
    'video/webm',
] as const;

// Browser <input accept="..."> string — also used to inform the trainer
// up-front which extensions the picker will surface.
export const ATTACHMENT_ACCEPT_ATTR = ATTACHMENT_ACCEPT_MIME.join(',');

/**
 * Load + manage attachments for a single client.
 *
 * Storage layout: <user_id>/<client_id>/<uuid>-<safe-filename>
 * The first path segment MUST equal auth.uid() — Storage RLS policies
 * scope reads/writes by that segment so each trainer sees only their
 * own folder. The DB row in public.client_attachments mirrors the
 * isolation via user_id = auth.uid() RLS.
 */
export function useClientAttachments(clientId: string | undefined) {
    const { user } = useAuth();
    const [attachments, setAttachments] = useState<ClientAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAttachments = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
            .from('client_attachments')
            .select('*')
            .eq('client_id', clientId)
            .order('uploaded_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching client attachments:', fetchError);
            setError(fetchError.message);
        } else {
            setAttachments(data || []);
        }
        setLoading(false);
    }, [clientId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch keyed on clientId; pattern matches ClientDetailPage
        fetchAttachments();
    }, [fetchAttachments]);

    /**
     * Upload a single file. Returns the new ClientAttachment row on success.
     * Throws on size-cap violation, storage upload error, or DB insert error.
     */
    const uploadAttachment = async (file: File): Promise<ClientAttachment> => {
        if (!user) throw new Error('לא מחובר');
        if (!clientId) throw new Error('לקוח לא נבחר');
        if (file.size > ATTACHMENT_MAX_BYTES) {
            throw new Error('הקובץ חורג מ-50MB');
        }

        // Sanitize the filename: keep extension + collapse anything non-safe.
        // Storage path safety: avoid spaces, Hebrew, slashes, etc., to keep
        // signed-URL generation predictable. Display name preserves the
        // original for the UI.
        const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
        const objectId = crypto.randomUUID();
        const storagePath = `${user.id}/${clientId}/${objectId}-${safeName || 'file'}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, file, {
                contentType: file.type || undefined,
                upsert: false,
            });

        if (uploadError) {
            throw new Error(uploadError.message || 'שגיאה בהעלאת הקובץ');
        }

        const { data: row, error: insertError } = await supabase
            .from('client_attachments')
            .insert({
                client_id: clientId,
                user_id: user.id,
                storage_path: storagePath,
                display_name: file.name,
                mime_type: file.type || null,
                size_bytes: file.size,
            })
            .select()
            .single();

        if (insertError || !row) {
            // Best-effort cleanup: remove the orphan storage object.
            await supabase.storage.from(BUCKET).remove([storagePath]);
            throw new Error(insertError?.message || 'שגיאה בשמירת הקובץ');
        }

        await logActivity('client_attachment', row.id, 'created', `קובץ הועלה: ${row.display_name}`);
        setAttachments((prev) => [row, ...prev]);
        return row;
    };

    /**
     * Generate a short-lived signed URL for downloading/viewing the file.
     * 5-minute TTL — long enough to click + start the download, short
     * enough that a leaked URL goes stale fast.
     */
    const getDownloadUrl = async (attachment: ClientAttachment): Promise<string> => {
        const { data, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS, {
                download: attachment.display_name,
            });
        if (signError || !data) {
            throw new Error(signError?.message || 'שגיאה ביצירת קישור הורדה');
        }
        return data.signedUrl;
    };

    const deleteAttachment = async (attachment: ClientAttachment): Promise<void> => {
        // Storage first — if it fails we don't want a phantom DB row pointing nowhere.
        const { error: storageError } = await supabase.storage
            .from(BUCKET)
            .remove([attachment.storage_path]);
        if (storageError) {
            // Continue even on 404 — the object may have been removed out-of-band.
            console.warn('Storage remove warning:', storageError);
        }

        const { error: deleteError } = await supabase
            .from('client_attachments')
            .delete()
            .eq('id', attachment.id);

        if (deleteError) {
            throw new Error(deleteError.message || 'שגיאה במחיקת הקובץ');
        }

        await logActivity('client_attachment', attachment.id, 'deleted', `קובץ נמחק: ${attachment.display_name}`);
        setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    };

    return {
        attachments,
        loading,
        error,
        uploadAttachment,
        deleteAttachment,
        getDownloadUrl,
        refresh: fetchAttachments,
    };
}
