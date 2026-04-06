export type AppUserRole = 'Maker' | 'Checker';

export type DocumentScenario = 'ovd' | 'text' | 'form' | 'misc';

export interface AppSessionUser {
  id: string;
  fullName: string;
  role: AppUserRole;
  branchCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  status: 'success';
  message: string;
  token: string;
  user: {
    id: string;
    fullName: string;
    role: AppUserRole;
    branchCode: string;
  };
}

export interface ExtractionSessionContext {
  documentId: string;
  documentLabel: string;
  fileName: string;
  previewUrl?: string;
  previewKind?: 'image' | 'pdf' | 'other';
}

export interface ExtractionSession {
  documentId: string;
  documentLabel: string;
  fileName: string;
  previewUrl?: string;
  previewKind?: 'image' | 'pdf' | 'other';
  scenario: DocumentScenario;
  createdAt: string;
}

export interface StageEvent {
  stageCode: 'QUEUED' | 'OCR_STARTED' | 'OCR_COMPLETED' | 'FIELD_EXTRACTION' | 'VALIDATION' | 'READY_FOR_REVIEW';
  stageLabel: string;
  statusMessage: string;
  progress: number;
  qualityScore: number;
}

export interface OvdField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
}

export interface OvdReviewPayload {
  scenario: 'ovd';
  documentLabel: string;
  fileName: string;
  previewUrl?: string;
  previewKind?: 'image' | 'pdf' | 'other';
  customerReference: string;
  fields: OvdField[];
}

export interface TextLineBlock {
  id: string;
  page: number;
  formattedText: string;
  confidence: number;
}

export interface TextReviewPayload {
  scenario: 'text';
  documentLabel: string;
  fileName: string;
  previewUrl?: string;
  previewKind?: 'image' | 'pdf' | 'other';
  blocks: TextLineBlock[];
}

export interface FormField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormPage {
  pageNumber: number;
  sectionTitle: string;
  sections: FormSection[];
}

export interface FormReviewPayload {
  scenario: 'form';
  documentLabel: string;
  fileName: string;
  previewUrl?: string;
  previewKind?: 'image' | 'pdf' | 'other';
  totalPages: number;
  pages: FormPage[];
}

export interface MiscReviewPayload {
  scenario: 'misc';
  documentLabel: string;
  fileName: string;
  previewUrl?: string;
  previewKind?: 'image' | 'pdf' | 'other';
  summaryMessage: string;
}

export type ReviewPayload = OvdReviewPayload | TextReviewPayload | FormReviewPayload | MiscReviewPayload;

export interface VerificationRecord {
  id: string;
  documentLabel: string;
  fileName: string;
  scenario: DocumentScenario;
  status: 'Draft Saved' | 'Pending Checker' | 'Verified' | 'Rejected';
  checkerDecision: 'Pending Checker' | 'Verified' | 'Rejected';
  checkerName?: string;
  checkerComment?: string;
  checkerReviewedAt?: string;
  updatedAt: string;
  makerAction: string;
}

export type TopNavLabel = 'Dashboard' | 'Verification Queue' | 'Settings';

export interface TopNavItem {
  label: TopNavLabel;
  icon: string;
  route: string;
}

export type DocArtClass =
  | 'aadhaar'
  | 'pan'
  | 'voter'
  | 'passport'
  | 'driving-license'
  | 'aof'
  | 'hlf'
  | 'handwritten'
  | 'digital'
  | 'misc-text'
  | 'plf'
  | 'cheque'
  | 'application'
  | 'supporting';
