import { http } from 'msw';
import { API_ENDPOINTS } from '../constants/api';
import {
  mockAadhaarExtractionResponse,
  mockAccountOpeningPage1ExtractionResponse,
  mockPanExtractionResponse,
  mockRawTextExtractionResponse
} from './ocrMockResponses';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

export const handlers = [
  http.post(API_ENDPOINTS.extractPan, async ({ request }: { request: Request }) => {
    await request.formData();
    return jsonResponse(mockPanExtractionResponse);
  }),

  http.post(API_ENDPOINTS.extractAadhaar, async ({ request }: { request: Request }) => {
    await request.formData();
    return jsonResponse(mockAadhaarExtractionResponse);
  }),

  http.post(API_ENDPOINTS.extractRawText, async ({ request }: { request: Request }) => {
    await request.formData();
    return jsonResponse(mockRawTextExtractionResponse);
  }),

  http.post(API_ENDPOINTS.extractAccountOpeningPage1, async ({ request }: { request: Request }) => {
    await request.formData();
    return jsonResponse(mockAccountOpeningPage1ExtractionResponse);
  })
];
