import { useEffect, useState } from 'react';
import { ReviewDraftValue, ReviewFormProps } from './ReviewShared';
import { getDisplayValue, getSensitiveConfig } from '../../utils/sensitiveFieldUtils';

export function ReviewForm({
  payload,
  isLocked,
  isDraftSaved,
  isSavingDraft,
  isSubmitting,
  onSaveDraft,
  onSubmit,
  onEditRequested
}: ReviewFormProps): JSX.Element {
  const [workingPayload, setWorkingPayload] = useState(payload);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setWorkingPayload(payload);
    setActivePageIndex(0);
    setShowSensitive({});
  }, [payload]);

  const flattenFields = (): ReviewDraftValue[] =>
    workingPayload.pages.flatMap((page) => page.sections.flatMap((section) => section.fields.map((field) => ({ key: field.key, value: field.value }))));

  const toggleSensitive = (fieldKey: string) => setShowSensitive((current) => ({ ...current, [fieldKey]: !current[fieldKey] }));

  const currentPage = workingPayload.pages[activePageIndex];
  const stateClass = isSubmitting ? 'state-submitting' : isLocked ? 'state-locked' : 'state-editable';
  const stateLabel = isSubmitting ? 'Submitting' : isLocked ? 'Draft Locked' : 'Editable';

  return (
    <section className="form-review">
      <header className="form-head">
        <div>
          <h3>
            Document Review - {payload.documentLabel}
            <span className={`state-chip ${stateClass}`}>{stateLabel}</span>
          </h3>
          <p>Extracted {flattenFields().length} fields across {payload.totalPages} pages. Previewing sampled pages for editing.</p>
        </div>
        <span className="source-file">Source: {payload.fileName}</span>
      </header>

      <div className="page-nav">
        <button type="button" disabled={activePageIndex === 0} onClick={() => setActivePageIndex((v) => Math.max(v - 1, 0))}>Previous</button>
        {workingPayload.pages.map((page, index) => (
          <button type="button" key={page.pageNumber} className={index === activePageIndex ? 'active' : ''} onClick={() => setActivePageIndex(index)}>Page {page.pageNumber}</button>
        ))}
        <button type="button" disabled={activePageIndex === workingPayload.pages.length - 1} onClick={() => setActivePageIndex((v) => Math.min(v + 1, workingPayload.pages.length - 1))}>Next</button>
      </div>

      {currentPage ? (
        <article className="page-editor">
          <h4>Page {currentPage.pageNumber} - {currentPage.sectionTitle}</h4>
          {currentPage.sections.map((section) => (
            <section className="section-card" key={section.id}>
              <h5>{section.title}</h5>
              <div className="field-grid">
                {section.fields.map((field) => {
                  const sensitiveConfig = getSensitiveConfig(field);
                  const isHiddenSensitive = sensitiveConfig && !showSensitive[field.key];
                  return (
                    <article className="field-row" key={field.key}>
                      <label htmlFor={field.key}>{field.label}</label>
                      <div className="field-input-row">
                        <input
                          id={field.key}
                          type="text"
                          className={isLocked ? 'readonly-input' : ''}
                          value={getDisplayValue(field, field.value, showSensitive[field.key])}
                          readOnly={isLocked || !!isHiddenSensitive}
                          onChange={(event) => {
                            if (isHiddenSensitive) {
                              return;
                            }
                            setWorkingPayload((current) => ({
                              ...current,
                              pages: current.pages.map((page) => ({
                                ...page,
                                sections: page.sections.map((sec) => ({
                                  ...sec,
                                  fields: sec.fields.map((item) => (item.key === field.key ? { ...item, value: event.target.value } : item))
                                }))
                              }))
                            }));
                          }}
                        />
                        {sensitiveConfig ? (
                          <button
                            type="button"
                            className="sensitive-toggle"
                            onClick={() => toggleSensitive(field.key)}
                          >
                            {showSensitive[field.key] ? 'Hide' : 'Reveal'}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </article>
      ) : null}

      <div className="actions">
        <button className="save-btn" disabled={isSavingDraft || isSubmitting || isLocked} onClick={() => onSaveDraft(flattenFields())}>{isSavingDraft ? 'Saving...' : 'Save Draft'}</button>
        {isLocked ? <button className="edit-btn" onClick={onEditRequested}>Edit</button> : null}
        <button className="submit-btn" disabled={!isDraftSaved || isSavingDraft || isSubmitting || !isLocked} onClick={() => onSubmit(flattenFields())}>{isSubmitting ? 'Submitting...' : 'Submit For Checker Verification'}</button>
      </div>
    </section>
  );
}
