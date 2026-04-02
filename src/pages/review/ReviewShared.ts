import { FormReviewPayload, OvdReviewPayload, TextReviewPayload } from '../../types/app';

export type ReviewDraftValue = { key: string; value: string };

export type ReviewRendererCommonProps = {
  isLocked: boolean;
  isDraftSaved: boolean;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  onSaveDraft: (values: ReviewDraftValue[]) => void;
  onSubmit: (values: ReviewDraftValue[]) => void;
  onEditRequested: () => void;
};

export type ReviewOvdProps = ReviewRendererCommonProps & {
  payload: OvdReviewPayload;
};

export type ReviewTextProps = ReviewRendererCommonProps & {
  payload: TextReviewPayload;
};

export type ReviewFormProps = ReviewRendererCommonProps & {
  payload: FormReviewPayload;
};
