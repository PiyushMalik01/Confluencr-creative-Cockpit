'use client';

import { useState } from 'react';
import { StepCard } from './step-card';
import { Step1Brief } from './step-1-brief';
import { Step2StyleReport } from './step-2-style-report';
import { Step3Angles } from './step-3-angles';
import { Step4Concepts } from './step-4-concepts';
import { Step5ImageGen } from './step-5-image-gen';
import { Step6PromptDeck } from './step-6-prompt-deck';

const STEPS = [
  { n: 1, title: 'Brief', subtitle: 'Tell the cockpit about your product, audience, and brand.' },
  { n: 2, title: 'Competitor Style Report', subtitle: 'AI reads your competitor visuals and extracts patterns.' },
  { n: 3, title: 'Strategic Angles', subtitle: 'Five contextual angles. You pick three that span the trifecta.' },
  { n: 4, title: 'Concept Briefs', subtitle: 'Three on-brand briefs with prompts for every image-gen tool.' },
  { n: 5, title: 'Image Generation', subtitle: 'Optional. Bring your own key, or skip to prompts-only.' },
  { n: 6, title: 'Prompt Deck Export', subtitle: 'Copy any prompt, or download the full PDF.' },
] as const;

export function ProjectShell({ projectId, initialStep }: { projectId: string; initialStep: number }) {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [maxStep, setMaxStep] = useState(initialStep);

  function advance(to: number) {
    setActiveStep(to);
    setMaxStep((m) => Math.max(m, to));
    fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: to }),
    });
  }

  return (
    <div className="space-y-3">
      {STEPS.map((step) => {
        const isCompleted = maxStep > step.n;
        const isLocked = step.n > maxStep;
        return (
          <StepCard
            key={step.n}
            stepNumber={step.n}
            title={step.title}
            subtitle={step.subtitle}
            isActive={activeStep === step.n}
            isCompleted={isCompleted}
            isLocked={isLocked}
            onActivate={() => setActiveStep(step.n)}
          >
            {step.n === 1 && (
              <Step1Brief projectId={projectId} onContinue={() => advance(2)} />
            )}
            {step.n === 2 && (
              <Step2StyleReport projectId={projectId} onContinue={() => advance(3)} />
            )}
            {step.n === 3 && (
              <Step3Angles projectId={projectId} onContinue={() => advance(4)} />
            )}
            {step.n === 4 && (
              <Step4Concepts projectId={projectId} onContinue={() => advance(5)} />
            )}
            {step.n === 5 && <Step5ImageGen onContinue={() => advance(6)} />}
            {step.n === 6 && <Step6PromptDeck projectId={projectId} />}
          </StepCard>
        );
      })}
    </div>
  );
}
