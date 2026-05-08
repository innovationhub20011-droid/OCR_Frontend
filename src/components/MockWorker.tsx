import { useEffect } from 'react';

const useMockOcrApi = import.meta.env.VITE_USE_MOCK_API === 'true';

export function MockWorker() {
  useEffect(() => {
    if (!useMockOcrApi) {
      return;
    }

    import('../mocks/browser')
      .then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' });
        console.log('%cMSW mock worker started', 'color: green; font-weight: bold;');
      })
      .catch((error) => {
        console.error('Failed to start MSW mock worker:', error);
      });
  }, []);

  return null;
}
