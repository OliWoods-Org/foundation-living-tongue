/**
 * Language Recorder — Record, transcribe, and preserve endangered language audio.
 * @module language-recorder
 * @license GPL-3.0
 * @author OliWoods Foundation
 */
import { z } from 'zod';

export const LanguageProfileSchema = z.object({
  id: z.string(), name: z.string(), isoCode: z.string().optional(), family: z.string(),
  region: z.string(), speakers: z.number().int().nonnegative(), endangermentLevel: z.enum(['vulnerable', 'definitely-endangered', 'severely-endangered', 'critically-endangered', 'extinct']),
  writingSystem: z.string().optional(), toneLanguage: z.boolean(), morphologicalType: z.enum(['analytic', 'agglutinative', 'fusional', 'polysynthetic', 'unknown']),
  communityControlled: z.boolean().default(true),
});

export const RecordingSessionSchema = z.object({
  id: z.string().uuid(), languageId: z.string(), speakerId: z.string(), recordedAt: z.string().datetime(),
  durationSeconds: z.number().positive(), sampleRateHz: z.number().int().positive(),
  contentType: z.enum(['word-list', 'phrase', 'conversation', 'story', 'song', 'ceremony', 'elicitation']),
  transcript: z.string().optional(), translation: z.string().optional(),
  consentObtained: z.boolean(), communityApproved: z.boolean(),
  metadata: z.object({ topic: z.string().optional(), dialect: z.string().optional(), notes: z.string().optional() }),
});

export const LexiconEntrySchema = z.object({
  id: z.string().uuid(), languageId: z.string(), word: z.string(), ipa: z.string().optional(),
  partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'particle', 'other']),
  definitions: z.array(z.object({ language: z.string(), definition: z.string() })),
  examples: z.array(z.object({ sentence: z.string(), translation: z.string() })),
  audioRecordingId: z.string().optional(), culturalNotes: z.string().optional(),
});

export type LanguageProfile = z.infer<typeof LanguageProfileSchema>;
export type RecordingSession = z.infer<typeof RecordingSessionSchema>;
export type LexiconEntry = z.infer<typeof LexiconEntrySchema>;

export function assessVitality(profile: LanguageProfile): {
  vitalityScore: number; classification: string; urgency: string; recommendations: string[];
} {
  let score = 100;
  if (profile.speakers < 10) score -= 60;
  else if (profile.speakers < 100) score -= 40;
  else if (profile.speakers < 1000) score -= 25;
  else if (profile.speakers < 10000) score -= 10;
  const levelPenalty: Record<string, number> = { 'vulnerable': 5, 'definitely-endangered': 15, 'severely-endangered': 30, 'critically-endangered': 50, 'extinct': 100 };
  score -= levelPenalty[profile.endangermentLevel] || 0;
  score = Math.max(0, score);
  const recommendations: string[] = [];
  if (score < 20) recommendations.push('CRITICAL: Begin emergency documentation with remaining speakers immediately');
  if (score < 40) recommendations.push('Prioritize audio recording of elder speakers for all basic vocabulary and grammar');
  if (!profile.writingSystem) recommendations.push('Develop orthography in consultation with community');
  recommendations.push('Train community members in language documentation techniques');
  recommendations.push('Create immersion learning materials for youth');
  if (profile.communityControlled) recommendations.push('Maintain community data sovereignty — all recordings belong to the community');
  return {
    vitalityScore: Math.round(score),
    classification: score < 10 ? 'Nearly Extinct' : score < 25 ? 'Critically Endangered' : score < 50 ? 'Severely Endangered' : score < 75 ? 'Endangered' : 'Vulnerable',
    urgency: score < 20 ? 'EMERGENCY' : score < 40 ? 'URGENT' : score < 60 ? 'HIGH' : 'MODERATE',
    recommendations,
  };
}

export function calculateDocumentationCoverage(
  lexiconSize: number, recordingHours: number, hasGrammar: boolean, hasTextCorpus: boolean,
): { coveragePercent: number; gaps: string[]; nextPriorities: string[] } {
  let coverage = 0;
  const gaps: string[] = [];
  // Basic lexicon: ~2000 words for functional coverage
  coverage += Math.min(30, (lexiconSize / 2000) * 30);
  if (lexiconSize < 500) gaps.push(`Lexicon has only ${lexiconSize} entries — need at least 2,000 for basic coverage`);
  // Audio recordings: ~100 hours for reasonable ASR training
  coverage += Math.min(30, (recordingHours / 100) * 30);
  if (recordingHours < 10) gaps.push(`Only ${recordingHours} hours recorded — need 50-100 hours for speech model training`);
  // Grammar documentation
  if (hasGrammar) coverage += 20; else gaps.push('No grammar documentation — critical for language teaching');
  // Text corpus
  if (hasTextCorpus) coverage += 20; else gaps.push('No text corpus — needed for NLP model training');
  return {
    coveragePercent: Math.min(100, Math.round(coverage)),
    gaps,
    nextPriorities: gaps.length > 0 ? gaps.map(g => g.split('—')[1]?.trim() || g) : ['Maintain and expand existing documentation'],
  };
}
