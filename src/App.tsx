import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { APP_ROUTES } from './constants';
import {
  CheckerQueuePage,
  DashboardPage,
  DocumentSelectorPage,
  LoginPage,
  ReviewContainerPage,
  SettingsPage,
  UploadProcessingPage,
  VerificationQueuePage
} from './pages';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path={APP_ROUTES.login} element={<LoginPage />} />
      <Route path={APP_ROUTES.dashboard} element={<ProtectedRoute allowedRoles={['Maker', 'Checker']}><DashboardPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.uploadDocuments} element={<ProtectedRoute allowedRoles={['Maker']}><DocumentSelectorPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.uploadProcessing} element={<ProtectedRoute allowedRoles={['Maker']}><UploadProcessingPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.review} element={<ProtectedRoute allowedRoles={['Maker']}><ReviewContainerPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.verificationQueue} element={<ProtectedRoute allowedRoles={['Maker', 'Checker']}><VerificationQueuePage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.checkerQueue} element={<ProtectedRoute allowedRoles={['Checker']}><CheckerQueuePage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.settings} element={<ProtectedRoute allowedRoles={['Maker', 'Checker']}><SettingsPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.login} replace />} />
      <Route path={APP_ROUTES.wildcard} element={<Navigate to={APP_ROUTES.login} replace />} />
    </Routes>
  );
}
