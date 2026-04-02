import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { APP_ROUTES, DOC_ASSET_MAP, DOCUMENT_SECTIONS } from '../../constants';
import { getShellProps } from '../../config/shell';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export function DocumentSelectorPage(): JSX.Element {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const onSelectDocument = (documentId: string) => {
    setSelectedDocumentId((value) => (value === documentId ? null : documentId));
  };

  const onContinue = () => {
    if (!selectedDocumentId) {
      return;
    }
    navigate(`${APP_ROUTES.uploadProcessing}?documentId=${encodeURIComponent(selectedDocumentId)}`);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <main className="loading-screen">Loading documents...</main>;
  }

  return (
    <main className="selector-page">
      <AppShell
        {...getShellProps(user)}
      >
        <section className="selector-shell">
          <p className="intro">Welcome! Please select the document type to proceed.</p>

          {DOCUMENT_SECTIONS.map((section) => (
            <section className="category-block" key={section.title}>
              <h2>{section.title}</h2>
              <div className="doc-grid">
                {section.documents.map((document) => (
                  <article
                    className={`doc-card ${selectedDocumentId === document.id ? 'selected' : ''}`}
                    key={document.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedDocumentId === document.id}
                    onClick={() => onSelectDocument(document.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectDocument(document.id);
                      }
                    }}
                  >
                    {selectedDocumentId === document.id ? (
                      <button
                        className="tick-pill"
                        type="button"
                        aria-label="selected"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                          <path d="M3 8.2 6.2 12 13 4.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : null}
                    <h3>{document.label}</h3>
                    <div className={`doc-art ${document.artClass}`}>
                      <img className="doc-svg" src={DOC_ASSET_MAP[document.artClass]} alt={`${document.label} preview`} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <div className="selector-actions">
            <button
              className="continue-btn"
              type="button"
              disabled={!selectedDocumentId}
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        </section>
      </AppShell>
    </main>
  );
}
