import type { Collection, Document } from 'mongodb';
import { getDb } from './client';
import type { Project } from '@/lib/schemas/project';
import type { Brief } from '@/lib/schemas/brief';
import type { StyleReport } from '@/lib/schemas/style-report';
import type { AngleProposalDoc } from '@/lib/schemas/angle';
import type { ConceptBrief } from '@/lib/schemas/concept-brief';
import type { PromptDeck, GeneratedImage } from '@/lib/schemas/prompt-deck';

export async function projects(): Promise<Collection<Project>> {
  return (await getDb()).collection<Project>('projects');
}
export async function briefs(): Promise<Collection<Brief>> {
  return (await getDb()).collection<Brief>('briefs');
}
export async function styleReports(): Promise<Collection<StyleReport>> {
  return (await getDb()).collection<StyleReport>('styleReports');
}
export async function angleProposals(): Promise<Collection<AngleProposalDoc>> {
  return (await getDb()).collection<AngleProposalDoc>('angleProposals');
}
export async function conceptBriefs(): Promise<Collection<ConceptBrief>> {
  return (await getDb()).collection<ConceptBrief>('conceptBriefs');
}
export async function promptDecks(): Promise<Collection<PromptDeck>> {
  return (await getDb()).collection<PromptDeck>('promptDecks');
}
export async function generatedImages(): Promise<Collection<GeneratedImage>> {
  return (await getDb()).collection<GeneratedImage>('generatedImages');
}

export async function bumpEditEpoch(projectId: string): Promise<void> {
  await (await projects()).updateOne(
    { _id: projectId } as Document,
    { $inc: { editEpoch: 1 }, $set: { lastTouchedAt: new Date() } } as Document
  );
}
