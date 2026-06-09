<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│                    Caller / Parent Agent                     │
│  Inputs: draft, count, placements, style, brandKeywords      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     StartNode ("Inputs")                     │
│  `cinatra/oas.json` → $referenced_components.start           │
└──────────┬─────────────────────┬────────────────────────────┘
           │                     │
           ▼                     ▼
┌─────────────────────┐  ┌──────────────────────────────────┐
│  context_imagePrompt│  │    (data wired in parallel)      │
│  Context (FlowNode) │  │                                  │
│  `cinatra/oas.json` │  │                                  │
│  Subflow: resolve,  │  │                                  │
│  branch, gate, final│  │                                  │
└──────────┬──────────┘  └──────────────────────────────────┘
           │ contextSlotBindings
           ▼
┌──────────────────────────────────────────────────────────────┐
│                ApiNode "generate"                            │
│  POST {{CINATRA_BASE_URL}}/api/llm-bridge                    │
│  `cinatra/oas.json` → $referenced_components.generate        │
│  system+user prompt assembled from SKILL.md instructions     │
│  LLM: openai / gpt-5.5                                       │
└──────────┬───────────────────────────────────────────────────┘
           │ prompts[], notes
           ▼
┌──────────────────────────────────────────────────────────────┐
│                 EndNode ("End")                              │
│  Outputs: prompts (array<BlogImagePrompt>), notes (string)   │
└──────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| StartNode (`start`) | Declares all inputs; exposes `draft` as required, rest hidden | `cinatra/oas.json` → `$referenced_components.start` |
| FlowNode (`context_imagePromptContext`) | Orchestrates context-slot resolution sub-flow (interactive or autonomous) | `cinatra/oas.json` → `$referenced_components.context_imagePromptContext` |
| Context Subflow (`context-imagePromptContext-subflow`) | Resolve candidates → branch on selectionMode → HITL gate (interactive) or auto-finalize → output `contextSlotBindings` | `cinatra/oas.json` → `$referenced_components.context-imagePromptContext-subflow` |
| ApiNode (`generate`) | Calls `/api/llm-bridge` with blog draft + constraints; receives structured JSON `{prompts, notes}` | `cinatra/oas.json` → `$referenced_components.generate` |
| EndNode (`end`) | Passes through `prompts` and `notes` to the caller | `cinatra/oas.json` → `$referenced_components.end` |
| SKILL.md | LLM behavior specification — 5-step recipe, output schema, style/brand constraints | `skills/blog-image-prompt-agent/SKILL.md` |
| extension-kind-gate.mjs | Self-contained CI gate: validates `cinatra/oas.json` for banned retired primitives; supports `agent` and `workflow` kinds | `extension-kind-gate.mjs` |

## Pattern Overview

**Overall:** Cinatra Flow Agent — a declarative, stateless node graph executed by the Cinatra runtime.

**Key Characteristics:**
- No source code executes at invocation time — behavior is fully specified in `cinatra/oas.json` (graph) and `skills/blog-image-prompt-agent/SKILL.md` (LLM instructions).
- The only runtime side-effect is an HTTP POST to `{{CINATRA_BASE_URL}}/api/llm-bridge`, which resolves the environment variable at runtime.
- Stateless: every invocation is independent; no persistent storage, no session.
- HITL (human-in-the-loop) approval gate is embedded in the context-resolution subflow via `InputMessageNode` (`ctx-imagePromptContext-context_select_gate`), rendered by `@cinatra-ai/context-selection-agent:context-selector`.

## Layers

**Flow Definition Layer:**
- Purpose: Declares node graph, control-flow edges, data-flow edges, and I/O schemas.
- Location: `cinatra/oas.json`
- Contains: StartNode, ApiNodes, FlowNode (subflow), BranchingNode, OutputMessageNode, InputMessageNode, EndNode.
- Depends on: Cinatra runtime environment (`CINATRA_BASE_URL`), `@cinatra-ai/context-selection-agent`.
- Used by: Cinatra marketplace runtime at publish/install and execution time.

**LLM Prompt Specification Layer:**
- Purpose: Defines the exact instructions the LLM follows inside the `generate` ApiNode.
- Location: `skills/blog-image-prompt-agent/SKILL.md`
- Contains: 5-step generation recipe, output JSON envelope contract, style/brand constraints, example output.
- Depends on: Nothing (pure markdown, consumed by `/api/llm-bridge` via `agent_id` discovery).
- Used by: `generate` ApiNode at invocation; SKILL.md is auto-discovered by the bridge via `agent_id: "blog-image-prompt-agent"`.

**CI Gate Layer:**
- Purpose: Pre-publish sanity check — scans `cinatra/oas.json` for retired CRM primitives in LLM-visible prompt strings.
- Location: `extension-kind-gate.mjs`
- Contains: `validateAgent()`, `validateWorkflow()`, `validateBpmnSanity()`, `runGate()`.
- Depends on: Node.js builtins only (zero external dependencies).
- Used by: `.github/workflows/ci.yml` → `kind-gates` job.

## Data Flow

### Primary Request Path

1. Caller supplies `draft` (required), optionally `count`, `placements`, `style`, `brandKeywords`, `cinatra_run_id`, `projectId` → **StartNode** (`cinatra/oas.json` → `start`)
2. StartNode fans out data to two destinations in parallel:
   - `context_imagePromptContext` FlowNode (receives `cinatra_run_id`, `imagePromptContextParentPackageName`, `imagePromptContextSlotId`, `projectId`)
   - `generate` ApiNode (receives `draft`, `count`, `placements`, `style`, `brandKeywords`, `cinatra_run_id` as `agent_run_id`)
3. Context subflow executes: `resolve_context` → `select_mode` branch → (interactive path: `emit_context_payload` → `context_select_gate` HITL → `finalize_interactive`) or (autonomous path: `finalize_autonomous`) → returns `contextSlotBindings`
4. `contextSlotBindings` flows into `generate` ApiNode
5. `generate` POSTs to `{{CINATRA_BASE_URL}}/api/llm-bridge` with `agent_id`, system/user prompt (embedding draft, count, placements, style, brandKeywords, contextSlotBindings), and LLM config (`openai/gpt-5.5`)
6. Bridge discovers `skills/blog-image-prompt-agent/SKILL.md` via `agent_id`, executes LLM call, returns `{prompts, notes}`
7. `generate` outputs `prompts[]` and `notes` → **EndNode** → returned to caller

### Context Resolution Sub-Flow

1. `resolve_context` → POST `{{CINATRA_BASE_URL}}/api/context-resolve` with `parentRunId`, `parentPackageName`, `slotId`, `projectId` → returns `candidates`, `slotMeta`, `selectedRefs`, `selectionMode`, `resolutionMode`
2. `select_mode` BranchingNode: if `selectionMode == "autonomous"` → skip HITL gate; otherwise → default branch
3. Default branch: `emit_context_payload` emits JSON message to human; `context_select_gate` InputMessageNode pauses for user selection; `finalize_interactive` → POST `{{CINATRA_BASE_URL}}/api/context-finalize`
4. Autonomous branch: `finalize_autonomous` → POST `{{CINATRA_BASE_URL}}/api/context-finalize` using resolved `selectedRefs`
5. Both branches emit `contextSlotBindings` array to the parent flow

**State Management:**
- Fully stateless within the agent. Context state is externalized to the Cinatra backend (`/api/context-resolve`, `/api/context-finalize`).

## Key Abstractions

**BlogImagePrompt:**
- Purpose: Represents a single generated image description for a given blog placement.
- Shape: `{ placement: "cover" | "inline" | "social" | string, prompt: string (30-150 words), rationale: string (1-2 sentences) }`
- Defined in: `skills/blog-image-prompt-agent/SKILL.md` (schema) and `cinatra/oas.json` outputs schema.

**contextSlotBindings:**
- Purpose: Carry resolved artifact references (brand-voice or blog-post artifacts) into the `generate` prompt call, enabling optional brand/context injection.
- Shape: array of `{ artifactId, representationRevisionId, semanticAssertionId, extension, sourceScope, ownerId }`.
- Defined in: `cinatra/oas.json` → `generate` ApiNode inputs schema.

**SKILL.md auto-discovery:**
- Purpose: The `/api/llm-bridge` endpoint resolves the SKILL.md for an agent by its `agent_id` string, enabling decoupled LLM instruction authoring.
- Resolved path pattern (server-side): `agents/cinatra/<agent_id>/skills/<agent_id>/SKILL.md`.

## Entry Points

**Flow StartNode:**
- Location: `cinatra/oas.json` → `$referenced_components.start`
- Triggers: Cinatra runtime invokes the agent with the declared input payload.
- Responsibilities: Validate `draft` (required), apply defaults for `count` (3), `placements` (["cover","inline","social"]), `style` (""), `brandKeywords` ([]).

**CI Gate:**
- Location: `extension-kind-gate.mjs` (invoked as `node extension-kind-gate.mjs --package-root .`)
- Triggers: `.github/workflows/ci.yml` `kind-gates` job on push/PR to `main`.
- Responsibilities: Parse `package.json` kind, dispatch to `validateAgent()` or `validateWorkflow()`, exit 0/1.

## Architectural Constraints

- **Threading:** Not applicable — no runtime code. The Cinatra runtime executes nodes; `extension-kind-gate.mjs` is single-threaded Node.js.
- **Global state:** None. No module-level singletons. `extension-kind-gate.mjs` uses only pure functions and process exit codes.
- **Circular imports:** Not applicable — no import graph (no `src/` directory).
- **Tool access:** Intentionally zero. `cinatra.toolAccess: []` in `package.json`; `cinatra.toolboxes` is omitted from the OAS so the LLM bridge injects no MCP primitives.
- **LLM cap:** `count` hard-capped at 5 by SKILL.md; the `generate` node does not enforce this at the graph level — it is purely an LLM instruction.
- **No image generation:** The agent outputs text prompt descriptions only; image generation is explicitly out of scope.

## Anti-Patterns

### Calling MCP primitives from the LLM

**What happens:** If the `generate` prompt instructed the LLM to call `contacts_list`, `lists_get`, or similar retired CRM primitives, or referenced `@cinatra-ai/entity-accounts:account` type hints in a system/user string.
**Why it's wrong:** These are retired routes; the Cinatra runtime would fail or route incorrectly. The agent is designed as a pure text-generation leaf — no tool calls.
**Do this instead:** Keep all LLM instructions in `skills/blog-image-prompt-agent/SKILL.md` within the "no tool calls" constraint; run `extension-kind-gate.mjs` in CI to catch violations (`extension-kind-gate.mjs` → `validateAgent()` → `scanOasString()`).

### Adding inline `cinatra.workflow` to `package.json`

**What happens:** Placing the workflow/flow definition directly in `package.json` under `cinatra.workflow`.
**Why it's wrong:** The gate (`validateWorkflowPackageShape()` in `extension-kind-gate.mjs`) explicitly rejects this: "inline cinatra.workflow is forbidden; ship a cinatra/workflow.bpmn sidecar."
**Do this instead:** All flow definitions live in `cinatra/oas.json` (for agents) or `cinatra/workflow.bpmn` (for workflows).

## Error Handling

**Strategy:** Delegated to the Cinatra runtime and SKILL.md LLM instructions.

**Patterns:**
- Invalid `count` (< 1): SKILL.md instructs LLM to return `prompts: []` and surface the issue in `notes`.
- `count > 5`: SKILL.md instructs LLM to cap at 5 and record the cap in `notes` (e.g., "Capped count from 7 to 5").
- Context resolution errors: handled by the Cinatra backend (`/api/context-resolve`, `/api/context-finalize`); not modeled in the agent graph.
- CI gate failures: `extension-kind-gate.mjs` exits with code 1 and prints violations; the workflow fails the `kind-gates` job.

## Cross-Cutting Concerns

**Logging:** None within the agent graph. CI gate writes to `console.log`/`console.error`.
**Validation:** Input validation is at two levels: StartNode schema defaults/required fields, and SKILL.md LLM instructions for semantic validation (`count` bounds, placement distribution).
**Authentication:** Not handled in this package. The Cinatra runtime manages auth to `{{CINATRA_BASE_URL}}`.

---

*Architecture analysis: 2026-06-09*
