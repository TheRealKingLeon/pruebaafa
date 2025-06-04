'use server';

/**
 * @fileOverview AI flow to generate a highlight reel of the best moments from the tournament.
 *
 * - generateHighlightReel - A function that generates the highlight reel.
 * - GenerateHighlightReelInput - The input type for the generateHighlightReel function.
 * - GenerateHighlightReelOutput - The return type for the generateHighlightReel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHighlightReelInputSchema = z.object({
  tournamentName: z.string().describe('The name of the tournament.'),
  bestMomentsDescription: z
    .string()
    .describe('The description of the best moments in the game.'),
});
export type GenerateHighlightReelInput = z.infer<typeof GenerateHighlightReelInputSchema>;

const GenerateHighlightReelOutputSchema = z.object({
  highlightReelDescription: z
    .string()
    .describe('A description of the generated highlight reel.'),
  highlightReelVideoDataUri: z
    .string()
    .describe(
      'The highlight reel video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Fixed typo here
    ),
});
export type GenerateHighlightReelOutput = z.infer<typeof GenerateHighlightReelOutputSchema>;

export async function generateHighlightReel(input: GenerateHighlightReelInput): Promise<GenerateHighlightReelOutput> {
  return generateHighlightReelFlow(input);
}

const generateImagePrompt = ai.definePrompt({
  name: 'generateImagePrompt',
  input: {schema: GenerateHighlightReelInputSchema},
  prompt: `Create a visually stunning image that represents the best moments of the {{{tournamentName}}} eSports tournament.
    The image should reflect the energy, excitement, and skill displayed during the tournament's best moments as described: {{{bestMomentsDescription}}}.`,
});

const generateHighlightReelFlow = ai.defineFlow(
  {
    name: 'generateHighlightReelFlow',
    inputSchema: GenerateHighlightReelInputSchema,
    outputSchema: GenerateHighlightReelOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: await generateImagePrompt(input),
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {
      highlightReelDescription: `Highlight reel for ${input.tournamentName}`,
      highlightReelVideoDataUri: media.url,
    };
  }
);
