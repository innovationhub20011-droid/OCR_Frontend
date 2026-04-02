import {
  DocumentScenario,
  ExtractionSession,
  ExtractionSessionContext,
  OvdField,
  FormReviewPayload,
  VerificationRecord,
  OvdReviewPayload,
  ReviewPayload,
  StageEvent,
  TextReviewPayload
} from '../types/app';
import {
  AadhaarExtractionResponse,
  AccountOpeningPage1ExtractionResponse,
  backendApiService,
  PanExtractionResponse,
  RawTextExtractionResponse
} from './api';
import { API_DEFAULT_UPLOAD_FILE_NAMES } from '../constants';
import { buildStageSequence } from './workflowStageSequence.ts';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const CURRENT_SESSION_KEY = 'sbi-ocr-current-session';

export class ExtractionWorkflowService {
  private currentSession: ExtractionSession | null = null;
  private verificationStore = new Map<string, VerificationRecord>();
  private reviewPayloadCache: ReviewPayload | null = null;
  private inFlightReviewPayload: Promise<ReviewPayload> | null = null;

  constructor() {
    this.loadCurrentSessionFromStorage();
  }

  createSession(context: ExtractionSessionContext): ExtractionSession {
    const session: ExtractionSession = {
      documentId: context.documentId,
      documentLabel: context.documentLabel,
      fileName: context.fileName,
      previewUrl: context.previewUrl,
      previewKind: context.previewKind,
      scenario: this.resolveScenario(context.documentId),
      createdAt: new Date().toISOString()
    };
    this.currentSession = session;
    this.persistCurrentSession();
    this.reviewPayloadCache = null;
    this.inFlightReviewPayload = null;
    return session;
  }

  getCurrentSession(): ExtractionSession | null {
    if (this.currentSession) {
      return this.currentSession;
    }
    this.loadCurrentSessionFromStorage();
    return this.currentSession;
  }

  subscribeStageEvents(onEvent: (event: StageEvent) => void): () => void {
    const scenario = this.getCurrentSession()?.scenario || 'misc';
    const events = buildStageSequence(scenario);
    const timers: number[] = [];

    events.forEach((event, index) => {
      const delayMs = index === 0 ? 220 : 220 + index * 900;
      const timer = window.setTimeout(() => onEvent(event), delayMs);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }

  async getReviewPayload(): Promise<ReviewPayload> {
    if (this.reviewPayloadCache) {
      return this.reviewPayloadCache;
    }

    if (this.inFlightReviewPayload) {
      return this.inFlightReviewPayload;
    }

    const payloadPromise = this.buildReviewPayload();
    this.inFlightReviewPayload = payloadPromise;

    try {
      const payload = await payloadPromise;
      this.reviewPayloadCache = payload;
      return payload;
    } finally {
      this.inFlightReviewPayload = null;
    }
  }

  private async buildReviewPayload(): Promise<ReviewPayload> {
    const session = this.getCurrentSession();

    if (!session) {
      await wait(120);
      return {
        scenario: 'misc',
        documentLabel: 'Document',
        fileName: '',
        previewUrl: undefined,
        previewKind: undefined,
        summaryMessage: 'No uploaded document found. Please upload the document again.'
      };
    }

    await wait(220);
    if (session.scenario === 'ovd') {
      return await this.createOvdPayload(session);
    }
    if (session.scenario === 'text') {
      return await this.createTextPayload(session);
    }
    if (session.scenario === 'form') {
      return await this.createFormPayload(session);
    }

    return {
      scenario: session.scenario,
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      previewUrl: session.previewUrl,
      previewKind: session.previewKind,
      summaryMessage: this.buildGenericScenarioSummary(session.scenario)
    };
  }

  async saveReviewDraft(request: { values: Array<{ key: string; value: string }> }): Promise<{ savedAt: string; record: VerificationRecord }> {
    const session = this.getCurrentSession();
    const now = new Date().toISOString();
    const record: VerificationRecord = {
      id: this.buildVerificationId(),
      documentLabel: session?.documentLabel || 'Document',
      fileName: session?.fileName || '',
      scenario: session?.scenario || 'misc',
      status: 'Draft Saved',
      checkerDecision: 'Pending Verification',
      updatedAt: now,
      makerAction: `Draft saved with ${request.values.length} edited fields`
    };
    this.verificationStore.set(record.id, record);
    await wait(220);
    return { savedAt: now, record };
  }

  async submitForVerification(request: { values: Array<{ key: string; value: string }> }): Promise<{ savedAt: string; record: VerificationRecord }> {
    const session = this.getCurrentSession();
    const now = new Date().toISOString();
    const record: VerificationRecord = {
      id: this.buildVerificationId(),
      documentLabel: session?.documentLabel || 'Document',
      fileName: session?.fileName || '',
      scenario: session?.scenario || 'misc',
      status: 'Pending Verification',
      checkerDecision: 'Pending Verification',
      updatedAt: now,
      makerAction: `Submitted with ${request.values.length} reviewed fields`
    };
    this.verificationStore.set(record.id, record);
    await wait(260);
    return { savedAt: now, record };
  }

  async getVerificationQueueRows(): Promise<VerificationRecord[]> {
    await wait(180);
    return this.sortedVerificationRows().filter((row) => row.status === 'Pending Verification' && row.checkerDecision === 'Pending Verification');
  }

  private async createOvdPayload(session: ExtractionSession): Promise<OvdReviewPayload> {
    const ovdType = this.resolveOvdType(session);
    const templateFields = this.buildOvdTemplateFields(ovdType);

    const payload: OvdReviewPayload = {
      scenario: 'ovd',
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      previewUrl: session.previewUrl,
      previewKind: session.previewKind,
      customerReference: '',
      fields: templateFields
    };

    if (!ovdType || !session.previewUrl) {
      return payload;
    }

    try {
      const objectResponse = await fetch(session.previewUrl);
      if (!objectResponse.ok) {
        return payload;
      }

      const fileBlob = await objectResponse.blob();
      const extractionResult = ovdType === 'pan'
        ? await backendApiService.extractPan(fileBlob, session.fileName || API_DEFAULT_UPLOAD_FILE_NAMES.pan)
        : await backendApiService.extractAadhaar(fileBlob, session.fileName || API_DEFAULT_UPLOAD_FILE_NAMES.aadhaar);

      const mappedFields = ovdType === 'pan'
        ? this.mergePanFieldsFromApi(templateFields, extractionResult)
        : ovdType === 'aadhaar'
          ? this.mergeAadhaarFieldsFromApi(templateFields, extractionResult)
          : this.mergeOvdFieldsFromApi(templateFields, extractionResult, ovdType);

      const extractedDocumentNumber = mappedFields.find(
        (field) => field.key === 'documentNumber' || field.key === 'panNumber' || field.key === 'aadhaarNumber'
      )?.value || '';

      return {
        ...payload,
        customerReference: extractedDocumentNumber,
        fields: mappedFields
      };
    } catch (error) {
      console.error('Failed to create OVD payload from preview URL', error);
      // Return template fields only; do not fall back to mock values.
      return payload;
    }
  }

  private resolveOvdType(session: ExtractionSession): 'pan' | 'aadhaar' | null {
    if (session.documentId === 'ovd-pan' || /\bpan\b/i.test(session.documentLabel || '')) {
      return 'pan';
    }

    if (session.documentId === 'ovd-aadhaar' || /\baadhaar\b|\badhar\b|\badhaar\b/i.test(session.documentLabel || '')) {
      return 'aadhaar';
    }

    return null;
  }

  private buildOvdTemplateFields(ovdType: 'pan' | 'aadhaar' | null): OvdField[] {
    if (ovdType === 'pan') {
      return [
        { key: 'fullName', label: 'Full Name', value: '', confidence: 0, required: true },
        { key: 'panNumber', label: 'PAN Number', value: '', confidence: 0, required: true },
        { key: 'dateOfBirth', label: 'Date of Birth', value: '', confidence: 0, required: true },
        { key: 'fatherName', label: 'Father Name', value: '', confidence: 0, required: false }
      ];
    }

    if (ovdType === 'aadhaar') {
      return [
        { key: 'fullName', label: 'Full Name', value: '', confidence: 0, required: true },
        { key: 'dateOfBirth', label: 'Date of Birth', value: '', confidence: 0, required: true },
        { key: 'gender', label: 'Gender', value: '', confidence: 0, required: false },
        { key: 'aadhaarNumber', label: 'Aadhaar Number', value: '', confidence: 0, required: true },
        { key: 'address', label: 'Address', value: '', confidence: 0, required: false }
      ];
    }

    return [
      { key: 'fullName', label: 'Full Name', value: '', confidence: 0, required: true },
      { key: 'documentNumber', label: 'Document Number', value: '', confidence: 0, required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', value: '', confidence: 0, required: true },
      { key: 'gender', label: 'Gender', value: '', confidence: 0, required: false },
      { key: 'address', label: 'Address', value: '', confidence: 0, required: true },
      { key: 'issuedDate', label: 'Issued Date', value: '', confidence: 0, required: false }
    ];
  }

  private mergeOvdFieldsFromApi(
    baseFields: OvdField[],
    apiResult: PanExtractionResponse | AadhaarExtractionResponse,
    ovdType: 'pan' | 'aadhaar'
  ): OvdField[] {
    const normalizedValueMap = this.buildNormalizedValueMap(apiResult);

    const commonFieldKeys: Record<string, string[]> = {
      fullName: ['name', 'fullname', 'cardholdername', 'holdername', 'applicantname'],
      dateOfBirth: ['dob', 'dateofbirth', 'birthdate'],
      gender: ['gender', 'sex'],
      address: ['address', 'residentialaddress'],
      issuedDate: ['issuedate', 'issueddate']
    };

    const documentNumberKeys = ovdType === 'pan'
      ? ['pannumber', 'pan', 'panno', 'panid', 'documentnumber']
      : ['aadhaarnumber', 'aadhaar', 'uid', 'uidai', 'aadhaarid', 'idnumber', 'documentnumber'];

    const fieldSourceKeys: Record<string, string[]> = {
      ...commonFieldKeys,
      documentNumber: documentNumberKeys
    };

    return baseFields.map((field) => {
      const candidates = fieldSourceKeys[field.key] || [];
      const matchedValue = this.findFirstNormalizedValue(normalizedValueMap, candidates);
      if (!matchedValue) {
        return field;
      }
      return {
        ...field,
        value: matchedValue
      };
    });
  }

  private mergePanFieldsFromApi(baseFields: OvdField[], apiResult: PanExtractionResponse): OvdField[] {
    const panData = this.extractPanData(apiResult);
    const panMap = new Map<string, string>([
      ['fullName', this.readStringValue(panData, ['full_name', 'fullName', 'name'])],
      ['panNumber', this.readStringValue(panData, ['pan_number', 'panNumber', 'pan', 'document_number'])],
      ['dateOfBirth', this.readStringValue(panData, ['date_of_birth', 'dateOfBirth', 'dob'])],
      ['fatherName', this.readStringValue(panData, ['father_name', 'fatherName'])]
    ]);

    return baseFields.map((field) => {
      const value = panMap.get(field.key) || '';
      if (!value) {
        return field;
      }
      return {
        ...field,
        value
      };
    });
  }

  private mergeAadhaarFieldsFromApi(baseFields: OvdField[], apiResult: AadhaarExtractionResponse): OvdField[] {
    const aadhaarData = this.extractAadhaarData(apiResult);
    const aadhaarMap = new Map<string, string>([
      ['fullName', this.readStringValue(aadhaarData, ['full_name', 'fullName', 'name'])],
      ['dateOfBirth', this.readStringValue(aadhaarData, ['date_of_birth', 'dateOfBirth', 'dob'])],
      ['gender', this.readStringValue(aadhaarData, ['gender', 'sex'])],
      ['aadhaarNumber', this.readStringValue(aadhaarData, ['aadhaar_number', 'aadhaarNumber', 'aadhaar', 'uid'])],
      ['address', this.readStringValue(aadhaarData, ['address', 'residential_address'])]
    ]);

    return baseFields.map((field) => {
      const value = aadhaarMap.get(field.key) || '';
      if (!value) {
        return field;
      }
      return {
        ...field,
        value
      };
    });
  }

  private extractPanData(apiResult: PanExtractionResponse): Record<string, unknown> {
    const asRecord = apiResult as Record<string, unknown>;

    if (asRecord.pan_data && typeof asRecord.pan_data === 'object') {
      return asRecord.pan_data as Record<string, unknown>;
    }

    const dataNode = asRecord.data;
    if (dataNode && typeof dataNode === 'object') {
      const nestedPan = (dataNode as Record<string, unknown>).pan_data;
      if (nestedPan && typeof nestedPan === 'object') {
        return nestedPan as Record<string, unknown>;
      }
      return dataNode as Record<string, unknown>;
    }

    return asRecord;
  }

  private extractAadhaarData(apiResult: AadhaarExtractionResponse): Record<string, unknown> {
    const asRecord = apiResult as Record<string, unknown>;

    if (asRecord.aadhaar_data && typeof asRecord.aadhaar_data === 'object') {
      return asRecord.aadhaar_data as Record<string, unknown>;
    }

    const dataNode = asRecord.data;
    if (dataNode && typeof dataNode === 'object') {
      const nested = (dataNode as Record<string, unknown>).aadhaar_data;
      if (nested && typeof nested === 'object') {
        return nested as Record<string, unknown>;
      }
      return dataNode as Record<string, unknown>;
    }

    return asRecord;
  }

  private readStringValue(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  private buildNormalizedValueMap(input: unknown): Map<string, string> {
    const valueMap = new Map<string, string>();

    const visit = (node: unknown, keyHint?: string): void => {
      if (node === null || node === undefined) {
        return;
      }

      if (Array.isArray(node)) {
        node.forEach((entry) => visit(entry, keyHint));
        return;
      }

      if (typeof node === 'object') {
        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => visit(value, key));
        return;
      }

      if (!keyHint) {
        return;
      }

      const normalizedKey = this.normalizeKey(keyHint);
      const normalizedValue = String(node).trim();
      if (!normalizedKey || !normalizedValue) {
        return;
      }

      if (!valueMap.has(normalizedKey)) {
        valueMap.set(normalizedKey, normalizedValue);
      }
    };

    visit(input);
    return valueMap;
  }

  private findFirstNormalizedValue(map: Map<string, string>, candidates: string[]): string {
    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizeKey(candidate);
      const direct = map.get(normalizedCandidate);
      if (direct) {
        return direct;
      }

      for (const [key, value] of map.entries()) {
        if (key.includes(normalizedCandidate)) {
          return value;
        }
      }
    }

    return '';
  }

  private normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private async createTextPayload(session: ExtractionSession): Promise<TextReviewPayload> {
    const textType = this.resolveTextType(session);

    if (textType === 'handwritten' && session.previewUrl) {
      try {
        const objectResponse = await fetch(session.previewUrl);
        if (objectResponse.ok) {
          const fileBlob = await objectResponse.blob();
          const rawTextResult = await backendApiService.extractRawText(fileBlob, session.fileName || API_DEFAULT_UPLOAD_FILE_NAMES.handwritten);
          const extractedText = this.extractRawTextValue(rawTextResult);
          return {
            scenario: 'text',
            documentLabel: session.documentLabel,
            fileName: session.fileName,
            previewUrl: session.previewUrl,
            previewKind: session.previewKind,
            blocks: [
              {
                id: 'txt-1',
                page: 1,
                confidence: 0,
                formattedText: extractedText || ''
              }
            ]
          };
        }
      } catch (error) {
        console.error('Failed to build text payload from preview URL', error);
        return {
          scenario: 'text',
          documentLabel: session.documentLabel,
          fileName: session.fileName,
          previewUrl: session.previewUrl,
          previewKind: session.previewKind,
          blocks: [
            {
              id: 'txt-1',
              page: 1,
              confidence: 0,
              formattedText: ''
            }
          ]
        };
      }
    }

    return {
      scenario: 'text',
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      previewUrl: session.previewUrl,
      previewKind: session.previewKind,
      blocks: [
        {
          id: 'txt-1',
          page: 1,
          confidence: 92,
          formattedText: [
            'To,',
            'The Branch Manager',
            'State Bank of India, Park Street Branch',
            '',
            'Subject: Request for address update in account records',
            '',
            'Dear Sir/Madam,',
            'I request you to update my residential address linked with Savings Account 12345678901.',
            'New Address: 22 Park Street, Kolkata - 700016.',
            '',
            'Regards,',
            'Ramesh Kumar'
          ].join('\n')
        },
        {
          id: 'txt-2',
          page: 2,
          confidence: 89,
          formattedText: [
            'Enclosures:',
            '1. Self-attested address proof',
            '2. Copy of PAN card',
            '3. Passport-size photograph'
          ].join('\n')
        }
      ]
    };
  }

  private resolveTextType(session: ExtractionSession): 'handwritten' | 'digital' | 'misc' {
    if (session.documentId === 'text-handwritten' || /handwritten/i.test(session.documentLabel || '')) {
      return 'handwritten';
    }
    if (session.documentId === 'text-digital' || /digital/i.test(session.documentLabel || '')) {
      return 'digital';
    }
    return 'misc';
  }

  private extractRawTextValue(apiResult: RawTextExtractionResponse): string {
    const asRecord = apiResult as Record<string, unknown>;

    const pagesNode = asRecord.pages;
    if (Array.isArray(pagesNode)) {
      const mergedByPage = pagesNode
        .filter((page): page is Record<string, unknown> => !!page && typeof page === 'object')
        .map((page, index) => {
          const pageNumber = typeof page.page_number === 'number' ? page.page_number : index + 1;
          const extractedText = typeof page.extracted_text === 'string' ? page.extracted_text.trim() : '';
          return { pageNumber, extractedText };
        })
        .filter((item) => item.extractedText.length > 0)
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((item) => item.extractedText)
        .join('\n\n');

      if (mergedByPage) {
        return mergedByPage;
      }
    }

    const directCandidates = ['/raw_text', 'raw_text', 'rawText', 'document_text', 'text', 'extracted_text', 'extractedText'];
    for (const key of directCandidates) {
      const value = asRecord[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    const dataNode = asRecord.data;
    if (dataNode && typeof dataNode === 'object') {
      const nested = dataNode as Record<string, unknown>;
      for (const key of directCandidates) {
        const value = nested[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }

    return '';
  }

  private async createFormPayload(session: ExtractionSession): Promise<FormReviewPayload> {
    const payload: FormReviewPayload = session.documentId === 'form-aof'
      ? {
          scenario: 'form',
          documentLabel: session.documentLabel,
          fileName: session.fileName,
          previewUrl: session.previewUrl,
          previewKind: session.previewKind,
          totalPages: 1,
          pages: [
            {
              pageNumber: 1,
              sectionTitle: 'Account Opening Form - Page 1',
              sections: [
                {
                  id: 'sec-top',
                  title: 'Top Section',
                  fields: [
                    { key: 'branch_name', label: 'Branch Name', value: '', confidence: 0, required: false },
                    { key: 'branch_code', label: 'Branch Code', value: '', confidence: 0, required: false },
                    { key: 'date', label: 'Date', value: '', confidence: 0, required: false },
                    { key: 'customer_id', label: 'Customer ID', value: '', confidence: 0, required: false },
                    { key: 'account_number', label: 'Account Number', value: '', confidence: 0, required: false },
                    { key: 'account_type', label: 'Account Type', value: '', confidence: 0, required: false },
                    { key: 'ckyc_number', label: 'CKYC Number', value: '', confidence: 0, required: false },
                    { key: 'pf_number', label: 'PF Number', value: '', confidence: 0, required: false }
                  ]
                },
                {
                  id: 'sec-personal',
                  title: 'Personal Section',
                  fields: [
                    { key: 'first_name', label: 'First Name', value: '', confidence: 0, required: false },
                    { key: 'middle_name', label: 'Middle Name', value: '', confidence: 0, required: false },
                    { key: 'last_name', label: 'Last Name', value: '', confidence: 0, required: false },
                    { key: 'fullName', label: 'Full Name', value: '', confidence: 0, required: false },
                    { key: 'dob', label: 'Date of Birth', value: '', confidence: 0, required: false },
                    { key: 'gender', label: 'Gender', value: '', confidence: 0, required: false },
                    { key: 'marital_status', label: 'Marital Status', value: '', confidence: 0, required: false },
                    { key: 'parent_or_spouse_name', label: 'Parent/Spouse Name', value: '', confidence: 0, required: false },
                    { key: 'guardian_name', label: 'Guardian Name', value: '', confidence: 0, required: false },
                    { key: 'relationship_with_guardian', label: 'Relationship With Guardian', value: '', confidence: 0, required: false },
                    { key: 'nationality', label: 'Nationality', value: '', confidence: 0, required: false },
                    { key: 'citizenship', label: 'Citizenship', value: '', confidence: 0, required: false },
                    { key: 'occupation_type', label: 'Occupation Type', value: '', confidence: 0, required: false },
                    { key: 'employee_id', label: 'Employee ID', value: '', confidence: 0, required: false },
                    { key: 'place_of_posting', label: 'Place of Posting', value: '', confidence: 0, required: false },
                    { key: 'organization_name', label: 'Organization Name', value: '', confidence: 0, required: false },
                    { key: 'nature_of_business', label: 'Nature of Business', value: '', confidence: 0, required: false },
                    { key: 'designation', label: 'Designation', value: '', confidence: 0, required: false },
                    { key: 'annual_income', label: 'Annual Income', value: '', confidence: 0, required: false },
                    { key: 'net_worth', label: 'Net Worth', value: '', confidence: 0, required: false },
                    { key: 'source_of_funds', label: 'Source of Funds', value: '', confidence: 0, required: false },
                    { key: 'religion', label: 'Religion', value: '', confidence: 0, required: false },
                    { key: 'category', label: 'Category', value: '', confidence: 0, required: false },
                    { key: 'person_with_disability', label: 'Person With Disability', value: '', confidence: 0, required: false },
                    { key: 'education', label: 'Education', value: '', confidence: 0, required: false },
                    { key: 'politically_exposed', label: 'Politically Exposed', value: '', confidence: 0, required: false },
                    { key: 'pan_number', label: 'PAN Number', value: '', confidence: 0, required: false }
                  ]
                },
                {
                  id: 'sec-contact',
                  title: 'Contact Section',
                  fields: [
                    { key: 'mobile_number', label: 'Mobile Number', value: '', confidence: 0, required: false },
                    { key: 'email', label: 'Email', value: '', confidence: 0, required: false },
                    { key: 'std_tel_off', label: 'STD Tel (Office)', value: '', confidence: 0, required: false },
                    { key: 'tel_res', label: 'Tel (Residence)', value: '', confidence: 0, required: false }
                  ]
                }
              ]
            }
          ]
        }
      : {
          scenario: 'form',
          documentLabel: session.documentLabel,
          fileName: session.fileName,
          previewUrl: session.previewUrl,
          previewKind: session.previewKind,
          totalPages: 8,
          pages: [
            {
              pageNumber: 1,
              sectionTitle: 'Applicant Profile',
              sections: [
                {
                  id: 'sec-personal',
                  title: 'Personal Details',
                  fields: [
                    { key: 'fullName', label: 'Full Name', value: 'RAMESH KUMAR', confidence: 97, required: true },
                    { key: 'dob', label: 'Date of Birth', value: '1991-06-15', confidence: 96, required: true },
                    { key: 'pan', label: 'PAN Number', value: 'ABCDE1234F', confidence: 94, required: true },
                    { key: 'mobile', label: 'Mobile Number', value: '9876543210', confidence: 93, required: true }
                  ]
                }
              ]
            },
            {
              pageNumber: 2,
              sectionTitle: 'Employment Details',
              sections: [
                {
                  id: 'sec-employment',
                  title: 'Income & Occupation',
                  fields: [
                    { key: 'occupation', label: 'Occupation', value: 'Software Engineer', confidence: 90, required: true },
                    { key: 'employer', label: 'Employer Name', value: 'ABC Technologies Pvt Ltd', confidence: 91, required: true },
                    { key: 'annualIncome', label: 'Annual Income', value: '1400000', confidence: 88, required: true },
                    { key: 'workExp', label: 'Work Experience (Years)', value: '7', confidence: 86, required: false }
                  ]
                }
              ]
            },
            {
              pageNumber: 3,
              sectionTitle: 'Loan Request',
              sections: [
                {
                  id: 'sec-loan',
                  title: 'Requested Facility',
                  fields: [
                    { key: 'loanType', label: 'Loan Type', value: 'Personal Loan', confidence: 95, required: true },
                    { key: 'amount', label: 'Requested Amount', value: '500000', confidence: 92, required: true },
                    { key: 'tenure', label: 'Tenure (Months)', value: '48', confidence: 93, required: true },
                    { key: 'emi', label: 'Estimated EMI', value: '12780', confidence: 85, required: false }
                  ]
                }
              ]
            }
          ]
        };

    if (session.documentId !== 'form-aof' || !session.previewUrl) {
      return payload;
    }

    try {
      const objectResponse = await fetch(session.previewUrl);
      if (!objectResponse.ok) {
        return payload;
      }

      const fileBlob = await objectResponse.blob();
      const apiResult = await backendApiService.extractAccountOpeningPage1(fileBlob, session.fileName || API_DEFAULT_UPLOAD_FILE_NAMES.accountOpeningPage1);
      return {
        ...payload,
        pages: this.mergeAccountOpeningPage1FromApi(payload.pages, apiResult)
      };
    } catch (error) {
      console.error('Failed to create form payload from account opening preview URL', error);
      return payload;
    }
  }

  private mergeAccountOpeningPage1FromApi(
    pages: FormReviewPayload['pages'],
    apiResult: AccountOpeningPage1ExtractionResponse
  ): FormReviewPayload['pages'] {
    if (!pages.length) {
      return pages;
    }

    const parsedData = this.extractAccountOpeningPage1Data(apiResult);
    const valueMap = this.buildNormalizedValueMap(parsedData);
    const personalSection = this.readObjectValue(parsedData, ['personal_section', 'personalSection']);
    const contactSection = this.readObjectValue(parsedData, ['contact_section', 'contactSection']);

    const fullName = [
      this.readStringValue(personalSection, ['first_name', 'firstName']),
      this.readStringValue(personalSection, ['middle_name', 'middleName']),
      this.readStringValue(personalSection, ['last_name', 'lastName'])
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const topSection = this.readObjectValue(parsedData, ['top_section', 'topSection']);

    const explicitFieldValues: Record<string, string> = {
      branch_name: this.readStringValue(topSection, ['branch_name', 'branchName']),
      branch_code: this.readStringValue(topSection, ['branch_code', 'branchCode']),
      date: this.readStringValue(topSection, ['date']),
      customer_id: this.readStringValue(topSection, ['customer_id', 'customerId']),
      account_number: this.readStringValue(topSection, ['account_number', 'accountNumber']),
      account_type: this.readStringValue(topSection, ['account_type', 'accountType']),
      ckyc_number: this.readStringValue(topSection, ['ckyc_number', 'ckycNumber']),
      pf_number: this.readStringValue(topSection, ['pf_number', 'pfNumber']),
      first_name: this.readStringValue(personalSection, ['first_name', 'firstName']),
      middle_name: this.readStringValue(personalSection, ['middle_name', 'middleName']),
      last_name: this.readStringValue(personalSection, ['last_name', 'lastName']),
      fullName,
      dob: this.readStringValue(personalSection, ['dob', 'date_of_birth', 'dateOfBirth']),
      gender: this.readStringValue(personalSection, ['gender']),
      marital_status: this.readStringValue(personalSection, ['marital_status', 'maritalStatus']),
      parent_or_spouse_name: this.readStringValue(personalSection, ['parent_or_spouse_name', 'parentOrSpouseName']),
      guardian_name: this.readStringValue(personalSection, ['guardian_name', 'guardianName']),
      relationship_with_guardian: this.readStringValue(personalSection, ['relationship_with_guardian', 'relationshipWithGuardian']),
      nationality: this.readStringValue(personalSection, ['nationality']),
      citizenship: this.readStringValue(personalSection, ['citizenship']),
      occupation_type: this.readStringValue(personalSection, ['occupation_type', 'occupationType']),
      employee_id: this.readStringValue(personalSection, ['employee_id', 'employeeId']),
      place_of_posting: this.readStringValue(personalSection, ['place_of_posting', 'placeOfPosting']),
      organization_name: this.readStringValue(personalSection, ['organization_name', 'organizationName']),
      nature_of_business: this.readStringValue(personalSection, ['nature_of_business', 'natureOfBusiness']),
      designation: this.readStringValue(personalSection, ['designation']),
      annual_income: this.readStringValue(personalSection, ['annual_income', 'annualIncome']),
      net_worth: this.readStringValue(personalSection, ['net_worth', 'netWorth']),
      source_of_funds: this.readStringValue(personalSection, ['source_of_funds', 'sourceOfFunds']),
      religion: this.readStringValue(personalSection, ['religion']),
      category: this.readStringValue(personalSection, ['category']),
      person_with_disability: this.readStringValue(personalSection, ['person_with_disability', 'personWithDisability']),
      education: this.readStringValue(personalSection, ['education']),
      politically_exposed: this.readStringValue(personalSection, ['politically_exposed', 'politicallyExposed']),
      pan_number: this.readStringValue(personalSection, ['pan_number', 'panNumber', 'pan']),
      mobile_number: this.readStringValue(contactSection, ['mobile_number', 'mobileNumber', 'mobile', 'phone']),
      email: this.readStringValue(contactSection, ['email']),
      std_tel_off: this.readStringValue(contactSection, ['std_tel_off', 'stdTelOff']),
      tel_res: this.readStringValue(contactSection, ['tel_res', 'telRes']),
      pan: this.readStringValue(personalSection, ['pan_number', 'panNumber', 'pan']),
      mobile: this.readStringValue(contactSection, ['mobile_number', 'mobileNumber', 'mobile', 'phone'])
    };

    const sourceKeys: Record<string, string[]> = {
      fullName: ['full_name', 'fullName', 'name', 'applicant_name', 'applicantName', 'customer_name'],
      dob: ['date_of_birth', 'dateOfBirth', 'dob', 'birth_date'],
      pan: ['pan_number', 'panNumber', 'pan', 'pan_no', 'panno'],
      mobile: ['mobile_number', 'mobileNumber', 'mobile', 'phone', 'contact_number']
    };

    return pages.map((page, pageIndex) => {
      if (pageIndex !== 0) {
        return page;
      }

      return {
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) => {
            const explicitValue = explicitFieldValues[field.key] || '';
            if (explicitValue) {
              return {
                ...field,
                value: explicitValue
              };
            }

            const candidates = sourceKeys[field.key] || [];
            const matchedValue = this.findFirstNormalizedValue(valueMap, candidates);
            if (!matchedValue) {
              return field;
            }
            return {
              ...field,
              value: matchedValue
            };
          })
        }))
      };
    });
  }

  private extractAccountOpeningPage1Data(apiResult: AccountOpeningPage1ExtractionResponse): Record<string, unknown> {
    const asRecord = apiResult as Record<string, unknown>;

    if (asRecord.page1_data && typeof asRecord.page1_data === 'object') {
      return asRecord.page1_data as Record<string, unknown>;
    }

    if (asRecord.page1 && typeof asRecord.page1 === 'object') {
      return asRecord.page1 as Record<string, unknown>;
    }

    const dataNode = asRecord.data;
    if (dataNode && typeof dataNode === 'object') {
      const nested = dataNode as Record<string, unknown>;
      if (nested.page1_data && typeof nested.page1_data === 'object') {
        return nested.page1_data as Record<string, unknown>;
      }
      if (nested.page1 && typeof nested.page1 === 'object') {
        return nested.page1 as Record<string, unknown>;
      }
      return nested;
    }

    return asRecord;
  }

  private readObjectValue(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    for (const key of keys) {
      const value = source[key];
      if (value && typeof value === 'object') {
        return value as Record<string, unknown>;
      }
    }
    return {};
  }

  private buildGenericScenarioSummary(scenario: DocumentScenario): string {
    if (scenario === 'text') {
      return 'Text blocks are ready. Use the text-preserving review renderer to retain source formatting.';
    }
    if (scenario === 'form') {
      return 'Multi-page extraction completed. Use paginated section review for 100+ fields.';
    }
    return 'Document extraction finished. Scenario-specific review template will be rendered.';
  }

  private resolveScenario(documentId: string): DocumentScenario {
    if (documentId.startsWith('ovd-')) {
      return 'ovd';
    }
    if (documentId.startsWith('text-')) {
      return 'text';
    }
    if (documentId.startsWith('form-')) {
      return 'form';
    }
    return 'misc';
  }

  private buildVerificationId(): string {
    const timestamp = Date.now().toString(36);
    const randomSeed = Math.random().toString(36).slice(2, 7);
    return `verify-${timestamp}-${randomSeed}`;
  }

  private persistCurrentSession(): void {
    try {
      if (!this.currentSession) {
        window.sessionStorage.removeItem(CURRENT_SESSION_KEY);
        return;
      }
      window.sessionStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Failed to persist current session to storage', error);
      // Ignore browser storage errors.
    }
  }

  private loadCurrentSessionFromStorage(): void {
    try {
      const raw = window.sessionStorage.getItem(CURRENT_SESSION_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as ExtractionSession;
      if (!parsed?.documentId || !parsed?.scenario) {
        return;
      }

      // `URL.createObjectURL()` generates blob URLs that are only valid for the
      // current page lifetime. Stale session-store blob URLs will fail with
      // ERR_FILE_NOT_FOUND during object fetch attempts.
      if (parsed.previewUrl && parsed.previewUrl.startsWith('blob:')) {
        parsed.previewUrl = undefined;
        parsed.previewKind = undefined;
      }

      this.currentSession = parsed;
    } catch (error) {
      console.error('Failed to load current session from storage', error);
      // Ignore malformed payloads.
    }
  }

  private sortedVerificationRows(): VerificationRecord[] {
    return Array.from(this.verificationStore.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export const extractionWorkflowService = new ExtractionWorkflowService();

