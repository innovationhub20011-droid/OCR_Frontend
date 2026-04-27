import {
  API_BASE_URL,
  API_DEFAULT_UPLOAD_FILE_NAMES,
  API_ENDPOINTS,
  API_HEADERS,
  API_UPLOAD_FIELD_KEYS
} from '../constants';

export type PanExtractionResponse = {
  pan_data?: {
    full_name?: string;
    pan_number?: string;
    date_of_birth?: string;
    father_name?: string;
  };
  face_image?: string; // Base64 data URL from API
  signature?: string; // Base64 data URL from API
  photo?: string | Blob; // Base64 encoded photo or blob
  photoUrl?: string; // Data URL for photo
} & Record<string, unknown>;
export type AadhaarExtractionResponse = {
  face_image?: string; // Base64 data URL from API
} & Record<string, unknown>;
export type RawTextExtractionResponse = {
  document_type?: string;
  file_name?: string;
  total_pages?: number;
  pages?: Array<{
    page_number?: number;
    extracted_text?: string;
  }>;
} & Record<string, unknown>;
export type AccountOpeningPage1ExtractionResponse = Record<string, unknown>;

export class ApiError extends Error {
  constructor(public statusCode: number, public detail: string) {
    super(detail);
    this.name = 'ApiError';
  }
}

async function postFormData<TResponse>(path: string, formData: FormData, queryParams?: Record<string, string | boolean>): Promise<TResponse> {
  const fullUrl = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const url = new URL(fullUrl, window.location.origin);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  console.log('[API] postFormData - Full URL:', url.toString(), 'Path:', path, 'API_BASE_URL:', API_BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: API_HEADERS.acceptJson
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text().catch((error) => {
      console.error('Failed to read error response body', error);
      return 'Unable to read error response body';
    });

    try {
      const errorJson = JSON.parse(errorText);
      const detail = errorJson.detail || errorText;
      throw new ApiError(response.status, detail);
    } catch (parseError) {
      if (parseError instanceof ApiError) {
        throw parseError;
      }
      throw new ApiError(response.status, errorText);
    }
  }

  return (await response.json()) as TResponse;
}

export class BackendApiService {
  async extractPan(
    file: Blob,
    fileName: string = API_DEFAULT_UPLOAD_FILE_NAMES.pan,
    extractPhoto: boolean = false,
    extractSignature: boolean = false
  ): Promise<PanExtractionResponse> {
    const formData = new FormData();
    formData.append(API_UPLOAD_FIELD_KEYS.file, file, fileName);
    return postFormData<PanExtractionResponse>(API_ENDPOINTS.extractPan, formData, {
      photo: extractPhoto,
      signature: extractSignature
    });
  }

  async extractAadhaar(file: Blob, fileName: string = API_DEFAULT_UPLOAD_FILE_NAMES.aadhaar, extractPhoto: boolean = false): Promise<AadhaarExtractionResponse> {
    const formData = new FormData();
    formData.append(API_UPLOAD_FIELD_KEYS.file, file, fileName);
    return postFormData<AadhaarExtractionResponse>(API_ENDPOINTS.extractAadhaar, formData, { photo: extractPhoto });
  }

  async extractRawText(file: Blob, fileName: string = API_DEFAULT_UPLOAD_FILE_NAMES.handwritten): Promise<RawTextExtractionResponse> {
    const formData = new FormData();
    formData.append(API_UPLOAD_FIELD_KEYS.file, file, fileName);
    return postFormData<RawTextExtractionResponse>(API_ENDPOINTS.extractRawText, formData);
  }

  async extractAccountOpeningPage1(
    file: Blob,
    fileName: string = API_DEFAULT_UPLOAD_FILE_NAMES.accountOpeningPage1
  ): Promise<AccountOpeningPage1ExtractionResponse> {
    const formData = new FormData();
    formData.append(API_UPLOAD_FIELD_KEYS.file, file, fileName);
    return postFormData<AccountOpeningPage1ExtractionResponse>(API_ENDPOINTS.extractAccountOpeningPage1, formData);
  }
}

export const backendApiService = new BackendApiService();
