import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { getShellProps } from '../../config/shell';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { extractionWorkflowService } from '../../services/workflow';
import { VerificationRecord } from '../../types/app';

export function VerificationQueuePage(): JSX.Element {
  const user = useCurrentUser();
  const [rows, setRows] = useState<VerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    extractionWorkflowService.getVerificationQueueRows().then((records) => {
      setRows(records);
      setIsLoading(false);
      if (records.length === 0) {
        setInfoMessage('No records are pending verification.');
      }
    });
  }, []);

  return (
    <main className="queue-page">
      <AppShell
        {...getShellProps(user)}
      >
        <section className="queue-shell">
          <header className="head">
            <h2>Verification Queue</h2>
            <p>Records currently waiting for verification.</p>
          </header>
          {infoMessage ? <article className="info">{infoMessage}</article> : null}
          {isLoading ? <div className="loading">Loading pending records...</div> : null}
          {!isLoading && rows.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Scenario</th>
                    <th>Verification Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.documentLabel}</td>
                      <td>{row.scenario}</td>
                      <td><span className="pending-chip">Pending</span></td>
                      <td>{new Date(row.updatedAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </AppShell>
    </main>
  );
}
