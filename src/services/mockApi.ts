import type {
  AadhaarExtractionResponse,
  AccountOpeningPage1ExtractionResponse,
  PanExtractionResponse,
  RawTextExtractionResponse
} from './api';
import {
  mockAadhaarExtractionResponse,
  mockAccountOpeningPage1ExtractionResponse,
  mockPanExtractionResponse,
  mockRawTextExtractionResponse
} from '../mocks/ocrMockResponses';

export class MockBackendApiService {
  async extractPan(
    _file: Blob,
    _fileName: string,
    _extractPhoto: boolean,
    _extractSignature: boolean
  ): Promise<PanExtractionResponse> {
    return Promise.resolve(mockPanExtractionResponse);
  }

  async extractAadhaar(
    _file: Blob,
    _fileName: string,
    _extractPhoto: boolean
  ): Promise<AadhaarExtractionResponse> {
    return Promise.resolve(mockAadhaarExtractionResponse);
  }

  async extractRawText(
    _file: Blob,
    _fileName: string
  ): Promise<RawTextExtractionResponse> {
    return Promise.resolve(mockRawTextExtractionResponse);
  }

  async extractAccountOpeningPage1(
    _file: Blob,
    _fileName: string
  ): Promise<AccountOpeningPage1ExtractionResponse> {
    return Promise.resolve(mockAccountOpeningPage1ExtractionResponse);
  }
}

export const mockBackendApiService = new MockBackendApiService();
