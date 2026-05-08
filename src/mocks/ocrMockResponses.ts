import type {
  AadhaarExtractionResponse,
  AccountOpeningPage1ExtractionResponse,
  PanExtractionResponse,
  RawTextExtractionResponse
} from '../services/api';

export const mockPanExtractionResponse: PanExtractionResponse = {
  pan_data: {
    full_name: 'Ravi Verma',
    pan_number: 'ABCDE1234F',
    date_of_birth: '1986-12-20',
    father_name: 'Suresh Verma'
  },
  face_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
  signature_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
};

export const mockAadhaarExtractionResponse: AadhaarExtractionResponse = {
  aadhaar_data: {
    full_name: 'Sneha Patel',
    date_of_birth: '1992-07-14',
    gender: 'Female',
    aadhaar_number: '1234 5678 9012',
    address: '5 MG Road, Mumbai, MH'
  },
  face_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
};

export const mockRawTextExtractionResponse: RawTextExtractionResponse = {
  document_type: 'Handwritten Text',
  file_name: 'mock-handwritten.png',
  total_pages: 1,
  pages: [
    {
      page_number: 1,
      extracted_text: 'This is mocked OCR text for local testing and UI validation.'
    }
  ]
};

export const mockAccountOpeningPage1ExtractionResponse: AccountOpeningPage1ExtractionResponse = {
  account_number: '123456789012',
  customer_name: 'Aman Gupta',
  dob: '1990-05-20',
  branch: 'Mumbai Main',
  ifsc: 'SBIN0001234'
};
