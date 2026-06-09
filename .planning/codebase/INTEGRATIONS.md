# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**Cinatra Agent Platform:**
- Cinatra Marketplace — the agent is published to and discovered via `registry.cinatra.ai`. Submission is gated through the marketplace MCP proxy (extension-submit-for-review → approve → promotion saga).
  - SDK/Client: Cinatra OAS runtime (host-internal, monorepo-provided)
  - Auth: `CINATRA_MARKETPLACE_VENDOR_TOKEN` org secret (GitHub Actions secret; not present locally)

**LLM Provider:**
- OpenAI — declared as `preferredProvider: "openai"` with `preferredModel: "gpt-5.5"` in `cinatra/oas.json` (`metadata.cinatra.llm`).
  - SDK/Client: Resolved by the Cinatra agent runtime (not directly imported in this repo)
  - Auth: Managed by the Cinatra platform; no API key directly in this repo

## Data Storage

**Databases:**
- Not applicable — this is a stateless leaf agent. No database connection is established.

**File Storage:**
- Not applicable — no file storage integration.

**Caching:**
- Not applicable — stateless; no caching layer.

## Authentication & Identity

**Auth Provider:**
- Not applicable — the agent performs no authentication itself. Identity and auth are handled by the Cinatra platform runtime that invokes the agent.

## Agent Dependencies (Runtime)

**@cinatra-ai/context-selection-agent:**
- Purpose: Provides the `context-selector` HITL (human-in-the-loop) screen referenced in `cinatra/oas.json` under `metadata.cinatra.hitlScreens`.
- Dependency type: `runtime` agent dependency, declared in `package.json` `cinatra.agentDependencies` as `^0.1.1`.
- Context slot `imagePromptContext` accepts artifacts of kinds `@cinatra-ai/brand-voice-artifact` and `@cinatra-ai/blog-post-artifact` (up to 5 items, interactive selection mode).

## Monitoring & Observability

**Error Tracking:**
- Not detected — no error tracking SDK (Sentry, Datadog, etc.) configured.

**Logs:**
- Logging is handled by the Cinatra platform runtime. The agent itself emits no direct log calls; it returns structured JSON (`{prompts, notes}`).

## CI/CD & Deployment

**Hosting:**
- Cinatra Marketplace (`registry.cinatra.ai`) — agent is distributed as an npm-compatible package.

**CI Pipeline:**
- GitHub Actions — two workflows in `.github/workflows/`:
  - `ci` workflow: runs on push/PR to `main`. Steps: checkout → Node 24 + corepack → classify first-party vs. standalone → install → typecheck → test → `npm pack --dry-run` → OAS gate via `node extension-kind-gate.mjs --package-root .`.
  - `release` workflow: triggers on GitHub Release published (or manual `workflow_dispatch` from a version tag). Delegates to reusable workflow `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main` with provenance attestation (`id-token: write`, `attestations: write`).

## Webhooks & Callbacks

**Incoming:**
- Not applicable — no incoming webhook endpoints.

**Outgoing:**
- Not applicable — the agent is stateless and invoked synchronously by the Cinatra runtime. No outgoing webhook calls.

## Environment Configuration

**Required env vars:**
- None required at runtime in this repo directly. The Cinatra platform runtime supplies LLM credentials.
- `CINATRA_MARKETPLACE_VENDOR_TOKEN` — GitHub org secret required for the `release` CI workflow (marketplace submission).

**Secrets location:**
- `.npmrc` present (existence noted; contents not read — may contain registry auth token for `@cinatra-ai` scoped packages).
- All runtime secrets managed by the Cinatra platform and GitHub Actions org secrets.

---

*Integration audit: 2026-06-09*
