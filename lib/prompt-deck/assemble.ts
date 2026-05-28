import type { ConceptBrief } from '@/lib/schemas/concept-brief';
import type { Brief } from '@/lib/schemas/brief';
import type { PromptCard, Tool } from '@/lib/schemas/prompt-deck';
import type { AspectRatio, ShotType } from '@/lib/schemas/common';

function recommendTool(shotType: ShotType): Tool {
  switch (shotType) {
    case 'hero':
    case 'lifestyle':
    case 'detail':
    case 'in-use':
    case 'scale':
    case 'packaging':
      return 'flux';
    case 'infographic':
      return 'ideogram';
    case 'comparison':
    case 'social-proof':
      return 'nano-banana';
    default:
      return 'flux';
  }
}

function promptForTool(concept: ConceptBrief, tool: Tool): string {
  switch (tool) {
    case 'midjourney':
      return concept.prompts.midjourney;
    case 'flux':
      return concept.prompts.flux;
    case 'nano-banana':
      return concept.prompts.nanoBanana;
    case 'gpt-image':
      return concept.prompts.gptImage;
    case 'ideogram':
      return concept.prompts.ideogram;
  }
}

const TOOL_LABEL: Record<Tool, string> = {
  midjourney: 'Midjourney',
  flux: 'Flux Kontext',
  'nano-banana': 'Nano Banana Pro',
  'gpt-image': 'GPT-Image',
  ideogram: 'Ideogram v3',
};

const SURFACE_LABEL: Record<AspectRatio, string> = {
  '1:1': 'Amazon hero (1:1)',
  '4:5': 'Meta feed (4:5)',
  '9:16': 'Reels / Story (9:16)',
  '16:9': 'Website hero (16:9)',
};

const ANGLE_FAMILY_LABEL: Record<string, string> = {
  Aspirational: 'Aspirational',
  Rational: 'Rational',
  Emotional: 'Emotional',
  'Problem-Solution': 'Problem-Solution',
  'Social-Proof': 'Social-Proof',
  Transformation: 'Transformation',
  Scarcity: 'Scarcity',
  Value: 'Value',
};

export function assembleDeck({
  brief,
  concepts,
  angleNameByConceptId,
  includeAllToolVariants = false,
}: {
  brief: Brief;
  concepts: ConceptBrief[];
  angleNameByConceptId: Record<string, string>;
  includeAllToolVariants?: boolean;
}): PromptCard[] {
  const cards: PromptCard[] = [];
  const surfaces = (brief.surfaces.aspectRatios.length > 0 ? brief.surfaces.aspectRatios : ['1:1']) as AspectRatio[];

  for (const concept of concepts.sort((a, b) => a.position - b.position)) {
    const angleName = angleNameByConceptId[concept._id] || ANGLE_FAMILY_LABEL[''] || 'Concept';
    const recommended = recommendTool(concept.shotRecipe.shotType);

    for (const surface of surfaces) {
      const tools: Tool[] = includeAllToolVariants
        ? ['midjourney', 'flux', 'nano-banana', 'gpt-image', 'ideogram']
        : [recommended];

      for (const tool of tools) {
        cards.push({
          heading: `Concept ${concept.position} · ${angleName} · ${concept.shotRecipe.shotType} · ${SURFACE_LABEL[surface]}`,
          description: `${TOOL_LABEL[tool]} · ${concept.copy.headline}`,
          prompt: promptForTool(concept, tool) + ` · aspect ${surface}`,
          tool,
          aspectRatio: surface,
          conceptId: concept._id,
        });
      }
    }
  }

  return cards;
}
