import { TopNavLabel } from '../types/app';
import { APP_ROUTES } from '../constants';

export function getTopNavActiveLabel(pathname: string): TopNavLabel | '' {
  if (pathname.startsWith(APP_ROUTES.verificationQueue)) {
    return 'Verification Queue';
  }
  if (pathname.startsWith(APP_ROUTES.dashboard)) {
    return 'Dashboard';
  }
  return '';
}
