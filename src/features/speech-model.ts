/**
 * Speech Model — Few-shot speech recognition and synthesis for endangered languages.
 * @module speech-model
 * @license GPL-3.0
 * @author OliWoods Foundation
 */
import { z } from 'zod';

export const ASRConfigSchema = z.object({
  languageId: z.string(), modelType: z.enum(['wav2vec2', 'whisper-finetune', 'nemo', 'custom']),
  trainingHours: z.number().positive(), wordErrorRate: z.number().min(0).max(100).optional(),
  vocabularySize: z.number().int().positive(), usesTransferLearning: z.boolean().default(true),
  baseModel: z.string().optional(), communityApproved: z.boolean(),
});

export const TranscriptionResultSchema = z.object({
  audioId: z.string(), text: z.string(), confidence: z.number().min(0).max(1),
  wordTimestamps: z.array(z.object({ word: z.string(), start: z.number(), end: z.number(), confidence: z.number() })),
  needsReview: z.boolean(),
});

export const TrainingDatasetSchema = z.object({
  languageId: z.string(), totalHours: z.number().positive(), totalUtterances: z.number().int().positive(),
  uniqueSpeakers: z.number().int().positive(), vocabularyCoverage: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  splits: z.object({ train: z.number(), validation: z.number(), test: z.number() }),
  consentVerified: z.boolean(), communityDataSovereignty: z.boolean(),
});

export type ASRConfig = z.infer<typeof ASRConfigSchema>;
export type TranscriptionResult = z.infer<typeof TranscriptionResultSchema>;
export type TrainingDataset = z.infer<typeof TrainingDatasetSchema>;

export function estimateModelQuality(dataset: TrainingDataset): {
  expectedWER: number; qualityTier: string; recommendations: string[];
} {
  const recommendations: string[] = [];
  let expectedWER = 80; // Start pessimistic
  // Hours impact
  if (dataset.totalHours >= 100) expectedWER -= 40;
  else if (dataset.totalHours >= 50) expectedWER -= 30;
  else if (dataset.totalHours >= 20) expectedWER -= 20;
  else if (dataset.totalHours >= 5) expectedWER -= 10;
  else recommendations.push(`Only ${dataset.totalHours} hours — need at least 20 hours for usable ASR`);
  // Speaker diversity
  if (dataset.uniqueSpeakers >= 20) expectedWER -= 10;
  else if (dataset.uniqueSpeakers >= 5) expectedWER -= 5;
  else recommendations.push('Need more speaker diversity — minimum 5 speakers for generalization');
  // Vocabulary coverage
  if (dataset.vocabularyCoverage >= 80) expectedWER -= 10;
  else if (dataset.vocabularyCoverage >= 50) expectedWER -= 5;
  // Quality
  if (dataset.qualityScore >= 80) expectedWER -= 5;
  expectedWER = Math.max(5, expectedWER);
  if (!dataset.communityDataSovereignty) recommendations.push('CRITICAL: Ensure community retains ownership and control of all training data');
  recommendations.push('Use transfer learning from a related majority language to improve results');
  return {
    expectedWER: Math.round(expectedWER),
    qualityTier: expectedWER < 20 ? 'Production' : expectedWER < 35 ? 'Usable' : expectedWER < 50 ? 'Draft' : 'Experimental',
    recommendations,
  };
}

export function prepareTrainingPipeline(config: ASRConfig): {
  steps: Array<{ step: number; name: string; description: string; estimatedHours: number }>;
  hardwareRequirements: { gpu: string; ram: string; storage: string };
  ethicsChecklist: string[];
} {
  const steps = [
    { step: 1, name: 'Data Audit', description: 'Verify consent, quality, and community approval for all recordings', estimatedHours: 4 },
    { step: 2, name: 'Preprocessing', description: 'Normalize audio, remove silence, segment into utterances', estimatedHours: 2 },
    { step: 3, name: 'Alignment', description: 'Force-align transcriptions to audio using base model', estimatedHours: config.trainingHours * 0.5 },
    { step: 4, name: 'Fine-tuning', description: `Fine-tune ${config.baseModel || config.modelType} on language-specific data`, estimatedHours: config.trainingHours * 2 },
    { step: 5, name: 'Evaluation', description: 'Calculate WER on held-out test set with native speaker review', estimatedHours: 2 },
    { step: 6, name: 'Community Review', description: 'Present results to community for approval before deployment', estimatedHours: 8 },
  ];
  return {
    steps,
    hardwareRequirements: { gpu: 'NVIDIA A100 or equivalent (available via Google Colab Pro)', ram: '32GB minimum', storage: `${Math.ceil(config.trainingHours * 2)}GB for audio data` },
    ethicsChecklist: [
      'Community has given informed consent for model training',
      'Community retains ownership of all data and models',
      'Model will not be used for commercial purposes without community agreement',
      'Sacred or ceremonial content has been excluded per community guidance',
      'Community members have been trained to maintain and update the model',
      'A data governance agreement is in place',
    ],
  };
}
