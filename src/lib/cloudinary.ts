const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export interface CloudinarySignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
}

function normalizeImageMime(mimeType: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = (mimeType || '').toLowerCase().trim();
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'image/jpeg';
  throw new Error('Unsupported image format. Please use JPG, JPEG, PNG, or WebP.');
}

async function fetchCloudinarySignature(
  endpoint: string,
  idToken: string,
  body?: Record<string, string>
): Promise<CloudinarySignatureResponse> {
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Failed to prepare upload (${res.status})`);
  }
  if (!data?.cloudName || !data?.apiKey || !data?.signature || !data?.timestamp || !data?.folder) {
    throw new Error('Invalid Cloudinary upload signature received from server.');
  }
  return data as CloudinarySignatureResponse;
}

export async function uploadImageToCloudinary(params: {
  blob: Blob;
  mimeType: string;
  signatureEndpoint: string;
  idToken: string;
  body?: Record<string, string>;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const normalizedMime = normalizeImageMime(params.mimeType);
  if (params.blob.size <= 0) {
    throw new Error('Selected image file is empty.');
  }
  if (params.blob.size >= 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB to upload.');
  }

  params.onProgress?.(5);
  const sig = await fetchCloudinarySignature(
    params.signatureEndpoint,
    params.idToken,
    params.body
  );

  const ext =
    normalizedMime === 'image/png' ? 'png' : normalizedMime === 'image/webp' ? 'webp' : 'jpg';
  const formData = new FormData();
  formData.append('file', params.blob, `${sig.publicId}.${ext}`);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);
  formData.append('public_id', sig.publicId);

  params.onProgress?.(10);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/image/upload`;

  const secureUrl = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.timeout = 45000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(99, Math.max(10, Math.round((event.loaded / event.total) * 100)));
        params.onProgress?.(pct);
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading image to Cloudinary. Please try again.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Image upload to Cloudinary timed out. Please check your connection and try again.'));
    };

    xhr.onload = () => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(xhr.responseText || '{}');
      } catch {
        parsed = {};
      }

      if (xhr.status >= 200 && xhr.status < 300 && typeof parsed?.secure_url === 'string') {
        params.onProgress?.(100);
        resolve(parsed.secure_url);
        return;
      }

      const cloudMsg =
        parsed?.error?.message || `Cloudinary upload failed (HTTP ${xhr.status}).`;
      reject(new Error(cloudMsg));
    };

    xhr.send(formData);
  });

  return secureUrl;
}

export async function deleteCloudinaryImageByUrl(
  imageUrl: string,
  idToken: string
): Promise<void> {
  if (!imageUrl || !imageUrl.includes('res.cloudinary.com') || !imageUrl.includes('/savvvnlab/')) {
    return;
  }
  try {
    const targetUrl = `${API_BASE}/api/uploads/cloudinary/destroy`;
    await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ imageUrl }),
    });
  } catch {
    // Non-fatal if already removed or offline
  }
}
