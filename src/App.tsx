import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { APP_ROUTES } from './constants';
import {
  DashboardPage,
  DocumentSelectorPage,
  LoginPage,
  ReviewContainerPage,
  UploadProcessingPage,
  VerificationQueuePage
} from './pages';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path={APP_ROUTES.login} element={<LoginPage />} />
      <Route path={APP_ROUTES.dashboard} element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.uploadDocuments} element={<ProtectedRoute><DocumentSelectorPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.uploadProcessing} element={<ProtectedRoute><UploadProcessingPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.review} element={<ProtectedRoute><ReviewContainerPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.verificationQueue} element={<ProtectedRoute><VerificationQueuePage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.login} replace />} />
      <Route path={APP_ROUTES.wildcard} element={<Navigate to={APP_ROUTES.login} replace />} />
    </Routes>
  );
}
