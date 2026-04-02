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
} & Record<string, unknown>;
export type AadhaarExtractionResponse = Record<string, unknown>;
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

async function postFormData<TResponse>(path: string, formData: FormData): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
    throw new Error(`Backend request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as TResponse;
}

export class BackendApiService {
  async extractPan(file: Blob, fileName: string = API_DEFAULT_UPLOAD_FILE_NAMES.pan): Promise<PanExtractionResponse> {
    const formData = new FormData();
    formData.append(API_UPLOAD_FIELD_KEYS.file, file, fileName);
    return postFormData<PanExtractionResponse>(API_ENDPOINTS.extractPan, formData);
  }

  async extractAadhaar(file: Blob, fileName: string = API_DEFAULT_UPLOAD_FILE_NAMES.aadhaar): Promise<AadhaarExtractionResponse> {
    const formData = new FormData();
    formData.append(API_UPLOAD_FIELD_KEYS.file, file, fileName);
    return postFormData<AadhaarExtractionResponse>(API_ENDPOINTS.extractAadhaar, formData);
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
