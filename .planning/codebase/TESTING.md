# Testing Patterns

**Analysis Date:** 2026-06-09

## Overview

This is a content-only Cinatra agent extension with no `src/` TypeScript sources. There are no test files in the repository. The CI pipeline explicitly skips standalone tests for source-mirror repos (those with host-internal `@cinatra-ai/*` optional peers) because the monorepo owns test execution for such packages. The only testable logic in this repo is the self-contained `extension-kind-gate.mjs` script.

## Test Framework

**Runner:** Not detected — no test framework installed or configured

**Config:** No `jest.config.*`, `vitest.config.*`, or `mocha.*` present

**Run Commands:**
```bash
# CI runs this, but it is a no-op when no test script is defined in package.json
corepack pnpm test --if-present
```

The `package.json` has no `scripts` field, so `pnpm test --if-present` exits 0 without running anything.

## Test File Organization

**Location:** Not applicable — no test files exist in this repository

**Naming:** Not applicable

**Structure:** Not applicable

## What CI Validates Instead

Although there are no unit tests, CI performs these checks as gate replacements:

1. **Package shape validation** (`ci.yml` — "Classify repo" step): Inline Node script checks that no `@cinatra-ai/*` packages leaked into `dependencies`/`devDependencies`/`optionalDependencies` and that all first-party peers are marked `peerDependenciesMeta.optional`.

2. **Agent OAS gate** (`ci.yml` — "Agent OAS validation gate" step): Runs `node extension-kind-gate.mjs --package-root .` which:
   - Parses `cinatra/oas.json`
   - Scans all LLM-visible fields (`system`, `user`, `description`) for retired CRM primitives (`contacts_*`, `accounts_*`, `lists_*`, etc.)
   - Exits `1` on any violation, `0` on clean pass

3. **Pack dry-run** (`ci.yml` — "Pack" step): `npm pack --dry-run` validates the publish payload shape without a registry.

## The Gate Script as a Testable Unit

`extension-kind-gate.mjs` exports all its logic as pure named functions so they can be tested in isolation if tests are ever added:

- `parseArgs(argv)` — argument parsing
- `validateAgent(packageRoot)` → `string[]` — OAS primitive scan
- `validateWorkflow(packageRoot)` → `string[]` — BPMN sidecar shape check
- `validateWorkflowPackageShape(pkg)` → `string[]` — pure package.json shape check
- `validateBpmnSanity(xml)` → `string[]` — pure XML / BPMN structure check
- `findWorkflowSidecars(packageRoot)` → `string[]` — filesystem walk
- `runGate(packageRoot)` → `{ kind, errors }` — top-level dispatch

All validators are pure (input → `string[]`), making them straightforward to unit test with any framework.

## Mocking

**Framework:** Not applicable

**What would need mocking if tests were added:**
- `node:fs` (`readFileSync`, `existsSync`, `readdirSync`) — required for `validateAgent`, `validateWorkflow`, `findWorkflowSidecars`
- `process.argv` / `process.exit` — required for `parseArgs` and `main()`

## Fixtures and Factories

**Test Data:** Not applicable — no tests exist

**What fixtures would look like:** Minimal `package.json` objects and raw XML/JSON strings passed directly to the pure validator functions (no filesystem fixtures needed for the pure subset).

## Coverage

**Requirements:** None enforced — no coverage tooling configured

## Test Types

**Unit Tests:** Not present

**Integration Tests:** Not present

**E2E Tests:** Not present

**Effective gate (CI-only):**
- Pre-publish OAS scan via `extension-kind-gate.mjs` (agent kind gate)
- Package shape invariant check (inline node script in CI)
- `npm pack --dry-run` publish-payload check

## Adding Tests in Future

If tests are introduced, the recommended approach given the existing code style:

1. Add a test framework (e.g., `vitest` or `node:test`) as a `devDependency`
2. Add a `"test": "vitest run"` (or `node --test`) script to `package.json`
3. Import pure functions from `extension-kind-gate.mjs` directly — all are named exports
4. No mocking needed for the pure validators (`validateWorkflowPackageShape`, `validateBpmnSanity`)
5. Use `memfs` or `node:test` mock for the filesystem-dependent validators

---

*Testing analysis: 2026-06-09*
