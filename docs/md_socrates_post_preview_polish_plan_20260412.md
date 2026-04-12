# Socrates Post-Preview Polish Plan
Date: 2026-04-12
Status: queued after current preview deployment

## Goal

- Keep the current `Phase 2` closure checkpoint deployable now.
- Split the next round of polish into small, isolated slices so detail work does not re-open the main chain.

## Deployment Judgment

- Current recommendation:
  - deploy preview first
  - validate the existing `Phase 2` main chain
  - start the polish round only after preview is confirmed usable
- These polish items are important, but they are not current preview blockers by default:
  - geometry drawing/recognition refinement
  - dialogue prompt optimization
  - model whitelist tightening
  - removing implicit/default model drift

## Slice 1: Geometry Recognition And Drawing

### Scope

- Tighten the `workbench` geometry chain so math geometry questions are easier to recover when OCR or auto-parse is incomplete.
- Reduce the gap between:
  - "AI recognized geometry"
  - "student can still correct/continue the problem"

### Focus

- Review `apps/socrates/app/api/geometry/route.ts`
- Review `apps/socrates/app/(student)/workbench/page.tsx`
- Review current geometry renderer / manual adjustment entry points

### Target Outcomes

- When geometry recognition is confident, drawing is stable and reusable inside `workbench`
- When geometry recognition is low-confidence, the student still has a clear recovery path instead of a dead end
- Geometry-specific prompts and UI hints align with the actual recognized structure

### Acceptance

- A geometry problem with clear figure text can enter `workbench` and render a usable figure
- A partially recognized figure does not break the rest of the learning flow
- A non-geometry problem does not trigger noisy geometry UI

## Slice 2: Dialogue Prompt Optimization

### Scope

- Tighten the actual tutoring prompt used in the active chat flow
- Keep focus on student guidance quality, not broad prompt experimentation

### Focus

- Review `apps/socrates/app/api/chat/route.ts`
- Review `apps/socrates/lib/prompts/builder.ts`
- Review `apps/socrates/lib/prompts/base.ts`
- Review `apps/socrates/lib/prompts/subjects/math.ts`

### Target Outcomes

- First assistant reply is shorter and more actionable
- Geometry questions receive more explicit "look at points/lines/angles/conditions" guidance
- The model avoids over-explaining before the student actually starts solving

### Acceptance

- Initial tutoring reply is visibly more concise
- Math/geometry questions guide the student into the next concrete step
- Prompt changes do not break existing subject routing

## Slice 3: Model Whitelist And Default Model Cleanup

### Scope

- Stop exposing or silently falling back to unnecessary models
- Keep only the intended models for each purpose

### Focus

- Review `apps/socrates/lib/ai-models/config`
- Review `apps/socrates/lib/ai-models/service`
- Review `apps/socrates/app/(student)/settings/page.tsx`
- Review model fallback usage in:
  - `apps/socrates/app/api/chat/route.ts`
  - `apps/socrates/app/api/planner/optimize/route.ts`

### Target Outcomes

- Settings only show the approved model list
- Chat / vision / reasoning each use explicit allowed models
- Default model behavior is deterministic and no longer depends on broad fallback drift

### Acceptance

- Settings page only displays the approved models
- API routes do not silently select deprecated or unintended models
- If a requested model is invalid, the fallback is explicit and predictable

## Recommended Order

1. Preview deploy and main-chain validation
2. Slice 3: model whitelist and default cleanup
3. Slice 2: dialogue prompt optimization
4. Slice 1: geometry recognition and drawing refinement

## Reasoning

- Slice 3 is the smallest-risk cleanup and reduces future prompt/model debugging noise
- Slice 2 directly improves tutoring quality without reopening OCR and geometry parsing complexity
- Slice 1 is valuable but has the largest interaction surface, so it should come after preview stability is confirmed

## Next Step

- Use this plan only after the current preview deployment is validated.
- Do not mix these polish slices back into the current checkpoint commit unless preview reveals a true blocker.
