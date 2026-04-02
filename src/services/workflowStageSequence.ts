import { DocumentScenario, StageEvent } from '../types/app';

export function buildStageSequence(scenario: DocumentScenario): StageEvent[] {
  const extractionLabel = scenario === 'ovd' ? 'Extracting identity fields' : 'Extracting scenario-specific content';

  return [
    {
      stageCode: 'QUEUED',
      stageLabel: 'Queued',
      statusMessage: 'File uploaded. Queueing extraction request...',
      progress: 22,
      qualityScore: 84
    },
    {
      stageCode: 'OCR_STARTED',
      stageLabel: 'OCR Started',
      statusMessage: 'Running OCR on uploaded image/document...',
      progress: 40,
      qualityScore: 86
    },
    {
      stageCode: 'OCR_COMPLETED',
      stageLabel: 'OCR Completed',
      statusMessage: 'OCR complete. Structuring parsed lines and zones...',
      progress: 62,
      qualityScore: 89
    },
    {
      stageCode: 'FIELD_EXTRACTION',
      stageLabel: 'Field Extraction',
      statusMessage: `${extractionLabel}...`,
      progress: 80,
      qualityScore: 92
    },
    {
      stageCode: 'VALIDATION',
      stageLabel: 'Validation',
      statusMessage: 'Applying confidence checks and basic validation rules...',
      progress: 94,
      qualityScore: 95
    },
    {
      stageCode: 'READY_FOR_REVIEW',
      stageLabel: 'Ready For Review',
      statusMessage: 'Extraction complete. Opening review form...',
      progress: 100,
      qualityScore: 97
    }
  ];
}
