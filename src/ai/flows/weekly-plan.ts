import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const WeeklyPlanInputSchema = z.object({
  fitnessGoals: z.string().optional(),
  currentStreakDays: z.number().int().nonnegative(),
  longestStreakDays: z.number().int().nonnegative(),
  visitsThisMonth: z.number().int().nonnegative(),
  totalVisits: z.number().int().nonnegative(),
  personalRecords: z.array(z.object({
    exercise: z.string(),
    value: z.number(),
    unit: z.enum(['kg', 'lb']),
  })),
  recentClasses: z.array(z.object({
    className: z.string(),
    classDay: z.string(),
  })),
});
export type WeeklyPlanInput = z.infer<typeof WeeklyPlanInputSchema>;

export const WeeklyPlanOutputSchema = z.object({
  summary: z.string().describe('A 1-2 sentence overview of the week, referencing the member\'s actual data.'),
  days: z.array(z.object({
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    focus: z.string().describe('e.g. "Upper body strength", "Active recovery", "Rest"'),
    sessionType: z.enum(['gym', 'class', 'rest']),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number().int().positive().optional(),
      reps: z.string().optional().describe('e.g. "8-10" or "AMRAP"'),
      targetLoad: z.string().optional().describe('e.g. "Bodyweight" or a load relative to a logged PR'),
    })).optional(),
    estMinutes: z.number().int().positive().optional(),
  })).length(7),
  classSuggestions: z.array(z.string()).describe('Names of classes from recentClasses or general class types worth trying.'),
  caution: z.string().describe('One sentence reminding the member this is a suggestion, not medical/professional advice, and to check with a trainer for form or injury concerns.'),
});
export type WeeklyPlanOutput = z.infer<typeof WeeklyPlanOutputSchema>;

export const weeklyPlanFlow = ai.defineFlow(
  {
    name: 'weeklyPlanFlow',
    inputSchema: WeeklyPlanInputSchema,
    outputSchema: WeeklyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a supportive, safety-conscious fitness coach for a gym called Gymli.
Generate a personalized 7-day workout plan for a member based on their real activity data below.
Reference their actual streak, visit history, and personal records where relevant - do not invent numbers.
If they have few visits or no streak, keep the plan approachable and build consistency rather than intensity.
Include at least one full rest day. Suggest realistic loads based on their logged personal records, never exceeding them for working sets.

Member data:
${JSON.stringify(input, null, 2)}
`,
      output: { schema: WeeklyPlanOutputSchema },
    });

    if (!output) {
      throw new Error('The AI coach did not return a usable plan. Please try again.');
    }
    return output;
  }
);
