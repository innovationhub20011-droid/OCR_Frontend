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
        setInfoMessage('No records are pending checker verification.');
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
            <p>Records currently waiting for checker verification.</p>
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
                      <td><span className="pending-chip">Pending Checker</span></td>
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

export function CheckerQueuePage(): JSX.Element {
  const user = useCurrentUser();
  const [rows, setRows] = useState<VerificationRecord[]>([]);
  const [rejectComments, setRejectComments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const loadQueue = () => {
    setIsLoading(true);
    extractionWorkflowService.getCheckerQueueRows().then((queueRows) => {
      setRows(queueRows);
      setIsLoading(false);
      if (queueRows.length === 0) {
        setFeedbackMessage('No records pending checker decision.');
      }
    });
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <main className="checker-page">
      <AppShell
        {...getShellProps(user, {
          userName: user?.fullName || 'Checker User',
          userRole: user?.role || 'Checker',
          footerLeft: 'Compliance Workflow'
        })}
      >
        <section className="queue-shell">
          <header className="queue-head">
            <h2>Checker Verification Queue</h2>
            <p>Mandatory checker decision states: Pending Checker, Verified, Rejected.</p>
          </header>
          {feedbackMessage ? <article className="feedback">{feedbackMessage}</article> : null}
          {isLoading ? <div className="loading">Loading pending records...</div> : null}
          {!isLoading && rows.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>File Name</th>
                    <th>Scenario</th>
                    <th>Submitted At</th>
                    <th>Reject Comment (Mandatory)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.documentLabel}</td>
                      <td>{row.fileName}</td>
                      <td>{row.scenario}</td>
                      <td>{new Date(row.updatedAt).toLocaleString()}</td>
                      <td>
                        <textarea value={rejectComments[row.id] || ''} onChange={(event) => setRejectComments((all) => ({ ...all, [row.id]: event.target.value }))} placeholder="Enter rejection reason" />
                      </td>
                      <td className="actions">
                        <button
                          className="verify"
                          type="button"
                          onClick={() => {
                            const checkerName = user?.fullName || 'Checker User';
                            extractionWorkflowService.checkerVerify(row.id, checkerName).then((updated) => {
                              if (!updated) {
                                setFeedbackMessage('Verification failed. Record may already be processed.');
                                return;
                              }
                              setFeedbackMessage(`${row.documentLabel} verified successfully.`);
                              loadQueue();
                            });
                          }}
                        >
                          Verify
                        </button>
                        <button
                          className="reject"
                          type="button"
                          onClick={() => {
                            const comment = rejectComments[row.id] || '';
                            if (!comment.trim()) {
                              setFeedbackMessage('Reject comment is mandatory.');
                              return;
                            }
                            const checkerName = user?.fullName || 'Checker User';
                            extractionWorkflowService.checkerReject(row.id, checkerName, comment).then((updated) => {
                              if (!updated) {
                                setFeedbackMessage('Reject failed. Record may already be processed.');
                                return;
                              }
                              setFeedbackMessage(`${row.documentLabel} rejected with checker comments.`);
                              loadQueue();
                            });
                          }}
                        >
                          Reject
                        </button>
                      </td>
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
