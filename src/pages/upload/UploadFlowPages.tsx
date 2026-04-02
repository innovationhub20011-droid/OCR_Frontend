import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { APP_ROUTES, DOCUMENT_LABEL_MAP } from '../../constants';
import { getShellProps } from '../../config/shell';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { extractionWorkflowService } from '../../services/workflow';

export function UploadProcessingPage(): JSX.Element {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [params] = useSearchParams();
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | 'other' | null>(null);
  const previousPreviewUrlRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(46);

  const selectedDocumentId = params.get('documentId') || '';
  const selectedDocumentLabel = DOCUMENT_LABEL_MAP[selectedDocumentId] || 'Selected Document';

  const onFileSelected = (file: File) => {
    if (previousPreviewUrlRef.current) {
      URL.revokeObjectURL(previousPreviewUrlRef.current);
      previousPreviewUrlRef.current = null;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setUploadProgress(52);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      previousPreviewUrlRef.current = url;
      setPreviewKind('image');
      setPreviewUrl(url);
      return;
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const url = URL.createObjectURL(file);
      previousPreviewUrlRef.current = url;
      setPreviewKind('pdf');
      setPreviewUrl(url);
      return;
    }

    setPreviewKind('other');
    setPreviewUrl(null);
  };

  useEffect(() => {
    if (!isUploading) {
      return;
    }
    const timer = window.setInterval(() => {
      setUploadProgress((value) => Math.min(value + 6, 100));
    }, 250);

    return () => window.clearInterval(timer);
  }, [isUploading]);

  useEffect(() => {
    if (!isUploading) {
      return;
    }

    if (uploadProgress >= 100) {
      setIsUploading(false);
      extractionWorkflowService.createSession({
        documentId: selectedDocumentId,
        documentLabel: selectedDocumentLabel,
        fileName,
        previewUrl: previewUrl || undefined,
        previewKind: previewKind || 'other'
      });
      navigate(APP_ROUTES.review);
    }
  }, [isUploading, uploadProgress, navigate, selectedDocumentId, selectedDocumentLabel, fileName, previewUrl, previewKind]);

  return (
    <main className="upload-page">
      <AppShell
        {...getShellProps(user)}
      >
        <section className="upload-shell">
          <h2>Upload {selectedDocumentLabel} Document</h2>
          <p className="subtext">Please upload your {selectedDocumentLabel} document for verification.</p>
          <div className="progress-wrap" aria-label="Processing progress">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>

          <div className={`content-grid ${selectedFile ? 'has-preview' : 'no-preview'}`}>
            <div className="drop-zone">
              <label className="upload-icon" htmlFor="filePicker">
                <svg viewBox="0 0 64 64" focusable="false">
                  <path d="M32 14l-11 11h7v14h8V25h7L32 14z" fill="currentColor"></path>
                  <path d="M16 42h32a6 6 0 0 1 6 6v2a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6v-2a6 6 0 0 1 6-6z" fill="none" stroke="currentColor" strokeWidth="4"></path>
                </svg>
                <span>Upload</span>
              </label>
              <p className="upload-browse-hint">Upload image or PDF (JPG, PNG, PDF)</p>
              <input
                id="filePicker"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) {
                    return;
                  }
                  onFileSelected(selected);
                }}
              />
              {fileName ? <div className="file-name">{fileName}</div> : null}
            </div>

            {selectedFile ? (
              <aside className="preview-pane" aria-label="Document Preview">
                <h3>Document Preview</h3>
                {previewKind === 'image' && previewUrl ? (
                <img className="doc-preview-image" src={previewUrl} alt={`Preview of ${fileName}`} />
                ) : null}
                {previewKind === 'pdf' && previewUrl ? (
                  <iframe className="doc-preview-frame" title={`Preview of ${fileName}`} src={previewUrl} />
                ) : null}
                {previewKind === 'other' ? (
                  <div className="preview-fallback">
                    <strong>No inline preview available</strong>
                    <span>{fileName}</span>
                  </div>
                ) : null}
              </aside>
            ) : null}
          </div>

          <div className="action-row">
            <button className="back-btn" type="button" onClick={() => navigate(APP_ROUTES.uploadDocuments)}>Back</button>
            <button className="upload-btn" type="button" disabled={!fileName || isUploading} onClick={() => setIsUploading(true)}>
              {isUploading ? 'Starting...' : 'Start Extraction'}
            </button>
          </div>
        </section>
      </AppShell>
    </main>
  );
}
