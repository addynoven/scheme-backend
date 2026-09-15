/**
 * Cloudinary image delivery and optimization helper.
 * Generates responsive, webp/avif auto-compressed CDN URLs for React Native Image components.
 */
export const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzao8h1ay';

export interface CloudinaryOptimizeOptions {
  width?: number;
  height?: number;
  quality?: string | number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  format?: 'auto' | 'webp' | 'png' | 'jpg';
}

export function optimizeCloudinaryUrl(
  url: string,
  options: CloudinaryOptimizeOptions = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width = 500,
    height,
    quality = 'auto',
    crop = 'fill',
    format = 'auto',
  } = options;

  const transforms: string[] = [`f_${format}`, `q_${quality}`];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width && height) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');

  // Pattern: https://res.cloudinary.com/<cloud_name>/image/upload/(v[0-9]+/)?...
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    return url;
  }

  const beforeUpload = url.substring(0, uploadIndex + '/upload/'.length);
  const afterUpload = url.substring(uploadIndex + '/upload/'.length);

  // Avoid duplicate transformation strings
  if (afterUpload.startsWith('f_auto') || afterUpload.includes('/v')) {
    // Inject right after /upload/
    return `${beforeUpload}${transformString}/${afterUpload}`;
  }

  return `${beforeUpload}${transformString}/${afterUpload}`;
}

export const cloudinary = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  optimize: optimizeCloudinaryUrl,
};
