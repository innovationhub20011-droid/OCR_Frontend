const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

const resolvedApiBaseUrl = (env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

// In development, use Vite proxy (vite.config.ts) for /extract routes to avoid CORS.
// In production, use the configured base URL.
export const API_BASE_URL = import.meta.env.DEV ? '' : resolvedApiBaseUrl;

export const API_HEADERS = {
  acceptJson: 'application/json'
} as const;

export const API_ENDPOINTS = {
  extractPan: '/extract/pan',
  extractAadhaar: '/extract/aadhaar',
  extractRawText: '/extract/text/handwritten_text',
  extractAccountOpeningPage1: '/extract/account-opening/page1'
} as const;

export const API_UPLOAD_FIELD_KEYS = {
  file: 'file'
} as const;

export const API_DEFAULT_UPLOAD_FILE_NAMES = {
  pan: 'pan-upload.jpg',
  aadhaar: 'aadhaar-upload.jpg',
  handwritten: 'handwritten-upload.jpg',
  accountOpeningPage1: 'account-opening-page1-upload.jpg'
} as const;

