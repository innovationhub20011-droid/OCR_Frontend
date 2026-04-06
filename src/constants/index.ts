import type { DocArtClass, TopNavItem } from '../types/app';
export * from './api';
export * from './routes';
import { APP_ROUTES } from './routes';

export type DocumentOption = {
  id: string;
  label: string;
  artClass: DocArtClass;
};

export type DocumentSection = {
  title: string;
  documents: readonly DocumentOption[];
};

export const REVIEW_EXTRACTION_LOADING_LABEL = 'Extracting data, please wait...';

export const TOP_NAV_ITEMS: TopNavItem[] = [
  { label: 'Dashboard', icon: 'D', route: APP_ROUTES.dashboard },
  { label: 'Verification Queue', icon: 'V', route: APP_ROUTES.verificationQueue },
  { label: 'Settings', icon: 'S', route: APP_ROUTES.settings }
];

export const DOC_ASSET_MAP: Record<DocArtClass, string> = {
  aadhaar: new URL('../assets/doc-icons/aadhaar.svg', import.meta.url).href,
  pan: new URL('../assets/doc-icons/pan.svg', import.meta.url).href,
  voter: new URL('../assets/doc-icons/voter.svg', import.meta.url).href,
  passport: new URL('../assets/doc-icons/passport.svg', import.meta.url).href,
  'driving-license': new URL('../assets/doc-icons/driving-license.svg', import.meta.url).href,
  aof: new URL('../assets/doc-icons/account-opening-form.svg', import.meta.url).href,
  hlf: new URL('../assets/doc-icons/housing-loan-form.svg', import.meta.url).href,
  handwritten: new URL('../assets/doc-icons/handwritten-text.svg', import.meta.url).href,
  digital: new URL('../assets/doc-icons/digital-text.svg', import.meta.url).href,
  'misc-text': new URL('../assets/doc-icons/misc-text.svg', import.meta.url).href,
  plf: new URL('../assets/doc-icons/personal-loan-form.svg', import.meta.url).href,
  cheque: new URL('../assets/doc-icons/cheque.svg', import.meta.url).href,
  application: new URL('../assets/doc-icons/application.svg', import.meta.url).href,
  supporting: new URL('../assets/doc-icons/supporting-document.svg', import.meta.url).href
};

export const DOCUMENT_SECTIONS: readonly DocumentSection[] = [
  {
    title: 'OVD Documents',
    documents: [
      { id: 'ovd-pan', label: 'PAN Card', artClass: 'pan' },
      { id: 'ovd-aadhaar', label: 'Aadhaar Card', artClass: 'aadhaar' },
      { id: 'ovd-voter', label: 'Voter Card', artClass: 'voter' },
      { id: 'ovd-passport', label: 'Passport', artClass: 'passport' },
      { id: 'ovd-driving', label: 'Driving Liscence', artClass: 'driving-license' }
    ]
  },
  {
    title: 'Text Documents',
    documents: [
      { id: 'text-handwritten', label: 'Handwritten Text', artClass: 'handwritten' },
      { id: 'text-digital', label: 'Digital Text', artClass: 'digital' },
      { id: 'text-misc', label: 'Miscellaneous Text Documents', artClass: 'misc-text' }
    ]
  },
  {
    title: 'Bank Forms',
    documents: [
      { id: 'form-aof', label: 'Account Opening Form', artClass: 'aof' },
      { id: 'form-hlf', label: 'Housing Loan Form', artClass: 'hlf' },
      { id: 'form-plf', label: 'Personal Loan Form', artClass: 'plf' }
    ]
  },
  {
    title: 'Miscelenous Documents',
    documents: [
      { id: 'misc-cheque', label: 'Cheque', artClass: 'cheque' },
      { id: 'misc-application', label: 'Application', artClass: 'application' },
      { id: 'misc-supporting', label: 'Supporting Document', artClass: 'supporting' }
    ]
  }
] as const;

export const DOCUMENT_LABEL_MAP: Record<string, string> = Object.fromEntries(
  DOCUMENT_SECTIONS.flatMap((section) => section.documents.map((document) => [document.id, document.label]))
);