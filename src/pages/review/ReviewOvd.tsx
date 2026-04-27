import { useEffect, useState } from 'react';
import { ReviewOvdProps } from './ReviewShared';
import { getDisplayValue, getSensitiveConfig, validateFieldInput, getMaxLengthForField } from '../../utils/sensitiveFieldUtils';

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
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [extractedPhoto, setExtractedPhoto] = useState<string | null>(payload.extractedPhoto || null);

  useEffect(() => {
    setFields(payload.fields);
    setShowSensitive({});
    setExtractedPhoto(payload.extractedPhoto || null);
  }, [payload]);

  const stateClass = isSubmitting ? 'state-submitting' : isLocked ? 'state-locked' : 'state-editable';
  const toggleSensitive = (fieldKey: string) => setShowSensitive((current) => ({ ...current, [fieldKey]: !current[fieldKey] }));
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

      {(payload.documentLabel.toLowerCase().includes('pan') || payload.documentLabel.toLowerCase().includes('aadhaar')) && extractedPhoto ? (
        <div className="photo-extraction-section">
          <h3>Extracted Photo</h3>
          <div className="photo-preview-container">
            <img src={extractedPhoto} alt={`Extracted ${payload.documentLabel} Photo`} className="extracted-photo" />
          </div>
        </div>
      ) : null}

      {(payload.documentLabel.toLowerCase().includes('pan') || payload.documentLabel.toLowerCase().includes('aadhaar')) && payload.signature_image ? (
        <div className="signature-extraction-section">
          <h3>Extracted Signature</h3>
          <div className="signature-preview-container">
            <img src={payload.signature_image} alt={`Extracted ${payload.documentLabel} Signature`} className="extracted-signature" />
          </div>
        </div>
      ) : null}

      <div className="field-grid">
        {fields.map((field) => {
          const sensitiveConfig = getSensitiveConfig(field);
          const isHiddenSensitive = sensitiveConfig && !showSensitive[field.key];
          return (
            <article className="field-card" key={field.key}>
              <label htmlFor={field.key}>{field.label}</label>
              <div className="field-input-row">
                <input
                  id={field.key}
                  type="text"
                  value={getDisplayValue(field, field.value, showSensitive[field.key])}
                  readOnly={isLocked || !!isHiddenSensitive}
                  className={isLocked ? 'readonly-input' : ''}
                  maxLength={getMaxLengthForField(field.key)}
                  onChange={(event) =>
                    !isHiddenSensitive &&
                    setFields((all) => all.map((item) => (item.key === field.key ? { ...item, value: validateFieldInput(field.key, event.target.value) } : item)))
                  }
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
          {isSubmitting ? 'Submitting...' : 'Submit For Checker Verification'}
        </button>
      </div>
    </section>
  );
}
