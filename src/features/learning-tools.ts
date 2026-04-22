/**
 * Learning Tools — Interactive language learning materials for community use.
 * @module learning-tools
 * @license GPL-3.0
 * @author OliWoods Foundation
 */
import { z } from 'zod';

export const LessonSchema = z.object({
  id: z.string().uuid(), languageId: z.string(), level: z.enum(['beginner', 'intermediate', 'advanced']),
  title: z.string(), topic: z.string(),
  vocabulary: z.array(z.object({ word: z.string(), ipa: z.string().optional(), translation: z.string(), audioId: z.string().optional() })),
  phrases: z.array(z.object({ phrase: z.string(), translation: z.string(), context: z.string(), audioId: z.string().optional() })),
  exercises: z.array(z.object({ type: z.enum(['matching', 'fill-blank', 'listening', 'speaking', 'translation']), prompt: z.string(), answer: z.string(), hints: z.array(z.string()) })),
  culturalNote: z.string().optional(),
});

export const ProgressSchema = z.object({
  learnerId: z.string(), languageId: z.string(), completedLessons: z.array(z.string()),
  vocabularyMastered: z.number().int().nonnegative(), streakDays: z.number().int().nonnegative(),
  totalPracticeMinutes: z.number().nonnegative(), level: z.enum(['beginner', 'intermediate', 'advanced']),
  lastActivity: z.string().datetime(),
});

export const PhrasebookSchema = z.object({
  languageId: z.string(), categories: z.array(z.object({
    name: z.string(),
    phrases: z.array(z.object({ original: z.string(), translation: z.string(), pronunciation: z.string().optional(), audioId: z.string().optional(), usage: z.string().optional() })),
  })),
});

export type Lesson = z.infer<typeof LessonSchema>;
export type Progress = z.infer<typeof ProgressSchema>;
export type Phrasebook = z.infer<typeof PhrasebookSchema>;

export function generatePhrasebook(languageId: string, languageName: string): Phrasebook {
  return PhrasebookSchema.parse({
    languageId,
    categories: [
      { name: 'Greetings', phrases: [
        { original: '[greeting-hello]', translation: 'Hello', usage: 'General greeting' },
        { original: '[greeting-goodbye]', translation: 'Goodbye', usage: 'Parting' },
        { original: '[greeting-thanks]', translation: 'Thank you', usage: 'Expressing gratitude' },
        { original: '[greeting-how-are-you]', translation: 'How are you?', usage: 'Casual inquiry' },
      ]},
      { name: 'Family', phrases: [
        { original: '[family-mother]', translation: 'Mother', usage: 'Family term' },
        { original: '[family-father]', translation: 'Father', usage: 'Family term' },
        { original: '[family-child]', translation: 'Child', usage: 'Family term' },
        { original: '[family-elder]', translation: 'Elder/Grandparent', usage: 'Respectful address' },
      ]},
      { name: 'Nature', phrases: [
        { original: '[nature-water]', translation: 'Water', usage: 'Essential vocabulary' },
        { original: '[nature-earth]', translation: 'Earth/Land', usage: 'Often culturally significant' },
        { original: '[nature-sky]', translation: 'Sky', usage: 'Basic vocabulary' },
        { original: '[nature-fire]', translation: 'Fire', usage: 'Basic vocabulary' },
      ]},
      { name: 'Daily Life', phrases: [
        { original: '[daily-eat]', translation: 'To eat', usage: 'Basic verb' },
        { original: '[daily-sleep]', translation: 'To sleep', usage: 'Basic verb' },
        { original: '[daily-walk]', translation: 'To walk/go', usage: 'Basic verb' },
        { original: '[daily-speak]', translation: 'To speak', usage: 'Meta-linguistic — important for language teaching' },
      ]},
    ],
  });
}

export function assessLearnerProgress(progress: Progress): {
  level: string; nextMilestone: string; encouragement: string; suggestedFocus: string;
} {
  const nextMilestone = progress.vocabularyMastered < 100 ? '100 words — basic conversational vocabulary'
    : progress.vocabularyMastered < 500 ? '500 words — functional fluency'
    : progress.vocabularyMastered < 2000 ? '2,000 words — advanced conversational ability'
    : 'Community storytelling and cultural knowledge transmission';
  return {
    level: progress.level,
    nextMilestone,
    encouragement: progress.streakDays > 7
      ? `${progress.streakDays}-day streak! Every day you practice, you help keep this language alive.`
      : 'Every word you learn is a word that survives. Keep going.',
    suggestedFocus: progress.vocabularyMastered < 200 ? 'Core vocabulary and greetings' : 'Sentence construction and conversation practice',
  };
}
