import client from './client';

// Uploads a File (from an <input type="file">) directly to Cloudinary using
// a short-lived signature from our backend. Returns the hosted image URL.
export async function uploadImageToCloudinary(file) {
  const { data: sig } = await client.get('/uploads/signature');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', sig.timestamp);
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'Upload failed');
  }

  // Inject Cloudinary's automatic quality/format optimization into the
  // delivery URL. This only affects how the image is served (Cloudinary
  // generates an optimized derivative on the fly) - the original upload
  // stored on Cloudinary is never modified or re-compressed.
  return result.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');
}
