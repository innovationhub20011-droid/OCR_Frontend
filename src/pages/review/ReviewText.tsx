import { useEffect, useState } from 'react';
import { ReviewTextProps } from './ReviewShared';

export function ReviewText({
  payload,
  isLocked,
  isDraftSaved,
  isSavingDraft,
  isSubmitting,
  onSaveDraft,
  onSubmit,
  onEditRequested
}: ReviewTextProps): JSX.Element {
  const [blocks, setBlocks] = useState(payload.blocks);
  const [selectedBlockId, setSelectedBlockId] = useState(payload.blocks[0]?.id || '');

  useEffect(() => {
    setBlocks(payload.blocks);
    setSelectedBlockId(payload.blocks[0]?.id || '');
  }, [payload]);

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) || null;
  const stateClass = isSubmitting ? 'state-submitting' : isLocked ? 'state-locked' : 'state-editable';
  const stateLabel = isSubmitting ? 'Submitting' : isLocked ? 'Draft Locked' : 'Editable';

  return (
    <section className="text-review">
      <header className="text-head">
        <div>
          <h3>
            Document Review - {payload.documentLabel}
            <span className={`state-chip ${stateClass}`}>{stateLabel}</span>
          </h3>
          <p>Formatting is preserved line-by-line. Edit carefully before submit.</p>
        </div>
        <span className="source-file">Source: {payload.fileName}</span>
      </header>

      <div className="text-layout">
        <aside className="blocks-nav">
          {blocks.map((block) => (
            <button key={block.id} type="button" className={selectedBlockId === block.id ? 'active' : ''} onClick={() => setSelectedBlockId(block.id)}>
              <strong>Page {block.page}</strong>
            </button>
          ))}
        </aside>

        {selectedBlock ? (
          <article className="editor">
            <h4>Page {selectedBlock.page} Extracted Text</h4>
            <pre className="formatted-preview">{selectedBlock.formattedText}</pre>
            <label htmlFor={`block-edit-${selectedBlock.id}`}>Editable Text (format retained)</label>
            <textarea
              id={`block-edit-${selectedBlock.id}`}
              value={selectedBlock.formattedText}
              readOnly={isLocked}
              className={isLocked ? 'readonly-textarea' : ''}
              onChange={(event) =>
                setBlocks((all) =>
                  all.map((block) => (block.id === selectedBlock.id ? { ...block, formattedText: event.target.value } : block))
                )
              }
            />
          </article>
        ) : null}
      </div>

      <div className="actions">
        <button
          className="save-btn"
          disabled={isSavingDraft || isSubmitting || isLocked}
          onClick={() => onSaveDraft(blocks.map((block) => ({ key: block.id, value: block.formattedText })))}
        >
          {isSavingDraft ? 'Saving...' : 'Save Draft'}
        </button>
        {isLocked ? <button className="edit-btn" onClick={onEditRequested}>Edit</button> : null}
        <button
          className="submit-btn"
          disabled={!isDraftSaved || isSavingDraft || isSubmitting || !isLocked}
          onClick={() => onSubmit(blocks.map((block) => ({ key: block.id, value: block.formattedText })))}
        >
          {isSubmitting ? 'Submitting...' : 'Submit For Verification'}
        </button>
      </div>
    </section>
  );
}
