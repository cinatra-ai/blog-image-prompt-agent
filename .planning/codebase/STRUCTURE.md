# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
blog-image-prompt-agent/
├── cinatra/
│   └── oas.json               # Complete Cinatra Flow agent definition (node graph, I/O schemas, LLM config)
├── skills/
│   └── blog-image-prompt-agent/
│       └── SKILL.md           # LLM system prompt / behavior specification (5-step recipe, output schema)
├── .github/
│   └── workflows/
│       ├── ci.yml             # Standalone CI: classify repo, install, typecheck, test, kind gate
│       └── release.yml        # Release workflow
├── .planning/
│   └── codebase/              # GSD codebase map documents (this directory)
├── extension-kind-gate.mjs    # Self-contained CI gate: validates agent OAS + workflow BPMN shape
├── package.json               # Package manifest with cinatra agent metadata
├── tsconfig.json              # TypeScript config (targets a src/ that does not yet exist)
├── .npmrc                     # npm/pnpm registry config
└── LICENSE                    # Apache-2.0
```

## Directory Purposes

**`cinatra/`:**
- Purpose: All Cinatra-runtime-consumed artifacts.
- Contains: `oas.json` — the full declarative flow graph in Cinatra agentspec format (v26.1.0). This is the authoritative definition of what the agent does at runtime.
- Key files: `cinatra/oas.json`

**`skills/blog-image-prompt-agent/`:**
- Purpose: LLM instruction set for the agent. The `/api/llm-bridge` server discovers this directory by `agent_id`.
- Contains: `SKILL.md` — the system prompt specification consumed by the LLM bridge.
- Key files: `skills/blog-image-prompt-agent/SKILL.md`

**`.github/workflows/`:**
- Purpose: GitHub Actions CI/CD.
- Contains: `ci.yml` (build, typecheck, test, pack dry-run, agent OAS gate), `release.yml` (publish).
- Key files: `.github/workflows/ci.yml`, `.github/workflows/release.yml`

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents written by `/gsd-map-codebase`.
- Contains: ARCHITECTURE.md, STRUCTURE.md (this file).
- Generated: Yes (by GSD tooling). Committed: Yes.

## Key File Locations

**Entry Points:**
- `cinatra/oas.json`: The agent's entire runtime definition — start node, context resolution subflow, generate ApiNode, end node.

**LLM Behavior:**
- `skills/blog-image-prompt-agent/SKILL.md`: Complete LLM instruction specification. Edit this to change how the agent generates image prompts.

**CI / Validation:**
- `extension-kind-gate.mjs`: Zero-dependency Node.js gate; run with `node extension-kind-gate.mjs --package-root .`. Contains exported functions `validateAgent()`, `validateWorkflow()`, `validateBpmnSanity()`, `runGate()`, `parseArgs()`.

**Package Manifest:**
- `package.json`: Declares `cinatra.kind: "agent"`, `cinatra.type: "flow"`, `cinatra.riskLevel: "low"`, `cinatra.hasApprovalGates: true`, `cinatra.toolAccess: []`, and the runtime dependency on `@cinatra-ai/context-selection-agent`.

**TypeScript Config:**
- `tsconfig.json`: Points `rootDir` at `src/` and `outDir` at `dist/`. No `src/` directory exists currently — this config is ready for if TypeScript sources are added.

## Naming Conventions

**Files:**
- Agent definition: `cinatra/oas.json` (always this exact name; required by Cinatra runtime).
- Skill file: `skills/<agent-id>/SKILL.md` (directory name matches `package.json` name's slug and the `agent_id` used in OAS).
- CI gate: `extension-kind-gate.mjs` (`.mjs` ES module, shipped verbatim by extraction script into every extracted agent repo).

**Directories:**
- Skill directory matches the agent's short id: `skills/blog-image-prompt-agent/`.
- Cinatra artifacts always live in `cinatra/`.

**Node IDs in OAS:**
- Main flow nodes: `start`, `generate`, `end`, `context_imagePromptContext`.
- Context subflow nodes: prefixed `ctx-imagePromptContext-` (e.g., `ctx-imagePromptContext-resolve_context`, `ctx-imagePromptContext-select_mode`).
- Data flow edge names: `<source-node>_<source-output>_to_<dest-node>_<dest-input>` (e.g., `start_draft_to_generate_draft`).

## Where to Add New Code

**Changing LLM generation behavior (prompt instructions, output schema, style rules):**
- Edit: `skills/blog-image-prompt-agent/SKILL.md`
- No OAS changes required unless I/O schema changes.

**Adding or changing agent inputs/outputs:**
- Edit: `cinatra/oas.json` — update `inputs`/`outputs` arrays in the top-level flow definition AND in `$referenced_components.start`/`$referenced_components.end`, and add corresponding data-flow edges.

**Adding a new flow node:**
- Edit: `cinatra/oas.json` — add the component under `$referenced_components`, reference it under `nodes`, and wire `control_flow_connections` and `data_flow_connections`.

**Adding TypeScript source code (utilities, tests for the gate):**
- Create: `src/` directory (matches `tsconfig.json` `rootDir`).
- Tests: `src/**/*.test.ts` (no test framework is configured yet; CI runs `pnpm test --if-present`).

**Adding banned primitives to the CI gate:**
- Edit: `extension-kind-gate.mjs` → `BANNED_PRIMITIVES` array or `BANNED_TYPEHINTS` array near line 65-74.

## Special Directories

**`cinatra/`:**
- Purpose: Runtime artifacts consumed by the Cinatra marketplace and execution engine.
- Generated: Partially (OAS is generated by Cinatra tooling from the flow editor, then committed). Treat as source of truth — do not hand-edit `oas.json` unless you understand the full agentspec format.
- Committed: Yes.

**`.planning/`:**
- Purpose: GSD planning artifacts (phase plans, codebase maps).
- Generated: Yes (by GSD commands).
- Committed: Yes.

**`dist/`:**
- Purpose: TypeScript compilation output (per `tsconfig.json`).
- Generated: Yes.
- Committed: No (not tracked; no `src/` exists yet so no `dist/` is produced).

---

*Structure analysis: 2026-06-09*
