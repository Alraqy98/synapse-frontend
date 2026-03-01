/**
 * Upload a blob to a signed URL (e.g. Supabase storage).
 * Backend returns upload_path and upload_token from POST /library/files/:fileId/recordings.
 */
export async function uploadToSignedUrl(upload_path, upload_token, blob) {
    const headers = {};
    if (upload_token) {
        headers.Authorization = `Bearer ${upload_token}`;
    }
    const res = await fetch(upload_path, {
        method: "PUT",
        body: blob,
        headers,
    });
    if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }
}
