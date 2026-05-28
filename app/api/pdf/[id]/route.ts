import { NextRequest } from 'next/server';
import {
  angleProposals,
  briefs,
  conceptBriefs,
  promptDecks,
  styleReports,
} from '@/lib/db/collections';
import { renderTestRunPdf } from '@/lib/pdf/render';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await ctx.params;
  const brief = await (await briefs()).findOne({ projectId });
  if (!brief) return new Response(JSON.stringify({ error: 'brief not found' }), { status: 404 });

  const style = await (await styleReports()).findOne({ projectId });
  const angles = await (await angleProposals()).findOne({ projectId });
  const concepts = await (await conceptBriefs()).find({ projectId }).sort({ position: 1 }).toArray();
  const deck = await (await promptDecks()).findOne({ projectId });

  const buf = await renderTestRunPdf({ brief, style, angles, concepts, deck });
  const filename = `confluencr-${(brief.product.name || 'brief').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${projectId.slice(0, 8)}.pdf`;
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
