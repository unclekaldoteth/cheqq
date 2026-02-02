import crypto from 'node:crypto';

const DEFAULT_BUCKET = 'kyc-documents';
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
]);

const sanitizeSegment = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 120);

const getSupabaseConfig = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase storage env vars are missing');
    }

    return {
        supabaseUrl: supabaseUrl.replace(/\/$/, ''),
        serviceKey,
        bucket: bucket.trim() || DEFAULT_BUCKET,
    };
};

export const isFile = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File;

export const validateDocumentFile = (file: File) => {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
        throw new Error('Unsupported document type. Use PDF, JPG, or PNG.');
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error('Document size exceeds 5MB limit.');
    }
};

type UploadOptions = {
    folder: string;
    ownerKey: string;
};

const createUploadId = () => {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return crypto.randomBytes(16).toString('hex');
};

const isBucketMissing = (status: number, message: string) => {
    if (status === 404) return true;
    const normalized = message.toLowerCase();
    return normalized.includes('bucket') && normalized.includes('not found');
};

export const uploadDocumentToSupabase = async (
    file: File,
    { folder, ownerKey }: UploadOptions
) => {
    const { supabaseUrl, serviceKey, bucket } = getSupabaseConfig();
    const safeOwner = sanitizeSegment(ownerKey || 'unknown');
    const safeName = sanitizeSegment(file.name || 'document');
    const uniqueName = `${createUploadId()}-${safeName || 'document'}`;
    const path = `${sanitizeSegment(folder)}/${safeOwner}/${uniqueName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const headers = {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
    };

    const attemptUpload = async (bucketName: string) => {
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`;
        let response = await fetch(uploadUrl, {
            method: 'POST',
            headers,
            body: buffer,
        });

        if (response.status === 405) {
            response = await fetch(uploadUrl, {
                method: 'PUT',
                headers,
                body: buffer,
            });
        }

        const text = response.ok ? '' : await response.text().catch(() => '');
        return { response, text, bucketName };
    };

    let result = await attemptUpload(bucket);
    if (!result.response.ok && bucket !== DEFAULT_BUCKET && isBucketMissing(result.response.status, result.text)) {
        console.warn(`Supabase bucket "${bucket}" not found. Falling back to "${DEFAULT_BUCKET}".`);
        result = await attemptUpload(DEFAULT_BUCKET);
    }

    if (!result.response.ok) {
        throw new Error(
            `Supabase upload failed (${result.response.status}) ${result.text || result.response.statusText}`
        );
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${result.bucketName}/${path}`;

    return { path, publicUrl };
};
