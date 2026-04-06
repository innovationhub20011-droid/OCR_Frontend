export const APP_ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  uploadDocuments: '/dashboard/upload-documents',
  uploadProcessing: '/dashboard/upload-documents/process',
  review: '/dashboard/review',
  verificationQueue: '/dashboard/verification-queue',
  checkerQueue: '/dashboard/checker-queue',
  settings: '/dashboard/settings',
  wildcard: '*'
} as const;
