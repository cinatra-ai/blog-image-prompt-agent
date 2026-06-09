# Coding Conventions

**Analysis Date:** 2026-06-09

## Overview

This is a content-only Cinatra agent extension. The repository ships no TypeScript source files of its own — it contains a `SKILL.md` system-prompt, a `cinatra/oas.json` OAS descriptor, and a single self-contained JavaScript gate script (`extension-kind-gate.mjs`). Conventions below reflect the patterns observed in those files.

## Naming Patterns

**Files:**
- `kebab-case` for all filenames: `extension-kind-gate.mjs`, `cinatra/oas.json`
- Skill directory mirrors the package slug: `skills/blog-image-prompt-agent/SKILL.md`
- Sidecar artifacts live under `cinatra/`: `cinatra/oas.json`

**Functions:**
- `camelCase` for all exported and internal functions: `parseArgs`, `validateAgent`, `validateWorkflow`, `runGate`, `walkLlmStrings`, `scanOasString`, `findWorkflowSidecars`, `validateBpmnSanity`, `validateWorkflowPackageShape`
- Helper predicates/transformers use descriptive verb phrases: `wordBoundary`, `localOf`, `prefixOf`

**Variables:**
- `camelCase` for local variables and parameters
- `SCREAMING_SNAKE_CASE` for module-level constants: `LLM_VISIBLE_FIELDS`, `BANNED_PRIMITIVES`, `BANNED_TYPEHINTS`, `BPMN_MODEL_NS`, `PRIMITIVE_PATTERNS`, `WORKFLOW_PACKAGE_NAME_RE`

**Types:**
- No TypeScript types in this repo (content-only extension; `extension-kind-gate.mjs` is plain `.mjs`)

## Code Style

**Formatting:**
- No formatter config detected (no `.prettierrc`, `biome.json`, or `eslint.config.*`)
- Code in `extension-kind-gate.mjs` uses 2-space indentation consistently
- Double-quoted strings throughout; template literals for interpolated messages

**Linting:**
- No linter config detected

**Module format:**
- ES Modules (`"type": "module"` in `package.json`)
- Uses `import { ... } from "node:fs"` / `"node:path"` — always the `node:` prefix for builtins
- All exports are named exports; no default exports

## Import Organization

**Order (observed in `extension-kind-gate.mjs`):**
1. Node built-in modules with `node:` prefix (`node:fs`, `node:path`)
2. No third-party or internal imports (zero-dependency by design)

**Path Aliases:**
- Not applicable (no TypeScript, no bundler aliases)

## Error Handling

**Patterns:**
- Functions are pure where possible: they return `string[]` error arrays rather than throwing. Callers collect and check the array length.
- File I/O is wrapped in `try/catch`; errors are pushed into the errors array as strings using `err instanceof Error ? err.message : String(err)`.
- The `main()` function at the top level uses a single `try/catch` around the entire invocation and calls `process.exit(1)` on unexpected errors.
- Exit codes are explicit: `0` = clean, `1` = violations, `2` (internal script) = dependency-shape regression.

**Example pattern (from `extension-kind-gate.mjs`):**
```js
try {
  parsed = JSON.parse(readFileSync(oasPath, "utf8"));
} catch (err) {
  errors.push(`cinatra/oas.json failed to parse: ${err instanceof Error ? err.message : String(err)}`);
  return errors;
}
```

## Logging

**Framework:** Node `console` (no logging library)

**Patterns:**
- `console.log` for success/pass messages (stdout)
- `console.error` for violation summaries and individual errors (stderr)
- CI output uses emoji prefix `✓` / `✗` for human readability in GitHub Actions logs

## Comments

**When to Comment:**
- Block comments at the top of each logical section (`// ---------- arg parsing ----------`) to segment the file
- JSDoc-style `/** ... */` for exported functions (e.g., `validateAgent`, `runGate`, `validateBpmnSanity`)
- Inline comments explain non-obvious decisions, especially regex constraints and namespace resolution logic

**Header comment:**
- Each file starts with a multi-line `//` block documenting scope, usage, exit codes, and intentional constraints (see `extension-kind-gate.mjs` lines 1–34)

## Function Design

**Size:** Functions are small and focused; the largest (`validateBpmnSanity`) is ~80 lines and handles one well-bounded task (XML sanity check)

**Parameters:** Functions take primitive values or plain objects; no class instances

**Return Values:**
- Validators return `string[]` (empty = passing, non-empty = violations)
- `runGate` returns `{ kind, errors }` — a plain object
- `parseArgs` returns `{ packageRoot }` — a plain object

## Module Design

**Exports:**
- All logic is exported as named functions so the gate can be unit-tested in isolation
- The `main()` entry point is NOT exported; it runs only when the script is invoked directly (`invokedDirectly` guard)

**Barrel Files:**
- Not applicable (single-file gate script; no `src/` tree)

## Agent Prompt Conventions (SKILL.md)

**Output contract:**
- The agent returns strict JSON (`{ prompts: BlogImagePrompt[], notes: string }`); no Markdown wrapping, no surrounding prose
- Field names are camelCase: `placement`, `prompt`, `rationale`, `notes`
- Placement values are string literals from the caller's input `placements` array; the agent never synthesizes new labels

**Constraint style in SKILL.md:**
- Rules are written as numbered steps with bolded keywords (**Parse**, **Distribute**, **Write**, **Return**)
- Hard constraints use ALL-CAPS for emphasis: "HARD CAP 5", "MUST", "NOT"
- Examples are provided inline as abbreviated JSON blocks

---

*Convention analysis: 2026-06-09*
