import { useEffect, useState } from 'react';
import { ReviewOvdProps } from './ReviewShared';

export function ReviewOvd({
  payload,
  isLocked,
  isDraftSaved,
  isSavingDraft,
  isSubmitting,
  onSaveDraft,
  onSubmit,
  onEditRequested
}: ReviewOvdProps): JSX.Element {
  const [fields, setFields] = useState(payload.fields);

  useEffect(() => {
    setFields(payload.fields);
  }, [payload]);

  const stateClass = isSubmitting ? 'state-submitting' : isLocked ? 'state-locked' : 'state-editable';
  const stateLabel = isSubmitting ? 'Submitting' : isLocked ? 'Draft Locked' : 'Editable';

  return (
    <section className="ovd-review">
      <header className="ovd-head">
        <div>
          <h3>
            Document Review - {payload.documentLabel}
            <span className={`state-chip ${stateClass}`}>{stateLabel}</span>
          </h3>
          <p>Reference: {payload.customerReference}</p>
        </div>
        <span className="source-file">Source: {payload.fileName}</span>
      </header>

      <div className="field-grid">
        {fields.map((field) => (
          <article className="field-card" key={field.key}>
            <label htmlFor={field.key}>{field.label}</label>
            <input
              id={field.key}
              value={field.value}
              readOnly={isLocked}
              className={isLocked ? 'readonly-input' : ''}
              onChange={(event) =>
                setFields((all) => all.map((item) => (item.key === field.key ? { ...item, value: event.target.value } : item)))
              }
            />
          </article>
        ))}
      </div>

      <div className="actions">
        <button
          className="save-btn"
          disabled={isSavingDraft || isSubmitting || isLocked}
          onClick={() => onSaveDraft(fields.map((field) => ({ key: field.key, value: field.value })))}
        >
          {isSavingDraft ? 'Saving...' : 'Save Draft'}
        </button>
        {isLocked ? <button className="edit-btn" onClick={onEditRequested}>Edit</button> : null}
        <button
          className="submit-btn"
          disabled={!isDraftSaved || isSavingDraft || isSubmitting || !isLocked}
          onClick={() => onSubmit(fields.map((field) => ({ key: field.key, value: field.value })))}
        >
          {isSubmitting ? 'Submitting...' : 'Submit For Verification'}
        </button>
      </div>
    </section>
  );
}
