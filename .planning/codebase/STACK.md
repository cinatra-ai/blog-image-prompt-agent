# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript — compiled to ESNext (ES2023 target); `tsconfig.json` configures strict mode, `verbatimModuleSyntax`, and JSX (`react-jsx`). No TypeScript source files are tracked in this repo (content-only agent extension).
- JavaScript (ESM) — `extension-kind-gate.mjs` is a self-contained zero-dependency Node.js gate script using only Node builtins.

**Secondary:**
- JSON — `cinatra/oas.json` is the primary agent specification artifact; `package.json` carries Cinatra manifest metadata.

## Runtime

**Environment:**
- Node.js 24 (specified in CI via `actions/setup-node@v4` with `node-version: "24"`)

**Package Manager:**
- pnpm (managed via corepack; CI runs `corepack enable` + `corepack pnpm`)
- Lockfile: not committed (CI uses `--no-frozen-lockfile` for standalone repos; this repo is a source mirror — no lockfile present)

## Frameworks

**Core:**
- Cinatra Agent Platform (`cinatra.ai/v1`) — the agent is defined as a `Flow` component type using the Cinatra OAS spec (`cinatra/oas.json`). AgentSpec version `26.1.0`.
- No application framework (Express, Next.js, etc.) — this is a stateless leaf agent with no HTTP server of its own.

**Testing:**
- Not applicable — no test files or test runner configured in this repo. Tests run in the monorepo context.

**Build/Dev:**
- TypeScript compiler (`tsc`) — `tsconfig.json` targets `outDir: dist`, `rootDir: src`. No bundler configured explicitly; `moduleResolution: bundler` is set.
- `extension-kind-gate.mjs` — zero-dependency CI gate run with plain `node`.

## Key Dependencies

**Critical:**
- `@cinatra-ai/context-selection-agent` `^0.1.1` — declared as a runtime agent dependency in `package.json` `cinatra.agentDependencies`. Provides the `context-selector` HITL screen used during context slot resolution.

**Infrastructure:**
- No npm `dependencies` or `devDependencies` declared in `package.json`. This is a source-mirror repo; all host-internal `@cinatra-ai/*` packages are provided by the cinatra monorepo at install time and are not published to any registry.

## Configuration

**Environment:**
- No `.env` files present in this repo. Agent configuration (LLM provider, model, context slots) is embedded in `cinatra/oas.json`.
- `.npmrc` is present (existence noted; contents not read).

**Build:**
- `tsconfig.json` — standalone TypeScript config (does not extend monorepo base). Targets ESNext modules, emits declarations and sourcemaps to `dist/`.
- `cinatra/oas.json` — authoritative agent OAS specification; validated by `extension-kind-gate.mjs` in CI.

## Platform Requirements

**Development:**
- Node.js 24+, pnpm via corepack. This repo is a source mirror; full typecheck and test require the cinatra monorepo workspace.

**Production:**
- Deployed to the Cinatra Marketplace via GitHub Release trigger. Marketplace CI runs `extension-kind-gate.mjs` OAS validation, then routes through the marketplace MCP proxy (extension-submit-for-review saga). Registry: `registry.cinatra.ai`.

---

*Stack analysis: 2026-06-09*
