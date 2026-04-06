import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { APP_ROUTES, REVIEW_EXTRACTION_LOADING_LABEL } from '../../constants';
import { getShellProps } from '../../config/shell';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { extractionWorkflowService } from '../../services/workflow';
import { ReviewPayload } from '../../types/app';
import { ReviewForm } from './ReviewForm';
import { ReviewOvd } from './ReviewOvd';
import { ReviewText } from './ReviewText';

export function ReviewContainerPage(): JSX.Element {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState('');
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    extractionWorkflowService.getReviewPayload().then((response) => {
      if (cancelled) {
        return;
      }
      setPayload(response);
      setIsLoading(false);
      setInfoMessage(response.scenario === 'misc' ? response.summaryMessage : '');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isFieldsLocked = isDraftSaved && !isEditMode;

  const onSaveDraft = async (values: Array<{ key: string; value: string }>) => {
    setIsSavingDraft(true);
    await extractionWorkflowService.saveReviewDraft({ values });
    setIsSavingDraft(false);
    setIsDraftSaved(true);
    setIsEditMode(false);
    setInfoMessage('Draft saved. Use Edit to modify and save again.');
  };

  const onSubmit = async (values: Array<{ key: string; value: string }>) => {
    if (!isDraftSaved || isEditMode) {
      setInfoMessage('Save draft first before submitting for verification.');
      return;
    }
    setIsSubmitting(true);
    await extractionWorkflowService.submitToChecker({ values });
    setIsSubmitting(false);
    navigate(APP_ROUTES.verificationQueue);
  };

  return (
    <main className="review-page">
      <AppShell
        {...getShellProps(user)}
      >
        <section className="review-shell">
          <header className="review-head">
            <div>
              <h2>Extracted Fields Review</h2>
            </div>
            <button className="back-btn" type="button" onClick={() => navigate(APP_ROUTES.uploadDocuments)}>Back To Upload</button>
          </header>

          {isLoading ? (
            <div className="extraction-loading">
              <span className="extraction-spinner" aria-hidden="true"></span>
              <p className="extraction-loading-label">{REVIEW_EXTRACTION_LOADING_LABEL}</p>
            </div>
          ) : null}
          {!isLoading && infoMessage ? <article className="info-banner">{infoMessage}</article> : null}

          {!isLoading && payload ? (
            <section className="review-preview-pane" aria-label="Document Preview">
              <h3>Document Preview</h3>
              {!payload.previewUrl ? <p>No preview available for this document.</p> : null}
              {payload.previewUrl && payload.previewKind === 'image' ? (
                <img className="review-preview-image" src={payload.previewUrl} alt={`Preview of ${payload.fileName || payload.documentLabel}`} />
              ) : null}
              {payload.previewUrl && payload.previewKind === 'pdf' ? (
                <iframe className="review-preview-frame" title={`Preview of ${payload.fileName || payload.documentLabel}`} src={payload.previewUrl} />
              ) : null}
              {payload.previewUrl && payload.previewKind === 'other' ? (
                <div className="review-preview-fallback">
                  <strong>Inline preview is not supported for this file type.</strong>
                  <span>{payload.fileName || payload.documentLabel}</span>
                </div>
              ) : null}
            </section>
          ) : null}

          {!isLoading && payload?.scenario === 'ovd' ? (
            <ReviewOvd
              payload={payload}
              isLocked={isFieldsLocked}
              isDraftSaved={isDraftSaved}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
              onSaveDraft={onSaveDraft}
              onSubmit={onSubmit}
              onEditRequested={() => {
                setIsEditMode(true);
                setIsDraftSaved(false);
                setInfoMessage('Edit mode enabled. Save draft again to lock fields and enable submit.');
              }}
            />
          ) : null}

          {!isLoading && payload?.scenario === 'text' ? (
            <ReviewText
              payload={payload}
              isLocked={isFieldsLocked}
              isDraftSaved={isDraftSaved}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
              onSaveDraft={onSaveDraft}
              onSubmit={onSubmit}
              onEditRequested={() => {
                setIsEditMode(true);
                setIsDraftSaved(false);
                setInfoMessage('Edit mode enabled. Save draft again to lock fields and enable submit.');
              }}
            />
          ) : null}

          {!isLoading && payload?.scenario === 'form' ? (
            <ReviewForm
              payload={payload}
              isLocked={isFieldsLocked}
              isDraftSaved={isDraftSaved}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
              onSaveDraft={onSaveDraft}
              onSubmit={onSubmit}
              onEditRequested={() => {
                setIsEditMode(true);
                setIsDraftSaved(false);
                setInfoMessage('Edit mode enabled. Save draft again to lock fields and enable submit.');
              }}
            />
          ) : null}

          {!isLoading && payload?.scenario === 'misc' ? (
            <article className="placeholder">
              <h3>Miscellaneous Review</h3>
              <p>Scenario detected: {payload.scenario}. The dedicated renderer for this document type will be added in the next iteration while keeping source formatting intact.</p>
            </article>
          ) : null}

        </section>
      </AppShell>
    </main>
  );
}
